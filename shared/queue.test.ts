import { describe, expect, it } from "vitest";
import {
  callNext,
  completeConsultation,
  createDemoState,
  createEmptyState,
  estimateWaits,
  getSummary,
  issueToken,
  orderWaiting,
  removeToken,
  returnToQueue,
  setDoctorStatus,
  type DemoState,
  type Doctor,
  type Token,
} from "./queue";

const NOW = 1_700_000_000_000;
const MINUTE = 60_000;

function addToken(
  state: DemoState,
  label: string,
  priority: "standard" | "assisted" = "standard",
  at = NOW
): DemoState {
  return issueToken(state, { label, priority }, at);
}

function withDoctor(
  state: DemoState,
  doctor: Partial<Doctor> & Pick<Doctor, "id">
): DemoState {
  const fullDoctor: Doctor = {
    id: doctor.id,
    name: doctor.name ?? doctor.id,
    specialty: doctor.specialty ?? "General practice",
    room: doctor.room ?? "Room 01",
    status: doctor.status ?? "available",
    serviceMinutes: doctor.serviceMinutes ?? 15,
  };
  return { ...state, doctors: [...state.doctors, fullDoctor] };
}

describe("queue ordering", () => {
  it("orders assisted tokens before standard tokens without changing the source array", () => {
    const standard: Token = {
      id: "standard",
      number: 1,
      label: "Standard",
      priority: "standard",
      status: "waiting",
      createdAt: NOW - 10 * MINUTE,
      doctorId: null,
      startedAt: null,
      completedAt: null,
    };
    const assisted: Token = {
      ...standard,
      id: "assisted",
      number: 2,
      priority: "assisted",
    };
    const source = [standard, assisted];

    expect(orderWaiting(source, NOW).map(token => token.id)).toEqual([
      "assisted",
      "standard",
    ]);
    expect(source.map(token => token.id)).toEqual(["standard", "assisted"]);
  });

  it("elevates a standard token at exactly 30 minutes to the assisted rank", () => {
    const state = addToken(
      addToken(createEmptyState(NOW), "New assisted", "assisted", NOW),
      "Aged standard",
      "standard",
      NOW - 30 * MINUTE
    );
    const ordered = orderWaiting(state.tokens, NOW);
    expect(ordered.map(token => token.label)).toEqual([
      "Aged standard",
      "New assisted",
    ]);
  });

  it("uses created time and then token number as stable FIFO tie breakers", () => {
    const state = createEmptyState(NOW);
    const first = addToken(state, "First", "assisted", NOW - 5 * MINUTE);
    const second = addToken(first, "Second", "assisted", NOW - 5 * MINUTE);
    expect(orderWaiting(second.tokens, NOW).map(token => token.label)).toEqual([
      "First",
      "Second",
    ]);
  });

  it("does not treat ordinary ageing as clinical urgency", () => {
    const state = addToken(
      createEmptyState(NOW),
      "Aged standard",
      "standard",
      NOW - 31 * MINUTE
    );
    const estimate = estimateWaits(
      withDoctor(state, { id: "d1", serviceMinutes: 10 }),
      NOW
    )["token-001"];
    expect(estimate.explanation).toContain(
      "standard priority aged 30+ minutes"
    );
    expect(estimate.explanation).not.toContain("urgent");
  });
});

describe("intake and state lifecycle", () => {
  it("creates an empty state with deterministic session metadata", () => {
    expect(createEmptyState(NOW)).toEqual({
      doctors: [],
      tokens: [],
      events: [],
      nextNumber: 1,
      sessionStartedAt: NOW,
    });
  });

  it("issues deterministic numbered tokens and records an event", () => {
    const state = issueToken(
      createEmptyState(NOW),
      { label: "  Visitor Alpha  ", priority: "standard" },
      NOW
    );
    expect(state.tokens[0]).toMatchObject({
      id: "token-001",
      number: 1,
      label: "Visitor Alpha",
      status: "waiting",
      createdAt: NOW,
    });
    expect(state.nextNumber).toBe(2);
    expect(state.events).toHaveLength(1);
    expect(state.events[0].type).toBe("token_issued");
  });

  it.each(["", "x", "a".repeat(41)])("rejects invalid label %s", label => {
    expect(() =>
      issueToken(createEmptyState(NOW), { label, priority: "standard" }, NOW)
    ).toThrow(/between 2 and 40/);
  });

  it("rejects an invalid priority", () => {
    expect(() =>
      issueToken(
        createEmptyState(NOW),
        { label: "Visitor", priority: "emergency" as "standard" },
        NOW
      )
    ).toThrow(/Invalid priority/);
  });

  it("caps events at the latest 100 entries", () => {
    let state = createEmptyState(NOW);
    for (let index = 0; index < 105; index += 1) {
      state = addToken(
        state,
        `Visitor ${String(index + 1).padStart(3, "0")}`,
        "standard",
        NOW + index
      );
    }
    expect(state.events).toHaveLength(100);
    expect(state.tokens).toHaveLength(105);
    expect(state.events[0].message).toContain("Visitor 006");
  });

  it("creates the requested fictional seed with all doctor statuses and token states", () => {
    const state = createDemoState(NOW);
    expect(state.doctors).toHaveLength(3);
    expect(state.doctors.map(doctor => doctor.status).sort()).toEqual([
      "available",
      "busy",
      "unavailable",
    ]);
    expect(state.tokens).toHaveLength(8);
    expect(
      state.tokens.filter(token => token.status === "in_consultation")
    ).toHaveLength(1);
    expect(
      state.tokens.filter(token => token.status === "completed")
    ).toHaveLength(1);
    expect(
      state.tokens.some(
        token => token.priority === "assisted" && token.status === "waiting"
      )
    ).toBe(true);
    expect(
      state.tokens.some(
        token =>
          token.priority === "standard" && token.createdAt <= NOW - 30 * MINUTE
      )
    ).toBe(true);
  });
});

describe("consultation transitions", () => {
  it("calls the next eligible token, marks the doctor busy, and does not mutate input", () => {
    const original = withDoctor(
      addToken(createEmptyState(NOW), "Standard", "standard", NOW - 5 * MINUTE),
      { id: "d1" }
    );
    const next = callNext(original, "d1", NOW);
    expect(original.tokens[0].status).toBe("waiting");
    expect(original.doctors[0].status).toBe("available");
    expect(next.tokens[0]).toMatchObject({
      status: "in_consultation",
      doctorId: "d1",
      startedAt: NOW,
    });
    expect(next.doctors[0].status).toBe("busy");
  });

  it("calls assisted before an older non-aged standard token", () => {
    let state = createEmptyState(NOW);
    state = addToken(state, "Old standard", "standard", NOW - 10 * MINUTE);
    state = addToken(state, "Assisted", "assisted", NOW - 1 * MINUTE);
    state = withDoctor(state, { id: "d1" });
    const next = callNext(state, "d1", NOW);
    expect(
      next.tokens.find(token => token.status === "in_consultation")?.label
    ).toBe("Assisted");
  });

  it("rejects calling a busy or unavailable doctor", () => {
    let state = withDoctor(createEmptyState(NOW), {
      id: "busy",
      status: "busy",
    });
    state = withDoctor(state, { id: "off", status: "unavailable" });
    state = addToken(state, "Visitor");
    expect(() => callNext(state, "busy", NOW)).toThrow(/while busy/);
    expect(() => callNext(state, "off", NOW)).toThrow(/while unavailable/);
  });

  it("rejects calling when the queue is empty", () => {
    const state = withDoctor(createEmptyState(NOW), { id: "d1" });
    expect(() => callNext(state, "d1", NOW)).toThrow(/queue is empty/);
  });

  it("completes a consultation and releases the doctor", () => {
    let state = withDoctor(addToken(createEmptyState(NOW), "Visitor"), {
      id: "d1",
    });
    state = callNext(state, "d1", NOW);
    const completed = completeConsultation(
      state,
      "token-001",
      NOW + 10 * MINUTE
    );
    expect(completed.tokens[0]).toMatchObject({
      status: "completed",
      completedAt: NOW + 10 * MINUTE,
    });
    expect(completed.doctors[0].status).toBe("available");
  });

  it("rejects completing a waiting, completed, or removed token", () => {
    let state = addToken(createEmptyState(NOW), "Waiting");
    expect(() => completeConsultation(state, "token-001", NOW)).toThrow(
      /not in consultation/
    );
    state = withDoctor(state, { id: "d1" });
    state = callNext(state, "d1", NOW);
    state = completeConsultation(state, "token-001", NOW + MINUTE);
    expect(() =>
      completeConsultation(state, "token-001", NOW + 2 * MINUTE)
    ).toThrow(/not in consultation/);
  });

  it("removes a waiting token without changing unrelated tokens", () => {
    let state = addToken(createEmptyState(NOW), "First");
    state = addToken(state, "Second");
    const removed = removeToken(state, "token-001", NOW);
    expect(removed.tokens.find(token => token.id === "token-001")?.status).toBe(
      "removed"
    );
    expect(removed.tokens.find(token => token.id === "token-002")?.status).toBe(
      "waiting"
    );
    expect(state.tokens[0].status).toBe("waiting");
  });

  it("removes an active token and releases its doctor", () => {
    let state = withDoctor(addToken(createEmptyState(NOW), "Visitor"), {
      id: "d1",
    });
    state = callNext(state, "d1", NOW);
    const removed = removeToken(state, "token-001", NOW + MINUTE);
    expect(removed.tokens[0]).toMatchObject({
      status: "removed",
      doctorId: null,
    });
    expect(removed.doctors[0].status).toBe("available");
  });

  it("returns an active token to waiting and releases its doctor", () => {
    let state = withDoctor(addToken(createEmptyState(NOW), "Visitor"), {
      id: "d1",
    });
    state = callNext(state, "d1", NOW);
    const returned = returnToQueue(state, "token-001", NOW + MINUTE);
    expect(returned.tokens[0]).toMatchObject({
      status: "waiting",
      doctorId: null,
      startedAt: null,
      completedAt: null,
    });
    expect(returned.doctors[0].status).toBe("available");
  });

  it("rejects returning a waiting or terminal token", () => {
    const state = addToken(createEmptyState(NOW), "Visitor");
    expect(() => returnToQueue(state, "token-001", NOW)).toThrow(
      /not an active consultation/
    );
  });
});

describe("doctor status constraints", () => {
  it("allows manual availability changes when no consultation is active", () => {
    let state = withDoctor(createEmptyState(NOW), { id: "d1" });
    state = setDoctorStatus(state, "d1", "unavailable", NOW);
    expect(state.doctors[0].status).toBe("unavailable");
    state = setDoctorStatus(state, "d1", "available", NOW + MINUTE);
    expect(state.doctors[0].status).toBe("available");
  });

  it("prevents making an active consultation available or unavailable", () => {
    let state = withDoctor(addToken(createEmptyState(NOW), "Visitor"), {
      id: "d1",
    });
    state = callNext(state, "d1", NOW);
    expect(() =>
      setDoctorStatus(state, "d1", "available", NOW + MINUTE)
    ).toThrow(/active consultation/);
    expect(() =>
      setDoctorStatus(state, "d1", "unavailable", NOW + MINUTE)
    ).toThrow(/active consultation/);
  });

  it("rejects unknown doctors and invalid statuses", () => {
    const state = withDoctor(createEmptyState(NOW), { id: "d1" });
    expect(() => setDoctorStatus(state, "missing", "available", NOW)).toThrow(
      /Unknown doctor/
    );
    expect(() =>
      setDoctorStatus(state, "d1", "paused" as "available", NOW)
    ).toThrow(/Invalid doctor status/);
  });
});

describe("wait estimates and summary", () => {
  it("uses an available doctor immediately and schedules later tokens by doctor slots", () => {
    let state = createEmptyState(NOW);
    state = withDoctor(state, { id: "d1", serviceMinutes: 10 });
    state = withDoctor(state, { id: "d2", serviceMinutes: 20 });
    state = addToken(state, "First", "standard", NOW);
    state = addToken(state, "Second", "standard", NOW + 1);
    state = addToken(state, "Third", "standard", NOW + 2);
    const waits = estimateWaits(state, NOW);
    expect(waits["token-001"].minutes).toBe(0);
    expect(waits["token-002"].minutes).toBe(0);
    expect(waits["token-003"].minutes).toBe(10);
    expect(waits["token-001"].position).toBe(1);
    expect(waits["token-003"].position).toBe(3);
  });

  it("accounts for the remaining time of a busy doctor", () => {
    let state = withDoctor(createEmptyState(NOW), {
      id: "d1",
      status: "busy",
      serviceMinutes: 20,
    });
    state = addToken(state, "Current");
    state = {
      ...state,
      tokens: [
        {
          ...state.tokens[0],
          status: "in_consultation",
          doctorId: "d1",
          startedAt: NOW - 12 * MINUTE,
        },
        ...state.tokens.slice(1),
      ],
    };
    state = addToken(state, "Waiting");
    const waits = estimateWaits(state, NOW);
    expect(waits["token-002"].minutes).toBe(8);
    expect(waits["token-002"].explanation).toContain("busy doctor");
  });

  it("uses the service duration as fallback for a standalone busy doctor", () => {
    let state = withDoctor(createEmptyState(NOW), {
      id: "d1",
      status: "busy",
      serviceMinutes: 12,
    });
    state = addToken(state, "Waiting");
    expect(estimateWaits(state, NOW)["token-001"].minutes).toBe(12);
  });

  it("returns null minutes when every doctor is unavailable", () => {
    let state = withDoctor(createEmptyState(NOW), {
      id: "d1",
      status: "unavailable",
    });
    state = addToken(state, "Waiting");
    const estimate = estimateWaits(state, NOW)["token-001"];
    expect(estimate.minutes).toBeNull();
    expect(estimate.position).toBe(1);
    expect(estimate.explanation).toContain("All doctors are unavailable");
  });

  it("does not reorder an in-consultation token and returns terminal estimates", () => {
    let state = withDoctor(createEmptyState(NOW), { id: "d1", status: "busy" });
    state = addToken(state, "Current");
    state = {
      ...state,
      tokens: [
        {
          ...state.tokens[0],
          status: "in_consultation",
          doctorId: "d1",
          startedAt: NOW,
        },
        ...state.tokens.slice(1),
      ],
    };
    state = addToken(state, "Waiting");
    state = addToken(state, "Done");
    state = {
      ...state,
      tokens: state.tokens.map(token =>
        token.label === "Done"
          ? { ...token, status: "completed", completedAt: NOW }
          : token
      ),
    };
    const waits = estimateWaits(state, NOW);
    expect(waits["token-001"].position).toBe(0);
    expect(waits["token-001"].explanation).toContain("already underway");
    expect(waits["token-003"].minutes).toBeNull();
    expect(waits["token-003"].explanation).toContain("Completed");
  });

  it("summarizes counts, available doctors, and average waiting time", () => {
    let state = withDoctor(createEmptyState(NOW), { id: "d1" });
    state = withDoctor(state, { id: "d2", status: "unavailable" });
    state = addToken(state, "Waiting one", "standard", NOW - 10 * MINUTE);
    state = addToken(state, "Waiting two", "assisted", NOW - 20 * MINUTE);
    const summary = getSummary(state, NOW);
    expect(summary).toEqual({
      waiting: 2,
      consulting: 0,
      completed: 0,
      removed: 0,
      availableDoctors: 1,
      averageWaitMinutes: 15,
    });
  });

  it("reports null average wait when no tokens are waiting", () => {
    const state = withDoctor(createEmptyState(NOW), { id: "d1" });
    expect(getSummary(state, NOW).averageWaitMinutes).toBeNull();
  });

  it("throws clear errors for unknown token IDs", () => {
    expect(() => removeToken(createEmptyState(NOW), "missing", NOW)).toThrow(
      /Unknown token/
    );
    expect(() =>
      completeConsultation(createEmptyState(NOW), "missing", NOW)
    ).toThrow(/Unknown token/);
  });
});

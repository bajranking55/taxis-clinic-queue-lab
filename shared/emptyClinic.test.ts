import { describe, expect, it } from "vitest";
import {
  callNext,
  completeConsultation,
  createEmptyClinicState,
  issueToken,
} from "./queue";

const now = Date.UTC(2026, 10, 10, 8);

describe("empty clinic workflow", () => {
  it("preserves ready doctors while clearing tokens and events", () => {
    const state = createEmptyClinicState(now);
    expect(state.doctors).toHaveLength(3);
    expect(state.doctors.every(doctor => doctor.status === "available")).toBe(
      true
    );
    expect(state.tokens).toEqual([]);
    expect(state.events).toEqual([]);
    expect(state.nextNumber).toBe(1);
  });
  it("supports issuing, calling and completing a first visitor", () => {
    let state = createEmptyClinicState(now);
    state = issueToken(
      state,
      { label: "Visitor 001", priority: "standard" },
      now
    );
    state = callNext(state, state.doctors[0].id, now);
    expect(state.tokens[0].status).toBe("in_consultation");
    state = completeConsultation(state, state.tokens[0].id, now + 12 * 60_000);
    expect(state.tokens[0].status).toBe("completed");
    expect(state.doctors[0].status).toBe("available");
  });
});

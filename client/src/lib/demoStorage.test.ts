import { describe, expect, it } from "vitest";
import { createDemoState } from "../../../shared/queue";
import { parseDemoSnapshot, serializeDemoSnapshot } from "./demoStorage";

const now = Date.UTC(2026, 10, 10, 8);

describe("demo snapshot safety", () => {
  it("round-trips a valid fictional session", () => {
    const state = createDemoState(now);
    expect(parseDemoSnapshot(serializeDemoSnapshot(state))).toEqual(state);
  });
  it("rejects missing and malformed data", () => {
    expect(parseDemoSnapshot(null)).toBeNull();
    expect(parseDemoSnapshot("not json")).toBeNull();
    expect(parseDemoSnapshot("{}")).toBeNull();
  });
  it("rejects an outdated snapshot version", () => {
    expect(
      parseDemoSnapshot(
        JSON.stringify({ version: 0, state: createDemoState(now) })
      )
    ).toBeNull();
  });
  it("rejects invalid token states and priorities", () => {
    const state = createDemoState(now);
    expect(
      parseDemoSnapshot(
        JSON.stringify({
          version: 1,
          state: {
            ...state,
            tokens: [{ ...state.tokens[0], status: "unknown" }],
          },
        })
      )
    ).toBeNull();
    expect(
      parseDemoSnapshot(
        JSON.stringify({
          version: 1,
          state: {
            ...state,
            tokens: [{ ...state.tokens[0], priority: "urgent" }],
          },
        })
      )
    ).toBeNull();
  });
  it("rejects unknown doctor references", () => {
    const state = createDemoState(now);
    expect(
      parseDemoSnapshot(
        JSON.stringify({
          version: 1,
          state: {
            ...state,
            tokens: [{ ...state.tokens[0], doctorId: "nonexistent" }],
          },
        })
      )
    ).toBeNull();
  });
  it("rejects duplicate token and doctor IDs", () => {
    const state = createDemoState(now);
    expect(
      parseDemoSnapshot(
        JSON.stringify({
          version: 1,
          state: { ...state, tokens: [state.tokens[0], state.tokens[0]] },
        })
      )
    ).toBeNull();
    expect(
      parseDemoSnapshot(
        JSON.stringify({
          version: 1,
          state: { ...state, doctors: [state.doctors[0], state.doctors[0]] },
        })
      )
    ).toBeNull();
  });
  it("rejects impossible service durations", () => {
    const state = createDemoState(now);
    expect(
      parseDemoSnapshot(
        JSON.stringify({
          version: 1,
          state: {
            ...state,
            doctors: [{ ...state.doctors[0], serviceMinutes: 0 }],
          },
        })
      )
    ).toBeNull();
  });
  it("bounds stored payload size", () => {
    expect(parseDemoSnapshot(" ".repeat(1_000_001))).toBeNull();
  });
});

describe("snapshot regression guards", () => {
  it("rejects finite timestamps outside the JavaScript Date range", () => {
    const state = createDemoState(now);
    state.events[0].at = 1e30;
    expect(parseDemoSnapshot(serializeDemoSnapshot(state))).toBeNull();
  });
  it("rejects an active token paired with an available doctor", () => {
    const state = createDemoState(now);
    const active = state.tokens.find(
      token => token.status === "in_consultation"
    )!;
    state.doctors.find(doctor => doctor.id === active.doctorId)!.status =
      "available";
    expect(parseDemoSnapshot(serializeDemoSnapshot(state))).toBeNull();
  });
  it("rejects a next token number that would collide with an existing token", () => {
    const state = createDemoState(now);
    state.nextNumber = 1;
    expect(parseDemoSnapshot(serializeDemoSnapshot(state))).toBeNull();
  });
});

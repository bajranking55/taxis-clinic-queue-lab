import { describe, expect, it } from "vitest";
import { callNext, createDemoState, issueToken, type DemoState } from "./queue";

const now = Date.UTC(2026, 10, 10, 8);

describe("queue safety regressions", () => {
  it("rejects a doctor marked available who already has an active token", () => {
    const state = createDemoState(now);
    const inconsistent: DemoState = {
      ...state,
      doctors: state.doctors.map(doctor => ({
        ...doctor,
        status: "available",
      })),
    };
    const busyId = state.tokens.find(
      token => token.status === "in_consultation"
    )!.doctorId!;
    expect(() => callNext(inconsistent, busyId, now)).toThrow(
      "already has an active consultation"
    );
  });
  it("keeps the latest 100 event IDs unique even at a fixed timestamp", () => {
    let state = createDemoState(now);
    for (let index = 0; index < 150; index++)
      state = issueToken(
        state,
        { label: `Visitor ${index + 10}`, priority: "standard" },
        now
      );
    expect(state.events).toHaveLength(100);
    expect(new Set(state.events.map(event => event.id)).size).toBe(100);
  });
});

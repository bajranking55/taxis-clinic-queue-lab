import type { DemoState } from "@shared/queue";

export const DEMO_STORAGE_KEY = "taxis-demo-session-v1";
const tokenStates = new Set([
  "waiting",
  "in_consultation",
  "completed",
  "removed",
]);
const doctorStates = new Set(["available", "busy", "unavailable"]);
const priorities = new Set(["standard", "assisted"]);
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isTimestamp = (value: unknown): value is number =>
  isNumber(value) && value >= 0 && value <= 8_640_000_000_000_000;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** Session storage is untrusted input: reject damaged or outdated demo snapshots. */
export function parseDemoSnapshot(raw: string | null): DemoState | null {
  if (!raw || raw.length > 1_000_000) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.version !== 1 || !isRecord(data.state))
      return null;
    const state = data.state;
    if (
      !Array.isArray(state.doctors) ||
      state.doctors.length > 20 ||
      !Array.isArray(state.tokens) ||
      state.tokens.length > 1000 ||
      !Array.isArray(state.events) ||
      state.events.length > 100
    )
      return null;
    if (
      !isNumber(state.nextNumber) ||
      !Number.isInteger(state.nextNumber) ||
      state.nextNumber < 1 ||
      !isTimestamp(state.sessionStartedAt)
    )
      return null;
    if (
      !state.doctors.every(
        doctor =>
          isRecord(doctor) &&
          typeof doctor.id === "string" &&
          typeof doctor.name === "string" &&
          typeof doctor.specialty === "string" &&
          typeof doctor.room === "string" &&
          doctorStates.has(String(doctor.status)) &&
          isNumber(doctor.serviceMinutes) &&
          doctor.serviceMinutes > 0 &&
          doctor.serviceMinutes <= 240
      )
    )
      return null;
    if (
      !state.tokens.every(
        token =>
          isRecord(token) &&
          typeof token.id === "string" &&
          isNumber(token.number) &&
          Number.isInteger(token.number) &&
          token.number >= 1 &&
          typeof token.label === "string" &&
          token.label.length >= 2 &&
          token.label.length <= 40 &&
          priorities.has(String(token.priority)) &&
          tokenStates.has(String(token.status)) &&
          isTimestamp(token.createdAt) &&
          (token.doctorId === null || typeof token.doctorId === "string") &&
          (token.startedAt === null || isTimestamp(token.startedAt)) &&
          (token.completedAt === null || isTimestamp(token.completedAt))
      )
    )
      return null;
    if (
      !state.events.every(
        event =>
          isRecord(event) &&
          typeof event.id === "string" &&
          typeof event.type === "string" &&
          typeof event.message === "string" &&
          isTimestamp(event.at)
      )
    )
      return null;
    const snapshot = state as unknown as DemoState;
    const doctorIds = new Set(snapshot.doctors.map(doctor => doctor.id));
    const tokenIds = new Set(snapshot.tokens.map(token => token.id));
    const tokenNumbers = new Set(snapshot.tokens.map(token => token.number));
    if (
      doctorIds.size !== snapshot.doctors.length ||
      tokenIds.size !== snapshot.tokens.length ||
      tokenNumbers.size !== snapshot.tokens.length
    )
      return null;
    if (
      snapshot.tokens.some(
        token => token.doctorId !== null && !doctorIds.has(token.doctorId)
      )
    )
      return null;
    if (snapshot.tokens.some(token => token.number >= snapshot.nextNumber))
      return null;
    const activeTokens = snapshot.tokens.filter(
      token => token.status === "in_consultation"
    );
    const activeDoctorIds = activeTokens.map(token => token.doctorId);
    if (
      activeDoctorIds.some(id => id === null) ||
      new Set(activeDoctorIds).size !== activeDoctorIds.length
    )
      return null;
    if (
      activeTokens.some(
        token =>
          token.startedAt === null ||
          snapshot.doctors.find(doctor => doctor.id === token.doctorId)
            ?.status !== "busy"
      )
    )
      return null;
    if (
      snapshot.tokens.some(
        token =>
          token.status === "waiting" &&
          (token.doctorId !== null ||
            token.startedAt !== null ||
            token.completedAt !== null)
      )
    )
      return null;
    return snapshot;
  } catch {
    return null;
  }
}

export function serializeDemoSnapshot(state: DemoState): string {
  return JSON.stringify({ version: 1, state });
}

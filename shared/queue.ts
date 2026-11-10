export type Priority = "standard" | "assisted";
export type DoctorStatus = "available" | "busy" | "unavailable";
export type TokenStatus =
  | "waiting"
  | "in_consultation"
  | "completed"
  | "removed";

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  room: string;
  status: DoctorStatus;
  serviceMinutes: number;
}

export interface Token {
  id: string;
  number: number;
  label: string;
  priority: Priority;
  status: TokenStatus;
  createdAt: number;
  doctorId: string | null;
  startedAt: number | null;
  completedAt: number | null;
}

export interface QueueEvent {
  id: string;
  at: number;
  type: string;
  message: string;
}

export interface DemoState {
  doctors: Doctor[];
  tokens: Token[];
  events: QueueEvent[];
  nextNumber: number;
  sessionStartedAt: number;
}

export interface IssueTokenInput {
  label: string;
  priority: Priority;
}

export interface WaitEstimate {
  minutes: number | null;
  position: number;
  explanation: string;
}

const MINUTE = 60_000;
const AGEING_MINUTES = 30;
const MAX_EVENTS = 100;

function timestampOrNow(now?: number): number {
  const value = now ?? Date.now();
  if (!Number.isFinite(value)) {
    throw new Error("now must be a finite timestamp");
  }
  return value;
}

function assertPriority(priority: Priority): void {
  if (priority !== "standard" && priority !== "assisted") {
    throw new Error(`Invalid priority: ${String(priority)}`);
  }
}

function assertDoctorStatus(status: DoctorStatus): void {
  if (status !== "available" && status !== "busy" && status !== "unavailable") {
    throw new Error(`Invalid doctor status: ${String(status)}`);
  }
}

function assertTokenStatus(status: TokenStatus): void {
  if (
    status !== "waiting" &&
    status !== "in_consultation" &&
    status !== "completed" &&
    status !== "removed"
  ) {
    throw new Error(`Invalid token status: ${String(status)}`);
  }
}

function padded(value: number): string {
  return String(value).padStart(3, "0");
}

function event(
  state: DemoState,
  at: number,
  type: string,
  message: string
): QueueEvent {
  const lastId = state.events[state.events.length - 1]?.id;
  const lastSequence = lastId?.match(/^event-\d+-(\d+)-/);
  const sequence = lastSequence
    ? Number(lastSequence[1]) + 1
    : state.events.length + 1;
  return {
    id: `event-${at}-${sequence}-${type}`,
    at,
    type,
    message,
  };
}

function withEvent(
  state: DemoState,
  at: number,
  type: string,
  message: string
): QueueEvent[] {
  return [...state.events, event(state, at, type, message)].slice(-MAX_EVENTS);
}

function doctorFor(state: DemoState, doctorId: string): Doctor {
  const doctor = state.doctors.find(candidate => candidate.id === doctorId);
  if (!doctor) {
    throw new Error(`Unknown doctor: ${doctorId}`);
  }
  return doctor;
}

function tokenFor(state: DemoState, tokenId: string): Token {
  const token = state.tokens.find(candidate => candidate.id === tokenId);
  if (!token) {
    throw new Error(`Unknown token: ${tokenId}`);
  }
  return token;
}

function activeTokenForDoctor(
  state: DemoState,
  doctorId: string
): Token | undefined {
  return state.tokens.find(
    token => token.status === "in_consultation" && token.doctorId === doctorId
  );
}

function serviceDuration(doctor: Doctor): number {
  return Number.isFinite(doctor.serviceMinutes) && doctor.serviceMinutes > 0
    ? doctor.serviceMinutes
    : 15;
}

function isAgedStandard(token: Token, now: number): boolean {
  return (
    token.priority === "standard" &&
    now - token.createdAt >= AGEING_MINUTES * MINUTE
  );
}

function compareNumbers(left: Token, right: Token): number {
  return left.number - right.number;
}

function compareWaiting(left: Token, right: Token, now: number): number {
  const leftRank =
    left.priority === "assisted" || isAgedStandard(left, now) ? 0 : 1;
  const rightRank =
    right.priority === "assisted" || isAgedStandard(right, now) ? 0 : 1;

  return (
    leftRank - rightRank ||
    left.createdAt - right.createdAt ||
    compareNumbers(left, right)
  );
}

function waitingTokens(state: DemoState, now: number): Token[] {
  return state.tokens
    .filter(token => token.status === "waiting")
    .sort((left, right) => compareWaiting(left, right, now));
}

export function createEmptyState(now?: number): DemoState {
  const sessionStartedAt = timestampOrNow(now);
  return {
    doctors: [],
    tokens: [],
    events: [],
    nextNumber: 1,
    sessionStartedAt,
  };
}

export function createDemoState(now?: number): DemoState {
  const sessionStartedAt = timestampOrNow(now);
  const doctors: Doctor[] = [
    {
      id: "doctor-rao",
      name: "Dr. A. Rao",
      specialty: "General practice",
      room: "Room 01",
      status: "available",
      serviceMinutes: 12,
    },
    {
      id: "doctor-chen",
      name: "Dr. L. Chen",
      specialty: "Family care",
      room: "Room 02",
      status: "busy",
      serviceMinutes: 18,
    },
    {
      id: "doctor-ibarra",
      name: "Dr. M. Ibarra",
      specialty: "Wellness review",
      room: "Room 03",
      status: "unavailable",
      serviceMinutes: 20,
    },
  ];

  const tokens: Token[] = [
    {
      id: "token-001",
      number: 1,
      label: "Visitor 001",
      priority: "standard",
      status: "waiting",
      createdAt: sessionStartedAt - 46 * MINUTE,
      doctorId: null,
      startedAt: null,
      completedAt: null,
    },
    {
      id: "token-002",
      number: 2,
      label: "Visitor 002",
      priority: "assisted",
      status: "waiting",
      createdAt: sessionStartedAt - 8 * MINUTE,
      doctorId: null,
      startedAt: null,
      completedAt: null,
    },
    {
      id: "token-003",
      number: 3,
      label: "Visitor 003",
      priority: "standard",
      status: "waiting",
      createdAt: sessionStartedAt - 3 * MINUTE,
      doctorId: null,
      startedAt: null,
      completedAt: null,
    },
    {
      id: "token-004",
      number: 4,
      label: "Visitor 004",
      priority: "standard",
      status: "in_consultation",
      createdAt: sessionStartedAt - 22 * MINUTE,
      doctorId: "doctor-chen",
      startedAt: sessionStartedAt - 10 * MINUTE,
      completedAt: null,
    },
    {
      id: "token-005",
      number: 5,
      label: "Visitor 005",
      priority: "assisted",
      status: "completed",
      createdAt: sessionStartedAt - 58 * MINUTE,
      doctorId: "doctor-rao",
      startedAt: sessionStartedAt - 52 * MINUTE,
      completedAt: sessionStartedAt - 38 * MINUTE,
    },
    {
      id: "token-006",
      number: 6,
      label: "Visitor 006",
      priority: "assisted",
      status: "waiting",
      createdAt: sessionStartedAt - 18 * MINUTE,
      doctorId: null,
      startedAt: null,
      completedAt: null,
    },
    {
      id: "token-007",
      number: 7,
      label: "Visitor 007",
      priority: "standard",
      status: "removed",
      createdAt: sessionStartedAt - 30 * MINUTE,
      doctorId: null,
      startedAt: null,
      completedAt: null,
    },
    {
      id: "token-008",
      number: 8,
      label: "Visitor 008",
      priority: "standard",
      status: "waiting",
      createdAt: sessionStartedAt - 1 * MINUTE,
      doctorId: null,
      startedAt: null,
      completedAt: null,
    },
  ];

  return {
    doctors,
    tokens,
    events: [
      {
        id: `event-${sessionStartedAt}-session`,
        at: sessionStartedAt,
        type: "session_started",
        message: "Fictional demo queue started.",
      },
      {
        id: `event-${sessionStartedAt}-seeded`,
        at: sessionStartedAt,
        type: "demo_seeded",
        message: "Fictional demo tokens and doctor availability loaded.",
      },
    ],
    nextNumber: 9,
    sessionStartedAt,
  };
}

/** Empty queue, but with a ready room roster so the demo can still progress. */
export function createEmptyClinicState(now?: number): DemoState {
  const sample = createDemoState(now);
  return {
    ...createEmptyState(sample.sessionStartedAt),
    doctors: sample.doctors.map(doctor => ({
      ...doctor,
      status: "available" as const,
    })),
  };
}

export function orderWaiting(tokens: Token[], now?: number): Token[] {
  const at = timestampOrNow(now);
  return tokens
    .filter(token => token.status === "waiting")
    .slice()
    .sort((left, right) => compareWaiting(left, right, at));
}

export function issueToken(
  state: DemoState,
  input: IssueTokenInput,
  now?: number
): DemoState {
  const at = timestampOrNow(now);
  if (!input || typeof input.label !== "string") {
    throw new Error("Token label is required");
  }
  const label = input.label.trim();
  if (label.length < 2 || label.length > 40) {
    throw new Error("Token label must be between 2 and 40 characters");
  }
  assertPriority(input.priority);
  if (!Number.isInteger(state.nextNumber) || state.nextNumber < 1) {
    throw new Error("State nextNumber must be a positive integer");
  }

  const number = state.nextNumber;
  const token: Token = {
    id: `token-${padded(number)}`,
    number,
    label,
    priority: input.priority,
    status: "waiting",
    createdAt: at,
    doctorId: null,
    startedAt: null,
    completedAt: null,
  };

  return {
    ...state,
    tokens: [...state.tokens, token],
    events: withEvent(
      state,
      at,
      "token_issued",
      `${label} joined the ${input.priority} queue.`
    ),
    nextNumber: number + 1,
  };
}

export function callNext(
  state: DemoState,
  doctorId: string,
  now?: number
): DemoState {
  const at = timestampOrNow(now);
  const doctor = doctorFor(state, doctorId);
  if (doctor.status !== "available") {
    throw new Error(
      `Doctor ${doctor.name} cannot call a token while ${doctor.status}`
    );
  }
  if (activeTokenForDoctor(state, doctorId)) {
    throw new Error(`Doctor ${doctor.name} already has an active consultation`);
  }
  const next = waitingTokens(state, at)[0];
  if (!next) {
    throw new Error("Cannot call the next token: the queue is empty");
  }

  return {
    ...state,
    doctors: state.doctors.map(candidate =>
      candidate.id === doctorId ? { ...candidate, status: "busy" } : candidate
    ),
    tokens: state.tokens.map(token =>
      token.id === next.id
        ? {
            ...token,
            status: "in_consultation",
            doctorId,
            startedAt: at,
          }
        : token
    ),
    events: withEvent(
      state,
      at,
      "consultation_started",
      `${doctor.name} called ${next.label}.`
    ),
  };
}

export function completeConsultation(
  state: DemoState,
  tokenId: string,
  now?: number
): DemoState {
  const at = timestampOrNow(now);
  const token = tokenFor(state, tokenId);
  if (token.status !== "in_consultation") {
    throw new Error(`Token ${token.label} is not in consultation`);
  }
  if (!token.doctorId) {
    throw new Error(`Token ${token.label} has no assigned doctor`);
  }
  const doctor = doctorFor(state, token.doctorId);

  return {
    ...state,
    doctors: state.doctors.map(candidate =>
      candidate.id === doctor.id
        ? { ...candidate, status: "available" }
        : candidate
    ),
    tokens: state.tokens.map(candidate =>
      candidate.id === tokenId
        ? { ...candidate, status: "completed", completedAt: at }
        : candidate
    ),
    events: withEvent(
      state,
      at,
      "consultation_completed",
      `${token.label} completed consultation with ${doctor.name}.`
    ),
  };
}

export function removeToken(
  state: DemoState,
  tokenId: string,
  now?: number
): DemoState {
  const at = timestampOrNow(now);
  const token = tokenFor(state, tokenId);
  if (token.status === "completed" || token.status === "removed") {
    throw new Error(
      `Token ${token.label} cannot be removed from ${token.status}`
    );
  }

  const assignedDoctorId =
    token.status === "in_consultation" ? token.doctorId : null;
  const doctor = assignedDoctorId ? doctorFor(state, assignedDoctorId) : null;
  return {
    ...state,
    doctors: doctor
      ? state.doctors.map(candidate =>
          candidate.id === doctor.id
            ? { ...candidate, status: "available" }
            : candidate
        )
      : state.doctors.slice(),
    tokens: state.tokens.map(candidate =>
      candidate.id === tokenId
        ? {
            ...candidate,
            status: "removed",
            doctorId: null,
          }
        : candidate
    ),
    events: withEvent(
      state,
      at,
      "token_removed",
      `${token.label} was removed from the demo queue.`
    ),
  };
}

export function returnToQueue(
  state: DemoState,
  tokenId: string,
  now?: number
): DemoState {
  const at = timestampOrNow(now);
  const token = tokenFor(state, tokenId);
  if (token.status !== "in_consultation") {
    throw new Error(`Token ${token.label} is not an active consultation`);
  }
  if (!token.doctorId) {
    throw new Error(`Token ${token.label} has no assigned doctor`);
  }
  const doctor = doctorFor(state, token.doctorId);

  return {
    ...state,
    doctors: state.doctors.map(candidate =>
      candidate.id === doctor.id
        ? { ...candidate, status: "available" }
        : candidate
    ),
    tokens: state.tokens.map(candidate =>
      candidate.id === tokenId
        ? {
            ...candidate,
            status: "waiting",
            doctorId: null,
            startedAt: null,
            completedAt: null,
          }
        : candidate
    ),
    events: withEvent(
      state,
      at,
      "consultation_returned",
      `${token.label} returned to the waiting queue.`
    ),
  };
}

export function setDoctorStatus(
  state: DemoState,
  doctorId: string,
  status: DoctorStatus,
  now?: number
): DemoState {
  const at = timestampOrNow(now);
  assertDoctorStatus(status);
  const doctor = doctorFor(state, doctorId);
  const active = activeTokenForDoctor(state, doctorId);
  if (active && (status === "available" || status === "unavailable")) {
    throw new Error(
      `Cannot mark ${doctor.name} ${status} during ${active.label}'s active consultation`
    );
  }
  if (doctor.status === status) {
    return state;
  }

  return {
    ...state,
    doctors: state.doctors.map(candidate =>
      candidate.id === doctorId ? { ...candidate, status } : candidate
    ),
    events: withEvent(
      state,
      at,
      "doctor_status_changed",
      `${doctor.name} is now ${status}.`
    ),
  };
}

export function estimateWaits(
  state: DemoState,
  now?: number
): Record<string, WaitEstimate> {
  const at = timestampOrNow(now);
  const ordered = waitingTokens(state, at);
  const estimates: Record<string, WaitEstimate> = {};
  const slots = state.doctors
    .filter(doctor => doctor.status === "available" || doctor.status === "busy")
    .map(doctor => {
      const active = activeTokenForDoctor(state, doctor.id);
      let readyAt = at;
      if (doctor.status === "busy") {
        if (active?.startedAt != null) {
          const elapsedMinutes = Math.max(0, (at - active.startedAt) / MINUTE);
          const remainingMinutes = Math.max(
            serviceDuration(doctor) - elapsedMinutes,
            0
          );
          readyAt = at + remainingMinutes * MINUTE;
        } else {
          readyAt = at + serviceDuration(doctor) * MINUTE;
        }
      }
      return { doctor, readyAt };
    });

  const hasEligibleDoctor = slots.length > 0;
  ordered.forEach((token, index) => {
    const rankExplanation =
      token.priority === "assisted"
        ? "assisted priority"
        : isAgedStandard(token, at)
          ? "standard priority aged 30+ minutes"
          : "standard FIFO priority";

    if (!hasEligibleDoctor) {
      estimates[token.id] = {
        minutes: null,
        position: index + 1,
        explanation: `Position ${index + 1}; ${rankExplanation}. All doctors are unavailable, so no estimate is available.`,
      };
      return;
    }

    let selected = slots[0];
    for (const slot of slots.slice(1)) {
      if (slot.readyAt < selected.readyAt) {
        selected = slot;
      }
    }
    const minutes = Math.max(0, Math.ceil((selected.readyAt - at) / MINUTE));
    estimates[token.id] = {
      minutes,
      position: index + 1,
      explanation: `Position ${index + 1}; ${rankExplanation}. Scheduled with ${selected.doctor.name}, an eligible ${selected.doctor.status} doctor.`,
    };
    selected.readyAt += serviceDuration(selected.doctor) * MINUTE;
  });

  for (const token of state.tokens) {
    if (token.status === "in_consultation") {
      estimates[token.id] = {
        minutes: null,
        position: 0,
        explanation:
          "In consultation; this token is already underway and is not reordered.",
      };
    } else if (token.status === "completed") {
      estimates[token.id] = {
        minutes: null,
        position: 0,
        explanation: "Completed consultation; no waiting estimate.",
      };
    } else if (token.status === "removed") {
      estimates[token.id] = {
        minutes: null,
        position: 0,
        explanation: "Removed from the demo queue; no waiting estimate.",
      };
    }
  }

  return estimates;
}

export function getSummary(
  state: DemoState,
  now?: number
): {
  waiting: number;
  consulting: number;
  completed: number;
  removed: number;
  availableDoctors: number;
  averageWaitMinutes: number | null;
} {
  const at = timestampOrNow(now);
  const waiting = state.tokens.filter(token => token.status === "waiting");
  const totalWait = waiting.reduce(
    (sum, token) => sum + Math.max(0, at - token.createdAt),
    0
  );
  return {
    waiting: waiting.length,
    consulting: state.tokens.filter(token => token.status === "in_consultation")
      .length,
    completed: state.tokens.filter(token => token.status === "completed")
      .length,
    removed: state.tokens.filter(token => token.status === "removed").length,
    availableDoctors: state.doctors.filter(
      doctor => doctor.status === "available"
    ).length,
    averageWaitMinutes:
      waiting.length === 0
        ? null
        : Math.round((totalWait / waiting.length / MINUTE) * 10) / 10,
  };
}

// Keep this assertion close to the public type guards so malformed callers get a clear error.
export function assertValidTokenStatus(status: TokenStatus): void {
  assertTokenStatus(status);
}

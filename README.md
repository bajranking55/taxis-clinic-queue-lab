# Taxis — Clinic Queue Lab

**A calmer kind of queue.** Taxis is an AI-assisted learning prototype for exploring clinic reception workflows using entirely fictional visitors and doctors. It connects a readable staff workspace to an explicit scheduling engine: issue tokens, change room availability, call the next visitor, complete a consultation, and see why the queue is ordered that way.

This is a new portfolio/learning project created with AI assistance. It is not a deployed hospital system, a clinical triage tool, medical advice, privacy-certified software, or evidence of real-world impact. No claims of real users, clients, historical maintenance, or measured reductions in waiting time are made.

## What works

The queue workspace supports fictional token intake with standard/assisted categories, active/waiting/in-care/finished filters, search, per-token wait estimates and a current session summary. The room panel connects available/busy/unavailable doctor states to call-next and consultation completion. A consultation can return to the waiting queue; removals and resets require confirmation.

The rules screen explains priority ageing and fictional service times. The activity log retains up to 100 session events. Reset reloads sample data, while an empty-queue session retains the room roster so a visitor can actually progress through the workflow.

## Try it locally

Prerequisites: Node.js 22 LTS and pnpm **10.18.0**. Use the checked-in lockfile and reviewed dependency-build permissions in `pnpm-workspace.yaml`.

```bash
corepack enable
corepack prepare pnpm@10.18.0 --activate
pnpm install --frozen-lockfile
pnpm dev:static
```

Open `http://localhost:3000`. The queue prototype needs no database, API key, model subscription or login. A small copy of the generated icon is included at `client/public/taxis-icon.webp`, so the favicon is available in local clones too.

```bash
pnpm check         # TypeScript
pnpm test          # Vitest: engine, session snapshots and starter integration checks
pnpm build:static  # Standalone frontend output: dist/public
```

For the included managed server wrapper, `pnpm dev` serves the frontend through Express; `pnpm build` builds both frontend and server; `pnpm start` serves that production output. The health endpoint is `/api/health`. Keep browser-facing URLs relative.

## Architecture

| Area | Responsibility |
|---|---|
| `shared/queue.ts` | Framework-independent state types, sample data, queue order, transitions, room guards and wait scheduling |
| `shared/queue*.test.ts` | Core behaviours and safety regressions |
| `client/src/pages/Home.tsx` | Workspace views, derived summaries and demo actions |
| `client/src/components/IntakeDialog.tsx` | Fictional token entry and category selection |
| `client/src/components/DoctorPanel.tsx` | Room availability and consultation actions |
| `client/src/lib/demoStorage.ts` | Bounded, versioned browser-session snapshot parsing |
| `client/src/lib/demoStorage.test.ts` | Damaged snapshot, Date-range and state-consistency regressions |
| `client/src/index.css` | Responsive visual system, focus states and reduced-motion handling |
| `client/public/manus-routes.json` | Actual page-route manifest for managed Preview |
| `server/_core`, `server/routers.ts`, `drizzle` | Supplied managed starter infrastructure; not used to store or serve queue records |
| `GITHUB-START-HERE.md` | Plain-language Git/GitHub guide for a first repository |

The frontend is React/TypeScript with accessible Radix dialog primitives, Lucide icons and a pure TypeScript engine. The starter additionally includes Express/tRPC/Drizzle/MySQL integration. The Database power-up was not selected, so queue doctors, tokens and events are **not database-backed**. Existing provisioned starter capabilities do not imply the app uses them. No staff-account or shared multi-user queue feature is claimed.

## Scheduling rules

Tokens have four states: `waiting`, `in_consultation`, `completed`, `removed`. A new token starts waiting. Calling next starts a consultation and marks its room busy. Completing releases the room. Returning to queue preserves the original arrival time and releases the room. Completed/removed tokens cannot be arbitrarily reopened. An active consultation is never pre-empted by a newly arriving token.

Assisted tokens and standard tokens that have waited **at least 30 minutes** belong to the higher scheduling group. Earlier arrival wins within a group, with token number as a tie-breaker. All other standard tokens follow arrival order. This ageing rule illustrates starvation prevention—it does not infer medical urgency or clinical need.

The wait estimator uses list scheduling: in queue order, each token is placed into the room expected to become free earliest. Available rooms start at zero delay; busy rooms include a fictional remaining service duration; unavailable rooms are excluded. Sample room durations are **12, 18 and 20 minutes**. If every room is unavailable, the estimate is absent rather than a made-up value. Predicted delays are rounded up to whole minutes. The UI's estimated average uses these predicted delays; the engine summary also exposes a separate elapsed-wait metric, which is not a future forecast.

Ordering is O(n log n); scheduling is O(n × d), where n is waiting tokens and d is eligible rooms. Immutability makes state transitions predictable and directly testable without React or a browser. This is a small-demo implementation, not a high-volume production queue service.

## Data policy and limitations

Only use fictional labels. Queue records stay in this tab's **sessionStorage**, with an in-memory fallback if storage is blocked. Refresh normally keeps the session; closing the tab normally ends it, although browser session restoration can retain session data. A different browser/tab visitor does not share the queue. No patient/token API is called, and queue state is not sent to a queue backend. Hosting and ordinary platform telemetry are separate from the application state model; do not enter actual patient data.

Snapshot loading validates version, array bounds, enums, timestamps, IDs, next token numbering and active-doctor consistency. Damaged data resets to a valid sample. This is defensive handling, not a security or regulatory certification. The UI itself remains a demo, not a protected production staff portal.

There is no validated predictive model, clinical triage, diagnosis, department-specific routing, real-time multi-client synchronisation, persistent database queue, hospital integration, notification service, role-based access control, or certified privacy/compliance layer. No automatic timer completes visits; staff demo actions determine transitions. Busy-room estimates can be optimistic when a visit exceeds its fictional duration.

## AI assistance and project provenance

AI assistance was used for implementation, UI, tests, documentation and the generated brand icon. Divyansh should review the implementation, run it, understand its design choices and make genuine improvements before presenting it as work he can maintain. Existing template infrastructure is identified rather than represented as custom-built project functionality. Git history reflects actual work dates; it is not backdated.

Connecting this repository to a platform or receiving a project invitation does not guarantee acceptance, approved hours or payment. Follow the opportunity's actual project criteria and AI-use/IP rules. Do not upload confidential employer code or claim this new prototype is an established personally maintained project.

## Sensible future improvements

Once the prototype is understood, useful engineering work could include dedicated doctor rosters, deterministic simulation time, broader property-based tests, separate presentation/state controllers and a genuinely authorised backend with ownership, concurrency control and privacy safeguards. A backend is a deliberate future scope choice—not a feature already delivered here.

## Beginner handoff

Start with [GitHub zero se](GITHUB-START-HERE.md). One understood project is more useful than several unexplained repositories. The guide covers repo/commit/push concepts, private repository connection, cloning, local running and future updates.

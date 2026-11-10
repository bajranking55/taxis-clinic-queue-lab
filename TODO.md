# Taxis — Clinic Queue Lab

Approved blueprint: beginner-friendly, AI-assisted hospital queue-management prototype, fictional demo data only. No real hospital deployment, clinical triage, medical advice, real-world users/impact, old development history, paid-work or Alignerr-approval claims. The Persistent Demo Records / Database power-up was not selected: no database-backed doctors/tokens/events or staff-account system was added. Existing starter infrastructure remains unused by queue features. Demo data belongs to this browser tab's session; state is not shared across visitors.

Visual implementation: editorial Swiss operations console with warm ivory canvas, deep ink navigation, teal interaction accents, orange priority markers and monospaced token IDs. Sparse controls; responsive workspace, focus states, contrast improvements and reduced-motion support. No decorative stock illustrations or copied third-party dashboard assets. The generated queue-mark icon is included in the repository and used as a favicon.

- [x] Token intake and queue: issue new tokens for fictional patients; show token number, state and arrival details; include empty states and validated inputs. The form requests a fictional label, not medical/personal details.
- [x] Doctor availability: show available, busy and unavailable states and allow valid demo status updates; prevent changes that conflict with an active consultation.
- [x] Transparent scheduling: apply explainable assisted-first/30-minute standard-ageing priority rules; state that these are not clinical triage/medical advice.
- [x] Staff workflow: call the next eligible token, manage waiting/in-consultation/completed/removed transitions, and show current queue summary. Invalid transitions produce clear errors; one room cannot receive a second active consultation.
- [x] Wait estimates: show waiting-time estimates based on queue position and fictional 12/18/20-minute service assumptions; label them as model estimates, not promises. Unavailable rooms are excluded; no capacity means no estimate. The summary's predicted average derives from these estimates, not elapsed waiting time.
- [x] Safe demo lifecycle: fictional initial data, input validation, empty states, visible browser-session persistence limitations, and explicitly confirmed reset/remove controls. An empty queue keeps available rooms so the workflow remains usable. Damaged timestamps/state snapshots are rejected.
- [x] Automated checks: runnable tests cover queue ordering, priority behaviour, doctor eligibility, invalid/valid transitions, wait-time calculations, empty-clinic lifecycle, capped-history ID uniqueness and snapshot safety.
- [x] Source and documentation: polished README, setup/run/test commands, simple architecture and engineering explanations, limitations and future improvements. AI assistance and starter provenance are documented honestly.
- [x] Beginner Git/GitHub handoff guide: repo/commit/remote in plain language; account/repo setup, first save/push, README verification and future update workflow. FIRST-RUN.md explains the actual demo. No fabricated commit dates or experience claims.
- [ ] Final delivery: meaningful runnable Preview, checked source and recorded project checkpoint; save/connect to user's new private GitHub repository through the owner-confirmed connection flow. The app/source/checks are ready; GitHub transfer remains pending until owner authorisation, push and completion verification.

## Existing evidence

`pnpm check`, `pnpm test` (54 tests across 6 files), `pnpm build`, `git diff --check` and HTTP health/route/asset checks passed. A read-only implementation review found empty-workflow, corrupted-state and metric-label defects; they were fixed with regression tests. The app-side session-replay collector was disabled. No database queue or patient API was added. No browser screenshot or production clinical validation was claimed.

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coffee,
  FileCode2,
  FlaskConical,
  LayoutDashboard,
  ListOrdered,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IntakeDialog } from "@/components/IntakeDialog";
import { DoctorPanel } from "@/components/DoctorPanel";
import {
  DEMO_STORAGE_KEY,
  parseDemoSnapshot,
  serializeDemoSnapshot,
} from "@/lib/demoStorage";
import {
  callNext,
  completeConsultation,
  createDemoState,
  createEmptyClinicState,
  estimateWaits,
  getSummary,
  issueToken,
  orderWaiting,
  removeToken,
  returnToQueue,
  setDoctorStatus,
  type DemoState,
  type DoctorStatus,
  type Priority,
  type Token,
} from "@shared/queue";

type View = "queue" | "rules" | "activity";
type Filter = "active" | "waiting" | "in_consultation" | "finished";
type PendingAction = { kind: "reset" | "empty" | "remove"; id?: string };
const formatToken = (number: number) => `T-${String(number).padStart(3, "0")}`;
const clock = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
const statusText = (status: Token["status"]) =>
  status === "in_consultation"
    ? "In consultation"
    : status === "waiting"
      ? "Waiting"
      : status === "completed"
        ? "Completed"
        : "Removed";

export default function Home() {
  const [state, setState] = useState<DemoState>(() => {
    try {
      return (
        parseDemoSnapshot(sessionStorage.getItem(DEMO_STORAGE_KEY)) ||
        createDemoState()
      );
    } catch {
      return createDemoState();
    }
  });
  const [now, setNow] = useState(Date.now());
  const [view, setView] = useState<View>("queue");
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );
  const [storageUnavailable, setStorageUnavailable] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(DEMO_STORAGE_KEY, serializeDemoSnapshot(state));
      setStorageUnavailable(false);
    } catch {
      setStorageUnavailable(true);
    }
  }, [state]);

  const summary = useMemo(() => getSummary(state, now), [state, now]);
  const waits = useMemo(() => estimateWaits(state, now), [state, now]);
  const waiting = useMemo(
    () => orderWaiting(state.tokens, now),
    [state.tokens, now]
  );
  const predictedWaits = waiting.map(token => waits[token.id]?.minutes);
  const averageEstimate =
    waiting.length &&
    predictedWaits.every(minutes => typeof minutes === "number")
      ? Math.round(
          predictedWaits.reduce<number>(
            (sum, minutes) => sum + (minutes ?? 0),
            0
          ) / waiting.length
        )
      : null;
  const consulting = state.tokens.filter(
    token => token.status === "in_consultation"
  );
  const finished = state.tokens
    .filter(token => token.status === "completed" || token.status === "removed")
    .sort(
      (a, b) => (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt)
    );
  const visible = (
    filter === "active"
      ? [...consulting, ...waiting]
      : filter === "waiting"
        ? waiting
        : filter === "in_consultation"
          ? consulting
          : finished
  ).filter(
    token =>
      !search ||
      `${formatToken(token.number)} ${token.label} ${statusText(token.status)}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );
  const next = waiting[0];
  const firstAvailable = state.doctors.find(
    doctor => doctor.status === "available"
  );
  const date = new Date(now).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  function update(
    transform: (current: DemoState) => DemoState,
    successMessage: string
  ): boolean {
    try {
      const changed = transform(state);
      setState(changed);
      setNow(Date.now());
      toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "That action could not be completed."
      );
      return false;
    }
  }
  const onCall = (doctorId: string) =>
    update(
      current => callNext(current, doctorId),
      "Next visitor called to consultation."
    );
  const onComplete = (tokenId: string) =>
    update(
      current => completeConsultation(current, tokenId),
      "Visit completed. The room is available again."
    );
  const onStatus = (doctorId: string, status: DoctorStatus) =>
    update(
      current => setDoctorStatus(current, doctorId, status),
      status === "available" ? "Room is available." : "Room is on a break."
    );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="/" className="brand" aria-label="Taxis home">
          <span className="brand-mark">
            <ListOrdered size={22} />
          </span>
          <span>
            taxis<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="workspace-label">CLINIC QUEUE LAB</div>
        <nav className="desktop-nav" aria-label="Workspace navigation">
          <button
            className={view === "queue" ? "active" : ""}
            onClick={() => setView("queue")}
          >
            <LayoutDashboard size={18} /> Queue workspace{" "}
            <span className="nav-count">
              {summary.waiting + summary.consulting}
            </span>
          </button>
          <button
            className={view === "rules" ? "active" : ""}
            onClick={() => setView("rules")}
          >
            <SlidersHorizontal size={18} /> Rules & estimates
          </button>
          <button
            className={view === "activity" ? "active" : ""}
            onClick={() => setView("activity")}
          >
            <Activity size={18} /> Activity log
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-card">
            <FlaskConical size={21} />
            <strong>A safe place to explore.</strong>
            <p>
              Fictional visitors.
              <br />
              Real scheduling logic.
            </p>
            <button onClick={() => setView("rules")}>
              How the demo works <ArrowRight size={14} />
            </button>
          </div>
          <div className="sidebar-user">
            <span className="user-monogram">DT</span>
            <div>
              <strong>Divyansh's project</strong>
              <span>AI-assisted prototype</span>
            </div>
            <span className="user-status" />
          </div>
        </div>
      </aside>

      <main className="main-workspace">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <ChevronRight size={13} />
            <span>
              {view === "queue"
                ? "Live queue"
                : view === "rules"
                  ? "Rules & estimates"
                  : "Activity log"}
            </span>
          </div>
          <div className="topbar-meta">
            <span className="session-chip">
              <span /> Demo session
            </span>
            <span className="today-date">{date}</span>
            <span className="topbar-avatar">DT</span>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Mobile workspace navigation">
          <button
            className={view === "queue" ? "active" : ""}
            onClick={() => setView("queue")}
          >
            Queue
          </button>
          <button
            className={view === "rules" ? "active" : ""}
            onClick={() => setView("rules")}
          >
            Rules
          </button>
          <button
            className={view === "activity" ? "active" : ""}
            onClick={() => setView("activity")}
          >
            Activity
          </button>
        </nav>
        <div className="workspace-body">
          <section className="page-heading">
            <div>
              <div className="eyebrow">LESS WAITING. MORE CLARITY.</div>
              <h1>
                {view === "queue"
                  ? "A calmer kind of queue."
                  : view === "rules"
                    ? "Nothing behind the curtain."
                    : "Every move, accounted for."}
              </h1>
              <p>
                {view === "queue"
                  ? "A clear view of who's waiting, who's next, and which rooms are ready."
                  : view === "rules"
                    ? "Transparent scheduling rules. Honest estimates. No medical decisions."
                    : "A session-only record of tokens, consultations, and room changes."}
              </p>
            </div>
            <div className="heading-actions">
              <button
                className="secondary-button reset-control"
                onClick={() => setPendingAction({ kind: "reset" })}
              >
                <RotateCcw size={15} /> Reset demo
              </button>
              <button
                className="primary-button"
                onClick={() => setIntakeOpen(true)}
              >
                <Plus size={17} /> New token
              </button>
            </div>
          </section>
          <div className="fictional-banner">
            <ShieldCheck size={16} />
            <span>
              <strong>Fictional data only.</strong> This prototype is not
              clinical triage, medical advice, or a real hospital system.
            </span>
            <button onClick={() => setView("rules")}>
              Read the rules <ArrowRight size={13} />
            </button>
          </div>
          {storageUnavailable && (
            <div role="status" className="storage-warning">
              Browser storage is unavailable. Changes work here, but refreshing
              will restart the demo.
            </div>
          )}

          {view === "queue" && (
            <>
              <section
                className="summary-strip"
                aria-label="Current session summary"
              >
                <div className="summary-item">
                  <div className="summary-label">
                    <UsersRound size={15} /> Waiting now
                  </div>
                  <strong>{String(summary.waiting).padStart(2, "0")}</strong>
                  <span>
                    {summary.waiting === 1
                      ? "visitor in the queue"
                      : "visitors in the queue"}
                  </span>
                </div>
                <div className="summary-item">
                  <div className="summary-label">
                    <Activity size={15} /> In consultation
                  </div>
                  <strong>{String(summary.consulting).padStart(2, "0")}</strong>
                  <span>
                    active {summary.consulting === 1 ? "room" : "rooms"}
                  </span>
                </div>
                <div className="summary-item">
                  <div className="summary-label">
                    <CheckCircle2 size={15} /> Completed
                  </div>
                  <strong>{String(summary.completed).padStart(2, "0")}</strong>
                  <span>visits this demo session</span>
                </div>
                <div className="summary-item">
                  <div className="summary-label">
                    <Clock3 size={15} /> Estimated average wait
                  </div>
                  <strong>
                    {averageEstimate === null ? "—" : averageEstimate}
                    <small>{averageEstimate === null ? "" : "min"}</small>
                  </strong>
                  <span>model estimate, not a promise</span>
                </div>
              </section>
              <div className="operations-layout">
                <section className="queue-section">
                  <div className="section-heading queue-heading">
                    <div>
                      <div className="eyebrow">RECEPTION DESK</div>
                      <h2>
                        Today's queue{" "}
                        <span className="inline-count">
                          {summary.waiting + summary.consulting}
                        </span>
                      </h2>
                    </div>
                    <div className="live-label">
                      <span /> Session updates
                    </div>
                  </div>
                  <div className="queue-toolbar">
                    <div
                      className="queue-tabs"
                      role="tablist"
                      aria-label="Filter tokens"
                    >
                      {(
                        [
                          [
                            "active",
                            "All active",
                            summary.waiting + summary.consulting,
                          ],
                          ["waiting", "Waiting", summary.waiting],
                          ["in_consultation", "In care", summary.consulting],
                          ["finished", "Finished", finished.length],
                        ] as const
                      ).map(([value, label, count]) => (
                        <button
                          key={value}
                          role="tab"
                          aria-selected={filter === value}
                          className={filter === value ? "selected" : ""}
                          onClick={() => setFilter(value)}
                        >
                          {label}
                          <span>{count}</span>
                        </button>
                      ))}
                    </div>
                    <label className="search-input">
                      <Search size={15} />
                      <input
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        placeholder="Find a token"
                        aria-label="Search token or fictional visitor"
                      />
                    </label>
                  </div>
                  <div className="queue-table-scroll">
                    <table className="queue-table">
                      <thead>
                        <tr>
                          <th>Token / visitor</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Arrival</th>
                          <th>Est. wait</th>
                          <th>
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map(token => {
                          const estimate = waits[token.id];
                          const aged =
                            token.priority === "standard" &&
                            now - token.createdAt >= 30 * 60_000 &&
                            token.status === "waiting";
                          const doctor = state.doctors.find(
                            entry => entry.id === token.doctorId
                          );
                          return (
                            <tr
                              key={token.id}
                              className={
                                token.status === "in_consultation"
                                  ? "consulting-row"
                                  : ""
                              }
                            >
                              <td>
                                <div className="token-identity">
                                  <span
                                    className={`token-tile ${token.status === "in_consultation" ? "in-care" : ""}`}
                                  >
                                    {String(token.number).padStart(3, "0")}
                                  </span>
                                  <div>
                                    <strong>{formatToken(token.number)}</strong>
                                    <span>{token.label}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`category-badge ${token.priority}`}
                                >
                                  <span />
                                  {token.priority === "assisted"
                                    ? "Assisted"
                                    : "Standard"}
                                </span>
                                {aged && (
                                  <small className="aged-note">
                                    Ageing boost
                                  </small>
                                )}
                              </td>
                              <td>
                                <span
                                  className={`token-status ${token.status}`}
                                >
                                  <span />
                                  {statusText(token.status)}
                                </span>
                                {doctor &&
                                  token.status === "in_consultation" && (
                                    <small className="room-label">
                                      {doctor.room}
                                    </small>
                                  )}
                              </td>
                              <td className="arrival-cell">
                                {clock(token.createdAt)}
                              </td>
                              <td
                                className="wait-cell"
                                title={estimate?.explanation}
                              >
                                {token.status === "waiting" ? (
                                  estimate?.minutes == null ? (
                                    <span className="wait-unavailable">
                                      Rooms paused
                                    </span>
                                  ) : (
                                    <>
                                      <strong>~{estimate.minutes}</strong>
                                      <span> min</span>
                                    </>
                                  )
                                ) : (
                                  <span className="muted-dash">—</span>
                                )}
                              </td>
                              <td>
                                <div className="row-actions">
                                  {token.status === "in_consultation" ? (
                                    <>
                                      <button
                                        className="icon-action teal"
                                        title="Complete visit"
                                        aria-label={`Complete ${formatToken(token.number)}`}
                                        onClick={() => onComplete(token.id)}
                                      >
                                        <Check size={16} />
                                      </button>
                                      <button
                                        className="icon-action"
                                        title="Return to waiting queue"
                                        aria-label={`Return ${formatToken(token.number)} to queue`}
                                        onClick={() =>
                                          update(
                                            current =>
                                              returnToQueue(current, token.id),
                                            "Visitor returned to the waiting queue."
                                          )
                                        }
                                      >
                                        <ArrowLeft size={15} />
                                      </button>
                                    </>
                                  ) : token.status === "waiting" ? (
                                    <button
                                      className="icon-action"
                                      title="Remove token"
                                      aria-label={`Remove ${formatToken(token.number)}`}
                                      onClick={() =>
                                        setPendingAction({
                                          kind: "remove",
                                          id: token.id,
                                        })
                                      }
                                    >
                                      <X size={15} />
                                    </button>
                                  ) : (
                                    <span className="finished-check">
                                      {token.status === "completed" ? (
                                        <CheckCircle2 size={17} />
                                      ) : (
                                        <X size={15} />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {!visible.length && (
                    <div className="empty-state">
                      <ListOrdered size={31} />
                      <h3>
                        {search
                          ? "No matching tokens."
                          : "A little room to breathe."}
                      </h3>
                      <p>
                        {search
                          ? "Try a token number or fictional visitor label."
                          : filter === "finished"
                            ? "Completed and removed tokens will appear here."
                            : "No visitors in this view. Issue a fictional token to try the workflow."}
                      </p>
                      <button
                        className="text-button"
                        onClick={() =>
                          search ? setSearch("") : setIntakeOpen(true)
                        }
                      >
                        {search ? "Clear search" : "Issue a token"}{" "}
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                  <div className="queue-footer">
                    <span>
                      <span className="priority-dot assisted" /> Assisted first
                      · standard tokens age after 30 min
                    </span>
                    <button onClick={() => setView("rules")}>
                      Why this order? <ArrowRight size={13} />
                    </button>
                  </div>
                  <div className="next-up-card">
                    <div className="next-up-icon">
                      <ArrowRight size={20} />
                    </div>
                    <div>
                      <div className="eyebrow">NEXT IN LINE</div>
                      <h3>
                        {next ? (
                          <>
                            {formatToken(next.number)}{" "}
                            <span>· {next.label}</span>
                          </>
                        ) : (
                          "No one waiting"
                        )}
                      </h3>
                      <p>
                        {next
                          ? firstAvailable
                            ? `${firstAvailable.name} is ready to see the next visitor.`
                            : "The next consultation starts when a room is available."
                          : "The waiting queue is clear. New tokens will appear here."}
                      </p>
                    </div>
                    <button
                      className="primary-button"
                      disabled={!next || !firstAvailable}
                      onClick={() =>
                        firstAvailable && onCall(firstAvailable.id)
                      }
                    >
                      Call next <ArrowRight size={16} />
                    </button>
                  </div>
                </section>
                <DoctorPanel
                  doctors={state.doctors}
                  tokens={state.tokens}
                  waitingCount={summary.waiting}
                  onCall={onCall}
                  onComplete={onComplete}
                  onStatus={onStatus}
                />
              </div>
            </>
          )}

          {view === "rules" && (
            <section className="rules-view">
              <article className="rule-panel">
                <div className="rule-number">01</div>
                <div>
                  <div className="eyebrow">FAIR, EXPLAINABLE ORDER</div>
                  <h2>Priority without guesswork.</h2>
                  <p>
                    Assisted tokens are considered first. Standard tokens
                    waiting at least 30 minutes receive an ageing boost into the
                    same priority group. Within a group, earlier arrival wins;
                    token number breaks ties.
                  </p>
                  <div className="rule-example">
                    <span className="category-badge assisted">Assisted</span>
                    <Plus size={13} />
                    <span className="category-badge aged">
                      Standard ≥ 30 min
                    </span>
                    <ArrowRight size={15} />
                    <strong>Arrival order</strong>
                  </div>
                  <p className="rule-footnote">
                    No diagnosis or urgency is inferred. An ongoing consultation
                    is never interrupted by a new token.
                  </p>
                </div>
              </article>
              <article className="rule-panel">
                <div className="rule-number">02</div>
                <div>
                  <div className="eyebrow">ESTIMATES, NOT PROMISES</div>
                  <h2>Time follows room capacity.</h2>
                  <p>
                    Waiting tokens are assigned in queue order to the next room
                    expected to become free. Each room has a fictional
                    service-time assumption. Busy rooms include their estimated
                    remaining time; rooms on a break are excluded.
                  </p>
                  <div className="service-assumptions">
                    {state.doctors.map(doctor => (
                      <div key={doctor.id}>
                        <span>{doctor.room}</span>
                        <strong>
                          {doctor.serviceMinutes}
                          <small> min / visit</small>
                        </strong>
                      </div>
                    ))}
                  </div>
                  <p className="rule-footnote">
                    When every room is unavailable, no wait estimate is shown.
                    These assumptions have not been validated against hospital
                    data.
                  </p>
                </div>
              </article>
              <article className="rule-panel">
                <div className="rule-number">03</div>
                <div>
                  <div className="eyebrow">LOCAL, FICTIONAL, REVERSIBLE</div>
                  <h2>Your demo. This tab only.</h2>
                  <p>
                    Tokens and events are stored in this tab's session storage
                    when available. Refreshing keeps the session; closing the
                    tab normally clears it. Browser session restore can retain
                    it. Other visitors do not share your data. No patient
                    records are sent to a server.
                  </p>
                  <p>
                    Use only fictional labels. This software is an AI-assisted
                    portfolio prototype—not a clinical, privacy-certified, or
                    production hospital product.
                  </p>
                  <div className="rule-buttons">
                    <button
                      className="secondary-button"
                      onClick={() => setPendingAction({ kind: "reset" })}
                    >
                      <RotateCcw size={15} /> Reload fictional sample
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => setPendingAction({ kind: "empty" })}
                    >
                      <ListOrdered size={15} /> Start with an empty queue
                    </button>
                  </div>
                </div>
              </article>
            </section>
          )}

          {view === "activity" && (
            <section className="activity-view">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">SESSION TRAIL</div>
                  <h2>Activity log</h2>
                </div>
                <span className="count-badge">{state.events.length}</span>
              </div>
              <p className="activity-intro">
                Latest actions first. Up to 100 events are retained in this
                browser session.
              </p>
              {state.events.length ? (
                <div className="event-list">
                  {[...state.events]
                    .sort((a, b) => b.at - a.at)
                    .map(event => (
                      <article key={event.id} className="event-row">
                        <span className="event-dot">
                          <Activity size={15} />
                        </span>
                        <div>
                          <strong>{event.message}</strong>
                          <span>{event.type.replaceAll("_", " ")}</span>
                        </div>
                        <time dateTime={new Date(event.at).toISOString()}>
                          {clock(event.at)}
                        </time>
                      </article>
                    ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Activity size={30} />
                  <h3>A fresh session.</h3>
                  <p>
                    Issue a token or update a room to start the activity trail.
                  </p>
                </div>
              )}
            </section>
          )}

          <footer className="workspace-footer">
            <span>
              <FlaskConical size={13} /> Built to learn. Not to diagnose.
            </span>
            <span>
              AI-assisted prototype <span className="footer-separator">/</span>{" "}
              Session-only data
            </span>
          </footer>
        </div>
      </main>

      <IntakeDialog
        open={intakeOpen}
        onOpenChange={setIntakeOpen}
        nextNumber={state.nextNumber}
        onSubmit={(label: string, priority: Priority) =>
          update(
            current => issueToken(current, { label, priority }),
            "Fictional token issued."
          )
        }
      />
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={open => !open && setPendingAction(null)}
      >
        <AlertDialogContent className="confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.kind === "remove"
                ? "Remove this demo token?"
                : pendingAction?.kind === "empty"
                  ? "Start with an empty queue?"
                  : "Reset this demo session?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.kind === "remove"
                ? "This fictional visitor will leave the active queue. The removal stays in this session's history."
                : "Current fictional tokens and events in this tab will be replaced. This does not affect any other visitor or real records."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current state</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingAction?.kind === "remove" && pendingAction.id)
                  update(
                    current => removeToken(current, pendingAction.id!),
                    "Token removed from the queue."
                  );
                else if (pendingAction) {
                  setState(
                    pendingAction.kind === "empty"
                      ? createEmptyClinicState()
                      : createDemoState()
                  );
                  setNow(Date.now());
                  setSearch("");
                  setFilter("active");
                  toast.success(
                    pendingAction.kind === "empty"
                      ? "Empty demo session ready."
                      : "Fictional sample restored."
                  );
                }
                setPendingAction(null);
              }}
            >
              {pendingAction?.kind === "remove"
                ? "Remove token"
                : "Replace demo data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

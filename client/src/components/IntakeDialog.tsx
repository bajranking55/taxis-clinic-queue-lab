import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, ShieldCheck, UserRound } from "lucide-react";
import type { Priority } from "@shared/queue";

export function IntakeDialog({
  open,
  onOpenChange,
  nextNumber,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextNumber: number;
  onSubmit: (label: string, priority: Priority) => boolean;
}) {
  const [label, setLabel] = useState("");
  const [priority, setPriority] = useState<Priority>("standard");
  const [error, setError] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        onOpenChange(value);
        if (!value) {
          setLabel("");
          setPriority("standard");
          setError("");
        }
      }}
    >
      <DialogContent className="intake-dialog">
        <DialogHeader>
          <div className="eyebrow">DEMO RECEPTION</div>
          <DialogTitle className="dialog-title">
            A place in the queue.
          </DialogTitle>
          <DialogDescription>
            Issue a token for a fictional visitor. No medical or personal
            details needed.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={event => {
            event.preventDefault();
            const value =
              label.trim() || `Visitor ${String(nextNumber).padStart(3, "0")}`;
            if (value.length < 2 || value.length > 40) {
              setError("Use a fictional label between 2 and 40 characters.");
              return;
            }
            if (onSubmit(value, priority)) onOpenChange(false);
          }}
        >
          <label className="field-label" htmlFor="visitor-label">
            Fictional visitor label <span>Optional</span>
          </label>
          <div className="input-icon-wrap">
            <UserRound size={16} />
            <input
              id="visitor-label"
              value={label}
              maxLength={40}
              onChange={event => {
                setLabel(event.target.value);
                setError("");
              }}
              placeholder={`Visitor ${String(nextNumber).padStart(3, "0")}`}
              autoComplete="off"
            />
          </div>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <fieldset className="priority-options">
            <legend className="field-label">Queue category</legend>
            <label
              className={`priority-option ${priority === "standard" ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="priority"
                checked={priority === "standard"}
                onChange={() => setPriority("standard")}
              />
              <span>
                <strong>Standard</strong>
                <small>First come, first served</small>
              </span>
              <span className="priority-dot standard" />
            </label>
            <label
              className={`priority-option ${priority === "assisted" ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="priority"
                checked={priority === "assisted"}
                onChange={() => setPriority("assisted")}
              />
              <span>
                <strong>Assisted</strong>
                <small>Demonstrates a priority queue</small>
              </span>
              <span className="priority-dot assisted" />
            </label>
          </fieldset>
          <div className="safety-note">
            <ShieldCheck size={16} />
            <p>
              This category is for scheduling demonstrations only. It is not
              clinical triage or medical advice.
            </p>
          </div>
          <button type="submit" className="primary-button dialog-submit">
            Issue token <ArrowRight size={16} />
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

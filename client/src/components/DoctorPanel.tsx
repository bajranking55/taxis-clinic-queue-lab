import { ArrowRight, Check, Clock3, Coffee, Stethoscope } from "lucide-react";
import type { Doctor, DoctorStatus, Token } from "@shared/queue";

export function DoctorPanel({
  doctors,
  tokens,
  waitingCount,
  onStatus,
  onCall,
  onComplete,
}: {
  doctors: Doctor[];
  tokens: Token[];
  waitingCount: number;
  onStatus: (doctorId: string, status: DoctorStatus) => void;
  onCall: (doctorId: string) => void;
  onComplete: (tokenId: string) => void;
}) {
  return (
    <aside className="doctor-panel">
      <div className="section-heading">
        <div>
          <div className="eyebrow">THE CARE TEAM</div>
          <h2>Consultation rooms</h2>
        </div>
        <span className="count-badge">{doctors.length}</span>
      </div>
      <div className="doctor-cards">
        {doctors.map((doctor, index) => {
          const active = tokens.find(
            token =>
              token.status === "in_consultation" && token.doctorId === doctor.id
          );
          return (
            <article className="doctor-card" key={doctor.id}>
              <div className="doctor-card-top">
                <div className={`doctor-avatar avatar-${index}`}>
                  <Stethoscope size={18} />
                </div>
                <div className="doctor-identity">
                  <h3>{doctor.name}</h3>
                  <p>
                    {doctor.specialty} <span>·</span> {doctor.room}
                  </p>
                </div>
                <span
                  className={`availability-dot ${doctor.status}`}
                  title={doctor.status}
                />
              </div>
              <div className="doctor-status-line">
                <span className={`status-badge ${doctor.status}`}>
                  {doctor.status === "available"
                    ? "Available"
                    : doctor.status === "busy"
                      ? "In consultation"
                      : "On a break"}
                </span>
                <span>
                  <Clock3 size={12} /> {doctor.serviceMinutes} min / visit
                </span>
              </div>
              {active ? (
                <>
                  <div className="active-patient">
                    <span>WITH VISITOR</span>
                    <div>
                      <strong>
                        T-{String(active.number).padStart(3, "0")}
                      </strong>
                      <small>{active.label}</small>
                    </div>
                  </div>
                  <button
                    className="complete-button"
                    onClick={() => onComplete(active.id)}
                  >
                    <Check size={14} /> Complete visit
                  </button>
                </>
              ) : (
                <div className="doctor-actions">
                  <button
                    className="call-next-button"
                    disabled={doctor.status !== "available" || !waitingCount}
                    onClick={() => onCall(doctor.id)}
                  >
                    Call next <ArrowRight size={14} />
                  </button>
                  <button
                    className="break-button"
                    aria-label={
                      doctor.status === "unavailable"
                        ? `Make ${doctor.name} available`
                        : `Put ${doctor.name} on a break`
                    }
                    title={
                      doctor.status === "unavailable"
                        ? "Back to available"
                        : "Take a break"
                    }
                    onClick={() =>
                      onStatus(
                        doctor.id,
                        doctor.status === "unavailable"
                          ? "available"
                          : "unavailable"
                      )
                    }
                  >
                    <Coffee size={16} />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <div className="room-note">
        <span className="small-line" />
        <p>
          One active consultation per room.
          <br />
          Availability updates queue estimates.
        </p>
      </div>
    </aside>
  );
}

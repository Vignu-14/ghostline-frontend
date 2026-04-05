import type { RefObject } from "react";
import { Button } from "../common/Button";
import type { CallNotice, CallSession } from "../../types/call";

type CallPanelProps = {
  callNotice: CallNotice | null;
  callSession: CallSession | null;
  onAccept: () => void;
  onDecline: () => void;
  onDismissNotice: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  remoteAudioRef: RefObject<HTMLAudioElement | null>;
};

export function CallPanel({
  callNotice,
  callSession,
  onAccept,
  onDecline,
  onDismissNotice,
  onEnd,
  onToggleMute,
  remoteAudioRef,
}: CallPanelProps) {
  if (!callSession && !callNotice) {
    return null;
  }

  return (
    <>
      {callSession ? (
        <section className={`call-panel call-panel--${callSession.phase}`}>
          <div className="call-panel__copy">
            <p className="eyebrow">Voice call</p>
            <h3>@{callSession.peerUsername}</h3>
            <p className="support-copy">{callSession.status}</p>
            <div className="call-panel__meta">
              <span>{callSession.direction === "incoming" ? "Incoming" : "Outgoing"}</span>
              <span>{callSession.isMuted ? "Mic muted" : "Mic live"}</span>
              {callSession.remoteMuted ? <span>@{callSession.peerUsername} muted</span> : null}
            </div>
          </div>

          <div className="call-panel__actions">
            {callSession.phase === "incoming" ? (
              <>
                <Button onClick={onDecline} type="button" variant="ghost">
                  Decline
                </Button>
                <Button onClick={onAccept} type="button">
                  Accept
                </Button>
              </>
            ) : (
              <>
                <Button
                  disabled={callSession.phase === "requesting_permission"}
                  onClick={onToggleMute}
                  type="button"
                  variant="quiet"
                >
                  {callSession.isMuted ? "Unmute" : "Mute"}
                </Button>
                <Button onClick={onEnd} type="button" variant="ghost">
                  {callSession.phase === "outgoing" ? "Cancel call" : "End call"}
                </Button>
              </>
            )}
          </div>

          <audio autoPlay playsInline ref={remoteAudioRef} />
        </section>
      ) : null}

      {callNotice ? (
        <section className={`call-notice call-notice--${callNotice.tone}`}>
          <p>{callNotice.message}</p>
          <Button onClick={onDismissNotice} type="button" variant="quiet">
            Dismiss
          </Button>
        </section>
      ) : null}
    </>
  );
}

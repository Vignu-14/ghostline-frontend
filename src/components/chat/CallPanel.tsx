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
  onToggleVideo: () => void;
  remoteVideoRef: RefObject<HTMLVideoElement | null>;
  localVideoRef: RefObject<HTMLVideoElement | null>;
};

export function CallPanel({
  callNotice,
  callSession,
  onAccept,
  onDecline,
  onDismissNotice,
  onEnd,
  onToggleMute,
  onToggleVideo,
  remoteVideoRef,
  localVideoRef,
}: CallPanelProps) {
  if (!callSession && !callNotice) {
    return null;
  }

  const isVideo = callSession?.callType === "video";

  return (
    <>
      {callSession ? (
        <section className={`call-panel call-panel--${callSession.phase} ${isVideo ? 'call-panel--video' : 'call-panel--audio'}`}>
          {isVideo && callSession.phase === "active" ? (
            <div className="video-grid">
              <video
                autoPlay
                playsInline
                ref={remoteVideoRef}
                className={`remote-video ${callSession.remoteVideoOff ? 'hidden' : ''}`}
              />
              <video
                autoPlay
                playsInline
                muted
                ref={localVideoRef}
                className={`local-video ${callSession.isVideoOff ? 'hidden' : ''}`}
              />
              {callSession.remoteVideoOff && (
                <div className="remote-video-placeholder">
                   <div className="avatar-circle large">
                    {callSession.peerUsername.slice(0, 1).toUpperCase()}
                   </div>
                   <p>Video paused</p>
                </div>
              )}
            </div>
          ) : (
            <div className="call-panel__copy">
              <p className="eyebrow">{isVideo ? '📹 Video' : '🎙️ Audio'} call</p>
              <div className="avatar-circle">
                {callSession.peerUsername.slice(0, 1).toUpperCase()}
              </div>
              <h3>@{callSession.peerUsername}</h3>
              <p className="support-copy">{callSession.status}</p>
              <div className="call-panel__meta">
                <span>{callSession.direction === "incoming" ? "📞 Incoming" : "📤 Outgoing"}</span>
                <span>{callSession.isMuted ? "🔇 Muted" : "🎤 Live"}</span>
                {callSession.remoteMuted ? <span>🔇 @{callSession.peerUsername} muted</span> : null}
              </div>
            </div>
          )}

          <div className="call-panel__actions">
            {callSession.phase === "incoming" ? (
              <>
                <Button onClick={onDecline} type="button" variant="ghost" size="sm">
                  Decline
                </Button>
                <Button onClick={onAccept} type="button" size="sm" variant="primary">
                  Accept
                </Button>
              </>
            ) : (
              <>
                <Button
                  disabled={callSession.phase === "requesting_permission"}
                  onClick={onToggleMute}
                  type="button"
                  variant="ghost"
                  size="sm"
                >
                  {callSession.isMuted ? "Unmute" : "Mute"}
                </Button>
                {isVideo && (
                  <Button
                    disabled={callSession.phase === "requesting_permission"}
                    onClick={onToggleVideo}
                    type="button"
                    variant="ghost"
                    size="sm"
                  >
                    {callSession.isVideoOff ? "Turn Video On" : "Turn Video Off"}
                  </Button>
                )}
                <Button onClick={onEnd} type="button" variant="danger" size="sm">
                  {callSession.phase === "outgoing" ? "Cancel" : "End call"}
                </Button>
              </>
            )}
          </div>

          {!isVideo && <audio autoPlay playsInline ref={remoteVideoRef as any} />}
        </section>
      ) : null}

      {callNotice ? (
        <section className={`call-notice call-notice--${callNotice.tone}`}>
          <p>{callNotice.message}</p>
          <Button onClick={onDismissNotice} type="button" variant="ghost" size="sm">
            Dismiss
          </Button>
        </section>
      ) : null}
    </>
  );
}

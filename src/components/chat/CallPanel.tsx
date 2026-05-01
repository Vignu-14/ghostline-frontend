import type { RefObject } from "react";
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
      {callSession && (
        <section className="absolute inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-500">
          {/* Video Grid */}
          <div className={`absolute inset-0 bg-slate-950 overflow-hidden transition-opacity duration-700 ${(isVideo && callSession.phase === "active") ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <video
              autoPlay
              playsInline
              ref={remoteVideoRef}
              className={`w-full h-full object-cover transition-opacity duration-500 ${callSession.remoteVideoOff ? 'opacity-0' : 'opacity-100'}`}
            />
            <video
              autoPlay
              playsInline
              muted
              ref={localVideoRef}
              className={`absolute bottom-8 right-8 w-32 h-48 md:w-48 md:h-64 object-cover rounded-3xl border-2 border-white/20 shadow-2xl z-10 transition-all duration-500 ${callSession.isVideoOff ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            />
            {isVideo && callSession.remoteVideoOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-xl">
                <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-3xl font-bold border-2 border-white/10 mb-4 shadow-xl">
                  {callSession.peerUsername.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Video paused</p>
              </div>
            )}
          </div>

          {/* Info Layer */}
          {(callSession.phase !== "active" || !isVideo) && (
            <div className="relative z-10 flex flex-col items-center text-center animate-in zoom-in duration-500">
              <div className="relative mb-8">
                <div className="w-28 h-28 rounded-[40px] bg-slate-800 flex items-center justify-center text-4xl font-bold border-4 border-white/10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/20 animate-pulse"></div>
                  <span className="relative z-10">{callSession.peerUsername.charAt(0).toUpperCase()}</span>
                </div>
                {callSession.phase === "incoming" && (
                  <div className="absolute -inset-4 border-2 border-primary/30 rounded-[48px] animate-ping opacity-20"></div>
                )}
              </div>
              
              <h3 className="text-3xl font-bold tracking-tight mb-2">@{callSession.peerUsername}</h3>
              <p className="text-primary font-bold text-[13px] uppercase tracking-[0.25em] mb-10">{callSession.status}</p>
              
              <div className="flex gap-4 mb-12">
                <div className="px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    {callSession.direction === 'incoming' ? 'call_received' : 'call_made'}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                    {callSession.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
                  </span>
                </div>
                {isVideo && (
                  <div className="px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3 backdrop-blur-sm">
                    <span className="material-symbols-outlined text-[20px] text-tertiary">videocam</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">Video Call</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="relative z-20 mt-auto mb-12 flex gap-8 items-center animate-in slide-in-from-bottom duration-700">
            {callSession.phase === "incoming" ? (
              <>
                <button 
                  onClick={onDecline}
                  className="w-16 h-16 flex items-center justify-center bg-error text-on-error rounded-full shadow-2xl shadow-error/40 hover:scale-110 active:scale-95 transition-all"
                  title="Decline"
                >
                  <span className="material-symbols-outlined text-[32px]">call_end</span>
                </button>
                <button 
                  onClick={onAccept}
                  className="w-16 h-16 flex items-center justify-center bg-tertiary text-on-tertiary rounded-full shadow-2xl shadow-tertiary/40 hover:scale-110 active:scale-95 transition-all"
                  title="Accept"
                >
                  <span className="material-symbols-outlined text-[32px]">call</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onToggleMute}
                  className={`w-14 h-14 flex items-center justify-center rounded-full border-2 transition-all active:scale-95 ${
                    callSession.isMuted ? 'bg-white text-slate-900 border-white shadow-xl shadow-white/10' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                  title={callSession.isMuted ? "Unmute" : "Mute"}
                >
                  <span className="material-symbols-outlined text-[26px]">
                    {callSession.isMuted ? 'mic_off' : 'mic'}
                  </span>
                </button>
                
                {isVideo && (
                  <button 
                    onClick={onToggleVideo}
                    className={`w-14 h-14 flex items-center justify-center rounded-full border-2 transition-all active:scale-95 ${
                      callSession.isVideoOff ? 'bg-white text-slate-900 border-white shadow-xl shadow-white/10' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                    title={callSession.isVideoOff ? "Turn Video On" : "Turn Video Off"}
                  >
                    <span className="material-symbols-outlined text-[26px]">
                      {callSession.isVideoOff ? 'videocam_off' : 'videocam'}
                    </span>
                  </button>
                )}

                <button 
                  onClick={onEnd}
                  className="w-16 h-16 flex items-center justify-center bg-error text-on-error rounded-full shadow-2xl shadow-error/40 hover:scale-110 active:scale-95 transition-all group"
                  title="End call"
                >
                  <span className="material-symbols-outlined text-[32px] group-hover:rotate-[135deg] transition-transform duration-300">call_end</span>
                </button>
              </>
            )}
          </div>

          {!isVideo && <audio autoPlay playsInline ref={remoteVideoRef as any} />}
        </section>
      )}

      {callNotice && (
        <section className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] px-6 py-4 rounded-[24px] shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-500 backdrop-blur-xl border border-white/10 ${
          callNotice.tone === 'error' ? 'bg-error text-on-error' : 'bg-slate-900 text-white'
        }`}>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
             <span className="material-symbols-outlined text-[18px]">
                {callNotice.tone === 'error' ? 'report' : 'info'}
             </span>
          </div>
          <p className="text-sm font-bold tracking-tight">{callNotice.message}</p>
          <button onClick={onDismissNotice} className="ml-2 w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors active:scale-90">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </section>
      )}
    </>
  );
}

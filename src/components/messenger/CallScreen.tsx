import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  callId: number;
  callerName: string;
  callerAvatar: string;
  callType: 'audio' | 'video';
  isIncoming: boolean;
  offerSdp?: string;
  onEnd: () => void;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export default function CallScreen({ callId, callerName, callerAvatar, callType, isIncoming, offerSdp, onEnd }: Props) {
  const [status, setStatus] = useState<'ringing' | 'connecting' | 'active' | 'ended'>(isIncoming ? 'ringing' : 'connecting');
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const icePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastIceId = useRef(0);

  const cleanup = useCallback(() => {
    if (durationRef.current) clearInterval(durationRef.current);
    if (icePollingRef.current) clearInterval(icePollingRef.current);
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const startDuration = useCallback(() => {
    durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  }, []);

  const pollIce = useCallback(() => {
    icePollingRef.current = setInterval(async () => {
      try {
        const candidates = await api.calls.getIce(callId, lastIceId.current);
        for (const c of candidates) {
          lastIceId.current = Math.max(lastIceId.current, c.id);
          if (pcRef.current) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(JSON.parse(c.candidate)));
          }
        }
      } catch (_e) { /* ignore */ }
    }, 1500);
  }, [callId]);

  const initPC = useCallback(async () => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      localStreamRef.current = stream;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }
    } catch (_e) {
      console.warn('Нет доступа к камере/микрофону');
    }

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        try {
          await api.calls.ice(callId, JSON.stringify(e.candidate.toJSON()));
        } catch (_e) { /* ignore */ }
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setStatus('active');
        startDuration();
      } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        setStatus('ended');
        cleanup();
        setTimeout(onEnd, 1500);
      }
    };

    return pc;
  }, [callId, callType, startDuration, cleanup, onEnd]);

  const startOutgoing = useCallback(async () => {
    const pc = await initPC();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await api.calls.initiate(callId, callType, offer.sdp || '');
    pollIce();

    const pollAnswer = setInterval(async () => {
      try {
        const s = await api.calls.status(callId);
        if (s.status === 'active' && s.answer_sdp) {
          clearInterval(pollAnswer);
          await pc.setRemoteDescription({ type: 'answer', sdp: s.answer_sdp });
        } else if (s.status === 'declined' || s.status === 'ended') {
          clearInterval(pollAnswer);
          setStatus('ended');
          cleanup();
          setTimeout(onEnd, 1500);
        }
      } catch (_e) { /* ignore */ }
    }, 1500);
  }, [callId, callType, initPC, pollIce, cleanup, onEnd]);

  const answerCall = useCallback(async () => {
    setStatus('connecting');
    const pc = await initPC();
    await pc.setRemoteDescription({ type: 'offer', sdp: offerSdp || '' });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await api.calls.answer(callId, answer.sdp || '');
    pollIce();
  }, [callId, offerSdp, initPC, pollIce]);

  useEffect(() => {
    if (!isIncoming) {
      startOutgoing();
    }
    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endCall = async () => {
    await api.calls.end(callId).catch(() => { /* ignore */ });
    cleanup();
    setStatus('ended');
    setTimeout(onEnd, 800);
  };

  const declineCall = async () => {
    await api.calls.decline(callId).catch(() => { /* ignore */ });
    cleanup();
    onEnd();
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(!muted);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = videoOff; });
    setVideoOff(!videoOff);
  };

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-fade-in">
      {callType === 'video' && (
        <>
          <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
          <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-32 right-6 w-32 h-24 object-cover rounded-xl border-2 border-white/20 z-10" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-24 h-24 rounded-3xl bg-primary/30 text-primary flex items-center justify-center text-3xl font-bold border-2 border-primary/40">
          {callerAvatar}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white">{callerName}</h2>
          <p className="text-white/60 mt-1 text-sm">
            {status === 'ringing' && (isIncoming ? '📲 Входящий звонок' : 'Вызов...')}
            {status === 'connecting' && 'Соединение...'}
            {status === 'active' && `🟢 ${formatDuration(duration)}`}
            {status === 'ended' && 'Звонок завершён'}
          </p>
          {callType === 'video' && (
            <p className="text-white/40 text-xs mt-1 flex items-center justify-center gap-1">
              <Icon name="Video" size={11} /> Видеозвонок
            </p>
          )}
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-5 mt-12">
        {status === 'ringing' && isIncoming ? (
          <>
            <button onClick={declineCall} className="w-16 h-16 rounded-2xl bg-destructive hover:bg-destructive/90 flex items-center justify-center transition-all hover:scale-105 shadow-lg">
              <Icon name="PhoneOff" size={26} className="text-white" />
            </button>
            <button onClick={answerCall} className="w-16 h-16 rounded-2xl bg-green-500 hover:bg-green-500/90 flex items-center justify-center transition-all hover:scale-105 shadow-lg">
              <Icon name="Phone" size={26} className="text-white" />
            </button>
          </>
        ) : (
          <>
            <button onClick={toggleMute} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105 ${muted ? 'bg-destructive/80' : 'bg-white/10 hover:bg-white/20'}`}>
              <Icon name={muted ? 'MicOff' : 'Mic'} size={22} className="text-white" />
            </button>
            {callType === 'video' && (
              <button onClick={toggleVideo} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105 ${videoOff ? 'bg-destructive/80' : 'bg-white/10 hover:bg-white/20'}`}>
                <Icon name={videoOff ? 'VideoOff' : 'Video'} size={22} className="text-white" />
              </button>
            )}
            <button onClick={endCall} className="w-16 h-16 rounded-2xl bg-destructive hover:bg-destructive/90 flex items-center justify-center transition-all hover:scale-105 shadow-lg">
              <Icon name="PhoneOff" size={26} className="text-white" />
            </button>
            <button onClick={() => setSpeakerOff(!speakerOff)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-105 ${speakerOff ? 'bg-destructive/80' : 'bg-white/10 hover:bg-white/20'}`}>
              <Icon name={speakerOff ? 'VolumeX' : 'Volume2'} size={22} className="text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

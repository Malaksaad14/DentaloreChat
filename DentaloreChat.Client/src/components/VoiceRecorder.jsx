import React, { useState, useRef, useEffect } from 'react';
import fixWebmDuration from 'fix-webm-duration';

export default function VoiceRecorder({ onSend, onCancel }) {
  const [status, setStatus] = useState('idle'); // idle | recording | paused | uploading | error
  const [duration, setDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  // Format seconds → "0:32"
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
// awl ma l voice recorder component ytrsm l useeffect btshghl l startrecording automatically
  useEffect(() => {
    startRecording();
    return () => stopTimer();
  }, []); //[]: dependency array shghl bs l function de(start recording) awl ma l component ytrsm mara wahda 
  //w mtshghlhash tany tol ma howa shghal

  const startTimer = () => {
    if (timerRef.current) return; // already running, don't create duplicate
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null; // must null it so startTimer knows it's stopped
    }
  };
// step 2: start recording
  const startRecording = async () => {
    setErrorMsg('');
    try {
    //bytlob permission bl tasgel mn l browser
    //`navigator.mediaDevices.getUserMedia` da API gahz fl browser
    //bytl3 ll user message(pop up) y2olo l mawk3 da ayz ystkhdm l mic mwaf2?
    //lma l user ywaf2 byrg3 haga asmha stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      //Start recording the audio stream
      recorder.start();

      //Update the UI state to reflect that recording is in progress
      setStatus('recording');

      // Start the timer to track the recording duration in real time
      startTimer();
      
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setStatus('error');
        setErrorMsg('Microphone permission was denied. Please allow access from your browser settings.');
      } else {
        setStatus('error');
        setErrorMsg('Microphone error. Make sure your device is connected and working.');
      }
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  };
// lma l user ydos cancel de l btshtghl
  const handleCancel = () => {
    mediaRecorderRef.current?.stop();//byw2f l tasgel
    stopStream(); //byw2f l stream ashan l red led ely fl browser ytfy
    stopTimer();//byw2f l timer
    onCancel();//bykhly isVoiceRecording = false w byrg3 l form l 3adya tany
  };

  const handlePause = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (isPaused) {
      recorder.resume();
      startTimer();
      setIsPaused(false);
    } else {
      recorder.pause();
      stopTimer();
      setIsPaused(true);
    }
  };

  const handleSend = () => {
    //lw msh f 7alt recording my3mlsh haga
    if (status !== 'recording') return;
    // If paused, we still allow sending
    stopTimer();
    //lw kan l user 3aml pause w das 3la send byrg3 y3ml resume l second
    if (isPaused) mediaRecorderRef.current?.resume();
    // l event l hyshtghl b mogrb ma l recorder yo2f
    mediaRecorderRef.current.onstop = async () => {
      stopStream();
      //bnshof no3 l file bna2n 3la l browser
      const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      //bngm3 l chunks f blob wahd
      const rawBlob = new Blob(audioChunksRef.current, { type: mimeType });

      setStatus('uploading');
      setUploadProgress(0);

      // Fix webm duration metadata — without this, the audio plays slow or loops
      const durationMs = duration * 1000;
      const blob = await fixWebmDuration(rawBlob, durationMs, { logger: false });

    //bnht l file gowa formdata ashan nb3to ll server
      const formData = new FormData();
      formData.append('file', blob, `voice_${Date.now()}.${ext}`);


      try {
        // Using XMLHttpRequest instead of fetch to track upload progress
        //hena bn create object yakhod l formdata w ywadeh ll server
        const xhr = new XMLHttpRequest();
        //hena bn2olo htroh ll 3nwan da
        xhr.open('POST', 'http://localhost:5123/api/messages/upload-audio');
       //tol manta btrf3 ab3tlna msg(event) feha atrf3 ad eh mn l total
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
     
        xhr.onload = () => {
          if (xhr.status === 200) {
            //bnakhod l rd l gay mn l server (ely 3obara 3n json feh l audio url)
            const data = JSON.parse(xhr.responseText);
            //bnady onsend ashan nb3t l url da l chatscreen ashan yzhr fl chat
            onSend({ audioUrl: data.audioUrl, audioSize: data.audioSize, audioDuration: duration });
          } else {
            setStatus('error');
            setErrorMsg('Upload failed. Please press Retry.');
          }
        };

        xhr.onerror = () => {
          setStatus('error');
          setErrorMsg('Connection lost during upload. Please try again.');
        };
      //hena b2a bnb3t l form data ll server f3ln
        xhr.send(formData);
      } catch (err) {
        setStatus('error');
        setErrorMsg('An unexpected error occurred during upload.');
      }
    };

    mediaRecorderRef.current.stop();
  };

  // ---- RENDER ----
  if (permissionDenied) {
    return (
      <div style={styles.container}>
        <span style={{ fontSize: '13px', color: '#f87171', flex: 1 }}>
          🎙️ {errorMsg}
        </span>
        <button onClick={onCancel} style={styles.cancelBtn}>Close</button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={styles.container}>
        <span style={{ fontSize: '13px', color: '#f87171', flex: 1 }}>⚠️ {errorMsg}</span>
        <button onClick={startRecording} style={styles.sendBtn}>Retry</button>
        <button onClick={onCancel} style={styles.cancelBtn}>Cancel</button>
      </div>
    );
  }

  if (status === 'uploading') {
    return (
      <div style={styles.container}>
        <span style={{ fontSize: '13px', color: '#38bdf8', flex: 1 }}>
          ⏫ Uploading... {uploadProgress}%
        </span>
        <div style={{ ...styles.progressBar, width: `${uploadProgress}%` }} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Pulsing mic icon */}
      <div style={styles.micPulse}>🎙️</div>

      {/* Timer */}
      <span style={styles.timer}>{formatTime(duration)}</span>

      {/* Pause / Resume */}
      <button onClick={handlePause} style={styles.pauseBtn} title={isPaused ? 'Resume recording' : 'Pause recording'}>
        {isPaused
          ? <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          : <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        }
      </button>

      {/* Cancel */}
      <button onClick={handleCancel} style={styles.cancelBtn} title="Cancel recording">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Send */}
      <button onClick={handleSend} style={styles.sendBtn} title="Send recording">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 16px', backgroundColor: '#1e293b',
    borderTop: '1px solid #334155', position: 'relative', overflow: 'hidden',
  },
  micPulse: {
    fontSize: '20px',
    animation: 'pulse 1.2s infinite',
  },
  timer: {
    fontFamily: 'monospace', fontSize: '15px',
    color: '#f87171', fontWeight: 'bold', flex: 1,
  },
  cancelBtn: {
    background: '#374151', color: '#e2e8f0', border: 'none',
    borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  pauseBtn: {
    width: '32px', height: '32px', borderRadius: '50%',
    background: '#475569', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendBtn: {
    background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    color: '#fff', border: 'none', borderRadius: '8px',
    padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  progressBar: {
    position: 'absolute', bottom: 0, left: 0,
    height: '3px', background: '#38bdf8', transition: 'width 0.2s',
  },
};

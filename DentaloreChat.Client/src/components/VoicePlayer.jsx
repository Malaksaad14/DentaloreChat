import React, { useState, useRef, useEffect } from 'react';

// Global ref to track currently playing audio — prevents two messages playing at once
let currentlyPlayingAudio = null;

export default function VoicePlayer({ audioUrl, duration, isSent }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  // Use the stored duration prop as the initial value (avoids 0:00 before metadata loads)
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [error, setError] = useState(false);
  const audioRef = useRef(null);

  // Format seconds → "0:32", handles Infinity and NaN (common with webm files)
  const formatTime = (sec) => {
    if (!sec || isNaN(sec) || !isFinite(sec)) return duration ? formatSeconds(duration) : '0:00';
    return formatSeconds(sec);
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);

    const onLoadedMetadata = () => {
      // webm files often return Infinity for duration — fall back to stored prop
      if (isFinite(audio.duration) && audio.duration > 0) {
        setTotalDuration(audio.duration);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      currentlyPlayingAudio = null;
    };

    const onError = () => setError(true);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      // Stop audio when component unmounts
      audio.pause();
    };
  }, []);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      currentlyPlayingAudio = null;
    } else {
      // Stop any other audio that is currently playing
      if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
        currentlyPlayingAudio.pause();
        currentlyPlayingAudio.dispatchEvent(new Event('externalstop'));
      }
      audio.play();
      setIsPlaying(true);
      currentlyPlayingAudio = audio;
    }
  };

  // Listen for external stop (when another player starts)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onExternalStop = () => setIsPlaying(false);
    audio.addEventListener('externalstop', onExternalStop);
    return () => audio.removeEventListener('externalstop', onExternalStop);
  }, []);

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const val = parseFloat(e.target.value);
    audio.currentTime = val;
    setCurrentTime(val);
  };

  const accentColor = isSent ? '#38bdf8' : '#a78bfa';

  if (error) {
    return (
      <div style={{ fontSize: '12px', color: '#f87171', padding: '4px 0' }}>
        ⚠️ The audio file could not be loaded.
      </div>
    );
  }

  // Use stored duration as max for the slider when audio metadata isn't loaded yet
  const sliderMax = (isFinite(totalDuration) && totalDuration > 0) ? totalDuration : (duration || 0);
  const progress = sliderMax > 0 ? (currentTime / sliderMax) * 100 : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', padding: '4px 0' }}>
      <audio ref={audioRef} src={`http://localhost:5123${audioUrl}`} preload="metadata" />

      {/* Play/Pause Button */}
      <button onClick={handlePlayPause} style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: `linear-gradient(135deg, ${accentColor}, #0ea5e9)`,
        border: 'none', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {isPlaying
          ? <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          : <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        }
      </button>

      {/* Progress + Time */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Progress bar wrapper — slider overlays the whole area for easy seeking */}
        <div style={{ position: 'relative', height: '4px' }}>
          {/* Background track */}
          <div style={{ position: 'absolute', inset: 0, background: '#334155', borderRadius: '2px' }} />
          {/* Filled portion */}
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${progress}%`, background: accentColor,
            borderRadius: '2px', transition: 'width 0.1s',
          }} />
          {/* Invisible seek slider — sits on top, full width */}
          <input
            type="range" min="0" max={sliderMax} step="0.1"
            value={currentTime}
            onChange={handleSeek}
            style={{
              position: 'absolute', top: '-8px', left: 0, width: '100%',
              opacity: 0, cursor: 'pointer', height: '20px', margin: 0,
            }}
          />
        </div>

        {/* Time display: left = current (only while playing), right = total duration */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
          <span>{isPlaying ? formatTime(currentTime) : ''}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}

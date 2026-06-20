import { useState, useEffect, useRef, useCallback } from 'react';
import { Wind, Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Timer, Coffee, Award } from 'lucide-react';

// Breathing config
const BREATH_PHASES = [
  { name: 'Inhale', duration: 4, instructions: 'Fill your lungs slowly with fresh air... 🌬️' },
  { name: 'Hold', duration: 4, instructions: 'Hold that peace inside your chest... 🧘' },
  { name: 'Exhale', duration: 4, instructions: 'Release all your exam worries and tension... 🍃' },
  { name: 'Hold empty', duration: 4, instructions: 'Stay empty, feel the absolute stillness... 🧘' }
];

export default function CopingHub() {
  // --- 1. Breathing States ---
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhaseIndex, setBreathPhaseIndex] = useState(0);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(4);

  // --- 2. Pomodoro States ---
  const [timerMode, setTimerMode] = useState('focus'); // 'focus' or 'break'
  const [timerDuration, setTimerDuration] = useState(25 * 60); // Default 25 min
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);

  // --- 3. Web Audio Synth States ---
  const [audioActive, setAudioActive] = useState(false);
  const [audioTrack, setAudioTrack] = useState('ocean'); // 'ocean' or 'binaural'
  const [audioVolume, setAudioVolume] = useState(0.5);

  const audioCtxRef = useRef(null);
  const noiseSourceRef = useRef(null);
  const lfoRef = useRef(null);
  const oscLRef = useRef(null);
  const oscRRef = useRef(null);
  const gainNodeRef = useRef(null);

  // --- Web Audio Synthesizer Functions ---

  const initAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playChimeSound = useCallback(() => {
    try {
      initAudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 1.3);
    } catch {
      // Ignored
    }
  }, [initAudioContext]);

  const stopAudio = useCallback(() => {
    try {
      if (noiseSourceRef.current) {
        noiseSourceRef.current.stop();
        noiseSourceRef.current.disconnect();
        noiseSourceRef.current = null;
      }
      if (lfoRef.current) {
        lfoRef.current.stop();
        lfoRef.current.disconnect();
        lfoRef.current = null;
      }
      if (oscLRef.current) {
        oscLRef.current.stop();
        oscLRef.current.disconnect();
        oscLRef.current = null;
      }
      if (oscRRef.current) {
        oscRRef.current.stop();
        oscRRef.current.disconnect();
        oscRRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'suspended') {
        audioCtxRef.current.suspend().catch(() => {});
      }
      setAudioActive(false);
    } catch {
      // already stopped/silent
    }
  }, []);

  const startAudio = useCallback(() => {
    try {
      initAudioContext();
      const ctx = audioCtxRef.current;
      
      // Stop existing before re-launch
      stopAudio();

      // Create primary output gain
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.gain.setValueAtTime(audioVolume, ctx.currentTime);
      gainNodeRef.current.connect(ctx.destination);

      if (audioTrack === 'ocean') {
        // Ocean waves generated via Brownian Noise + LFO low-pass filter automation
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // brown noise filter
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // compensation factor
        }

        noiseSourceRef.current = ctx.createBufferSource();
        noiseSourceRef.current.buffer = noiseBuffer;
        noiseSourceRef.current.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';

        // LFO to oscillate filter frequency between 150Hz and 900Hz (simulating waves crashing)
        lfoRef.current = ctx.createOscillator();
        lfoRef.current.frequency.value = 0.08; // Very slow 12-second ocean tide cycle
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 400; // filter range modifier

        lfoRef.current.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        filter.frequency.value = 450;

        noiseSourceRef.current.connect(filter);
        filter.connect(gainNodeRef.current);

        lfoRef.current.start();
        noiseSourceRef.current.start();

      } else {
        // Binaural beats: 200Hz left, 210Hz right (creates a 10Hz Alpha beat for focused study revision)
        const merger = ctx.createChannelMerger(2);

        oscLRef.current = ctx.createOscillator();
        oscLRef.current.frequency.value = 180; // Left ear
        
        oscRRef.current = ctx.createOscillator();
        oscRRef.current.frequency.value = 190; // Right ear (10Hz Delta/Alpha gap)

        // Split to stereo channels
        oscLRef.current.connect(merger, 0, 0);
        oscRRef.current.connect(merger, 0, 1);

        // Lowpass filter to keep it soft
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 150;

        merger.connect(lowpass);
        lowpass.connect(gainNodeRef.current);

        oscLRef.current.start();
        oscRRef.current.start();
      }

      setAudioActive(true);
    } catch {
      // Ignored
    }
  }, [initAudioContext, stopAudio, audioTrack, audioVolume]);

  // --- breathing effect ---
  useEffect(() => {
    let interval = null;
    if (breathingActive) {
      interval = setInterval(() => {
        setBreathSecondsLeft((prev) => {
          if (prev <= 1) {
            // Move to next phase
            const nextIdx = (breathPhaseIndex + 1) % BREATH_PHASES.length;
            setTimeout(() => {
              setBreathPhaseIndex(nextIdx);
            }, 0);
            return BREATH_PHASES[nextIdx].duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeout(() => {
        setBreathPhaseIndex(0);
        setBreathSecondsLeft(BREATH_PHASES[0].duration);
      }, 0);
    }
    return () => clearInterval(interval);
  }, [breathingActive, breathPhaseIndex]);

  // --- timer effect ---
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            // Play a synthesized chime sound
            playChimeSound();
            // Switch mode
            if (timerMode === 'focus') {
              setTimeout(() => {
                setTimerMode('break');
                setTimerDuration(5 * 60);
              }, 0);
              return 5 * 60;
            } else {
              setTimeout(() => {
                setTimerMode('focus');
                setTimerDuration(25 * 60);
              }, 0);
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerMode, playChimeSound]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [stopAudio]);

  // Sync volume node when volume slider changes
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(audioVolume, audioCtxRef.current.currentTime);
    }
  }, [audioVolume]);

  const handleAudioToggle = () => {
    if (audioActive) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  const handleTrackChange = (trackName) => {
    setAudioTrack(trackName);
    if (audioActive) {
      // Restart with new node config
      setTimeout(() => {
        startAudio();
      }, 50);
    }
  };

  // --- Pomodoro helper utilities ---
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const setTimerConfig = (type, minutes) => {
    setTimerActive(false);
    setTimerMode(type);
    const secs = minutes * 60;
    setTimerDuration(secs);
    setTimerSecondsLeft(secs);
  };

  const currentPhase = BREATH_PHASES[breathPhaseIndex];
  
  // Calculate breath scale class for visual breathing sphere
  const getBreathingScaleClass = () => {
    if (!breathingActive) return '';
    if (breathPhaseIndex === 0) return 'sphere-expand'; // Inhale
    if (breathPhaseIndex === 1) return 'sphere-hold';   // Hold
    if (breathPhaseIndex === 2) return 'sphere-shrink'; // Exhale
    return 'sphere-hold-empty';                         // Hold empty
  };

  return (
    <div className="fade-in coping-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '24px', alignItems: 'start' }}>
      
      {/* Visual Breathing Panel */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '440px', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <Wind size={20} style={{ color: 'var(--emerald)' }} aria-hidden="true" />
            Calming Box Breathing (4-4-4-4)
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Reset your nervous system and slow down your pulse instantly.
          </p>
        </div>

        {/* Breathing Circle Container */}
        <div 
          style={{ 
            height: '240px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            width: '100%'
          }}
        >
          {/* Pulsing Breathing Sphere */}
          <div 
            className={`breathing-sphere ${getBreathingScaleClass()}`}
            role="timer"
            aria-live="assertive"
            aria-label={breathingActive ? `Breathing phase: ${currentPhase.name}. ${breathSecondsLeft} seconds remaining.` : "Breathing sphere ready"}
            style={{
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(13, 148, 136, 0.7) 0%, rgba(99, 102, 241, 0.1) 70%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 20px rgba(13, 148, 136, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 4s cubic-bezier(0.4, 0, 0.2, 1), background 4s, box-shadow 4s',
              zIndex: 2
            }}
          >
            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-title)' }}>
              {breathingActive ? breathSecondsLeft : 'Ready'}
            </span>
            {breathingActive && (
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff', opacity: 0.8, marginTop: '2px' }}>
                {currentPhase.name}
              </span>
            )}
          </div>

          {/* Decorative outer waves */}
          {breathingActive && (
            <div className="breath-wave-pulse" aria-hidden="true"></div>
          )}
        </div>

        {/* Instructions */}
        <div style={{ textAlign: 'center', minHeight: '60px', padding: '0 20px' }}>
          {breathingActive ? (
            <p style={{ fontSize: '0.92rem', color: '#fff', fontWeight: '500', transition: 'var(--transition-smooth)' }}>
              {currentPhase.instructions}
            </p>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Sit in a comfortable position and take a normal breath to prepare.
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ width: '100%', display: 'flex', gap: '10px', marginTop: '16px' }}>
          {breathingActive ? (
            <button 
              type="button"
              className="btn-rose" 
              onClick={() => setBreathingActive(false)}
              aria-pressed={breathingActive}
              aria-label="Stop breathing guide session"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Stop Session
            </button>
          ) : (
            <button 
              type="button"
              className="btn-teal" 
              onClick={() => setBreathingActive(true)}
              aria-pressed={breathingActive}
              aria-label="Start box breathing guide session"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Start Breathing Guide
            </button>
          )}
        </div>
      </div>

      {/* Audio and Study Timer Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Web Audio Ambient soundscapes */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--primary)' }} aria-hidden="true" />
            Synthesized Ambient Soundscapes
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Generated in-browser (100% offline, private, and zero bandwidth).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Track Selector */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn-secondary ${audioTrack === 'ocean' ? 'audio-track-active' : ''}`}
                onClick={() => handleTrackChange('ocean')}
                aria-pressed={audioTrack === 'ocean'}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
              >
                🌊 Ocean Tide Waves
              </button>
              <button
                type="button"
                className={`btn-secondary ${audioTrack === 'binaural' ? 'audio-track-active' : ''}`}
                onClick={() => handleTrackChange('binaural')}
                aria-pressed={audioTrack === 'binaural'}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
              >
                🧠 Binaural Focus (10Hz)
              </button>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                type="button"
                className={audioActive ? "btn-rose" : "btn-primary"} 
                onClick={handleAudioToggle}
                aria-pressed={audioActive}
                aria-label={audioActive ? "Mute ambient audio" : "Play ambient audio"}
                style={{ flexShrink: 0, padding: '10px 18px', fontSize: '0.85rem' }}
              >
                {audioActive ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                {audioActive ? 'Mute Sounds' : 'Play Ambient'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <VolumeX size={14} style={{ color: 'var(--text-dark)' }} aria-hidden="true" />
                <input 
                  type="range" 
                  id="ambient-volume-slider"
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={audioVolume}
                  onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                  aria-label="Ambient audio volume slider"
                  style={{
                    flex: 1,
                    accentColor: 'var(--primary)',
                    background: 'rgba(255,255,255,0.1)',
                    height: '4px',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                />
                <Volume2 size={14} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* Study Focus Timer */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Timer size={18} style={{ color: 'var(--primary)' }} aria-hidden="true" />
            Exam Study Break Timer
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Work hard, break intentionally. Prevent cramming fatigue.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            
            {/* Quick config toggles */}
            <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => setTimerConfig('focus', 25)}
                aria-pressed={timerMode === 'focus' && timerDuration === 25 * 60}
                style={{ flex: 1, fontSize: '0.75rem', padding: '6px', justifyContent: 'center', border: timerMode === 'focus' && timerDuration === 25*60 ? '1px solid var(--primary)' : '1px solid var(--border-color)' }}
              >
                📚 25m Focus
              </button>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => setTimerConfig('focus', 50)}
                aria-pressed={timerMode === 'focus' && timerDuration === 50 * 60}
                style={{ flex: 1, fontSize: '0.75rem', padding: '6px', justifyContent: 'center', border: timerMode === 'focus' && timerDuration === 50*60 ? '1px solid var(--primary)' : '1px solid var(--border-color)' }}
              >
                📝 50m Focus
              </button>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => setTimerConfig('break', 5)}
                aria-pressed={timerMode === 'break' && timerDuration === 5 * 60}
                style={{ flex: 1, fontSize: '0.75rem', padding: '6px', justifyContent: 'center', border: timerMode === 'break' && timerDuration === 5*60 ? '1px solid var(--primary)' : '1px solid var(--border-color)' }}
              >
                ☕ 5m Break
              </button>
            </div>

            {/* Timer countdown clock */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div 
                role="timer"
                aria-live="assertive"
                aria-label={`Study Focus Timer: ${formatTime(timerSecondsLeft)} remaining`}
                style={{ 
                  fontSize: '2.6rem', 
                  fontWeight: '700', 
                  color: timerMode === 'focus' ? 'var(--primary)' : 'var(--emerald)',
                  fontFamily: 'var(--font-title)',
                  letterSpacing: '0.05em'
                }}
              >
                {formatTime(timerSecondsLeft)}
              </div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {timerMode === 'focus' ? <Award size={10} aria-hidden="true" /> : <Coffee size={10} aria-hidden="true" />}
                {timerMode === 'focus' ? 'Focus Session Active' : 'Break Time Active'}
              </div>
            </div>

            {/* Play/Pause/Reset Controls */}
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button 
                type="button"
                onClick={() => setTimerActive(!timerActive)}
                className={timerMode === 'focus' ? 'btn-teal' : 'btn-primary'}
                aria-pressed={timerActive}
                aria-label={timerActive ? "Pause study focus timer" : "Start study focus timer"}
                style={{ flex: 2, justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
              >
                {timerActive ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
                {timerActive ? 'Pause Timer' : 'Start Timer'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setTimerActive(false);
                  setTimerSecondsLeft(timerDuration);
                }}
                className="btn-secondary"
                aria-label="Reset study focus timer"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
              >
                <RotateCcw size={14} aria-hidden="true" /> Reset
              </button>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        .coping-grid-layout {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 24px;
        }
        @media (max-width: 900px) {
          .coping-grid-layout {
            grid-template-columns: 1fr;
          }
        }
        
        /* Sphere Animation Phases */
        .sphere-expand {
          transform: scale(1.25) !important;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.95) 0%, rgba(13, 148, 136, 0.3) 70%) !important;
          box-shadow: 0 0 50px rgba(99, 102, 241, 0.6) !important;
        }
        .sphere-hold {
          transform: scale(1.25) !important;
          background: radial-gradient(circle, rgba(13, 148, 136, 0.95) 0%, rgba(99, 102, 241, 0.3) 70%) !important;
          box-shadow: 0 0 50px rgba(13, 148, 136, 0.6) !important;
        }
        .sphere-shrink {
          transform: scale(0.9) !important;
          background: radial-gradient(circle, rgba(13, 148, 136, 0.8) 0%, rgba(13, 148, 136, 0.2) 70%) !important;
          box-shadow: 0 0 20px rgba(13, 148, 136, 0.4) !important;
        }
        .sphere-hold-empty {
          transform: scale(0.9) !important;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.7) 0%, rgba(13, 148, 136, 0.1) 70%) !important;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.3) !important;
        }

        .breath-wave-pulse {
          position: absolute;
          width: 170px;
          height: 170px;
          border-radius: 50%;
          border: 1px solid rgba(13, 148, 136, 0.3);
          animation: scalePulse 4s infinite linear;
          z-index: 1;
        }
        
        @keyframes scalePulse {
          0% { transform: scale(0.85); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .audio-track-active {
          border-color: var(--primary) !important;
          color: #fff !important;
          background: var(--primary-glow) !important;
        }
      `}</style>

    </div>
  );
}

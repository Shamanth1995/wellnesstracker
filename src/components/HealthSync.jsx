import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, 
  Activity, 
  Sun, 
  CloudRain, 
  Cloud, 
  RefreshCw, 
  Smartphone, 
  CheckCircle, 
  Zap, 
  Moon, 
  Flame, 
  Compass, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { generateHealthInsights } from '../services/aiEngine';

export default function HealthSync({ activeProfile, journals }) {
  // --- 1. State Initializations from localStorage with input clamping / validation ---
  const [steps, setSteps] = useState(() => {
    const saved = localStorage.getItem(`mindmirror_health_steps_${activeProfile?.id}`);
    const val = saved ? parseInt(saved, 10) : 0;
    return isNaN(val) ? 0 : Math.max(0, Math.min(999999, val));
  });

  const [sleep, setSleep] = useState(() => {
    const saved = localStorage.getItem(`mindmirror_health_sleep_${activeProfile?.id}`);
    const val = saved ? parseFloat(saved) : 7.0;
    return isNaN(val) ? 7.0 : Math.max(0.0, Math.min(24.0, val));
  });

  const [heartRate, setHeartRate] = useState(() => {
    const saved = localStorage.getItem(`mindmirror_health_hr_${activeProfile?.id}`);
    const val = saved ? parseInt(saved, 10) : 72;
    return isNaN(val) ? 72 : Math.max(30, Math.min(250, val));
  });

  const [weather, setWeather] = useState(() => {
    const saved = localStorage.getItem(`mindmirror_weather_${activeProfile?.id}`);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.temp === 'number' && typeof parsed.description === 'string') {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing weather storage:', e);
    }
    return null;
  });

  const [syncingWeather, setSyncingWeather] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [accelForce, setAccelForce] = useState(9.8);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const lastStepTime = useRef(0);
  const motionListenerRef = useRef(null);

  const stopMotionTracking = useCallback(() => {
    if (motionListenerRef.current) {
      window.removeEventListener('devicemotion', motionListenerRef.current);
      motionListenerRef.current = null;
    }
    setTrackingActive(false);
    setAccelForce(9.8);
    setSuccessMsg('Step tracker stopped.');
  }, []);

  // Sync state with activeProfile changes (with data sanitization)
  useEffect(() => {
    if (!activeProfile?.id) return;
    
    const savedSteps = localStorage.getItem(`mindmirror_health_steps_${activeProfile.id}`);
    const savedSleep = localStorage.getItem(`mindmirror_health_sleep_${activeProfile.id}`);
    const savedHr = localStorage.getItem(`mindmirror_health_hr_${activeProfile.id}`);
    const savedWeather = localStorage.getItem(`mindmirror_weather_${activeProfile.id}`);

    const stepsVal = savedSteps ? parseInt(savedSteps, 10) : 0;
    const sleepVal = savedSleep ? parseFloat(savedSleep) : 7.0;
    const hrVal = savedHr ? parseInt(savedHr, 10) : 72;

    let parsedWeather = null;
    if (savedWeather) {
      try {
        const parsed = JSON.parse(savedWeather);
        if (parsed && typeof parsed.temp === 'number' && typeof parsed.description === 'string') {
          parsedWeather = parsed;
        }
      } catch (e) {
        console.error('Error parsing weather storage:', e);
      }
    }

    setTimeout(() => {
      setSteps(isNaN(stepsVal) ? 0 : Math.max(0, Math.min(999999, stepsVal)));
      setSleep(isNaN(sleepVal) ? 7.0 : Math.max(0.0, Math.min(24.0, sleepVal)));
      setHeartRate(isNaN(hrVal) ? 72 : Math.max(30, Math.min(250, hrVal)));
      setWeather(parsedWeather);
      
      // Stop tracking when profile changes
      if (motionListenerRef.current) {
        stopMotionTracking();
      }
      setErrorMsg(null);
      setSuccessMsg(null);
    }, 0);
  }, [activeProfile?.id, stopMotionTracking]);

  // Persist state changes
  useEffect(() => {
    if (!activeProfile?.id) return;
    localStorage.setItem(`mindmirror_health_steps_${activeProfile.id}`, steps);
  }, [steps, activeProfile?.id]);

  useEffect(() => {
    if (!activeProfile?.id) return;
    localStorage.setItem(`mindmirror_health_sleep_${activeProfile.id}`, sleep);
  }, [sleep, activeProfile?.id]);

  useEffect(() => {
    if (!activeProfile?.id) return;
    localStorage.setItem(`mindmirror_health_hr_${activeProfile.id}`, heartRate);
  }, [heartRate, activeProfile?.id]);

  useEffect(() => {
    if (!activeProfile?.id) return;
    if (weather) {
      localStorage.setItem(`mindmirror_weather_${activeProfile.id}`, JSON.stringify(weather));
    } else {
      localStorage.removeItem(`mindmirror_weather_${activeProfile.id}`);
    }
  }, [weather, activeProfile?.id]);

  // Cleanup motion listener on unmount
  useEffect(() => {
    return () => {
      if (motionListenerRef.current) {
        window.removeEventListener('devicemotion', motionListenerRef.current);
      }
    };
  }, []);

  // --- 2. Live Weather Sync Handler ---
  const syncLocalWeather = () => {
    setSyncingWeather(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Weather code to description helper
    const mapWeatherCode = (code) => {
      if (code === 0) return { desc: 'Clear sky', isRainy: false, isOvercast: false };
      if (code === 1 || code === 2) return { desc: 'Partly cloudy', isRainy: false, isOvercast: false };
      if (code === 3) return { desc: 'Overcast', isRainy: false, isOvercast: true };
      if (code >= 45 && code <= 48) return { desc: 'Foggy', isRainy: false, isOvercast: true };
      if (code >= 51 && code <= 55) return { desc: 'Drizzle', isRainy: true, isOvercast: false };
      if (code >= 61 && code <= 65) return { desc: 'Rainy', isRainy: true, isOvercast: false };
      if (code >= 71 && code <= 77) return { desc: 'Snowy', isRainy: false, isOvercast: false };
      if (code >= 80 && code <= 82) return { desc: 'Rain showers', isRainy: true, isOvercast: false };
      if (code >= 95 && code <= 99) return { desc: 'Thunderstorm', isRainy: true, isOvercast: false };
      return { desc: 'Overcast', isRainy: false, isOvercast: true };
    };

    const fetchWeather = (lat, lon) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error('Weather API request failed');
          return res.json();
        })
        .then(data => {
          if (data?.current_weather && typeof data.current_weather.temperature === 'number' && typeof data.current_weather.weathercode === 'number') {
            const codeInfo = mapWeatherCode(data.current_weather.weathercode);
            const weatherResult = {
              temp: Math.round(data.current_weather.temperature),
              description: String(codeInfo.desc),
              isRainy: Boolean(codeInfo.isRainy),
              isOvercast: Boolean(codeInfo.isOvercast),
              time: new Date().toISOString()
            };
            setWeather(weatherResult);
            setSuccessMsg(`Weather successfully synced! Conditions: ${weatherResult.description}, ${weatherResult.temp}°C`);
          } else {
            throw new Error('Invalid weather data structure');
          }
        })
        .catch(err => {
          console.error(err);
          setErrorMsg('Failed to reach weather service. Falling back to default region.');
          // Fallback: New Delhi coords (28.61, 77.20)
          fetchWeather(28.61, 77.20);
        })
        .finally(() => {
          setSyncingWeather(false);
        });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation denied or failed. Using New Delhi coords as fallback.', err);
          fetchWeather(28.61, 77.2);
        },
        { timeout: 10000 }
      );
    } else {
      setErrorMsg('Geolocation not supported by browser. Falling back to default region.');
      fetchWeather(28.61, 77.20);
    }
  };

  // --- 3. Device Motion (Accelerometer) Step Counter ---
  const startMotionTracking = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Check availability
    if (!window.DeviceMotionEvent) {
      setErrorMsg('Device Motion API is not supported on this browser/device.');
      return;
    }

    try {
      // iOS 13+ requires requestPermission
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        const permissionState = await DeviceMotionEvent.requestPermission();
        if (permissionState !== 'granted') {
          setErrorMsg('Permission to access device accelerometer was denied.');
          return;
        }
      }

      setTrackingActive(true);
      
      const threshold = 12.8; // m/s^2 (Standard gravity is ~9.8m/s^2)
      
      motionListenerRef.current = (event) => {
        const x = event.accelerationIncludingGravity?.x || 0;
        const y = event.accelerationIncludingGravity?.y || 0;
        const z = event.accelerationIncludingGravity?.z || 0;
        
        const force = Math.sqrt(x*x + y*y + z*z);
        setAccelForce(force);

        const now = Date.now();
        // Peak detection step counting with 350ms debounce
        if (force > threshold && now - lastStepTime.current > 350) {
          setSteps(prev => Math.min(999999, prev + 1));
          lastStepTime.current = now;
          
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }
      };

      window.addEventListener('devicemotion', motionListenerRef.current);
      setSuccessMsg('Motion tracking active! Keep the browser open and start walking.');
    } catch (err) {
      console.error(err);
      setErrorMsg('Error requesting device motion access.');
    }
  };

  // stopMotionTracking is declared above using useCallback

  const simulateStep = (count = 1) => {
    setSteps(prev => Math.min(999999, prev + count));
    
    // Simulate motion wave bump
    setAccelForce(14.2);
    setTimeout(() => {
      setAccelForce(9.8);
    }, 150);
  };

  // --- 4. Simulated Platform Sync Handlers ---
  const syncPlatformData = (platform) => {
    setSyncingPlatform(platform);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Simulate network delay
    setTimeout(() => {
      let mockSleep = 7.0;
      let mockHr = 72;
      let addedSteps = 2500;

      if (platform === 'Apple Health') {
        mockSleep = (Math.random() * 2.5 + 5.5).toFixed(1); // 5.5h to 8.0h
        mockHr = Math.round(Math.random() * 25 + 65); // 65 to 90 bpm
        addedSteps = Math.round(Math.random() * 4000 + 4000);
      } else if (platform === 'Google Fit') {
        mockSleep = (Math.random() * 2.8 + 5.2).toFixed(1); // 5.2h to 8.0h
        mockHr = Math.round(Math.random() * 28 + 63); // 63 to 91 bpm
        addedSteps = Math.round(Math.random() * 4500 + 3500);
      } else if (platform === 'Fitbit') {
        mockSleep = (Math.random() * 3.0 + 5.0).toFixed(1); // 5.0h to 8.0h
        mockHr = Math.round(Math.random() * 20 + 68); // 68 to 88 bpm
        addedSteps = Math.round(Math.random() * 5000 + 3000);
      }

      setSleep(Math.max(0.0, Math.min(24.0, parseFloat(mockSleep))));
      setHeartRate(Math.max(30, Math.min(250, mockHr)));
      setSteps(prev => Math.min(999999, prev + addedSteps));
      setSyncingPlatform(null);
      setSuccessMsg(`Import complete! Synced ${addedSteps} steps, ${mockSleep}h sleep, and ${mockHr} bpm resting HR from ${platform}.`);
    }, 1500);
  };

  // --- 5. AI Wellness Correlation & Insights Generation ---
  const healthData = { steps, sleep, heartRate };
  const insights = generateHealthInsights(healthData, weather, journals);

  const getScoreColor = (score) => {
    if (score >= 85) return 'var(--emerald)';
    if (score >= 60) return 'var(--amber)';
    return 'var(--rose)';
  };

  const generateWavePath = (force) => {
    const diff = Math.abs(force - 9.8);
    const amp = Math.max(3, Math.min(32, diff * 7));
    return `M 0 20 Q 40 ${20 - amp} 80 20 T 160 20 T 240 20 T 320 20 T 400 20`;
  };

  const clearSyncData = () => {
    setSteps(0);
    setSleep(7.0);
    setHeartRate(72);
    setWeather(null);
    setErrorMsg(null);
    setSuccessMsg('Data cleared for this profile.');
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Screen Reader Heading for proper semantic hierarchy */}
      <h2 className="sr-only">Health and Weather Sync Center</h2>

      {/* Top Banner Alert / Message Console (Accessible announcements) */}
      {(errorMsg || successMsg) && (
        <div 
          className="glass-card" 
          role="status"
          aria-live="polite"
          style={{ 
            padding: '12px 18px', 
            borderRadius: 'var(--radius-md)', 
            borderLeft: `4px solid ${errorMsg ? 'var(--rose)' : 'var(--emerald)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.88rem'
          }}
        >
          {errorMsg ? (
            <AlertCircle size={18} aria-hidden="true" style={{ color: 'var(--rose)', flexShrink: 0 }} />
          ) : (
            <CheckCircle size={18} aria-hidden="true" style={{ color: 'var(--emerald)', flexShrink: 0 }} />
          )}
          <span style={{ color: 'var(--text-main)' }}>{errorMsg || successMsg}</span>
        </div>
      )}

      {/* Main Grid: Sync Controls Left, AI Engine Dashboard Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Data Gathering Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          
          {/* Card 1: Real-time Live Step Counter */}
          <section className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={20} aria-hidden="true" style={{ color: 'var(--primary)' }} />
                <h3>Live Activity Tracking</h3>
              </div>
              {trackingActive && (
                <span style={{ fontSize: '0.75rem', color: 'var(--emerald)', background: 'var(--emerald-glow)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  ACTIVE SENSORS
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Count steps in real time using your phone's built-in accelerometer. Or use the simulator buttons below if testing on a desktop computer.
            </p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'var(--font-title)', color: 'var(--text-main)' }}>
                {steps.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>steps today</span>
            </div>

            {/* Wave force indicator */}
            <div style={{ height: '40px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg width="100%" height="40" aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                  <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="50%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="var(--emerald)" />
                  </linearGradient>
                </defs>
                <path d={generateWavePath(accelForce)} stroke="url(#wave-gradient)" fill="none" strokeWidth="2.5" />
              </svg>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', zIndex: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Motion: {accelForce.toFixed(2)} m/s²
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {trackingActive ? (
                <button 
                  type="button"
                  onClick={stopMotionTracking}
                  style={{
                    flex: '1',
                    background: 'var(--rose)',
                    border: 'none',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: 'bold',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  Stop Sensor Sync
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={startMotionTracking}
                  style={{
                    flex: '1',
                    background: 'var(--primary)',
                    border: 'none',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: 'bold',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  Track Live Activity
                </button>
              )}
            </div>

            {/* Desktop Simulator Panel */}
            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Desktop Simulator
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button"
                  onClick={() => simulateStep(1)}
                  style={{
                    flex: '1',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  +1 Step (Walk)
                </button>
                <button 
                  type="button"
                  onClick={() => simulateStep(10)}
                  style={{
                    flex: '1',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  +10 Steps (Run)
                </button>
              </div>
            </div>
          </section>

          {/* Card 2: Real Local Weather Sync */}
          <section className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sun size={20} aria-hidden="true" style={{ color: 'var(--amber)' }} />
                <h3>Local Weather Sync</h3>
              </div>
              {weather && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dark)' }}>
                  Synced {new Date(weather.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Sync local weather conditions to check if gloomy weather or sunlight is impacting your energy levels and exam concentration.
            </p>

            {weather ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '50%' }}>
                  {weather.isRainy ? (
                    <CloudRain size={36} aria-hidden="true" style={{ color: 'var(--primary)' }} />
                  ) : weather.isOvercast ? (
                    <Cloud size={36} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
                  ) : (
                    <Sun size={36} aria-hidden="true" style={{ color: 'var(--amber)' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'var(--font-title)' }}>
                    {weather.temp}°C
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', textTransform: 'capitalize' }}>
                    {weather.description}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dark)', fontSize: '0.85rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                Weather not synced yet
              </div>
            )}

            <button 
              type="button"
              onClick={syncLocalWeather}
              disabled={syncingWeather}
              style={{
                width: '100%',
                background: 'var(--emerald)',
                border: 'none',
                color: 'white',
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'var(--transition-smooth)'
              }}
            >
              <RefreshCw size={14} aria-hidden="true" className={syncingWeather ? 'spin-anim' : ''} style={{ animation: syncingWeather ? 'spin 1.2s linear infinite' : 'none' }} />
              {syncingWeather ? 'Syncing...' : 'Sync Local Weather'}
            </button>
            
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </section>

          {/* Card 3: Platform Imports */}
          <section className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Compass size={20} aria-hidden="true" style={{ color: 'var(--rose)' }} />
              <h3>Integrate Health Platforms</h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Pull sleep duration and resting heart rate data from popular fitness platforms to cross-correlate physiological strain with stress.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {['Apple Health', 'Google Fit', 'Fitbit'].map((platform) => (
                <div 
                  key={platform} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px 16px', 
                    borderRadius: 'var(--radius-md)', 
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <span style={{ fontSize: '0.88rem', fontWeight: 'bold' }}>{platform}</span>
                  <button 
                    type="button"
                    onClick={() => syncPlatformData(platform)}
                    disabled={syncingPlatform !== null}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 'bold',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    {syncingPlatform === platform ? 'Importing...' : 'Sync Data'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: AI Wellness Dashboard & Insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          
          {/* Card 4: Main AI Correlation & Insights Report */}
          <section className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Heart size={20} aria-hidden="true" style={{ color: 'var(--rose)' }} />
              AI Wellness Report
            </h3>

            {/* Overall Score */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '24px', textAlign: 'center' }}>
              <div 
                aria-label={`Wellness score ${insights.wellnessScore} out of 100`}
                style={{ 
                  width: '100px', 
                  height: '100px', 
                  borderRadius: '50%', 
                  border: `6px solid ${getScoreColor(insights.wellnessScore)}`, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '14px',
                  boxShadow: `0 0 20px -5px ${getScoreColor(insights.wellnessScore)}`
                }}
              >
                <span style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'var(--font-title)' }}>
                  {insights.wellnessScore}
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Index
                </span>
              </div>

              <h4 style={{ color: 'var(--text-main)', marginBottom: '6px' }}>{insights.summary}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Aggregates sleep ({sleep}h), active steps ({steps}), and resting HR ({heartRate} bpm) to index physiological capacity.
              </p>
            </div>

            {/* Synced Readings Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                <Moon size={12} aria-hidden="true" style={{ color: 'var(--primary)' }} />
                <span>Sleep: <strong>{sleep} hrs</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                <Flame size={12} aria-hidden="true" style={{ color: '#f43f5e' }} />
                <span>Steps: <strong>{steps}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                <Activity size={12} aria-hidden="true" style={{ color: 'var(--emerald)' }} />
                <span>Resting HR: <strong>{heartRate} bpm</strong></span>
              </div>
            </div>

            {/* Generated Insights */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Physiological & Environmental Insights
              </h4>
              <ul role="list" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', listStyle: 'none', padding: 0 }}>
                {insights.insights.length > 0 ? (
                  insights.insights.map((insight, idx) => (
                    <li 
                      key={idx} 
                      role="listitem"
                      style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        padding: '12px 16px', 
                        borderRadius: 'var(--radius-md)', 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid var(--border-color)',
                        fontSize: '0.85rem',
                        lineHeight: '1.4'
                      }}
                    >
                      <Zap size={16} aria-hidden="true" style={{ color: 'var(--amber)', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: 'var(--text-main)' }}>{insight}</span>
                    </li>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-dark)', fontSize: '0.85rem', textAlign: 'center', padding: '16px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    No insights generated. Sync more metrics or complete a Daily Journal check-in to compile diagnostics.
                  </div>
                )}
              </ul>
            </div>

            {/* Clear All Stats Data */}
            <button 
              type="button"
              onClick={clearSyncData}
              style={{
                width: '100%',
                background: 'rgba(225, 29, 72, 0.08)',
                border: '1px solid rgba(225, 29, 72, 0.25)',
                color: '#ff4d6d',
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                transition: 'var(--transition-smooth)'
              }}
            >
              Clear Health Stats
            </button>
          </section>

          {/* Educational Note */}
          <section className="glass-card" style={{ padding: '20px', display: 'flex', gap: '12px', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
            <HelpCircle size={18} aria-hidden="true" style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '4px' }}>Science-Backed Coping</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Both sleep duration and physical movement directly influence prefrontal cortex regulation. Adequate sleep improves information retention by up to 40%, while walking boosts oxygenation and blood circulation, rapidly reducing test anxiety.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

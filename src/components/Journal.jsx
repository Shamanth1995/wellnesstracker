import React, { useState } from 'react';
import { BookOpen, Tag, Sparkles, Heart, AlertCircle, Smile, ArrowRight, Music, HelpCircle } from 'lucide-react';
import { analyzeJournal, analyzeQuickLog } from '../services/aiEngine';

const MOODS = [
  { name: 'Calm', emoji: '🧘', color: 'var(--emerald)' },
  { name: 'Motivated', emoji: '🚀', color: '#3b82f6' },
  { name: 'Neutral', emoji: '😐', color: 'var(--text-muted)' },
  { name: 'Exhausted', emoji: '😴', color: '#a855f7' },
  { name: 'Anxious', emoji: '😰', color: 'var(--amber)' },
  { name: 'Down', emoji: '😢', color: 'var(--rose)' }
];

const QUICK_TAGS = [
  { name: 'Mock Test Jitters', type: 'mockTest' },
  { name: 'Study Burnout', type: 'sleep' },
  { name: 'Calculus/Math Block', type: 'subject' },
  { name: 'Organic Chemistry', type: 'subject' },
  { name: 'Physics Formulas', type: 'subject' },
  { name: 'Parent Expectations', type: 'family' },
  { name: 'Syllabus Backlog', type: 'subject' },
  { name: 'Peer Comparison', type: 'peer' },
  { name: 'Lack of Sleep', type: 'sleep' },
  { name: 'Exam Day Panic', type: 'future' },
  { name: 'Focused & Studying', type: 'general' },
  { name: 'Revision Backlog', type: 'subject' }
];

const JOURNAL_PROMPTS = [
  "How did today's mock test go, and what feelings are you carrying from it?",
  "Is there a specific subject backlog or chapter that is causing you tension right now?",
  "How did you sleep last night? Are you feeling physically fatigued?",
  "Are you feeling pressure from parent expectations or comparing your rank to others?",
  "Describe what your main worry is about exam day. Let's unpack it."
];

export default function Journal({ activeProfile, onLogCreated, onGoToDashboard }) {
  const [selectedMood, setSelectedMood] = useState('Neutral');
  const [logMode, setLogMode] = useState('open'); // 'open' or 'quick'
  const [journalText, setJournalText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [motivation, setMotivation] = useState(5);
  const [focus, setFocus] = useState(5);

  // Toggle quick tag selection
  const handleTagToggle = (tagName) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleNextPrompt = () => {
    setPromptIndex((prev) => (prev + 1) % JOURNAL_PROMPTS.length);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let result = null;
    const metrics = { energy, stress, motivation, focus };

    if (logMode === 'open') {
      if (!journalText.trim()) return;
      result = analyzeJournal(journalText, selectedMood, activeProfile, metrics);
      result.originalText = journalText;
    } else {
      if (selectedTags.length === 0) {
        alert('Please select at least one tag to check-in.');
        return;
      }
      result = analyzeQuickLog(selectedTags, selectedMood, activeProfile, metrics);
      result.originalText = `Quick check-in with tags: ${selectedTags.join(', ')}`;
    }

    // Pass result to parent (App.jsx) to store in localStorage
    onLogCreated(result);
    setAnalysisResult(result);
    
    // Clear inputs
    setJournalText('');
    setSelectedTags([]);
    setEnergy(5);
    setStress(5);
    setMotivation(5);
    setFocus(5);
  };

  const getStressColor = (level) => {
    if (level <= 3) return 'var(--emerald)';
    if (level <= 6) return 'var(--amber)';
    return 'var(--rose)';
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: analysisResult ? '1.1fr 0.9fr' : '1fr', gap: '24px', alignItems: 'start' }}>
      
      {/* Logger Panel */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={20} style={{ color: 'var(--primary)' }} />
          Daily Stress & Mood Log
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Step 1: Mood Selector */}
          <div>
            <label style={{ marginBottom: '8px', fontSize: '0.95rem' }}>1. How are you feeling right now?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
              {MOODS.map(m => {
                const isSelected = selectedMood === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setSelectedMood(m.name)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '12px 6px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                      border: isSelected ? `2px solid ${m.color}` : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'var(--transition-bounce)'
                    }}
                    className="mood-btn"
                  >
                    <span style={{ fontSize: '1.8rem' }}>{m.emoji}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: isSelected ? '#fff' : 'var(--text-muted)' }}>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Energy, Stress, Motivation, Focus sliders */}
          <div>
            <label style={{ marginBottom: '10px', fontSize: '0.95rem' }}>2. Rate your physical and mental state</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', margin: '4px 0 8px 0' }} className="metrics-sliders-grid">
              
              {/* Energy */}
              <div className="glass-card" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)' }}>
                <label style={{ fontSize: '0.82rem', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>⚡ Energy Level</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{energy}/10</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={energy} 
                  onChange={(e) => setEnergy(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dark)', marginTop: '4px' }}>
                  <span>Exhausted</span>
                  <span>Charged</span>
                </div>
              </div>

              {/* Stress */}
              <div className="glass-card" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)' }}>
                <label style={{ fontSize: '0.82rem', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>🔥 Stress Level</span>
                  <span style={{ color: 'var(--rose)', fontWeight: 'bold' }}>{stress}/10</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={stress} 
                  onChange={(e) => setStress(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--rose)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dark)', marginTop: '4px' }}>
                  <span>Relaxed</span>
                  <span>Panic</span>
                </div>
              </div>

              {/* Motivation */}
              <div className="glass-card" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)' }}>
                <label style={{ fontSize: '0.82rem', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>🚀 Motivation</span>
                  <span style={{ color: 'var(--emerald)', fontWeight: 'bold' }}>{motivation}/10</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={motivation} 
                  onChange={(e) => setMotivation(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--emerald)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dark)', marginTop: '4px' }}>
                  <span>Stuck</span>
                  <span>Driven</span>
                </div>
              </div>

              {/* Focus */}
              <div className="glass-card" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)' }}>
                <label style={{ fontSize: '0.82rem', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>🎯 Focus Level</span>
                  <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{focus}/10</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={focus} 
                  onChange={(e) => setFocus(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dark)', marginTop: '4px' }}>
                  <span>Distracted</span>
                  <span>Locked-in</span>
                </div>
              </div>

            </div>
          </div>

          {/* Step 3: Choose Logging Preference */}
          <div>
            <label style={{ marginBottom: '8px', fontSize: '0.95rem' }}>3. Choose your logging preference</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`btn-secondary ${logMode === 'open' ? 'active-mode' : ''}`}
                onClick={() => setLogMode('open')}
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  background: logMode === 'open' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                  borderColor: logMode === 'open' ? 'var(--primary)' : 'var(--border-color)'
                }}
              >
                <BookOpen size={16} /> Open-Ended Journal
              </button>
              <button
                type="button"
                className={`btn-secondary ${logMode === 'quick' ? 'active-mode' : ''}`}
                onClick={() => setLogMode('quick')}
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  background: logMode === 'quick' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                  borderColor: logMode === 'quick' ? 'var(--primary)' : 'var(--border-color)'
                }}
              >
                <Tag size={16} /> Quick Tag Check-in
              </button>
            </div>
          </div>

          {/* Step 4: Core Log Input */}
          {logMode === 'open' ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.95rem' }}>4. Write your thoughts (Open-ended venting)</label>
                <button 
                  type="button" 
                  onClick={handleNextPrompt}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}
                >
                  💡 Next Prompt
                </button>
              </div>
              <div 
                style={{
                  padding: '10px 14px',
                  background: 'rgba(99,102,241,0.03)',
                  borderLeft: '3px solid var(--primary)',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  marginBottom: '8px'
                }}
              >
                <strong>Prompt:</strong> {JOURNAL_PROMPTS[promptIndex]}
              </div>
              <textarea
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="What chapter is stressing you? Did you score lower in a mock test? Are parents expecting too much? Spill it out here..."
                rows={6}
                required
                style={{ resize: 'vertical' }}
              />
            </div>
          ) : (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.95rem' }}>4. Select prep & stress tags that match today</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '4px 0' }}>
                {QUICK_TAGS.map(t => {
                  const isSelected = selectedTags.includes(t.name);
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => handleTagToggle(t.name)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: isSelected ? 'var(--amber-glow)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '1px solid var(--amber)' : '1px solid var(--border-color)',
                        color: isSelected ? '#fff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        transition: 'var(--transition-bounce)'
                      }}
                    >
                      {isSelected ? '⚠️ ' : ''}{t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <Sparkles size={16} /> Analyze with GenAI Companion
          </button>
        </form>
      </div>

      {/* Real-time Analysis Result Panel */}
      {analysisResult && (
        <div 
          className="glass-card fade-in" 
          style={{ 
            padding: '24px', 
            background: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(99,102,241,0.05) 100%)',
            border: '1px solid rgba(255,255,255,0.12)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              GenAI Stress Analysis
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>Just now</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Stress level display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div 
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  border: `4px solid ${getStressColor(analysisResult.stressLevel)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: '800',
                  color: getStressColor(analysisResult.stressLevel),
                  fontFamily: 'var(--font-title)'
                }}
              >
                {analysisResult.stressLevel}
              </div>
              <div>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dark)', textTransform: 'uppercase' }}>Stress Severity</h4>
                <p style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>
                  {analysisResult.stressCategory} Stress
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Scale of 1 (Calm) to 10 (Critical)
                </p>
              </div>
            </div>

            {/* Triggers */}
            {analysisResult.detectedTriggers.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dark)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Detected Stress Triggers
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {analysisResult.detectedTriggers.map((t, idx) => (
                    <span 
                      key={idx} 
                      style={{ 
                        fontSize: '0.75rem', 
                        background: 'var(--amber-glow)', 
                        color: 'var(--amber)', 
                        padding: '3px 10px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(217, 119, 6, 0.3)',
                        fontWeight: '500'
                      }}
                    >
                      ⚠️ {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Coping Strategies */}
            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dark)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Tailored Coping Strategies
              </h4>
              <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysisResult.copingStrategies.map((c, idx) => (
                  <li key={idx} style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Encouragement */}
            <div style={{ background: 'var(--emerald-glow)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--emerald)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Heart size={14} />
                Zenbuddy Companion Note
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                {analysisResult.encouragement}
              </p>
            </div>

            {/* Recommended break */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Music size={18} style={{ color: 'var(--primary)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)', textTransform: 'uppercase' }}>Recommended Break</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{analysisResult.recommendedBreakActivity}</div>
                </div>
              </div>
            </div>

            {/* Go to Dashboard button */}
            <button 
              type="button" 
              className="btn-primary" 
              onClick={onGoToDashboard} 
              style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
            >
              Go to Dashboard <ArrowRight size={16} />
            </button>

          </div>
        </div>
      )}

      <style>{`
        .active-mode {
          border-color: var(--primary) !important;
          color: #fff !important;
        }
        .mood-btn:hover {
          transform: scale(1.05);
          background: rgba(255,255,255,0.02);
        }
      `}</style>

    </div>
  );
}

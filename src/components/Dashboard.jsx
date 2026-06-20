import React, { useState } from 'react';
import { Activity, Smile, TrendingUp, AlertCircle, Calendar, ChevronRight, ChevronDown, CheckCircle2, Sparkles } from 'lucide-react';
import { generateWellnessForecast } from '../services/aiEngine';

export default function Dashboard({ activeProfile, journals, onNavigateToTab }) {
  const [expandedJournalId, setExpandedJournalId] = useState(null);
  const [selectedChartMetric, setSelectedChartMetric] = useState('stress');

  // Helper: calculate average metric values
  const getAverageMetric = (key) => {
    if (journals.length === 0) return 0;
    let sum = 0;
    journals.forEach(j => {
      let val = 5;
      if (key === 'stress') val = j.stressLevel;
      else if (j.metrics && j.metrics[key] !== undefined) {
        val = j.metrics[key];
      }
      sum += val;
    });
    return (sum / journals.length).toFixed(1);
  };

  const avgStress = getAverageMetric('stress');
  const avgEnergy = getAverageMetric('energy');
  const avgMotivation = getAverageMetric('motivation');
  const avgFocus = getAverageMetric('focus');

  // Generate pattern-based forecast
  const forecast = generateWellnessForecast(journals);

  const getForecastStyle = (status) => {
    switch (status) {
      case 'danger':
        return {
          background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.18) 0%, rgba(217, 119, 6, 0.08) 100%)',
          borderColor: 'rgba(225, 29, 72, 0.35)',
          iconColor: 'var(--rose)',
          shadow: 'rgba(225, 29, 72, 0.15)'
        };
      case 'warning':
        return {
          background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
          borderColor: 'rgba(217, 119, 6, 0.3)',
          iconColor: 'var(--amber)',
          shadow: 'rgba(217, 119, 6, 0.1)'
        };
      case 'positive':
        return {
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.18) 0%, rgba(99, 102, 241, 0.08) 100%)',
          borderColor: 'rgba(13, 148, 136, 0.35)',
          iconColor: 'var(--emerald)',
          shadow: 'rgba(13, 148, 136, 0.15)'
        };
      case 'neutral':
        return {
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(13, 148, 136, 0.04) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.2)',
          iconColor: 'var(--primary)',
          shadow: 'rgba(99, 102, 241, 0.1)'
        };
      case 'learning':
      default:
        return {
          background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
          borderColor: 'var(--border-color)',
          iconColor: 'var(--text-muted)',
          shadow: 'rgba(0,0,0,0)'
        };
    }
  };

  const getForecastIcon = (status, iconColor) => {
    switch (status) {
      case 'danger':
      case 'warning':
        return <AlertCircle size={24} style={{ color: iconColor }} />;
      case 'positive':
      case 'neutral':
      case 'learning':
      default:
        return <Sparkles size={24} style={{ color: iconColor }} />;
    }
  };

  const fStyle = getForecastStyle(forecast.status);

  // Keep for backwards compatibility
  const averageStress = avgStress;

  const getMetricColor = (metric) => {
    switch (metric) {
      case 'stress': return 'var(--rose)';
      case 'energy': return 'var(--primary)';
      case 'motivation': return 'var(--emerald)';
      case 'focus': return '#3b82f6';
      default: return 'var(--primary)';
    }
  };

  // Helper: calculate streak (consecutive days of logging)
  const calculateStreak = () => {
    if (journals.length === 0) return 0;
    
    // Sort journals by date descending
    const sorted = [...journals].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < sorted.length; i++) {
      const entryDate = new Date(sorted[i].timestamp);
      entryDate.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(currentDate - entryDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0 || diffDays === 1) {
        streak++;
        currentDate = entryDate;
      } else if (diffDays > 1) {
        break; // Streak broken
      }
    }
    return streak;
  };

  // Helper: aggregate top triggers
  const getTopTriggers = () => {
    const counts = {};
    journals.forEach(j => {
      if (j.detectedTriggers) {
        j.detectedTriggers.forEach(t => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  };

  const streak = calculateStreak();
  const topTriggers = getTopTriggers();
  const recentJournals = [...journals]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  // SVG Chart rendering data
  const renderSVGChart = () => {
    if (journals.length < 2) {
      return (
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Keep logging entries to view stress charts (minimum 2 logs required).
        </div>
      );
    }

    // Sort ascending for chart flow (oldest to newest)
    const chartData = [...journals]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-7); // Last 7 entries

    const width = 500;
    const height = 180;
    const paddingX = 40;
    const paddingY = 25;

    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    const points = chartData.map((d, index) => {
      const x = paddingX + (index / (chartData.length - 1)) * chartWidth;
      let val = 5;
      if (selectedChartMetric === 'stress') val = d.stressLevel;
      else if (d.metrics && d.metrics[selectedChartMetric] !== undefined) {
        val = d.metrics[selectedChartMetric];
      }
      // invert Y since SVG coordinates start at top left (stress 1 = bottom, stress 10 = top)
      const y = paddingY + chartHeight - ((val - 1) / 9) * chartHeight;
      return { x, y, value: val, ...d };
    });

    const pathD = points.reduce((dStr, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${dStr} L ${p.x} ${p.y}`;
    }, '');

    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
      : '';

    const metricColor = getMetricColor(selectedChartMetric);

    return (
      <>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }} aria-hidden="true">
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metricColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={metricColor} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={metricColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={metricColor} stopOpacity="1.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((val, i) => {
            const y = paddingY + chartHeight - val * chartHeight;
            const label = Math.round(1 + val * 9);
            return (
              <g key={i}>
                <line 
                  x1={paddingX} 
                  y1={y} 
                  x2={width - paddingX} 
                  y2={y} 
                  stroke="rgba(255,255,255,0.05)" 
                  strokeDasharray="4,4"
                />
                <text 
                  x={paddingX - 10} 
                  y={y + 4} 
                  fill="var(--text-dark)" 
                  fontSize="10" 
                  textAnchor="end"
                  fontFamily="var(--font-title)"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#chartGlow)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((p, i) => {
            return (
              <g key={i}>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="5" 
                  fill={metricColor}
                  stroke="var(--bg-dark)" 
                  strokeWidth="2" 
                  style={{ cursor: 'pointer' }}
                />
                <text
                  x={p.x}
                  y={p.y - 10}
                  fill="var(--text-main)"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="var(--font-title)"
                >
                  {p.value}
                </text>
                <text
                  x={p.x}
                  y={height - paddingY + 15}
                  fill="var(--text-muted)"
                  fontSize="8"
                  textAnchor="middle"
                >
                  {new Date(p.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </text>
              </g>
            );
          })}
        </svg>

        <table className="sr-only">
          <caption>Student wellness metrics history table</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Stress Level</th>
              <th scope="col">Energy Level</th>
              <th scope="col">Motivation Level</th>
              <th scope="col">Focus Level</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((d, i) => {
              const energyVal = d.metrics?.energy !== undefined ? d.metrics.energy : 5;
              const stressVal = d.metrics?.stress !== undefined ? d.metrics.stress : d.stressLevel;
              const motVal = d.metrics?.motivation !== undefined ? d.metrics.motivation : 5;
              const focusVal = d.metrics?.focus !== undefined ? d.metrics.focus : 5;
              return (
                <tr key={i}>
                  <td>{new Date(d.timestamp).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                  <td>{stressVal} out of 10</td>
                  <td>{energyVal} out of 10</td>
                  <td>{motVal} out of 10</td>
                  <td>{focusVal} out of 10</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </>
    );
  };

  const getStressColor = (level) => {
    if (level <= 3) return 'var(--emerald)';
    if (level <= 6) return 'var(--amber)';
    return 'var(--rose)';
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Welcome Panel */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(13, 148, 136, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2.5rem' }}>{activeProfile?.avatar}</span>
          <div>
            <h2 style={{ fontSize: '1.6rem', color: '#fff' }}>Welcome back, {activeProfile?.name}!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Your {activeProfile?.targetExam} journey is challenging, but you are not alone. Let's look at your stress insights.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: 4 Core Wellness Metrics circular indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        {/* Metric 1: Stress */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            style={{ 
              width: '55px', 
              height: '55px', 
              borderRadius: '50%', 
              background: journals.length > 0 ? getStressColor(parseFloat(avgStress)) : 'rgba(255,255,255,0.05)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: '800',
              fontFamily: 'var(--font-title)'
            }}
          >
            {journals.length > 0 ? avgStress : '-'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg Stress
            </h3>
            <p style={{ fontSize: '1rem', fontWeight: '600' }}>
              {journals.length > 0 
                ? (avgStress <= 3 ? 'Low (Calm)' : avgStress <= 6 ? 'Moderate' : 'High pressure')
                : 'No logs'}
            </p>
          </div>
        </div>

        {/* Metric 2: Energy */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            style={{ 
              width: '55px', 
              height: '55px', 
              borderRadius: '50%', 
              background: journals.length > 0 ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              color: 'var(--primary)',
              fontSize: '1.2rem',
              fontWeight: '800',
              fontFamily: 'var(--font-title)'
            }}
          >
            {journals.length > 0 ? avgEnergy : '-'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg Energy
            </h3>
            <p style={{ fontSize: '1rem', fontWeight: '600' }}>
              {journals.length > 0 
                ? (avgEnergy <= 3 ? 'Exhausted' : avgEnergy <= 7 ? 'Stable' : 'Charged')
                : 'No logs'}
            </p>
          </div>
        </div>

        {/* Metric 3: Motivation */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            style={{ 
              width: '55px', 
              height: '55px', 
              borderRadius: '50%', 
              background: journals.length > 0 ? 'var(--emerald-glow)' : 'rgba(255,255,255,0.05)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              color: 'var(--emerald)',
              fontSize: '1.2rem',
              fontWeight: '800',
              fontFamily: 'var(--font-title)'
            }}
          >
            {journals.length > 0 ? avgMotivation : '-'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg Motivation
            </h3>
            <p style={{ fontSize: '1rem', fontWeight: '600' }}>
              {journals.length > 0 
                ? (avgMotivation <= 3 ? 'Stuck' : avgMotivation <= 7 ? 'Hopeful' : 'Driven')
                : 'No logs'}
            </p>
          </div>
        </div>

        {/* Metric 4: Focus */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            style={{ 
              width: '55px', 
              height: '55px', 
              borderRadius: '50%', 
              background: journals.length > 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.05)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              color: '#3b82f6',
              fontSize: '1.2rem',
              fontWeight: '800',
              fontFamily: 'var(--font-title)'
            }}
          >
            {journals.length > 0 ? avgFocus : '-'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg Focus
            </h3>
            <p style={{ fontSize: '1rem', fontWeight: '600' }}>
              {journals.length > 0 
                ? (avgFocus <= 3 ? 'Distracted' : avgFocus <= 7 ? 'Focused' : 'Locked-in')
                : 'No logs'}
            </p>
          </div>
        </div>

      </div>

      {/* Grid: Streaks and logging activity details */}
      <div className="forecast-streaks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Metric Card 2: Logging Streak */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            style={{ 
              width: '55px', 
              height: '55px', 
              borderRadius: '50%', 
              background: streak > 0 ? 'var(--emerald-glow)' : 'rgba(255,255,255,0.05)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              color: streak > 0 ? 'var(--emerald)' : 'var(--text-dark)'
            }}
          >
            <Activity size={24} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Journaling Streak
            </h3>
            <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              {streak} {streak === 1 ? 'day' : 'days'} active
            </p>
          </div>
        </div>

        {/* Metric Card 3: Mood log count */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            style={{ 
              width: '55px', 
              height: '55px', 
              borderRadius: '50%', 
              background: journals.length > 0 ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              color: journals.length > 0 ? 'var(--primary)' : 'var(--text-dark)'
            }}
          >
            <Smile size={24} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Check-Ins
            </h3>
            <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              {journals.length} {journals.length === 1 ? 'log' : 'logs'} recorded
            </p>
          </div>
        </div>

        {/* Metric Card 4: Wellness Forecast & Readiness */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '20px', 
            background: fStyle.background, 
            borderColor: fStyle.borderColor,
            boxShadow: fStyle.shadow !== 'rgba(0,0,0,0)' ? `0 10px 30px -5px ${fStyle.shadow}` : '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
            display: 'flex', 
            flexDirection: 'column',
            gap: '12px',
            justifyContent: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{ 
                width: '55px', 
                height: '55px', 
                borderRadius: '50%', 
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
              }}
            >
              {getForecastIcon(forecast.status, fStyle.iconColor)}
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Wellness Forecast
              </h3>
              <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>
                {forecast.title}
              </p>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
            {forecast.description}
          </div>
          {forecast.recommendation && (
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)', 
              borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
              paddingTop: '8px',
              fontStyle: 'italic'
            }}>
              <strong>Coping Suggestion:</strong> {forecast.recommendation}
            </div>
          )}
        </div>

      </div>

      {/* Grid: Charts & Triggers */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }} className="responsive-dashboard-grid">
        
        {/* Chart Panel */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: getMetricColor(selectedChartMetric) }} />
              Wellness Trends (Last 7 Logs)
            </h3>
            
            {/* Chart toggle tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              {['stress', 'energy', 'motivation', 'focus'].map(metric => (
                <button
                  key={metric}
                  type="button"
                  onClick={() => setSelectedChartMetric(metric)}
                  style={{
                    background: selectedChartMetric === metric ? getMetricColor(metric) : 'transparent',
                    border: 'none',
                    color: selectedChartMetric === metric ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.72rem',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontWeight: '600',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '10px 0' }}>
            {renderSVGChart()}
          </div>
        </div>

        {/* Triggers Panel */}
        <div className="glass-card" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertCircle size={18} style={{ color: 'var(--amber)' }} />
            Stress Triggers Detected
          </h3>

          {topTriggers.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px 0' }}>
              No triggers detected yet. Share your stress in your daily journal to see what triggers your anxiety.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topTriggers.map((t, idx) => (
                <div 
                  key={idx} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderLeft: '3px solid var(--amber)'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{t.name}</span>
                  <span 
                    style={{ 
                      fontSize: '0.75rem', 
                      background: 'var(--amber-glow)', 
                      color: 'var(--amber)', 
                      padding: '2px 8px', 
                      borderRadius: '12px',
                      fontWeight: '600'
                    }}
                  >
                    {t.count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent History Section */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Calendar size={18} style={{ color: 'var(--primary)' }} />
          Recent Wellness Logs & AI Analyses
        </h3>

        {recentJournals.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <p>You haven't logged any thoughts or moods today.</p>
            <button className="btn-primary" onClick={() => onNavigateToTab('journal')} style={{ fontSize: '0.85rem' }}>
              Create First Journal
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentJournals.map((j) => {
              const isExpanded = expandedJournalId === j.timestamp;
              return (
                <div 
                  key={j.timestamp}
                  className="glass-card"
                  style={{ 
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(255,255,255,0.01)'
                  }}
                >
                  {/* Header summary line */}
                  <div 
                    onClick={() => setExpandedJournalId(isExpanded ? null : j.timestamp)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      cursor: 'pointer',
                      background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.2rem', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '50%' }}>
                        {j.isQuickLog ? '🏷️' : '📝'}
                      </span>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                          {j.isQuickLog ? 'Quick Tag Log' : 'Open Journal'} 
                          <span style={{ fontWeight: 'normal', color: 'var(--text-dark)', marginLeft: '8px' }}>
                            ({new Date(j.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })})
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                          <span 
                            style={{ 
                              fontSize: '0.75rem', 
                              color: getStressColor(j.stressLevel),
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Activity size={10} /> Stress Score: {j.stressLevel}/10
                          </span>
                          <span style={{ color: 'var(--text-dark)', fontSize: '0.75rem' }}>|</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {j.moodSentiment}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>

                  {/* Expanded AI Details */}
                  {isExpanded && (
                    <div style={{ padding: '18px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      
                      {/* Original Log */}
                      {j.originalText && (
                        <div>
                          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dark)', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Your Journal Entry
                          </h4>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic', background: 'rgba(0,0,0,0.15)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--primary)' }}>
                            "{j.originalText}"
                          </p>
                        </div>
                      )}

                      {/* Triggers */}
                      {j.detectedTriggers && j.detectedTriggers.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dark)', textTransform: 'uppercase', marginBottom: '6px' }}>
                            Stress Triggers Detected
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {j.detectedTriggers.map((t, idx) => (
                              <span 
                                key={idx} 
                                style={{ 
                                  fontSize: '0.75rem', 
                                  background: 'var(--amber-glow)', 
                                  color: 'var(--amber)', 
                                  border: '1px solid rgba(217, 119, 6, 0.3)',
                                  padding: '2px 8px', 
                                  borderRadius: '12px' 
                                }}
                              >
                                ⚠️ {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Coping Plan */}
                      <div>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dark)', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Tailored AI Coping Plan
                        </h4>
                        <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {j.copingStrategies.map((c, idx) => (
                            <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Encouragement */}
                      <div style={{ background: 'var(--emerald-glow)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--emerald)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={12} />
                          Empathetic Note
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                          {j.encouragement}
                        </p>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .responsive-dashboard-grid {
          grid-template-columns: 2fr 1fr;
        }
        @media (max-width: 900px) {
          .responsive-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 800px) {
          .forecast-streaks-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .hover-danger:hover {
          color: var(--rose) !important;
        }
      `}</style>
    </div>
  );
}

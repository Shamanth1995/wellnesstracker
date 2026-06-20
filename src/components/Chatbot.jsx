import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, AlertTriangle, Heart, Wind, LifeBuoy, UserCheck } from 'lucide-react';
import { getChatbotResponse } from '../services/aiEngine';

export default function Chatbot({ activeProfile }) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [chatState, setChatState] = useState({});
  const [showHelplines, setShowHelplines] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Initialize chatbot conversation
  useEffect(() => {
    // Clear chat on profile change or load initial welcome message
    const name = activeProfile?.name || 'Friend';
    const exam = activeProfile?.targetExam || 'Competitive Exams';

    setMessages([
      {
        id: 'welcome-1',
        sender: 'zenbuddy',
        text: [
          `Hi ${name}! I'm ZenBuddy, your digital wellness companion. 🧘`,
          `Preparing for the ${exam} is an immense challenge. It is completely normal to feel study anxiety, backlog stress, or burnout.`,
          `I'm here for you 24/7 to listen without judgement.`
        ],
        timestamp: new Date().toISOString()
      }
    ]);
    setChatState({});
  }, [activeProfile]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const studentMsg = inputVal.trim();
    setInputVal('');

    // Append student message
    const updatedMessages = [
      ...messages,
      {
        id: `msg-${Date.now()}-student`,
        sender: 'student',
        text: [studentMsg],
        timestamp: new Date().toISOString()
      }
    ];
    setMessages(updatedMessages);

    // Get response from AI Engine
    setTimeout(() => {
      const response = getChatbotResponse(studentMsg, updatedMessages, activeProfile, chatState);
      
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-zenbuddy`,
          sender: 'zenbuddy',
          text: response.reply,
          timestamp: new Date().toISOString()
        }
      ]);
      setChatState(response.state);

      // If user inputs severe stress words, prompt helplines automatically
      const severeWords = ['depressed', 'quit', 'worthless', 'suicidal', 'die', 'give up'];
      if (severeWords.some(w => studentMsg.toLowerCase().includes(w))) {
        setShowHelplines(true);
      }
    }, 600); // Small realistic delay
  };

  const handleQuickAction = (actionText) => {
    // Inject a simulated input
    setInputVal(actionText);
    // Submit it
    setTimeout(() => {
      const mockEvent = { preventDefault: () => {} };
      const submitBtn = document.getElementById('chat-submit-btn');
      submitBtn?.click();
    }, 100);
  };

  const handleReset = () => {
    if (confirm('Clear this chat conversation?')) {
      const name = activeProfile?.name || 'Friend';
      const exam = activeProfile?.targetExam || 'Competitive Exams';
      setMessages([
        {
          id: 'welcome-reset',
          sender: 'zenbuddy',
          text: [
            `Chat reset. I am ready to support you again, ${name}.`,
            `How can I help you today? You can assess your stress levels or practice deep breathing.`
          ],
          timestamp: new Date().toISOString()
        }
      ]);
      setChatState({});
    }
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: showHelplines ? '1fr 300px' : '1fr', gap: '20px', height: 'calc(100vh - 200px)', minHeight: '500px' }} className="chat-layout-grid">
      
      {/* Main Chat Panel */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* Chat Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '1.8rem', background: 'var(--primary-glow)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🤖
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>ZenBuddy Companion</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', background: 'var(--emerald)', borderRadius: '50%', display: 'inline-block' }}></span>
                Empathic digital listener
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn-secondary" 
              onClick={() => setShowHelplines(!showHelplines)} 
              style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px', borderColor: showHelplines ? 'var(--rose)' : 'var(--border-color)' }}
            >
              <LifeBuoy size={14} style={{ color: showHelplines ? 'var(--rose)' : 'var(--text-muted)' }} />
              Helplines
            </button>
            <button 
              className="btn-secondary" 
              onClick={handleReset} 
              style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
              title="Reset Chat"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Message History Scroller */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((m) => {
            const isZen = m.sender === 'zenbuddy';
            return (
              <div 
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: isZen ? 'flex-start' : 'flex-end',
                  width: '100%',
                  animation: 'fadeIn 0.25s ease-out'
                }}
              >
                <div 
                  style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: isZen 
                      ? '0px 16px 16px 16px' 
                      : '16px 16px 0px 16px',
                    background: isZen 
                      ? 'rgba(255, 255, 255, 0.03)' 
                      : 'linear-gradient(135deg, var(--primary), #4f46e5)',
                    border: isZen ? '1px solid var(--border-color)' : 'none',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {m.text.map((paragraph, idx) => (
                      <p 
                        key={idx} 
                        style={{ 
                          fontSize: '0.9rem', 
                          lineHeight: '1.45',
                          color: isZen ? 'var(--text-main)' : '#fff',
                          textAlign: 'left'
                        }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  <div 
                    style={{ 
                      fontSize: '0.68rem', 
                      color: isZen ? 'var(--text-dark)' : 'rgba(255,255,255,0.6)', 
                      marginTop: '6px', 
                      textAlign: 'right' 
                    }}
                  >
                    {new Date(m.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Prompts */}
        <div style={{ padding: '8px 16px', display: 'flex', gap: '8px', overflowX: 'auto', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
          <button 
            type="button"
            className="btn-secondary"
            onClick={() => handleQuickAction('Assess my stress level')}
            style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '15px', whiteSpace: 'nowrap', gap: '4px' }}
          >
            📊 Check Stress (GAD-7)
          </button>
          <button 
            type="button"
            className="btn-secondary"
            onClick={() => handleQuickAction('Calm me down')}
            style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '15px', whiteSpace: 'nowrap', gap: '4px' }}
          >
            🌬️ Guided Breathing
          </button>
          <button 
            type="button"
            className="btn-secondary"
            onClick={() => handleQuickAction('Help! I am burned out')}
            style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '15px', whiteSpace: 'nowrap', gap: '4px' }}
          >
            🤯 Study Burnout
          </button>
          <button 
            type="button"
            className="btn-secondary"
            onClick={() => handleQuickAction('I did poorly in a mock test')}
            style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '15px', whiteSpace: 'nowrap', gap: '4px' }}
          >
            📝 Mock Test Failure
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} style={{ display: 'flex', padding: '16px', background: 'rgba(0,0,0,0.15)', gap: '10px', borderTop: '1px solid var(--border-color)' }}>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={chatState.inAssessment ? "Type response number (1, 2, 3 or 4)..." : "Talk about exam backlogs, mock results, study stress..."}
            required
            autoComplete="off"
            style={{ flex: 1, padding: '12px 16px' }}
          />
          <button type="submit" id="chat-submit-btn" className="btn-primary" style={{ padding: '12px 20px' }}>
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Helplines Sidebar Panel */}
      {showHelplines && (
        <div className="glass-card fade-in" style={{ padding: '20px', overflowY: 'auto', border: '1px solid rgba(225,29,72,0.2)', background: 'linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(225,29,72,0.03) 100%)' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '12px' }}>
            <AlertTriangle size={18} />
            Student Help & Crisis Resources
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '16px', textAlign: 'left' }}>
            Preparation for national-level exams is intense, but please remember your health is the absolute priority. If you feel hopeless or experiencing extreme panic, contact:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Helpline 1 */}
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>AASRA Helpline (India)</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 'bold', margin: '4px 0' }}>+91-9820466726</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dark)' }}>24/7 Professional emotional support.</div>
            </div>

            {/* Helpline 2 */}
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>Vandrevala Foundation</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 'bold', margin: '4px 0' }}>+91-9999666555</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dark)' }}>Free, immediate student mental wellness counseling.</div>
            </div>

            {/* Helpline 3 */}
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>Global Helpline</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--rose)', fontWeight: 'bold', margin: '4px 0' }}>988 / 112</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dark)' }}>National suicide & crisis lifelines. Free & confidential.</div>
            </div>
          </div>
          
          <button 
            className="btn-secondary" 
            onClick={() => setShowHelplines(false)}
            style={{ width: '100%', marginTop: '16px', padding: '8px', fontSize: '0.8rem', justifyContent: 'center' }}
          >
            Close Helplines
          </button>
        </div>
      )}

      <style>{`
        .chat-layout-grid {
          display: grid;
          grid-template-columns: ${showHelplines ? '1fr 300px' : '1fr'};
        }
        @media (max-width: 900px) {
          .chat-layout-grid {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
        }
      `}</style>

    </div>
  );
}

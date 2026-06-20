import { useState, useEffect } from 'react';
import { Plus, Check, Trash2, ChevronDown } from 'lucide-react';

const AVATARS = ['🧠', '🧘', '📚', '🚀', '🌟', '🍀', '🌊', '🎨', '🏆', '🦁'];
const EXAMS = [
  'JEE (Engineering)',
  'NEET (Medical)',
  'UPSC (Civil Services)',
  'CAT (Management)',
  'GATE (Engineering/Science)',
  'CUET (University Entrance)',
  'Board Exams (10th/12th)',
  'Other Competitive Exam'
];

export default function ProfileSelector({ profiles, activeProfile, onSelectProfile, onCreateProfile, onDeleteProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newExam, setNewExam] = useState(EXAMS[0]);
  const [newAvatar, setNewAvatar] = useState(AVATARS[0]);

  // Escape key listener to close menu
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Security sanitization: strip non-alphanumeric/spaces
    const sanitizedName = newName.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    if (!sanitizedName) return;

    onCreateProfile({
      name: sanitizedName,
      targetExam: newExam,
      avatar: newAvatar
    });

    setNewName('');
    setIsAdding(false);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this profile? All its logs and chat history will be permanently erased.')) {
      onDeleteProfile(id);
    }
  };

  const handleKeyDown = (e, profileId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectProfile(profileId);
      setIsOpen(false);
    }
  };

  return (
    <div className="profile-selector-container" style={{ position: 'relative' }}>
      <button 
        type="button"
        className="btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Profile options"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <span style={{ fontSize: '1.4rem' }}>{activeProfile?.avatar || '👤'}</span>
        <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{activeProfile?.name || 'Create Profile'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeProfile?.targetExam || 'No Exam Selected'}</div>
        </div>
        <ChevronDown size={16} style={{ marginLeft: '4px', opacity: 0.7 }} aria-hidden="true" />
      </button>

      {isOpen && (
        <div 
          className="glass-card" 
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '320px',
            padding: '16px',
            zIndex: 100,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}
        >
          {!isAdding ? (
            <>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', fontFamily: 'var(--font-title)' }}>
                Switch Student Profile
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', marginBottom: '12px', paddingRight: '4px' }}>
                {profiles.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProfile(p.id);
                      setIsOpen(false);
                    }}
                    onKeyDown={(e) => handleKeyDown(e, p.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select student profile for ${p.name}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: p.id === activeProfile?.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: p.id === activeProfile?.id ? '1px solid var(--primary)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                    className="profile-item"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{p.avatar}</span>
                      <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.targetExam}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {p.id === activeProfile?.id && <Check size={16} style={{ color: 'var(--primary)' }} aria-hidden="true" />}
                      {profiles.length > 1 && (
                        <button 
                          type="button"
                          onClick={(e) => handleDelete(p.id, e)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-dark)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          className="delete-profile-btn"
                          aria-label={`Delete profile for ${p.name}`}
                          title="Delete Profile"
                        >
                          <Trash2 size={14} className="hover-danger" style={{ transition: 'color 0.2s' }} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => setIsAdding(true)}
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '8px' }}
              >
                <Plus size={14} aria-hidden="true" /> Add New Profile
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', fontFamily: 'var(--font-title)' }}>
                Create New Profile
              </h3>
              
              <div>
                <label htmlFor="new-profile-name">Name</label>
                <input 
                  type="text" 
                  id="new-profile-name"
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="e.g. Aarav Patel" 
                  required 
                  maxLength={25}
                  autoFocus
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label htmlFor="new-profile-exam">Target Exam</label>
                <select 
                  id="new-profile-exam"
                  value={newExam} 
                  onChange={(e) => setNewExam(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  {EXAMS.map(exam => (
                    <option key={exam} value={exam}>{exam}</option>
                  ))}
                </select>
              </div>

              <div>
                <label id="avatar-group-label">Select Companion Avatar</label>
                <div role="group" aria-labelledby="avatar-group-label" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {AVATARS.map(avatar => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setNewAvatar(avatar)}
                      aria-label={`Select companion avatar ${avatar}`}
                      style={{
                        fontSize: '1.4rem',
                        padding: '6px 0',
                        background: newAvatar === avatar ? 'var(--primary-glow)' : 'transparent',
                        border: newAvatar === avatar ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsAdding(false)}
                  style={{ flex: 1, padding: '8px', fontSize: '0.85rem', justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ flex: 1, padding: '8px', fontSize: '0.85rem', justifyContent: 'center' }}
                >
                  Create
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

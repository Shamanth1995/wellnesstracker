import { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, MessageSquarePlus, Activity, Heart } from 'lucide-react';
import ProfileSelector from './components/ProfileSelector';
import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import Chatbot from './components/Chatbot';
import CopingHub from './components/CopingHub';
import HealthSync from './components/HealthSync';

export default function App() {
  const [profiles, setProfiles] = useState(() => {
    const savedProfilesStr = localStorage.getItem('mindmirror_profiles');
    let loadedProfiles = [];
    if (savedProfilesStr) {
      try {
        loadedProfiles = JSON.parse(savedProfilesStr);
      } catch (e) {
        console.error('Error parsing profiles:', e);
      }
    }

    // If no profiles exist, create a default one
    if (loadedProfiles.length === 0) {
      const defaultProfile = {
        id: 'prof-default-' + Date.now(),
        name: 'Aarav Patel',
        targetExam: 'JEE (Engineering)',
        avatar: '🧠'
      };
      loadedProfiles = [defaultProfile];
      localStorage.setItem('mindmirror_profiles', JSON.stringify(loadedProfiles));
      localStorage.setItem('mindmirror_active_profile_id', defaultProfile.id);
    }
    return loadedProfiles;
  });

  const [activeProfileId, setActiveProfileId] = useState(() => {
    const savedActiveId = localStorage.getItem('mindmirror_active_profile_id');
    const savedProfilesStr = localStorage.getItem('mindmirror_profiles');
    let loadedProfiles = [];
    if (savedProfilesStr) {
      try {
        loadedProfiles = JSON.parse(savedProfilesStr);
      } catch {
        // Ignored
      }
    }
    if (loadedProfiles.length === 0) {
      return 'prof-default-' + Date.now();
    }
    return savedActiveId && loadedProfiles.some(p => p.id === savedActiveId)
      ? savedActiveId
      : loadedProfiles[0].id;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [journals, setJournals] = useState([]);

  // --- 2. Load Journals whenever Active Profile ID changes ---
  useEffect(() => {
    if (!activeProfileId) return;

    const savedJournalsStr = localStorage.getItem(`mindmirror_journals_${activeProfileId}`);
    let loadedJournals = [];
    if (savedJournalsStr) {
      try {
        loadedJournals = JSON.parse(savedJournalsStr);
      } catch (e) {
        console.error('Error parsing journals:', e);
      }
    }
    // Defer state update to avoid cascading renders warning
    setTimeout(() => {
      setJournals(loadedJournals);
    }, 0);
  }, [activeProfileId]);

  // --- 3. Profile Management handlers ---
  
  const handleSelectProfile = (id) => {
    setActiveProfileId(id);
    localStorage.setItem('mindmirror_active_profile_id', id);
    setActiveTab('dashboard'); // reset to dashboard on switch
  };

  const handleCreateProfile = (newProfData) => {
    const newProfile = {
      id: 'prof-' + Date.now(),
      ...newProfData
    };
    
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem('mindmirror_profiles', JSON.stringify(updatedProfiles));
    
    // Switch to new profile
    setActiveProfileId(newProfile.id);
    localStorage.setItem('mindmirror_active_profile_id', newProfile.id);
    setActiveTab('dashboard');
  };

  const handleDeleteProfile = (id) => {
    const updatedProfiles = profiles.filter(p => p.id !== id);
    setProfiles(updatedProfiles);
    localStorage.setItem('mindmirror_profiles', JSON.stringify(updatedProfiles));

    // Clear deleted profile logs
    localStorage.removeItem(`mindmirror_journals_${id}`);
    localStorage.removeItem(`mindmirror_chats_${id}`);

    // If active profile was deleted, switch to the first remaining
    if (activeProfileId === id) {
      const nextActiveId = updatedProfiles[0].id;
      setActiveProfileId(nextActiveId);
      localStorage.setItem('mindmirror_active_profile_id', nextActiveId);
    }
  };

  // --- 4. Journal analysis logs handlers ---
  
  const handleLogCreated = (newLog) => {
    const updatedLogs = [newLog, ...journals];
    setJournals(updatedLogs);
    localStorage.setItem(`mindmirror_journals_${activeProfileId}`, JSON.stringify(updatedLogs));
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  // Render navigation-specific screen
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            activeProfile={activeProfile} 
            journals={journals} 
            onNavigateToTab={setActiveTab} 
          />
        );
      case 'journal':
        return (
          <Journal 
            activeProfile={activeProfile} 
            onLogCreated={handleLogCreated} 
            onGoToDashboard={() => setActiveTab('dashboard')}
          />
        );
      case 'chat':
        return (
          <Chatbot 
            activeProfile={activeProfile} 
          />
        );
      case 'coping':
        return (
          <CopingHub />
        );
      case 'health':
        return (
          <HealthSync 
            activeProfile={activeProfile} 
            journals={journals} 
          />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="app-container">
      {/* Header Panel */}
      <header>
        <div className="logo-section">
          <div className="logo-icon">
            <Heart size={20} style={{ color: '#fff' }} aria-hidden="true" />
          </div>
          <div>
            <h1>MindMirror</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Student Wellness Companion
            </p>
          </div>
        </div>

        {/* Profile Switcher widget */}
        <div className="header-actions">
          <ProfileSelector 
            profiles={profiles}
            activeProfile={activeProfile}
            onSelectProfile={handleSelectProfile}
            onCreateProfile={handleCreateProfile}
            onDeleteProfile={handleDeleteProfile}
          />
        </div>
      </header>

      {/* Main Nav Tabs bar */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
        <div className="nav-tabs" role="tablist" aria-label="MindMirror Navigation Tabs">
          <button 
            type="button"
            role="tab"
            id="tab-dashboard"
            aria-selected={activeTab === 'dashboard'}
            aria-controls="main-tab-panel"
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={16} aria-hidden="true" /> Dashboard
          </button>
          <button 
            type="button"
            role="tab"
            id="tab-journal"
            aria-selected={activeTab === 'journal'}
            aria-controls="main-tab-panel"
            className={`nav-tab ${activeTab === 'journal' ? 'active' : ''}`}
            onClick={() => setActiveTab('journal')}
          >
            <BookOpen size={16} aria-hidden="true" /> Daily Journal
          </button>
          <button 
            type="button"
            role="tab"
            id="tab-chat"
            aria-selected={activeTab === 'chat'}
            aria-controls="main-tab-panel"
            className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquarePlus size={16} aria-hidden="true" /> ZenBuddy Chat
          </button>
          <button 
            type="button"
            role="tab"
            id="tab-coping"
            aria-selected={activeTab === 'coping'}
            aria-controls="main-tab-panel"
            className={`nav-tab ${activeTab === 'coping' ? 'active' : ''}`}
            onClick={() => setActiveTab('coping')}
          >
            <Activity size={16} aria-hidden="true" /> Coping Hub
          </button>
          <button 
            type="button"
            role="tab"
            id="tab-health"
            aria-selected={activeTab === 'health'}
            aria-controls="main-tab-panel"
            className={`nav-tab ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => setActiveTab('health')}
          >
            <Heart size={16} aria-hidden="true" /> Health Sync
          </button>
        </div>
      </div>

      {/* Primary Tab View Panel */}
      <main className="main-content" id="main-tab-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {renderTabContent()}
      </main>

      {/* Footer footer-text */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '20px 0', textAlign: 'center', color: 'var(--text-dark)', fontSize: '0.78rem', marginTop: 'auto' }}>
        <p>© 2026 MindMirror. Built with care for students. All emotional logs are stored 100% locally on your browser.</p>
      </footer>
    </div>
  );
}

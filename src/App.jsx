import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, MessageSquarePlus, Activity, User, Heart } from 'lucide-react';
import ProfileSelector from './components/ProfileSelector';
import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import Chatbot from './components/Chatbot';
import CopingHub from './components/CopingHub';

export default function App() {
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [journals, setJournals] = useState([]);

  // --- 1. Load Profiles & Init default profile on mount ---
  useEffect(() => {
    const savedProfilesStr = localStorage.getItem('mindmirror_profiles');
    const savedActiveId = localStorage.getItem('mindmirror_active_profile_id');

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
      setProfiles(loadedProfiles);
      setActiveProfileId(defaultProfile.id);
    } else {
      setProfiles(loadedProfiles);
      // Fallback active profile id if none or invalid
      const activeId = savedActiveId && loadedProfiles.some(p => p.id === savedActiveId)
        ? savedActiveId
        : loadedProfiles[0].id;
      setActiveProfileId(activeId);
      localStorage.setItem('mindmirror_active_profile_id', activeId);
    }
  }, []);

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
    setJournals(loadedJournals);
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
            <Heart size={20} style={{ color: '#fff' }} />
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
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button 
            className={`nav-tab ${activeTab === 'journal' ? 'active' : ''}`}
            onClick={() => setActiveTab('journal')}
          >
            <BookOpen size={16} /> Daily Journal
          </button>
          <button 
            className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquarePlus size={16} /> ZenBuddy Chat
          </button>
          <button 
            className={`nav-tab ${activeTab === 'coping' ? 'active' : ''}`}
            onClick={() => setActiveTab('coping')}
          >
            <Activity size={16} /> Coping Hub
          </button>
        </div>
      </div>

      {/* Primary Tab View Panel */}
      <main className="main-content">
        {renderTabContent()}
      </main>

      {/* Footer footer-text */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '20px 0', textAlign: 'center', color: 'var(--text-dark)', fontSize: '0.78rem', marginTop: 'auto' }}>
        <p>© 2026 MindMirror. Built with care for students. All emotional logs are stored 100% locally on your browser.</p>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import EventCard from './components/EventCard';
import EventProposalForm from './components/EventProposalForm';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import UserLogin from './components/UserLogin';
import UserDashboard from './components/UserDashboard';
import LegalDisclaimerModal from './components/LegalDisclaimerModal';
import { Event, EventProposal } from './types/Event';
import api, { getAuthToken } from "./api";

function App() {
  const LEGAL_DISCLAIMER_KEY = 'secure_events_legal_disclaimer_v1';

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'events' | 'propose' | 'login' | 'admin-login' | 'admin-events' | 'dashboard'>('login');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [proposals, setProposals] = useState<EventProposal[]>([]);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [showLegalDisclaimer, setShowLegalDisclaimer] = useState(false);
  const [postDisclaimerView, setPostDisclaimerView] = useState<'events' | 'admin-events'>('events');

  useEffect(() => {
    const init = async () => {
      const token = getAuthToken();

      if (!token) {
        setCurrentView('login');
        setIsInitializing(false);
        return;
      }

      try {
        const data = await api.auth.me();
        setCurrentUser(data.user);

        const needsDisclaimer = localStorage.getItem(LEGAL_DISCLAIMER_KEY) !== 'accepted';

        if (data.user.role === 'admin') {
          setIsAdmin(true);
          setIsAdminAuthenticated(true);
          setPostDisclaimerView('admin-events');

          if (needsDisclaimer) {
            setShowLegalDisclaimer(true);
            setCurrentView('admin-login');
          } else {
            // ✅ Redirection auto admin après refresh
            setCurrentView('admin-events');
            loadProposals();
          }
        } else {
          setIsUserAuthenticated(true);
          setPostDisclaimerView('events');

          if (needsDisclaimer) {
            setShowLegalDisclaimer(true);
          }

          // ✅ Redirection auto user après refresh
          setCurrentView('events');
        }

        await loadEvents();
      } catch (error) {
        console.error("Auth error:", error);
        sessionStorage.removeItem("auth_token");
        setCurrentView('login');
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await api.events.list();
      const list = Array.isArray(response) ? response : (response?.events || []);
      setEvents(list);
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
    }
  };

  const loadProposals = async () => {
    try {
      const proposalsList = await api.proposals.list();
      setProposals(Array.isArray(proposalsList) ? proposalsList : []);
    } catch (error) {
      console.error('Failed to load proposals:', error);
    }
  };

  const handleUserLogin = () => {
    setIsAdmin(false);
    setIsAdminAuthenticated(false);
    setIsUserAuthenticated(true);

    const needsDisclaimer = localStorage.getItem(LEGAL_DISCLAIMER_KEY) !== 'accepted';
    setPostDisclaimerView('events');

    if (needsDisclaimer) {
      setShowLegalDisclaimer(true);
      setCurrentView('login');
      return;
    }

    setCurrentView('events');
  };

  const handleToggleAdmin = () => {
    if (isAdmin) {
      setIsAdmin(false);
      setIsAdminAuthenticated(true);
      setCurrentView('events');
    } else {
      setIsAdmin(true);
      setCurrentView('admin-login');
    }
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
    setIsAdminAuthenticated(true);
    setIsUserAuthenticated(false);

    const needsDisclaimer = localStorage.getItem(LEGAL_DISCLAIMER_KEY) !== 'accepted';
    setPostDisclaimerView('admin-events');

    if (needsDisclaimer) {
      setShowLegalDisclaimer(true);
      setCurrentView('admin-login');
      return;
    }

    setCurrentView('admin-events');
    loadProposals();
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view as any);
    if (view === 'admin-proposals') {
      loadProposals();
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }

    sessionStorage.removeItem("auth_token");

    setIsAdmin(false);
    setIsAdminAuthenticated(false);
    setIsUserAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('login');
  };

  const handleAcceptLegalDisclaimer = () => {
    localStorage.setItem(LEGAL_DISCLAIMER_KEY, 'accepted');
    setShowLegalDisclaimer(false);
    setCurrentView(postDisclaimerView);

    if (postDisclaimerView === 'admin-events') {
      loadProposals();
    }
  };

  const handleDeclineLegalDisclaimer = () => {
    sessionStorage.removeItem("auth_token");
    setIsAdmin(false);
    setIsAdminAuthenticated(false);
    setIsUserAuthenticated(false);
    setCurrentUser(null);
    setShowLegalDisclaimer(false);
    setCurrentView('login');
  };

  const renderContent = () => {
    if (isInitializing) {
      return (
        <div className="flex justify-center items-center py-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (isAdmin && !isAdminAuthenticated && currentView === 'admin-login') {
      return <AdminLogin onLogin={handleAdminLogin} />;
    }

    if (isAdmin && isAdminAuthenticated) {
      return (
        <AdminDashboard
          currentView={currentView}
          events={events}
          proposals={proposals}
        />
      );
    }

    if (currentView === 'login') {
      return <UserLogin onUserLogin={handleUserLogin} />;
    }

    if (currentView === 'dashboard') {
      return <UserDashboard onBackToEvents={() => setCurrentView('events')} />;
    }

    if (currentView === 'propose') {
      return <EventProposalForm onSubmit={() => { }} />;
    }

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {events.map(event => (
          <EventCard key={event.id} event={event} onRefresh={loadEvents} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LegalDisclaimerModal
        isOpen={showLegalDisclaimer}
        onAccept={handleAcceptLegalDisclaimer}
        onDecline={handleDeclineLegalDisclaimer}
      />

      {!isInitializing && currentView !== 'login' && currentView !== 'admin-login' && (
        <Header
          isAdmin={isAdminAuthenticated}
          currentView={currentView}
          onViewChange={handleViewChange}
          onToggleAdmin={handleToggleAdmin}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onLogout={handleLogout}
          isAuthenticated={isUserAuthenticated || isAdminAuthenticated}
        />
      )}

      <main>{renderContent()}</main>
    </div>
  );
}

export default App;
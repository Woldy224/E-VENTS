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
  // Default to the login/registration screen so users authenticate before seeing the home page.
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
    const token = getAuthToken();

    if (token) {
      api.auth.me()
        .then(data => {
          setCurrentUser(data.user);

          const needsDisclaimer = localStorage.getItem(LEGAL_DISCLAIMER_KEY) !== 'accepted';

          if (data.user.role === 'admin') {
            setIsAdmin(true);
            setIsAdminAuthenticated(true);
            setPostDisclaimerView('admin-events');

            if (needsDisclaimer) {
              setShowLegalDisclaimer(true);
              // keep view minimal behind modal
              setCurrentView('admin-login');
            } else {
              setCurrentView('admin-events');
            }
          } else {
            setIsUserAuthenticated(true);
            setPostDisclaimerView('events');

            if (needsDisclaimer) {
              setShowLegalDisclaimer(true);
              setCurrentView('events');
            } else {
              setCurrentView('events');
            }
          }
        })
        .catch(() => {
          sessionStorage.removeItem("auth_token");
          setCurrentView('login');
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      // No saved session -> show login
      setCurrentView('login');
      setIsInitializing(false);
    }

    loadEvents();
  }, []);


  const loadEvents = async () => {
    try {
      const response = await api.events.list();
      // API may return { events: [...] } or an array
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
      setProposals(proposalsList);
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

  const handleCreateEvent = async (eventData: Omit<Event, 'id' | 'soldTickets' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await api.events.create(eventData);
      setEvents(prev => [...prev, response.event]);
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event');
    }
  };

  const handleUpdateEvent = async (eventId: string, eventData: Omit<Event, 'id' | 'soldTickets' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await api.events.update(eventId, eventData);
      setEvents(prev =>
        prev.map(event =>
          event.id === eventId ? response.event : event
        )
      );
    } catch (error) {
      console.error('Failed to update event:', error);
      alert('Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await api.events.delete(eventId);
        setEvents(prev => prev.filter(event => event.id !== eventId));
      } catch (error) {
        console.error('Failed to delete event:', error);
        alert('Failed to delete event');
      }
    }
  };

  const handleResetTickets = async (eventId?: string) => {
    const confirmMsg = eventId 
      ? "Voulez-vous vraiment remettre à zéro le nombre de billets vendus pour cet événement ?"
      : "Voulez-vous vraiment remettre à zéro le nombre de billets vendus pour tous les événements ?";
      
    if (confirm(confirmMsg)) {
      try {
        await api.events.resetTickets(eventId);
        loadEvents();
        alert('Le nombre de billets vendus a été réinitialisé.');
      } catch (error) {
        console.error('Failed to reset tickets:', error);
        alert('Échec de la réinitialisation.');
      }
    }
  };

  const handleSubmitProposal = async (proposalData: Omit<EventProposal, 'id' | 'status' | 'submittedAt'>) => {
    try {
      await api.proposals.submit(proposalData);
      alert('Merci! Votre proposition a été soumise.');
    } catch (error) {
      console.error('Failed to submit proposal:', error);
      alert('Failed to submit proposal');
    }
  };

  const handleApproveProposal = async (proposalId: string) => {
    try {
      const response = await api.proposals.approve(proposalId);

      setEvents(prev => [...prev, response.event]);

      setProposals(prev =>
        prev.map(p =>
          p.id === proposalId ? { ...p, status: 'approved' as const } : p
        )
      );
    } catch (error) {
      console.error('Failed to approve proposal:', error);
      alert('Failed to approve proposal');
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    if (confirm('Are you sure you want to reject this proposal?')) {
      try {
        await api.proposals.reject(proposalId);

        setProposals(prev =>
          prev.map(p =>
            p.id === proposalId ? { ...p, status: 'rejected' as const } : p
          )
        );
      } catch (error) {
        console.error('Failed to reject proposal:', error);
        alert('Failed to reject proposal');
      }
    }
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
          onCreateEvent={handleCreateEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
          onResetTickets={handleResetTickets}
          onApproveProposal={handleApproveProposal}
          onRejectProposal={handleRejectProposal}
        />
      );
    }

    if (currentView === 'propose') {
      return <EventProposalForm onSubmit={handleSubmitProposal} />;
    }

    if (currentView === 'login') {
      return (
        <UserLogin
          onUserLogin={handleUserLogin}
        />
      );
    }

    if (currentView === 'dashboard') {
      return <UserDashboard onBackToEvents={() => setCurrentView('events')} />;
    }

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white pt-16 sm:pt-20 pb-12 sm:pb-16 mb-16 rounded-[2.5rem] shadow-sm border border-blue-100/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-5xl md:text-6xl font-extrabold font-heading text-gray-900 tracking-tight mb-6">
              Vivez les <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Meilleurs</span> Événements
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-sans">
              Trouvez, réservez et participez aux rencontres les plus passionnantes près de chez vous.
              Votre prochaine aventure commence ici.
            </p>
          </div>

          <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 hidden md:block" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 hidden md:block" />
        </div>

        {events.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🗓️</span>
            </div>
            <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">Aucun événement</h3>
            <p className="text-gray-500">Revenez plus tard pour découvrir de nouvelles expériences !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map(event => (
              <EventCard key={event.id} event={event} onRefresh={loadEvents} />
            ))}
          </div>
        )}
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
      {!isInitializing && (isUserAuthenticated || isAdminAuthenticated || !!currentUser) && (
        <Header
          isAdmin={isAdminAuthenticated || (currentUser?.role === 'admin')}
          currentView={currentView}
          onViewChange={handleViewChange}
          onToggleAdmin={handleToggleAdmin}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onLogout={handleLogout}
          isAuthenticated={isUserAuthenticated || isAdminAuthenticated || !!currentUser}
        />
      )}

      <main>{renderContent()}</main>

      {!isInitializing && (isUserAuthenticated || isAdminAuthenticated || !!currentUser) && (
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center text-gray-600">
              <p>
                &copy; 2025 AYITI EVENTS. Tous droits réservés.
                Une plateforme développée par DAMCO. Toute reproduction ou utilisation non autorisée est strictement interdite.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;

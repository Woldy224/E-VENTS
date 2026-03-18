import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, TrendingUp, Users, Calendar } from 'lucide-react';
import { Event, EventProposal } from '../types/Event';
import EventCard from './EventCard';
import EventForm from './EventForm';
import CurrencyConverter from './CurrencyConverter';

interface AdminDashboardProps {
  currentView: string;
  events: Event[];
  proposals: EventProposal[];
  onCreateEvent: (eventData: Omit<Event, 'id' | 'soldTickets' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEvent: (eventId: string, eventData: Omit<Event, 'id' | 'soldTickets' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteEvent: (eventId: string) => void;
  onResetTickets: () => void;
  onApproveProposal: (proposalId: string) => void;
  onRejectProposal: (proposalId: string) => void;
}

export default function AdminDashboard({
  currentView,
  events,
  proposals,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onResetTickets,
  onApproveProposal,
  onRejectProposal
}: AdminDashboardProps) {
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  const safeEvents = Array.isArray(events) ? events : [];
  const safeProposals = Array.isArray(proposals) ? proposals : [];

  const totalRevenue = safeEvents.reduce((sum, event) => sum + (event.soldTickets * event.price), 0);
  const totalTicketsSold = safeEvents.reduce((sum, event) => sum + event.soldTickets, 0);
  const pendingProposals = safeProposals.filter(p => p.status === 'pending').length;

  const filteredEvents = safeEvents.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProposals = safeProposals.filter(proposal =>
    proposal.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleFormSubmit = (eventData: Omit<Event, 'id' | 'soldTickets' | 'createdAt' | 'updatedAt'>) => {
    if (editingEvent) {
      onUpdateEvent(editingEvent.id, eventData);
    } else {
      onCreateEvent(eventData);
    }
    setShowEventForm(false);
    setEditingEvent(undefined);
  };

  const handleFormClose = () => {
    setShowEventForm(false);
    setEditingEvent(undefined);
  };

  if (currentView === 'admin-events') {
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTicketsSold}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Events</p>
                  <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Currency Converter Section for Admin */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-3"></span>
              Gestion des Devises
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20 flex flex-col justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-2">Revenu Total (USD)</p>
                  <p className="text-4xl font-black font-heading">${totalRevenue.toFixed(2)}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-500/50">
                  <p className="text-blue-100 text-xs italic">Utilisez le convertisseur à droite pour estimer les revenus dans d'autres devises.</p>
                </div>
              </div>
              <div className="sm:mt-0">
                <CurrencyConverter initialUSD={totalRevenue} />
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-900 font-heading">Manage Events</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={onResetTickets}
                className="group flex items-center px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl hover:bg-amber-600 hover:text-white transition-all duration-300 font-semibold shadow-sm hover:shadow-amber-200"
                title="Remettre à zéro les tickets vendus"
              >
                <div className="bg-amber-100 text-amber-600 p-1.5 rounded-lg mr-2 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  🔄
                </div>
                Remise à zéro (Tickets)
              </button>
              <button
                onClick={() => setShowEventForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-semibold shadow-sm hover:shadow-blue-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first event.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowEventForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Event
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isAdmin={true}
                  onEdit={handleEditEvent}
                  onDelete={onDeleteEvent}
                  onReset={onResetTickets}
                />
              ))}
            </div>
          )}
        </div>

        {showEventForm && (
          <EventForm
            event={editingEvent}
            onClose={handleFormClose}
            onSubmit={handleFormSubmit}
          />
        )}
      </>
    );
  }

  if (currentView === 'admin-proposals') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Event Proposals</h1>
            <p className="text-gray-600 mt-1">
              {pendingProposals} pending proposal{pendingProposals !== 1 ? 's' : ''} awaiting review
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Proposals List */}
        {filteredProposals.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms.' : 'No event proposals have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProposals.map((proposal) => (
              <div key={proposal.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{proposal.eventName}</h3>
                      <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4">{proposal.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Date & Time</p>
                        <p className="text-sm text-gray-600">
                          {new Date(`${proposal.date}T${proposal.time}`).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Tickets</p>
                        <p className="text-sm text-gray-600">{proposal.numberOfTickets}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Price</p>
                        <p className="text-sm text-gray-600">${proposal.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Couverture</p>
                        <p className="text-sm text-gray-600">{proposal.mediaCoverageRequested ? 'Oui' : 'Non'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Contact</p>
                        <p className="text-sm text-gray-600">{proposal.contactName}</p>
                        <p className="text-sm text-gray-600 truncate">{proposal.contactEmail}</p>
                      </div>
                    </div>
                  </div>

                  {proposal.status === 'pending' && (
                    <div className="flex space-x-3 mt-4 lg:mt-0 lg:ml-6">
                      <button
                        onClick={() => onApproveProposal(proposal.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onRejectProposal(proposal.id)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /*if (currentView === 'admin-sales') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sales Reports</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sales Reporting System</h3>
            <p className="text-gray-600 mb-6">
              Automated email reports will be sent to event owners daily and after each event completion.
              This feature requires backend integration with email services.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
              <h4 className="font-medium text-blue-900 mb-3">Report Features (To Be Implemented):</h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Daily sales summaries sent via email</li>
                <li>• Post-event detailed reports with attendee information</li>
                <li>• Revenue analytics and ticket sales trends</li>
                <li>• CSV exports for accounting and record-keeping</li>
                <li>• Customizable report schedules and recipients</li>
              </ul>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Backend Integration Required:</strong> Email reporting functionality needs server-side 
                implementation with services like SendGrid, Amazon SES, or similar email providers.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }*/

  return null;
}
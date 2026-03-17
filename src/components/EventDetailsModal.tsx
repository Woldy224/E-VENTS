import { X, Calendar, Clock, MapPin, Users, ShoppingCart, Tag } from 'lucide-react';
import { Event } from '../types/Event';
import Countdown from './Countdown';

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
  onPurchaseClick: () => void;
  isAdmin?: boolean;
}

export default function EventDetailsModal({ event, onClose, onPurchaseClick, isAdmin }: EventDetailsModalProps) {
  const availableTickets = event.totalTickets - event.soldTickets;
  const soldOutPercentage = event.totalTickets > 0 ? (event.soldTickets / event.totalTickets) * 100 : 0;

  const formatDate = (dateStr: string, timeStr: string) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    return {
      date: date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const { date, time } = formatDate(event.date, event.time);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
      <div 
        className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors shadow-sm backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative h-72 sm:h-96 w-full bg-gray-100">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center text-blue-200">
              <Calendar className="w-24 h-24 opacity-50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80" />
          
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white leading-tight drop-shadow-lg">
              {event.title}
            </h2>
            <div className="shrink-0 hidden sm:block">
              <Countdown date={event.date} time={event.time} />
            </div>
          </div>
        </div>
        
        <div className="sm:hidden -mt-8 relative z-10 flex justify-center w-full px-4 mb-6">
          <Countdown date={event.date} time={event.time} />
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-heading mb-3 flex items-center">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-3"></span>
                  À propos de cet événement
                </h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>

              <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-4 font-heading">Lieu & Horaires</h4>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mr-4 shrink-0 text-blue-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Date</p>
                      <p className="text-gray-900 font-medium capitalize">{date}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mr-4 shrink-0 text-indigo-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Heure</p>
                      <p className="text-gray-900 font-medium">{time}</p>
                    </div>
                  </div>
                  {event.location && (
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mr-4 shrink-0 text-purple-600">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Lieu</p>
                        <p className="text-gray-900 font-medium">{event.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="mb-6">
                  <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Prix du billet</span>
                  <div className="text-4xl font-extrabold text-gray-900 font-heading mt-1">
                    ${event.price.toFixed(2)}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="flex items-center text-gray-600"><Users className="w-4 h-4 mr-1.5" /> Disponibilité</span>
                    <span className="text-gray-900">{availableTickets} / {event.totalTickets}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${soldOutPercentage > 90 ? 'bg-red-500' : soldOutPercentage > 75 ? 'bg-orange-500' : 'bg-blue-600'}`}
                      style={{ width: `${soldOutPercentage}%` }}
                    ></div>
                  </div>
                  {availableTickets < 20 && availableTickets > 0 && (
                    <p className="text-orange-500 text-xs font-semibold mt-2 flex items-center">
                      <Tag className="w-3 h-3 mr-1" /> Vite ! Plus que {availableTickets} billets.
                    </p>
                  )}
                </div>

                {!isAdmin && (
                  <button
                    onClick={() => {
                      onClose();
                      onPurchaseClick();
                    }}
                    disabled={availableTickets === 0}
                    className={`w-full flex items-center justify-center px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl ${
                      availableTickets === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-indigo-500/30 transform hover:-translate-y-1'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2 -ml-2" />
                    {availableTickets === 0 ? 'Complet' : 'Acheter un Ticket'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

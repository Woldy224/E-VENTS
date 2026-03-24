import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, ShoppingCart } from 'lucide-react';
import { Event } from '../types/Event';
import TicketPurchaseModal from './TicketPurchaseModal';
import api from '../api';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import Countdown from './Countdown';
import EventDetailsModal from './EventDetailsModal';

interface EventCardProps {
  event: Event;
  isAdmin?: boolean;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onReset?: (eventId: string) => void;
  onRefresh?: () => void;
}

export default function EventCard({ event, isAdmin, onEdit, onDelete, onReset, onRefresh }: EventCardProps) {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const availableTickets = event.totalTickets - event.soldTickets;
  const soldOutPercentage = event.totalTickets > 0 ? (event.soldTickets / event.totalTickets) * 100 : 0;

  const formatDate = (dateStr: string, timeStr: string) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    return {
      date: date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const { date, time } = formatDate(event.date, event.time);

  const handlePurchase = async (purchase: { 
    buyerName: string; 
    buyerEmail: string; 
    buyerPhone?: string; 
    quantity: number;
    paymentMethod: string;
    paymentProof?: string;
  }) => {
    try {
      const response = await api.tickets.purchase({
        eventId: event.id,
        quantity: purchase.quantity,
        buyerName: purchase.buyerName,
        buyerEmail: purchase.buyerEmail,
        buyerPhone: purchase.buyerPhone,
        paymentMethod: purchase.paymentMethod,
        paymentProof: purchase.paymentProof
      });

      setShowPurchaseModal(false);

      if (onRefresh) {
        onRefresh();
      }

      alert('Achat enregistré ! Votre billet sera disponible au téléchargement une fois le paiement validé par l\'administrateur. Veuillez vérifier votre tableau de bord.');
    } catch (err: any) {
      console.error('Erreur achat billet:', err);
      alert(err.message || 'Une erreur est survenue lors de l\'achat.');
    }
  };

  return (
    <>
      <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full font-sans cursor-pointer" onClick={() => setShowDetailsModal(true)}>
        <div className="relative h-56 overflow-hidden bg-gray-100">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10 scale-90 sm:scale-100" onClick={(e) => e.stopPropagation()}>
            <Countdown date={event.date} time={event.time} />
          </div>
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold font-heading text-gray-900 leading-tight group-hover:text-blue-600 transition-colors flex-1 pr-2 line-clamp-2 cursor-pointer" onClick={() => setShowDetailsModal(true)}>{event.title}</h3>
            {isAdmin && (
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => onEdit?.(event)}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => onReset?.(event.id)}
                  className="text-amber-600 hover:text-amber-800 font-medium text-sm"
                >
                  Reset
                </button>
                <button
                  onClick={() => onDelete?.(event.id)}
                  className="text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-500 mb-5 line-clamp-3 leading-relaxed text-sm">{event.description}</p>

          <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center text-sm text-gray-600 font-medium">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-600">
                <Calendar className="h-4 w-4" />
              </div>
              {date}
            </div>
            <div className="flex items-center text-sm text-gray-600 font-medium">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 text-indigo-600">
                <Clock className="h-4 w-4" />
              </div>
              {time}
            </div>
            {event.location && (
              <div className="flex items-center text-sm text-gray-600 font-medium">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 text-purple-600">
                  <MapPin className="h-4 w-4" />
                </div>
                {event.location}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Disponibilité</span>
              <div className="flex items-center text-sm text-gray-700 font-medium">
                <Users className="h-4 w-4 mr-1.5 text-blue-500" />
                {availableTickets} / {event.totalTickets} billets
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold block mb-1">Prix</span>
              <div className="text-2xl font-bold font-heading text-gray-900">
                ${event.price.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${soldOutPercentage > 90 ? 'bg-red-500' : soldOutPercentage > 75 ? 'bg-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
              style={{ width: `${soldOutPercentage}%` }}
            ></div>
          </div>

          <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
            {!isAdmin && (
              <button
                onClick={() => setShowPurchaseModal(true)}
                disabled={availableTickets === 0}
                className={`w-full flex items-center justify-center px-5 py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-md transform hover:-translate-y-0.5 ${availableTickets === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-indigo-500/25'
                  }`}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {availableTickets === 0 ? 'Sold Out' : 'Acheter le Ticket'}
              </button>
            )}
            <button
              onClick={() => setShowDetailsModal(true)}
              className="mt-3 w-full flex items-center justify-center px-4 py-2.5 rounded-lg font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              Voir les détails
            </button>
          </div>
        </div>
      </div>

      {showDetailsModal && (
        <EventDetailsModal
          event={event}
          onClose={() => setShowDetailsModal(false)}
          onPurchaseClick={() => {
            setShowDetailsModal(false);
            setShowPurchaseModal(true);
          }}
          isAdmin={isAdmin}
        />
      )}

      {showPurchaseModal && (
        <TicketPurchaseModal
          event={event}
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={handlePurchase}
        />
      )}
    </>
  );
}

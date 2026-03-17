import React, { useState } from 'react';
import { X, ShoppingCart, User, Mail, Phone, Minus, Plus } from 'lucide-react';
import { Event } from '../types/Event';

interface TicketPurchaseModalProps {
  event: Event;
  onClose: () => void;
  onPurchase: (purchase: { buyerName: string; buyerEmail: string; buyerPhone?: string; quantity: number }) => void;
}

export default function TicketPurchaseModal({ event, onClose, onPurchase }: TicketPurchaseModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [buyerInfo, setBuyerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTickets = event.totalTickets - event.soldTickets;
  const totalAmount = quantity * event.price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (buyerInfo.name && buyerInfo.email) {
      setIsSubmitting(true);
      try {
        await onPurchase({
          quantity,
          buyerName: buyerInfo.name,
          buyerEmail: buyerInfo.email,
          buyerPhone: buyerInfo.phone || undefined
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const updateQuantity = (change: number) => {
    const newQuantity = Math.max(1, Math.min(availableTickets, quantity + change));
    setQuantity(newQuantity);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Acheter le ticket</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
            <p className="text-sm text-gray-600">{new Date(`${event.date}T${event.time}`).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">${event.price.toFixed(2)} per ticket</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantité(s)
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => updateQuantity(-1)}
                disabled={quantity <= 1}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(1)}
                disabled={quantity >= availableTickets}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {availableTickets} Quantités Disponibles
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <h4 className="font-medium text-gray-900">Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom Complet *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={buyerInfo.name}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, name: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Valide *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={buyerInfo.email}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={buyerInfo.phone}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, phone: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Espace réservé pour l'intégration du paiement</h4>
            <p className="text-sm text-yellow-700">
              Le traitement des paiements sera intégré ici. Cela inclura le traitement sécurisé des cartes bancaires, la confirmation du paiement et la génération automatique de billets avec des codes QR.
            </p>
          </div>

          <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-900">Total Amount:</span>
            <span className="text-xl font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Traitement...' : 'Acheter'}
          </button>
        </form>
      </div>
    </div>
  );
}

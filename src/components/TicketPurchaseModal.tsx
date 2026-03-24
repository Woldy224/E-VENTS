import React, { useState } from 'react';
import { X, ShoppingCart, User, Mail, Phone, CheckCircle, Minus, Plus } from 'lucide-react';
import QRCode from 'qrcode';
import { Event } from '../types/Event';

interface TicketPurchaseModalProps {
  event: Event;
  onClose: () => void;
  onPurchase: (purchase: {
    buyerName: string;
    buyerEmail: string;
    buyerPhone?: string;
    quantity: number;
    paymentMethod: string;
    paymentProof?: string;
  }) => void;
}

export default function TicketPurchaseModal({ event, onClose, onPurchase }: TicketPurchaseModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [buyerInfo, setBuyerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'moncash' | 'natcash'>('card');
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  React.useEffect(() => {
    const generatePaymentQR = async () => {
      if (paymentMethod === 'card') return;

      // You can replace these with your actual MonCash/NatCash merchant IDs or phone numbers
      const moncashData = "moncash://pay?id=00000000&name=AyitiEvents";
      const natcashData = "natcash://transfer?id=00000000";

      const data = paymentMethod === 'moncash' ? moncashData : natcashData;

      try {
        const url = await QRCode.toDataURL(data, {
          width: 400,
          margin: 2,
          color: {
            dark: paymentMethod === 'moncash' ? '#ef4444' : '#f97316', // Red-500 for MonCash, Orange-500 for NatCash
            light: '#ffffff'
          }
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };

    generatePaymentQR();
  }, [paymentMethod]);

  const availableTickets = event.totalTickets - event.soldTickets;
  const totalAmount = quantity * event.price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (buyerInfo.name && buyerInfo.email) {
      if ((paymentMethod === 'moncash' || paymentMethod === 'natcash') && !paymentProof) {
        alert("Veuillez soumettre une capture d'écran du paiement pour confirmer votre achat.");
        return;
      }

      setIsSubmitting(true);
      try {
        await onPurchase({
          quantity,
          buyerName: buyerInfo.name,
          buyerEmail: buyerInfo.email,
          buyerPhone: buyerInfo.phone || undefined,
          paymentMethod,
          paymentProof: paymentProof || undefined
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result as string);
      };
      reader.readAsDataURL(file);
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

          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Méthode de Paiement</h4>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 border rounded-lg text-sm font-medium flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                💳 Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('moncash')}
                className={`p-3 border rounded-lg text-sm font-medium flex flex-col items-center gap-2 transition-all ${paymentMethod === 'moncash' ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                🔴 MonCash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('natcash')}
                className={`p-3 border rounded-lg text-sm font-medium flex flex-col items-center gap-2 transition-all ${paymentMethod === 'natcash' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                🟠 NatCash
              </button>
            </div>
          </div>

          {paymentMethod === 'card' ? (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Paiement Sécurisé</h4>
              <p className="text-sm text-blue-700">
                Paiement via carte bancaire sécurisé. Confirmation immédiate.
              </p>
            </div>
          ) : (
            <div className="mb-6 space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-sm font-medium text-gray-800 mb-4">
                  Scannez ou cliquez sur le QR Code {paymentMethod === 'moncash' ? 'MonCash' : 'NatCash'} ci-dessous
                </p>

                <a
                  href={paymentMethod === 'moncash' ? "moncash://" : "natcash://"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block p-4 bg-white border rounded-xl hover:shadow-lg transition-shadow"
                >
                  {paymentMethod === 'moncash' ? (
                    <img
                      src="/assets/QR2.jpeg"
                      alt="Payment QR"
                      className="w-48 h-auto max-h-64"
                    />
                  ) : qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="Payment QR"
                      className="w-48 h-48"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                      <div className="animate-pulse text-gray-400 text-xs">Génération...</div>
                    </div>
                  )}
                </a>

                <p className="text-xs text-gray-500 mt-4">
                  {paymentMethod === 'moncash' ? 'Une fois le paiement effectué, veuillez soumettre une capture d\'écran.' : 'Préparez votre capture d\'écran après le transfert.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preuve de paiement (Capture d'écran) *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {paymentProof && (
                  <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Image chargée avec succès
                  </div>
                )}
              </div>
            </div>
          )}

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
            {isSubmitting ? 'Traitement...' : (paymentMethod === 'card' ? 'Acheter' : 'Envoyer')}
          </button>
        </form>
      </div>
    </div>
  );
}

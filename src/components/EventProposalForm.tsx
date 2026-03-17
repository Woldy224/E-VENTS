import React, { useState } from 'react';
import { Send, Calendar, Clock, Users, DollarSign, User, Mail, Phone, FileText } from 'lucide-react';
import CurrencyConverter from './CurrencyConverter';
import { EventProposal } from '../types/Event';

interface EventProposalFormProps {
  onSubmit: (proposal: Omit<EventProposal, 'id' | 'status' | 'submittedAt'>) => void;
}

export default function EventProposalForm({ onSubmit }: EventProposalFormProps) {
  const [formData, setFormData] = useState({
    eventName: '',
    description: '',
    date: '',
    time: '',
    numberOfTickets: 0,
    price: 0,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    imageUrl: '',
    mediaCoverageRequested: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      setSubmitted(true);
      setFormData({
        eventName: '',
        description: '',
        date: '',
        time: '',
        numberOfTickets: 0,
        price: 0,
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        imageUrl: '',
        mediaCoverageRequested: false
      });
    } catch (error) {
      console.error('Error submitting proposal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-green-900 mb-2">Proposal Submitted!</h2>
          <p className="text-green-700 mb-4">
            Merci pour votre proposition d'événement. Nous avons bien reçu votre soumission et l'examinerons sous peu.
            Vous recevrez une confirmation par e-mail ainsi que des mises à jour concernant le statut de votre proposition.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Enregistrer une autre proposition
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
          <h1 className="text-3xl font-bold text-white mb-2">Enregistrer un Evenement</h1>
          <p className="text-blue-100">
            Vous avez une idée d'événement géniale ? Partagez-la avec nous et nous envisagerons de l'ajouter à notre plateforme.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Information sur l'événement
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.eventName}
                  onChange={(e) => handleInputChange('eventName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What's your event called?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Description *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={5}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Describe your event in detail..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Tickets *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.numberOfTickets}
                      onChange={(e) => handleInputChange('numberOfTickets', parseInt(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="How many tickets?"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Price ($) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <CurrencyConverter initialUSD={formData.price} />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Event Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files[0]) {
                      const file = files[0];
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        handleInputChange('imageUrl', typeof reader.result === 'string' ? reader.result : '');
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Contact Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Qu'est ce qui se passe après</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>- Nous examinerons votre proposition d'événement sous 2 à 3 jours ouvrables</li>
                  <li>- Vous recevrez une confirmation de votre soumission par e-mail</li>
                  <li>- Si elle est approuvée, nous vous contacterons pour finaliser les détails de l'événement</li>
                  <li>- Une fois publié, nous nous occuperons de la vente des billets et vous fournirons des rapports</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="md:col-span-2">
              <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <input
                  id="mediaCoverageRequested"
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={!!formData.mediaCoverageRequested}
                  onChange={(e) =>
                    handleInputChange('mediaCoverageRequested', e.target.checked)
                  }
                />
                <label htmlFor="mediaCoverageRequested" className="text-sm text-gray-700">
                  <span className="font-medium">Couverture médiatique :</span>{' '}
                  Souhaitez-vous une couverture médiatique pour cet événement ?
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center px-8 py-3 rounded-md font-medium transition-colors ${isSubmitting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Soumettre la proposition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

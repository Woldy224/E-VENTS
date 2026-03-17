import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  DollarSign,
  Users,
  MapPin,
  FileText
} from 'lucide-react';
import CurrencyConverter from './CurrencyConverter';
import { Event } from '../types/Event';

interface EventFormProps {
  event?: Event;
  onClose: () => void;
  onSubmit: (
    eventData: Omit<Event, 'id' | 'soldTickets' | 'createdAt' | 'updatedAt'>
  ) => void;
}

export default function EventForm({ event, onClose, onSubmit }: EventFormProps) {

  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || '',
    time: event?.time || '',
    price: event?.price || 0,
    totalTickets: event?.totalTickets || 0,
    location: event?.location || '',
    imageUrl: event?.imageUrl || ''
  });

  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {

    const interval = setInterval(() => {

      if (!formData.date || !formData.time) return;

      const eventDate = new Date(`${formData.date}T${formData.time}`);
      const now = new Date();

      const diff = eventDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Event started");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m remaining`);

    }, 60000);

    return () => clearInterval(interval);

  }, [formData.date, formData.time]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">

      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b">

          <h2 className="text-xl font-semibold">
            {event ? "Edit Event" : "Create Event"}
          </h2>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        <form onSubmit={handleSubmit} className="p-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Title */}
            <div className="md:col-span-2">

              <label className="text-sm font-medium">
                Event Title
              </label>

              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full border rounded px-3 py-2 mt-1"
                placeholder="Event title"
              />

            </div>

            {/* Description */}
            <div className="md:col-span-2">

              <label className="text-sm font-medium">
                Description
              </label>

              <div className="relative">

                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full pl-10 border rounded px-3 py-2"
                  placeholder="Describe your event"
                />

              </div>

            </div>

            {/* Date */}
            <div>

              <label className="text-sm font-medium">
                Event Date
              </label>

              <div className="relative">

                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className="w-full pl-10 border rounded px-3 py-2"
                />

              </div>

            </div>

            {/* Time */}
            <div>

              <label className="text-sm font-medium">
                Event Time
              </label>

              <div className="relative">

                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  className="w-full pl-10 border rounded px-3 py-2"
                />

              </div>

            </div>

            {/* Countdown */}
            {timeLeft && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-700">
                ⏳ {timeLeft}
              </div>
            )}

            {/* Price */}
            <div>

              <label className="text-sm font-medium">
                Ticket Price
              </label>

              <div className="relative">

                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 border rounded px-3 py-2"
                />

              </div>

            </div>

            <div className="md:col-span-2">
              <CurrencyConverter initialUSD={formData.price} />
            </div>

            {/* Tickets */}
            <div>

              <label className="text-sm font-medium">
                Total Tickets
              </label>

              <div className="relative">

                <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                <input
                  type="number"
                  min="1"
                  value={formData.totalTickets}
                  onChange={(e) => handleInputChange("totalTickets", parseInt(e.target.value) || 0)}
                  className="w-full pl-10 border rounded px-3 py-2"
                />

              </div>

            </div>

            {/* Location */}
            <div className="md:col-span-2">

              <label className="text-sm font-medium">
                Location
              </label>

              <div className="relative">

                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="w-full pl-10 border rounded px-3 py-2"
                />

              </div>

            </div>

            {/* Image Upload */}
            <div className="md:col-span-2">

              <label className="text-sm font-medium">
                Event Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {

                  const file = e.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();

                  reader.onloadend = () => {
                    handleInputChange("imageUrl", reader.result as string);
                  };

                  reader.readAsDataURL(file);

                }}
                className="w-full border rounded px-3 py-2"
              />

            </div>

          </div>

          {/* Event Preview */}

          <div className="mt-10">

            <h3 className="font-semibold mb-4">
              Event Preview
            </h3>

            <div className="group border rounded-lg overflow-hidden shadow hover:shadow-xl transition cursor-pointer">

              {formData.imageUrl && (

                <img
                  src={formData.imageUrl}
                  className="w-full h-48 object-cover group-hover:scale-105 transition"
                />

              )}

              <div className="p-4">

                <h4 className="text-lg font-bold">
                  {formData.title || "Event Title"}
                </h4>

                <p
                  title={formData.description}
                  className="text-gray-500 text-sm line-clamp-2 hover:line-clamp-none transition"
                >
                  {formData.description || "Event description"}
                </p>

                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <div>📅 {formData.date}</div>
                  <div>⏰ {formData.time}</div>
                  <div>📍 {formData.location}</div>
                </div>

                <div className="mt-3 font-semibold text-blue-600">
                  ${formData.price}
                </div>

                {timeLeft && (
                  <div className="text-xs text-green-600 mt-2">
                    ⏳ {timeLeft}
                  </div>
                )}

              </div>

            </div>

          </div>

          {/* Buttons */}

          <div className="flex justify-end gap-4 mt-8">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border rounded"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {event ? "Update Event" : "Create Event"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}
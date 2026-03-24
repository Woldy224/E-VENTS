import React, { useState, useEffect, useRef } from 'react';
import { Download, QrCode, Calendar as CalendarIcon, DollarSign, Users, CheckCircle, User, X } from 'lucide-react';
import api from '../api';
import { processTicketPurchase } from '../utils/ticketGenerator';
import { Html5Qrcode } from 'html5-qrcode';

// Types inside the dashboard
interface Ticket {
  id: string;
  eventId: string;
  eventName: string; // assumed, may need to fetch if not present
  quantity: number;
  totalAmount: number;
  status: string;
  purchasedAt: string;
  isSale?: boolean;
  buyerName?: string;
}

interface EventStats {
  id: string;
  title: string;
  totalTickets: number;
  soldTickets: number;
  revenue: number;
}

interface UserDashboardProps {
  onBackToEvents: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onBackToEvents }) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'events' | 'scanner'>('tickets');

  // Data States
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [myEvents, setMyEvents] = useState<EventStats[]>([]);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scanner State
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'invalid'>('idle');
  const isProcessingRef = useRef(false);

  // Initial Load
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'tickets') {
        // Fetch tickets the user bought
        const boughtResponse = await api.tickets.myTickets();
        const boughtTickets = boughtResponse.tickets || boughtResponse || []; // Handle both {tickets: []} and [] response structures

        // Fetch events the user organizes to get the tickets they sold
        let soldTickets: Ticket[] = [];
        try {
          const eventsResponse = await api.events.myEvents();
          const myOwnEvents = eventsResponse.events || eventsResponse || [];

          const salesPromises = myOwnEvents.map(async (event: any) => {
            try {
              const statsResponse = await api.tickets.eventSales(event.id);
              const sales = Array.isArray(statsResponse) ? statsResponse : statsResponse.sales || [];
              return sales.map((sale: any) => ({
                id: sale.id,
                eventId: event.id,
                eventName: event.title,
                quantity: sale.quantity,
                totalAmount: sale.totalAmount,
                status: sale.status,
                purchasedAt: sale.purchasedAt,
                // Add an extra flag or property if you want to distinguish visually later
                isSale: true,
                buyerName: sale.buyerName
              }));
            } catch { return []; }
          });

          const allSalesArrays = await Promise.all(salesPromises);
          soldTickets = allSalesArrays.flat();
        } catch (e) {
          console.error("Failed fetching sold tickets", e);
        }

        // Combine and sort by date descending
        const allTickets = [...boughtTickets, ...soldTickets].sort((a, b) =>
          new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
        );

        setMyTickets(allTickets);
      } else if (activeTab === 'events') {
        const response = await api.events.myEvents();
        const myOwnEvents = Array.isArray(response) ? response : (response.events || []);

        const validEvents = myOwnEvents.map((event: any) => ({
          id: event.id,
          title: event.title,
          totalTickets: event.totalTickets || 0,
          soldTickets: event.soldTickets || 0,
          revenue: event.revenue || 0
        }));
        setMyEvents(validEvents);
      }
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement des données.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTicket = async (ticket: Ticket) => {
    try {
      setIsLoading(true);
      const user = await api.auth.me();
      const eventDetails = await api.events.get(ticket.eventId);

      const ticketData = {
        ticketId: ticket.id,
        eventTitle: ticket.eventName || eventDetails.title || `Événement #${ticket.eventId}`,
        eventDate: eventDetails.date || ticket.purchasedAt.split(' ')[0],
        eventTime: eventDetails.time || "20:00",
        eventLocation: eventDetails.location || "Lieu à confirmer",
        buyerName: user?.user?.name || "Participant",
        buyerEmail: user?.user?.email || "email@example.com",
        quantity: ticket.quantity,
        totalAmount: ticket.totalAmount,
      };

      await processTicketPurchase(ticketData);
      alert('Téléchargement du billet réussi !');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération du PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  // QR Scanner Initialization
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (activeTab === 'scanner') {
      setScanResult(null);
      setScanStatus('idle');
      isProcessingRef.current = false;
      html5QrCode = new Html5Qrcode("qr-reader");

      const startScanner = async () => {
        try {
          await html5QrCode?.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => {
              if (isProcessingRef.current) return;
              isProcessingRef.current = true;
              try {
                const parsedData = JSON.parse(decodedText);
                if (!parsedData.ticketId) {
                  throw new Error("Format QR invalide. Le billet doit contenir un Ticket ID.");
                }
                const response = await api.tickets.scan(parsedData.ticketId);
                setScanResult({ ...parsedData, dbInfo: response.ticket });
                setScanStatus('success');
              } catch (err: any) {
                setScanStatus('invalid');
                let rawJson = decodedText;
                try { rawJson = JSON.stringify(JSON.parse(decodedText), null, 2); } catch {}
                setScanResult({ error: err.message || "Erreur lors de la validation.", raw: rawJson });
              }
            },
            () => { /* silent parse errors */ }
          );
        } catch (err) {
          console.error("Camera activation failed:", err);
          setError("Échec de l'activation automatique de la caméra. Assurez-vous d'avoir autorisé l'accès.");
        }
      };

      startScanner();

      return () => {
        if (html5QrCode) {
          const stopAndClear = async () => {
            try {
              if (html5QrCode?.isScanning) {
                await html5QrCode.stop();
              }
              html5QrCode?.clear();
            } catch (e) {
              console.warn("Cleanup error:", e);
            }
          };
          stopAndClear();
        }
      };
    }
  }, [activeTab]);


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-16rem)] font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 font-heading">Mon Espace</h1>
          <p className="text-gray-500 mt-2">Gérez vos billets, vos événements et scannez les entrées.</p>
        </div>
        <button
          onClick={onBackToEvents}
          className="mt-4 md:mt-0 text-blue-600 hover:text-blue-800 font-medium flex items-center bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition"
        >
          &larr; Retour aux événements
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 py-4 px-6 text-center font-semibold text-sm transition-colors ${activeTab === 'tickets' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Mes Billets
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-4 px-6 text-center font-semibold text-sm transition-colors ${activeTab === 'events' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Mes Événements (Organisateurs)
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 py-4 px-6 text-center font-semibold text-sm transition-colors ${activeTab === 'scanner' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Scanner un Billet
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ================= TICKETS TAB ================= */}
          {activeTab === 'tickets' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {myTickets.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  <QrCode className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Aucun billet trouvé</h3>
                  <p className="mt-2 text-gray-500">Vous n'avez pas encore acheté de billets pour nos événements.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myTickets.map((ticket) => (
                    <div key={ticket.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-bold text-lg text-gray-900 truncate pr-4">
                            {ticket.isSale ? `Vente #${ticket.id.slice(0, 8)}` : `Billet #${ticket.id.slice(0, 8)}`}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.isSale ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {ticket.isSale ? 'Vendu' : 'Acheté'}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600 mb-6">
                          <p className="font-medium text-gray-900 truncate">{ticket.eventName}</p>
                          {ticket.isSale && ticket.buyerName && (
                            <p className="flex items-center text-gray-500"><User className="w-4 h-4 mr-2" /> {ticket.buyerName}</p>
                          )}
                          <p className="flex items-center"><CalendarIcon className="w-4 h-4 mr-2" /> Date : {new Date(ticket.purchasedAt).toLocaleDateString()}</p>
                          <p className="flex items-center"><Users className="w-4 h-4 mr-2" /> {ticket.quantity} entrée(s)</p>
                          <p className="flex items-center"><DollarSign className="w-4 h-4 mr-2" /> {ticket.totalAmount}</p>
                          
                          {!ticket.isSale && (
                            <p className={`flex items-center font-semibold ${ticket.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {ticket.status === 'completed' ? 'Validé' : 'En attente de validation'}
                            </p>
                          )}
                        </div>
                        {!ticket.isSale && ticket.status === 'completed' && (
                          <button
                            onClick={() => handleDownloadTicket(ticket)}
                            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger PDF
                          </button>
                        )}
                        {!ticket.isSale && ticket.status !== 'completed' && (
                          <div className="w-full text-center py-2.5 px-4 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium">
                            En attente de validation...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= EVENTS TAB (Organizers) ================= */}
          {activeTab === 'events' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {myEvents.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Aucun événement organisé</h3>
                  <p className="mt-2 text-gray-500">Vous ne gérez actuellement aucun événement ou l'accès vous est refusé.</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Événement</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Billets Vendus</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Taux de remplissage</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenus (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {myEvents.map((event) => {
                        const percent = event.totalTickets > 0 ? Math.round((event.soldTickets / event.totalTickets) * 100) : 0;
                        return (
                          <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{event.title}</div>
                              <div className="text-sm text-gray-500">ID: {event.id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {event.soldTickets} / {event.totalTickets}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
                              </div>
                              <span className="text-xs text-gray-500 mt-1 inline-block">{percent}%</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              {event.revenue} $
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= SCANNER TAB ================= */}
          {activeTab === 'scanner' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Caméra de validation</h3>
                <div id="qr-reader" className="w-full overflow-hidden rounded-xl border-2 border-dashed border-gray-300"></div>
                <p className="text-sm text-gray-500 mt-4 text-center">Placez le QR code du billet devant la caméra.</p>
              </div>

              <div className="w-full md:w-1/2">
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 h-full flex flex-col justify-center items-center text-center">
                  {scanStatus === 'success' && scanResult ? (
                    <div className="animate-in zoom-in duration-300 w-full max-w-sm">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Billet Validé !</h3>
                      
                      <div className="bg-white p-6 rounded-xl border border-gray-200 text-left mt-6 shadow-sm">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Participant</p>
                          <p className="text-lg font-bold text-gray-900">{scanResult.buyerName}</p>
                          <p className="text-sm text-gray-500">{scanResult.buyerEmail}</p>
                        </div>
                        
                        <div className="space-y-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase">Événement</p>
                            <p className="font-semibold text-gray-800">{scanResult.eventTitle}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                               <p className="text-xs text-gray-400 font-semibold uppercase">Quantité</p>
                               <p className="font-semibold text-blue-600">{scanResult.quantity} entrée(s)</p>
                            </div>
                            <div className="text-right">
                               <p className="text-xs text-gray-400 font-semibold uppercase">ID Billet</p>
                               <p className="font-mono text-xs text-gray-500 mt-1">{scanResult.ticketId.substring(0, 8)}...</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => { setScanStatus('idle'); setScanResult(null); isProcessingRef.current = false; }}
                        className="mt-8 bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 px-6 py-3 rounded-xl font-bold transition w-full shadow-sm"
                      >
                        Scanner le billet suivant
                      </button>
                    </div>
                  ) : scanStatus === 'invalid' ? (
                    <div className="animate-in zoom-in duration-300 w-full max-w-sm">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-red-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Billet Invalide</h3>
                      
                      <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6 text-left">
                        <p className="text-red-700 font-medium text-sm text-center">
                          {scanResult?.error || "Une erreur inconnue s'est produite lors de la vérification."}
                        </p>
                      </div>
                      
                      {scanResult?.raw && (
                        <div className="bg-white p-4 rounded-xl border border-gray-200 text-left w-full shadow-sm">
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Données brutes lues :</p>
                          <pre className="font-mono text-[10px] text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto border border-gray-100">
                            {scanResult.raw.substring(0, 150)}{scanResult.raw.length > 150 ? '...' : ''}
                          </pre>
                        </div>
                      )}

                      <button
                        onClick={() => { setScanStatus('idle'); setScanResult(null); isProcessingRef.current = false; }}
                        className="mt-8 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 px-6 py-3 rounded-xl font-bold transition w-full shadow-sm"
                      >
                        Réessayer le scan
                      </button>
                    </div>
                  ) : (
                    <div>
                      <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-700">En attente de scan...</h3>
                      <p className="text-gray-500 mt-2 max-w-xs mx-auto">Le résultat apparaîtra ici dès qu'un billet sera détecté par la caméra.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default UserDashboard;

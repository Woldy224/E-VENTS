export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  price: number;
  totalTickets: number;
  soldTickets: number;
  imageUrl?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventProposal {
  id: string;
  eventName: string;
  description: string;
  date: string;
  time: string;
  numberOfTickets: number;
  price: number;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  imageUrl?: string;
  mediaCoverageRequested?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface TicketPurchase {
  id: string;
  eventId: string;
  quantity: number;
  totalAmount: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  status: 'pending' | 'completed' | 'cancelled';
  purchasedAt: string;
  qrCode?: string;
}
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

export interface TicketData {
  ticketId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation?: string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  totalAmount: number;
  purchaseDate: string;
}

export const generateTicketId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `TKT-${timestamp}-${randomStr}`.toUpperCase();
};

export const generateQRCode = async (ticketData: TicketData): Promise<string> => {
  const qrData = JSON.stringify({
    ticketId: ticketData.ticketId,
    eventTitle: ticketData.eventTitle,
    eventDate: ticketData.eventDate,
    eventTime: ticketData.eventTime,
    buyerName: ticketData.buyerName,
    buyerEmail: ticketData.buyerEmail,
    quantity: ticketData.quantity,
    verified: true
  });

  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const generateTicketPDF = async (ticketData: TicketData, qrCodeDataURL: string): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set up colors and fonts
  const primaryColor = [37, 99, 235]; // Blue
  const secondaryColor = [75, 85, 99]; // Gray
  const textColor = [31, 41, 55]; // Dark gray

  // Header background
  pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(0, 0, 210, 40, 'F');

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BILLET D\'ÉVÉNEMENT', 105, 20, { align: 'center' });

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Votre Pass Électronique', 105, 30, { align: 'center' });

  // Event Information Section
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Détails de l\'Événement', 20, 60);

  // Event details
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');

  let yPos = 75;
  const lineHeight = 8;

  // Event Title
  pdf.setFont('helvetica', 'bold');
  pdf.text('Événement:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(ticketData.eventTitle, 45, yPos);
  yPos += lineHeight;

  // Date and Time
  pdf.setFont('helvetica', 'bold');
  pdf.text('Date:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  const eventDate = new Date(`${ticketData.eventDate}T${ticketData.eventTime}`);
  const formattedDate = eventDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  pdf.text(`${formattedDate} à ${formattedTime}`, 45, yPos);
  yPos += lineHeight;

  // Location (if available)
  if (ticketData.eventLocation) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Lieu:', 20, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(ticketData.eventLocation, 45, yPos);
    yPos += lineHeight;
  }

  yPos += 10;

  // Ticket Information Section
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Informations du Billet', 20, yPos);
  yPos += 15;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');

  // Ticket ID
  pdf.setFont('helvetica', 'bold');
  pdf.text('ID Billet:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(ticketData.ticketId, 45, yPos);
  yPos += lineHeight;

  // Buyer Name
  pdf.setFont('helvetica', 'bold');
  pdf.text('Nom:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(ticketData.buyerName, 45, yPos);
  yPos += lineHeight;

  // Email
  pdf.setFont('helvetica', 'bold');
  pdf.text('Email:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(ticketData.buyerEmail, 45, yPos);
  yPos += lineHeight;

  // Quantity
  pdf.setFont('helvetica', 'bold');
  pdf.text('Quantité:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${ticketData.quantity} billet${ticketData.quantity > 1 ? 's' : ''}`, 45, yPos);
  yPos += lineHeight;

  // Total Amount
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Payé:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${ticketData.totalAmount.toFixed(2)}$`, 45, yPos);
  yPos += lineHeight;

  // Purchase Date
  pdf.setFont('helvetica', 'bold');
  pdf.text('Acheté le:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  const purchaseDate = new Date(ticketData.purchaseDate);
  pdf.text(purchaseDate.toLocaleDateString('fr-FR'), 45, yPos);

  // QR Code Section
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Scanner pour l\'Entrée', 20, 180);

  // Add QR code
  pdf.addImage(qrCodeDataURL, 'PNG', 20, 190, 50, 50);

  // QR Code instructions
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  pdf.text('Présentez ce code QR à l\'entrée de l\'événement', 80, 200);
  pdf.text('pour un enregistrement rapide et facile.', 80, 210);
  pdf.text('Gardez ce billet en sécurité sur votre appareil.', 80, 220);

  // Footer
  pdf.setFillColor(245, 245, 245);
  pdf.rect(0, 260, 210, 37, 'F');

  pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  pdf.setFontSize(8);
  pdf.text('Ceci est votre billet officiel. Veuillez le conserver précieusement.', 105, 270, { align: 'center' });
  pdf.text('Pour assistance, contactez l\'organisateur ou visitez notre site web.', 105, 280, { align: 'center' });
  pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} - Plateforme AYITI EVENTS`, 105, 290, { align: 'center' });

  // Save the PDF
  const fileName = `ticket-${ticketData.ticketId}.pdf`;
  pdf.save(fileName);
};

export const processTicketPurchase = async (ticketData: Omit<TicketData, 'ticketId' | 'purchaseDate'> & { ticketId?: string }): Promise<string> => {
  try {
    // Generate unique ticket ID, or use provided database ticket ID
    const ticketId = ticketData.ticketId || generateTicketId();

    // Create complete ticket data
    const completeTicketData: TicketData = {
      ...ticketData,
      ticketId,
      purchaseDate: new Date().toISOString()
    };

    // Generate QR code
    const qrCodeDataURL = await generateQRCode(completeTicketData);

    // Generate and download PDF
    await generateTicketPDF(completeTicketData, qrCodeDataURL);

    return ticketId;
  } catch (error) {
    console.error('Error processing ticket purchase:', error);
    throw new Error('Failed to generate ticket. Please try again.');
  }
};
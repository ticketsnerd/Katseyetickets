import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ChevronLeft, CreditCard, Lock, Ticket, Info, AlertCircle, CheckCircle } from 'lucide-react';

// --- MOCKED DATA FROM USER FILES ---
// In a real app, you might fetch these files, but for a standalone build, 
// embedding the critical parts guarantees it works immediately on Apache.

const MOCK_VENUE = {
  id: "182",
  name: "Bill Graham Civic Auditorium",
  address: "99 Grove Street, San Francisco, CA 94102",
  city: "San Francisco",
  state: "CA",
  image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Bill_Graham_Civic_Auditorium_2012.jpg/1200px-Bill_Graham_Civic_Auditorium_2012.jpg" // Fallback image
};

const MOCK_EVENT = {
  id: "5867053",
  name: "Katseye",
  date: "Sat, Dec 6, 2025",
  time: "8:00 PM",
  venueId: "182",
  minPrice: 632.61,
  imageUrl: "https://a.vsstatic.com/mobile/app/concerts/katseye.jpg"
};

const MOCK_LISTINGS = [
  { id: 1, section: "General Admission", row: "GA1", quantity: 2, price: 632.61, type: "E-Ticket" },
  { id: 2, section: "Loge 102", row: "B", quantity: 2, price: 750.00, type: "Instant Transfer" },
  { id: 3, section: "Balcony 210", row: "A", quantity: 4, price: 815.50, type: "E-Ticket" },
  { id: 4, section: "Floor", row: "Standing", quantity: 2, price: 1200.00, type: "VIP Package" },
];

// --- COMPONENTS ---

// 1. Event Listing Page
function EventPage() {
  const { id } = useParams();
  // In a real app, use 'id' to fetch specific data. We use MOCK_EVENT for demo.
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white pb-12">
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <div className="flex items-center space-x-2 text-sm text-slate-400 mb-6">
            <Link to="/" className="hover:text-white transition flex items-center">
              <ChevronLeft className="w-4 h-4" /> Back to Search
            </Link>
            <span>/</span>
            <span>Concerts</span>
            <span>/</span>
            <span>Pop</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-2">{MOCK_EVENT.name}</h1>
              <div className="flex flex-col space-y-2 text-slate-300">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span className="font-medium">{MOCK_EVENT.date} • {MOCK_EVENT.time}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="font-medium">{MOCK_VENUE.name} - {MOCK_VENUE.city}, {MOCK_VENUE.state}</span>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block">
               {/* Venue Image Thumbnail */}
               <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-slate-700 shadow-xl">
                 <img src={MOCK_VENUE.image} alt={MOCK_VENUE.name} className="w-full h-full object-cover" />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Listings */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 pb-20">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-lg text-gray-800">Available Tickets</h2>
            <span className="text-sm text-gray-500">{MOCK_LISTINGS.length} listings found</span>
          </div>

          <div className="divide-y divide-gray-100">
            {MOCK_LISTINGS.map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-blue-50 transition flex flex-col sm:flex-row sm:items-center justify-between group">
                <div className="mb-3 sm:mb-0">
                  <div className="font-bold text-lg text-slate-800">{ticket.section}</div>
                  <div className="text-sm text-slate-500 flex items-center">
                    Row {ticket.row} • {ticket.quantity} tickets
                  </div>
                  <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    <Ticket className="w-3 h-3 mr-1" />
                    {ticket.type}
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                  <div className="text-right">
                    <div className="text-xl font-bold text-slate-900">${ticket.price.toFixed(2)}</div>
                    <div className="text-xs text-slate-400">ea / + fees</div>
                  </div>
                  <Link 
                    to={`/checkout/${MOCK_EVENT.id}/${ticket.id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition transform active:scale-95"
                  >
                    Buy
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. Checkout Page (Square Integration)
function CheckoutPage() {
  const { eventId, ticketId } = useParams();
  const [isLoaded, setIsLoaded] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, error
  const [errorMessage, setErrorMessage] = useState('');
  
  // Find data based on params
  const ticket = MOCK_LISTINGS.find(t => t.id === parseInt(ticketId));
  const total = ticket ? (ticket.price * ticket.quantity * 1.15).toFixed(2) : "0.00"; // 15% fee example

  // Square SDK Refs
  const cardRef = useRef(null);
  const paymentInstance = useRef(null);

  // ---------------------------------------------------------
  // SQUARE API CONFIGURATION
  // Replace these with your actual Sandbox credentials
  // ---------------------------------------------------------
  const APPLICATION_ID = "sq0idp-brXOtCaOhiSpu6ZwJF7a-Q"; 
  const LOCATION_ID = "LG23ERAFG60C2";
  // ---------------------------------------------------------

  useEffect(() => {
    // Check if Square script is loaded
    if (!window.Square) {
      setErrorMessage("Square Payment SDK failed to load. Please refresh.");
      return;
    }

    const initializePayment = async () => {
      try {
        const payments = window.Square.payments(APPLICATION_ID, LOCATION_ID);
        const card = await payments.card();
        await card.attach('#card-container');
        paymentInstance.current = card;
        setIsLoaded(true);
      } catch (e) {
        console.error("Square Initialization Error:", e);
        setErrorMessage("Failed to initialize payment form. Check API Keys.");
      }
    };

    if (ticket) {
      initializePayment();
    }

    // Cleanup
    return () => {
      if (paymentInstance.current) {
        paymentInstance.current.destroy();
      }
    };
  }, [ticket]);

  const handlePayment = async () => {
    if (!paymentInstance.current) return;
    
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // 1. Tokenize the card
      const result = await paymentInstance.current.tokenize();
      
      if (result.status === 'OK') {
        const token = result.token;
        console.log("Square Token Received:", token);
        
        // 2. SEND TOKEN TO PHP BACKEND
        const response = await fetch('/api/process-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                token: token, 
                amount: parseFloat(total) // Send amount as a number
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
           setPaymentStatus('success');
        } else {
           // Handle Backend Errors
           console.error("Backend Error:", data);
           setErrorMessage("Payment declined or failed server-side.");
           setPaymentStatus('error');
        }

      } else {
        setErrorMessage(result.errors[0].message);
        setPaymentStatus('error');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Payment failed. Please try again.");
      setPaymentStatus('error');
    }
  };

  if (!ticket) return <div className="p-10 text-center">Ticket not found</div>;

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">You have purchased <strong>{ticket.quantity}x {ticket.section}</strong> tickets for <strong>{MOCK_EVENT.name}</strong>.</p>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 text-sm text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono font-medium">#ORD-{Math.floor(Math.random()*100000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-medium">${total}</span>
            </div>
          </div>
          <Link to="/" className="block w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
          <div className="flex items-start mb-4 pb-4 border-b border-gray-100">
            <img src={MOCK_EVENT.imageUrl} className="w-16 h-16 rounded object-cover mr-4" alt="Event" />
            <div>
              <h4 className="font-bold text-gray-900">{MOCK_EVENT.name}</h4>
              <p className="text-sm text-gray-500">{MOCK_EVENT.date}</p>
              <p className="text-sm text-gray-500">{MOCK_VENUE.name}</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{ticket.quantity}x {ticket.section}, Row {ticket.row}</span>
              <span className="font-medium">${(ticket.price * ticket.quantity).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Service Fees</span>
              <span className="font-medium">${(ticket.price * ticket.quantity * 0.15).toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between text-base font-bold">
              <span>Total</span>
              <span>${total}</span>
            </div>
          </div>
          
          <div className="mt-6 bg-blue-50 p-3 rounded text-xs text-blue-800 flex items-start">
            <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <p>Your tickets will be transferred to your email immediately after payment confirmation.</p>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-600">
          <div className="flex items-center mb-6">
            <Lock className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Secure Payment</h2>
          </div>

          {/* Square Card Container */}
          <div id="card-container" className="min-h-[100px] mb-6">
            {!isLoaded && !errorMessage && (
              <div className="text-center py-8 text-gray-400 animate-pulse">Loading secure payment form...</div>
            )}
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {errorMessage}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={!isLoaded || paymentStatus === 'processing'}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-md transition flex justify-center items-center"
          >
            {paymentStatus === 'processing' ? (
              <>Processing...</>
            ) : (
              <>Pay ${total}</>
            )}
          </button>
          
          <div className="mt-4 flex justify-center items-center space-x-2 text-gray-400">
             <CreditCard className="w-5 h-5" />
             <span className="text-xs">Payments processed securely by Square</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// 3. Home/Landing Page
function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          Vivid Seats (Copy)
        </h1>
        <p className="text-xl text-slate-400 mb-8">Experience it live. Secure tickets to the hottest events.</p>
        <Link to={`/event/${MOCK_EVENT.id}`} className="inline-block bg-white text-slate-900 font-bold py-3 px-8 rounded-full hover:bg-blue-50 transition">
          View Featured Event: {MOCK_EVENT.name}
        </Link>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
           {/* Mock Categories based on 'navigation' file content */}
           {['Concerts', 'Sports', 'Theater'].map(cat => (
             <div key={cat} className="bg-slate-800 p-6 rounded-xl hover:bg-slate-700 transition cursor-pointer border border-slate-700">
                <h3 className="text-xl font-bold">{cat}</h3>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP ROUTER ---

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/event/:id" element={<EventPage />} />
        <Route path="/checkout/:eventId/:ticketId" element={<CheckoutPage />} />
      </Routes>
    </Router>
  );
}


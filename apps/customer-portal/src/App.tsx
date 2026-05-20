import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import SubmitTicketPage from './pages/SubmitTicketPage';
import TrackTicketPage from './pages/TrackTicketPage';
import TicketStatusPage from './pages/TicketStatusPage';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Routes>
        <Route path="/"           element={<LandingPage />} />
        <Route path="/submit"     element={<SubmitTicketPage />} />
        <Route path="/track"      element={<TrackTicketPage />} />
        <Route path="/tickets/:id" element={<TicketStatusPage />} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SubmitTicketPage from './pages/SubmitTicketPage';
import TicketStatusPage from './pages/TicketStatusPage';
import TrackTicketPage from './pages/TrackTicketPage';
import KbBrowsePage from './pages/KbBrowsePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<LandingPage />} />
        <Route path="/submit"    element={<SubmitTicketPage />} />
        <Route path="/status"    element={<TicketStatusPage />} />
        <Route path="/track/:id" element={<TrackTicketPage />} />
        <Route path="/kb"        element={<KbBrowsePage />} />
        <Route path="/kb/:slug"  element={<KbBrowsePage />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ClinicLanding from './pages/ClinicLanding';
import ClinicianDashboard from './pages/ClinicianDashboard';
import PatientDetail from './pages/PatientDetail';
import InsuranceForm from './pages/InsuranceForm';
import Reclaimant from './pages/Reclaimant';
import Integrations from './pages/Integrations';
import SessionReplay from './pages/SessionReplay';
import './index.css';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Routes location={location}>
          <Route path="/" element={<ClinicLanding />} />
          <Route path="/dashboard" element={<ClinicianDashboard />} />
          <Route path="/dashboard/:patientId" element={<PatientDetail />} />
          <Route path="/insurance" element={<InsuranceForm />} />
          <Route path="/reclaimant" element={<Reclaimant />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/replay/:patientId" element={<SessionReplay />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

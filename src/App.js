import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Flights from './pages/Flights';
import Bookings from './pages/Bookings';
import Security from './pages/Security';
import Reports from './pages/Reports';
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/flights" element={<Flights />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/security" element={<Security />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
        <ToastContainer position="top-right" />
      </div>
    </Router>
  );
}

export default App;

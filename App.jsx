import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './pages/admin';
import Host from './pages/host';
import Player from './pages/player';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/host" element={<Host />} />
        <Route path="/" element={<Player />} />
      </Routes>
    </Router>
  );
}
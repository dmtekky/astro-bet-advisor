import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import GamesSection from './components/GamesSection';
import GameDetails from './pages/GameDetails';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/games" element={<GamesSection />} />
          <Route path="/game/:gameId" element={<GameDetails />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

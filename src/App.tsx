import { Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchProvider } from './context/SearchContext';
import Dashboard from "./pages/Dashboard";
import EventDetails from "./pages/EventDetails";
import TeamPage from "./pages/TeamPage";
import PlayerPage from "./pages/PlayerPage";
import LeaguePage from "./pages/LeaguePage";
import GameDetails from "./pages/GameDetails";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import UpcomingGames from "./pages/UpcomingGames";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import Footer from "./components/Footer";

// Create a client
const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow pt-16">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/league/:leagueId" element={<LeaguePage />} />
          <Route path="/game/:gameId" element={<GameDetails />} />
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/team/:teamId" element={<TeamPage />} />
          <Route path="/team/:teamId/player/:playerId" element={<PlayerPage />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/upcoming-games" element={<UpcomingGames />} />
          <Route path="/upcoming-games/:sport" element={<UpcomingGames />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchProvider>
        <AppContent />
      </SearchProvider>
    </QueryClientProvider>
  );
}

export default App;

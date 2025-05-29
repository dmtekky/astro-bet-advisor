import { Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchProvider } from './context/SearchContext';
import Dashboard from "./pages/Dashboard";
import EventDetails from "./pages/EventDetails";
import TeamPage from "./pages/TeamPage";
import PlayerDetailPage from "./pages/PlayerDetailPage";
import LeaguePage from "./pages/LeaguePage";
import GamePage from "./pages/GamePage";
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
          <Route path="/game/:gameId" element={<GamePage />} />
          <Route path="/event/:id" element={<EventDetails />} />
          {/* New routes with plural form */}
          <Route path="/teams/:teamId" element={<TeamPage />} />
          <Route path="/teams/:teamId/player-details/:playerId" element={<PlayerDetailPage />} />
          
          {/* Redirects for old URLs */}
          <Route path="/team/:teamId" element={<TeamPageWrapper />} />
          <Route path="/team/:teamId/player/:playerId" element={<PlayerDetailPageWrapper />} />
          <Route path="/teams/:teamId/players/:playerId" element={<PlayerDetailPageWrapper />} />
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

// Wrapper components for handling redirects with parameters
const TeamPageWrapper = () => {
  const { teamId } = useParams<{ teamId: string }>();
  return <Navigate to={`/teams/${teamId}`} replace />;
};

const PlayerDetailPageWrapper = () => {
  const { teamId, playerId } = useParams<{ teamId: string; playerId: string }>();
  return <Navigate to={`/teams/${teamId}/player-details/${playerId}`} replace />;
};

export default App;

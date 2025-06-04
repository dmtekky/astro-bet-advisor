import { Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchProvider } from './context/SearchContext';
import { Analytics } from '@vercel/analytics/react';
import { PageViewProvider } from './contexts/PageViewContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from "./pages/Dashboard";
import EventDetails from "./pages/EventDetails";
import TeamPage from "./pages/TeamPage";
import PlayerDetailPage from "./pages/PlayerDetailPage";
import LeaguePage from "./pages/LeaguePage";
import GamePage from "./pages/GamePage";
import SearchResults from "./pages/SearchResults";
import UpcomingGames from "./pages/UpcomingGames";
import NewsPage from "./pages/NewsPage";
import NewsArticle from "./pages/NewsArticle";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import FloatingBackButton from "./components/common/FloatingBackButton";

// Create a client
const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <FloatingBackButton />
      <main className="flex-grow pt-0">
        <Analytics />
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/league/:leagueId" element={<LeaguePage />} />
          <Route path="/game/:gameId" element={<GamePage />} />
          <Route path="/event/:id" element={<EventDetails />} />
          {/* New routes with plural form */}
          <Route path="/teams/:teamId" element={<TeamPage />} />
          <Route path="/teams/:teamId/player-details/:playerId" element={<PlayerDetailPage />} />
          
          {/* Redirects for old URLs */}
          <Route path="/team/:teamId" element={<TeamPageWrapper />} />
          {/* Redirect old player routes to the new Astro route */}
          <Route path="/team/:teamId/player/:playerId" element={<PlayerDetailPageWrapper />} />
          <Route path="/teams/:teamId/players/:playerId" element={<PlayerDetailPageWrapper />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/upcoming-games" element={<UpcomingGames />} />
          <Route path="/upcoming-games/:sport" element={<UpcomingGames />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:slug" element={<NewsArticle />} />
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
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
      <AuthProvider>
        <PageViewProvider>
          <SearchProvider>
            <AppContent />
          </SearchProvider>
        </PageViewProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Wrapper components for handling redirects with parameters
const TeamPageWrapper = () => {
  const { teamId } = useParams<{ teamId: string }>();
  return <Navigate to={`/teams/${teamId}`} replace />;
};

const PlayerDetailPageWrapper = () => {
  const { teamId, playerId } = useParams();
  // This will trigger a full page load to the Astro route
  if (typeof window !== 'undefined') {
    window.location.href = `/teams/${teamId}/player-details/${playerId}`;
    return null;
  }
  return null;
};

export default App;

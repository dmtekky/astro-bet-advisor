import {
  Routes,
  Route,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SearchProvider } from "./context/SearchContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PageViewProvider } from "./contexts/PageViewContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
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
// NBA imports
import NbaTeamsPage from "./pages/NbaTeamsPage";
import NbaTeamDetailPage from "./pages/NbaTeamDetailPage";
import NbaPlayersPage from "./pages/NbaPlayersPage";
import BasketballPlayerPage from "./pages/players/BasketballPlayerPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

function AppContent() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <FloatingBackButton />
      <main className="flex-grow pt-16 md:pt-20 bg-gray-50">
        <Analytics />
        <SpeedInsights />
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/league/:leagueId" element={<LeaguePage />} />
          <Route path="/game/:gameId" element={<GamePage />} />
          <Route path="/event/:id" element={<EventDetails />} />
          {/* NBA-specific routes */}
          <Route path="/nba/teams" element={<NbaTeamsPage />} />

          {/* Legal Pages */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/nba/teams/:teamId" element={<NbaTeamDetailPage />} />
          <Route path="/nba/players" element={<NbaPlayersPage />} />
          <Route
            path="/nba/players/:playerId"
            element={<BasketballPlayerPage />}
          />

          {/* Team and player routes */}
          <Route path="/teams/:teamId" element={<TeamPage />} />

          {/* Redirects for old NBA player URLs */}
          <Route path="/team/:teamId" element={<TeamPageWrapper />} />
          <Route
            path="/team/:teamId/player/:playerId"
            element={<PlayerDetailPageWrapper />}
          />
          <Route
            path="/teams/:teamId/players/:playerId"
            element={<PlayerDetailPageWrapper />}
          />

          {/* Legacy player detail route - redirect to basketball player page */}
          <Route
            path="/teams/:teamId/player-details/:playerId"
            element={<BasketballPlayerPage />}
          />
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
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

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
  // Redirect to the basketball player page for NBA teams
  if (typeof window !== "undefined") {
    // Check if this is an NBA team (you might need to adjust this condition based on your team IDs)
    const isNbaTeam =
      teamId &&
      (teamId.startsWith("nba-") || teamId.toLowerCase().includes("nba"));

    if (isNbaTeam) {
      window.location.href = `/nba/players/${playerId}`;
    } else {
      // For non-NBA teams, use the generic player detail page
      window.location.href = `/teams/${teamId}/player-details/${playerId}`;
    }
    return null;
  }
  return null;
};

export default App;

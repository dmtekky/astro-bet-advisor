import { Suspense, lazy } from 'react';
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

import ScrollToTop from "./components/ScrollToTop";
import SignUpPrompt from './components/auth/SignUpPrompt';
import useSignUpPrompt from "./hooks/useSignUpPrompt";

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const PlayerDetailPage = lazy(() => import('./pages/PlayerDetailPage'));
const LeaguePage = lazy(() => import('./pages/LeaguePage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const UpcomingGames = lazy(() => import('./pages/UpcomingGames'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const NewsArticle = lazy(() => import('./pages/NewsArticle'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Header = lazy(() => import('./components/Header'));
const Footer = lazy(() => import('./components/Footer'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Profile = lazy(() => import('./pages/Profile'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const FloatingBackButton = lazy(() => import('./components/common/FloatingBackButton'));

const NbaTeamsPage = lazy(() => import('./pages/NbaTeamsPage'));
const NbaTeamDetailPage = lazy(() => import('./pages/NbaTeamDetailPage'));
const NbaPlayersPage = lazy(() => import('./pages/NbaPlayersPage'));
const BasketballPlayerPage = lazy(() => import('./pages/players/BasketballPlayerPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const SignUpPromptPreview = lazy(() => import('./pages/SignUpPromptPreview'));

// Lazy load preview pages
const ExampleProfilePage = lazy(() => import('./pages/preview/ExampleProfilePage'));

// Import the LoadingScreen component
import LoadingScreen from "./components/LoadingScreen";
import AmazonAffiliateBanner from "./components/AmazonAffiliateBanner";

// Single instance of QueryClient with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});



function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchProvider>
        <PageViewProvider>
          <AuthProvider>
            <Suspense fallback={<LoadingScreen fullScreen />}>
              <AppContent />
            </Suspense>
          </AuthProvider>
        </PageViewProvider>
      </SearchProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const { showPrompt, handleClose } = useSignUpPrompt();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ScrollToTop />
      <Header />
      <div className="w-full mt-20">
        <AmazonAffiliateBanner />
      </div>
      <FloatingBackButton />
      
      <main className="flex-grow bg-gray-50">
        <SignUpPromptWrapper />
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
              <Route path="/nba/teams/:teamId" element={<NbaTeamDetailPage />} />
              <Route path="/nba/players" element={<NbaPlayersPage />} />
              <Route path="/nba/players/:playerId" element={<BasketballPlayerPage />} />
              
              {/* Team and player routes */}
              <Route path="/teams/:teamId" element={<TeamPage />} />
              
              {/* Redirects for old NBA player URLs */}
              <Route path="/team/:teamId" element={<TeamPageWrapper />} />
              <Route path="/team/:teamId/player/:playerId" element={<PlayerDetailPageWrapper />} />
              <Route path="/teams/:teamId/players/:playerId" element={<PlayerDetailPageWrapper />} />
              <Route path="/teams/:teamId/player-details/:playerId" element={<PlayerDetailPage />} />
              <Route path="/players/:playerId" element={<PlayerDetailPage />} />
              
              {/* Search and Content */}
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
              
              <Route path="/preview/signup-prompt" element={
                <Suspense fallback={<LoadingScreen fullScreen />}>
                  <SignUpPromptPreview />
                  <SignUpPromptWrapper />
                </Suspense>
              } />
              <Route path="/preview/profile" element={
                <Suspense fallback={<LoadingScreen fullScreen />}>
                  <ExampleProfilePage />
                </Suspense>
              } />
              <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      <div className="border-t border-gray-200">
        <AmazonAffiliateBanner />
        <Footer />
      </div>
    </div>
  );
}

// Wrapper components for handling redirects with parameters
function TeamPageWrapper() {
  const { teamId } = useParams();
  return <Navigate to={`/teams/${teamId}`} replace />;
}

function PlayerDetailPageWrapper() {
  const { teamId, playerId } = useParams();
  
  // Handle different URL patterns for player details
  if (teamId && playerId) {
    return <Navigate to={`/teams/${teamId}/player-details/${playerId}`} replace />;
  }
  
  // If we only have a playerId (from old URL format), redirect to search
  if (playerId) {
    return <Navigate to={`/search?q=${encodeURIComponent(playerId)}`} replace />;
  }
  
  // Fallback to home if no valid parameters
  return <Navigate to="/" replace />;
}

// SignUpPromptWrapper is a simple component that shows the SignUpPrompt
function SignUpPromptWrapper() {
  const { showPrompt, handleClose } = useSignUpPrompt();
  
  if (!showPrompt) return null;
  
  return <SignUpPrompt onClose={handleClose} showPrompt={showPrompt} />;
}

export default App;

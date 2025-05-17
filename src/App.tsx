import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import EventDetails from "./pages/EventDetails";
import TeamPage from "./pages/TeamPage";
import LeaguePage from "./pages/LeaguePage";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/league/:leagueId" element={<LeaguePage />} />
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/team/:teamId" element={<TeamPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;

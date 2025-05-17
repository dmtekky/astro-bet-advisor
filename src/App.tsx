import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import EventDetails from "./pages/EventDetails"
import TeamPage from "./pages/TeamPage"
import LeaguePage from "./pages/LeaguePage"
import Home from "./pages/Home"
import NotFound from "./pages/NotFound"
import Header from "./components/Header"
import Footer from "./components/Footer"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
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
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App;

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CalendarDays } from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import SportNavigation from "@/components/navigation/SportNavigation";
import MobileNav from "@/components/navigation/MobileNav";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import { Link } from "react-router-dom";
import AmazonAffiliateBanner from "@/components/AmazonAffiliateBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { searchQuery, setSearchQuery, handleSearch } = useSearch();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        {/* Existing header content */}
      </header>
      
      {/* Amazon Banner under header */}
      <div className="mt-16">
        <AmazonAffiliateBanner />
      </div>

      {/* Main Content */}
      <main className="flex-1 container py-4 md:py-6 bg-gray-50">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Amazon Banner above footer */}
      <AmazonAffiliateBanner />
      
      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 md:py-8 bg-white">
        <div className="container">
          {/* Sports Navigation */}
          <div className="mb-6 hidden md:block">
            <h3 className="text-center text-lg font-semibold mb-4">
              Popular Sports
            </h3>
            <SportNavigation />
          </div>

          <div className="pt-4 md:pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>
              © {new Date().getFullYear()} Venusian Labs. All rights reserved.
            </p>
            <p className="text-xs mt-1">
              Powered by The Odds API, Sports Game Odds API, and Swiss Ephemeris
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;

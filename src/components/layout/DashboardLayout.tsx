import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, CalendarDays } from 'lucide-react';
import { useSearch } from '@/context/SearchContext';
import SportNavigation from '@/components/navigation/SportNavigation';
import MobileNav from '@/components/navigation/MobileNav';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import { Link } from 'react-router-dom';

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
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-30">
        <div className="container">
          <div className="flex justify-between items-center p-4">
            {/* Mobile Navigation */}
            <MobileNav />
            
            {/* Logo - only visible on mobile */}
            <div className="md:hidden font-bold text-lg">Astro Bet</div>
            
            {/* Search Form - Hidden on Mobile */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players, teams, and more..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  className="pl-9 h-9 min-w-[200px] md:min-w-[300px] pr-9"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button type="submit" size="sm" className="mr-2">
                Search
              </Button>
              <Link to="/upcoming-games">
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarDays className="h-4 w-4" />
                  View All Games
                </Button>
              </Link>
            </form>
            
            {/* Empty div for mobile layout balance */}
            <div className="block md:hidden w-8"></div>
          </div>
          
          {/* Sports Navigation */}
          <div className="border-t border-border bg-muted/40">
            <div className="container">
              <SportNavigation isHeader />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container py-4 md:py-6">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Footer */}
      <footer className="border-t border-border py-6 md:py-8 bg-muted/20 mt-8">
        <div className="container">
          {/* Sports Navigation */}
          <div className="mb-6 hidden md:block">
            <h3 className="text-center text-lg font-semibold mb-4">Popular Sports</h3>
            <SportNavigation />
          </div>
          
          <div className="pt-4 md:pt-6 border-t border-border text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} BettingAssist. All rights reserved.</p>
            <p className="text-xs mt-1">Powered by The Odds API, Sports Game Odds API, and Swiss Ephemeris</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, CalendarDays } from 'lucide-react';
import { useSearch } from '@/context/SearchContext';
import SportNavigation from '@/components/navigation/SportNavigation';
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-primary"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <h1 className="text-xl font-bold">Astro Plays</h1>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
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
      <main className="flex-1 container py-6">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/20">
        <div className="container">
          {/* Sports Navigation */}
          <div className="mb-6">
            <h3 className="text-center text-lg font-semibold mb-4">Popular Sports</h3>
            <SportNavigation />
          </div>
          
          <div className="pt-6 border-t border-border text-center text-sm text-muted-foreground">
            <p>  {new Date().getFullYear()} BettingAssist. All rights reserved.</p>
            <p className="text-xs mt-1">Powered by The Odds API, Sports Game Odds API, and Swiss Ephemeris</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;

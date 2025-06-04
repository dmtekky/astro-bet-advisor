import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Calendar, User, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sport } from '@/types';
import { useSearch } from '@/context/SearchContext';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface MobileNavProps {
  className?: string;
}

const sports: { id: Sport; name: string; icon: string }[] = [
  { id: 'nba', name: 'NBA', icon: '🏀' },
  { id: 'mlb', name: 'MLB', icon: '⚾' },
  { id: 'nfl', name: 'NFL', icon: '🏈' },
  { id: 'boxing', name: 'Boxing', icon: '🥊' },
  { id: 'soccer', name: 'Soccer', icon: '⚽' },
  { id: 'ncaa', name: 'NCAA FB', icon: '🏈' },
];

const MobileNav: React.FC<MobileNavProps> = ({ className = '' }) => {
  const location = useLocation();
  const { searchQuery, setSearchQuery, handleSearch } = useSearch();
  const [showSearch, setShowSearch] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
      setShowSearch(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const isDashboard = location.pathname === '/dashboard';
  const isTeamsPage = location.pathname === '/teams';
  const isGamesPage = location.pathname.includes('/upcoming-games');
  const isProfile = location.pathname.includes('/profile');

  return (
    <div className={`${className} md:hidden`}>
      {showSearch ? (
        <div className="fixed inset-0 bg-background z-50 p-4 flex flex-col">
          <div className="flex items-center mb-4">
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(false)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h2 className="text-lg font-semibold ml-2">Search</h2>
          </div>
          
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players, teams, and more..."
                value={searchQuery}
                onChange={handleInputChange}
                className="pl-9 h-10 pr-9 w-full"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" className="w-full">
              Search
            </Button>
          </form>
        </div>
      ) : (
        <>
          {/* Mobile Navigation Drawer */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80vw] max-w-sm p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold">Astro Bet Advisor</h2>
                </div>
                
                <div className="p-4 overflow-auto flex-1">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Sports</h3>
                  <nav className="mb-6">
                    <ul className="grid grid-cols-2 gap-2">
                      {sports.map((sport) => {
                        const isActive = isDashboard && new URLSearchParams(location.search).get('sport') === sport.id;
                        
                        return (
                          <li key={sport.id}>
                            <Link
                              to={`/dashboard?sport=${sport.id}`}
                              className={`flex items-center space-x-2 px-3 py-3 rounded-md transition-colors ${
                                isActive
                                  ? 'bg-primary text-primary-foreground font-medium'
                                  : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground'
                              }`}
                            >
                              <span className="text-xl mr-2">{sport.icon}</span>
                              <span>{sport.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                  
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 mt-6">Navigation</h3>
                  <nav>
                    <ul className="space-y-1">
                      <li>
                        <Link 
                          to="/dashboard" 
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors w-full ${
                            isDashboard ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <Home className="h-5 w-5" />
                          <span>Home</span>
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/upcoming-games" 
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors w-full ${
                            isGamesPage ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <Calendar className="h-5 w-5" />
                          <span>Upcoming Games</span>
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/teams" 
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors w-full ${
                            isTeamsPage ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 20H7V16H17V20Z" />
                            <path d="M12 4C14.2091 4 16 5.79086 16 8C16 10.2091 14.2091 12 12 12C9.79086 12 8 10.2091 8 8C8 5.79086 9.79086 4 12 4Z" />
                          </svg>
                          <span>Teams</span>
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/profile" 
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors w-full ${
                            isProfile ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          <User className="h-5 w-5" />
                          <span>Profile</span>
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
                
                <div className="p-4 border-t mt-auto">
                  <p className="text-xs text-muted-foreground">Astro Bet Advisor © {new Date().getFullYear()}</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Search Button */}
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
            <Search className="h-6 w-6" />
          </Button>
        </>
      )}
    </div>
  );
};

export default MobileNav;

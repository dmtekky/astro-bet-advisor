import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  location?: {
    pathname: string;
  };
}

const Header: React.FC<HeaderProps> = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLeaguesOpen, setIsLeaguesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Keep leagues menu open if we're on a league page
  useEffect(() => {
    const isLeaguePage = location.pathname.startsWith('/league/');
    setIsLeaguesOpen(isLeaguePage);
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLeaguesOpen(false);
      }
    };

    // Only add the event listener if the dropdown is open
    if (isLeaguesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLeaguesOpen]);

  const leagues = [
    { id: 'nba', name: 'NBA', icon: '🏀' },
    { id: 'mlb', name: 'MLB', icon: '⚾' },
    { id: 'nfl', name: 'NFL', icon: '🏈' },
    { id: 'boxing', name: 'Boxing', icon: '🥊' },
    { id: 'soccer', name: 'Soccer', icon: '⚽', comingSoon: true },
    { id: 'ncaa', name: 'NCAA Football', icon: '🏈', comingSoon: true },
  ];

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/upcoming-games', label: 'Games' },
  ];

  // Don't render header on home page
  if (location.pathname === '/') return null;
  
  return (
    <header className="fixed w-full z-50 shadow-lg">
      {/* Frosted glass effect using CSS */}
      <div className="absolute inset-0 backdrop-blur-md bg-white/80 -z-10"></div>
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo - Clickable to return to dashboard */}
          <Link to="/dashboard" className="flex items-center space-x-2 group transition-all duration-700 ease-[cubic-bezier(0.16, 1, 0.3, 1)]">
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16, 1, 0.3, 1)] group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600">
              {/* Empty circle - moon emoji removed */}
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-700 ease-[cubic-bezier(0.16, 1, 0.3, 1)]">
              Full Moon Odds
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2.5 rounded-md text-base font-medium ${
                  location.pathname === link.to
                    ? 'bg-transparent text-gray-800 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                } transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)] transform hover:scale-105`}
              >
                {link.label}
              </Link>
            ))}

            {/* Leagues Dropdown */}
            <div 
              className="relative"
              ref={dropdownRef}
            >
              <button
                className={`px-4 py-2.5 rounded-md text-base font-medium flex items-center ${
                  location.pathname.startsWith('/league/')
                    ? 'bg-transparent text-gray-800 dark:text-white font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                } transition-colors duration-200`}
                onClick={() => setIsLeaguesOpen(!isLeaguesOpen)}
                onMouseEnter={() => setIsLeaguesOpen(true)}
                aria-expanded={isLeaguesOpen}
                aria-haspopup="true"
              >
                Leagues
                <span className={`ml-1 transition-transform duration-200 ${isLeaguesOpen ? 'transform rotate-180' : ''}`}>▼</span>
              </button>
              
              <div 
                className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 ring-opacity-100 ${
                  isLeaguesOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
                } transform transition-all duration-200 ease-out z-50`}
              >
                <div className="py-1">
                  {leagues.map((league) => (
                    <Link
                      key={league.id}
                      to={league.comingSoon ? '#' : `/league/${league.id}`}
                      className={`block px-4 py-2 text-sm ${
                        league.comingSoon 
                          ? 'text-gray-500 cursor-not-allowed' 
                          : location.pathname === `/league/${league.id}`
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={(e) => {
                        if (league.comingSoon) {
                          e.preventDefault();
                        } else {
                          setIsLeaguesOpen(true);
                        }
                      }}
                    >
                      <span className="mr-2">{league.icon}</span>
                      {league.name}
                      {league.comingSoon && <span className="ml-2 text-xs text-yellow-400">(Coming Soon)</span>}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Mobile menu button */}
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === link.to
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="pt-4 border-t border-gray-700">
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Leagues
                </h3>
                <div className="mt-2 space-y-1">
                  {leagues.map((league) => (
                    <Link
                      key={league.id}
                      to={league.comingSoon ? '#' : `/league/${league.id}`}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        league.comingSoon
                          ? 'text-gray-500 cursor-not-allowed'
                          : 'text-gray-300 hover:bg-transparent'
                      }`}
                      onClick={(e) => {
                        if (league.comingSoon) {
                          e.preventDefault();
                        } else {
                          setIsMenuOpen(false);
                        }
                      }}
                    >
                      <span className="mr-2">{league.icon}</span>
                      {league.name}
                      {league.comingSoon && <span className="ml-2 text-xs text-yellow-400">(Coming Soon)</span>}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

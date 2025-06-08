import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, Settings } from 'lucide-react';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const isTeamsPage = location.pathname === '/teams';
  const isGamesPage = location.pathname.includes('/upcoming-games');
  const isProfile = location.pathname.includes('/profile');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 md:hidden">
      <nav className="flex items-center justify-around h-16">
        <Link 
          to="/dashboard" 
          className={`flex flex-col items-center justify-center w-full h-full ${isDashboard ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Home className={`h-5 w-5 ${isDashboard ? 'text-primary' : ''}`} />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link 
          to="/upcoming-games" 
          className={`flex flex-col items-center justify-center w-full h-full ${isGamesPage ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Calendar className={`h-5 w-5 ${isGamesPage ? 'text-primary' : ''}`} />
          <span className="text-xs mt-1">Games</span>
        </Link>
        
        <Link 
          to="/teams" 
          className={`flex flex-col items-center justify-center w-full h-full ${isTeamsPage ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Users className={`h-5 w-5 ${isTeamsPage ? 'text-primary' : ''}`} />
          <span className="text-xs mt-1">Teams</span>
        </Link>
        
        <Link 
          to="/profile" 
          className={`flex flex-col items-center justify-center w-full h-full ${isProfile ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Settings className={`h-5 w-5 ${isProfile ? 'text-primary' : ''}`} />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </nav>
    </div>
  );
};

export default MobileBottomNav;

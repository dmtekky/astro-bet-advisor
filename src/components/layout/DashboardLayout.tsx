
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { toast } = useToast();
  
  const handleConnectSupabase = () => {
    toast({
      title: "Supabase Connection Required",
      description: "Please connect Supabase using the Lovable integration to unlock all features.",
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg 
              viewBox="0 0 24 24" 
              className="w-8 h-8 text-primary" 
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-7.5l4-4 1.41 1.41L11.83 14 10 12.17z" />
            </svg>
            <h1 className="text-xl font-bold">BettingAssist</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="secondary" 
              onClick={handleConnectSupabase}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Connect Supabase
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container py-6">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border p-4">
        <div className="container text-sm text-muted-foreground text-center">
          <p>Sports Betting Assistance App © {new Date().getFullYear()}</p>
          <p className="text-xs mt-1">Powered by The Odds API, Sports Game Odds API, and Swiss Ephemeris</p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;

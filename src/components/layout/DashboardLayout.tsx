import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SportNavigation from '@/components/navigation/SportNavigation';

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
      <header className="border-b border-border">
        <div className="container">
          <div className="flex justify-between items-center p-4">
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

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Share2Icon, 
  TwitterIcon, 
  FacebookIcon, 
  LinkIcon, 
  CheckIcon
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface TeamShareButtonProps {
  team: {
    id: string;
    name: string;
    logo: string;
    astroScore: number;
    leagueSlug: string;
    teamSlug: string;
  };
}

const TeamShareButton: React.FC<TeamShareButtonProps> = ({ team }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const teamPageUrl = `${window.location.origin}/teams/${team.leagueSlug}/${team.teamSlug}`;
  const shareText = `Check out ${team.name}'s Astro Score: ${team.astroScore} on Astro Bet Advisor!`;
  
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${team.name} - Astro Bet Advisor`,
          text: shareText,
          url: teamPageUrl,
        });
        trackShareEvent('mobile_share');
      } else {
        // Fallback for desktop
        setCopied(true);
        navigator.clipboard.writeText(`${shareText} ${teamPageUrl}`);
        
        toast({
          title: 'Link copied!',
          description: 'Team link copied to clipboard',
        });
        
        setTimeout(() => setCopied(false), 2000);
        trackShareEvent('clipboard');
      }
    } catch (err) {
      toast({
        title: 'Sharing failed',
        description: 'Could not share team details',
        variant: 'destructive',
      });
    }
  };
  
  const handlePlatformShare = (platform: string) => {
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(teamPageUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(teamPageUrl)}`;
        break;
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
    trackShareEvent(platform);
  };
  
  const trackShareEvent = (platform: string) => {
    // Implement analytics tracking here
    console.log(`Shared ${team.name} via ${platform}`);
    // Example: analytics.track('team_shared', { team: team.id, platform });
  };
  
  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="secondary"
            className="flex items-center gap-2"
            aria-label="Share team"
          >
            <Share2Icon className="h-4 w-4" />
            <span>Share Team</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <DropdownMenuItem 
            onClick={() => handlePlatformShare('twitter')}
            className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
          >
            <TwitterIcon className="h-4 w-4 text-blue-400" />
            <span className="text-sm">Twitter</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handlePlatformShare('facebook')}
            className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
          >
            <FacebookIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Facebook</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => {
              navigator.clipboard.writeText(teamPageUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
              trackShareEvent('clipboard');
              
              toast({
                title: 'Link copied!',
                description: 'Team link copied to clipboard',
              });
            }}
            className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-500" />
            ) : (
              <LinkIcon className="h-4 w-4" />
            )}
            <span className="text-sm">{copied ? 'Copied!' : 'Copy Link'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TeamShareButton;

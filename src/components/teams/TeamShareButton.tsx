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
    astro_score?: number;
    leagueSlug: string;
    teamSlug: string;
  };
  className?: string;
}

const TeamShareButton: React.FC<TeamShareButtonProps> = ({ team, className = '' }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Ensure we have required team data
  if (!team || !team.leagueSlug || !team.teamSlug) {
    console.error('Missing required team data for sharing');
    return null;
  }

  // Use team abbreviation for a cleaner URL
  const teamPageUrl = `${window.location.origin}/teams/${team.teamSlug.toLowerCase()}`;
  const astroScore = team.astro_score ?? 0;
  const teamName = team.name || 'This team';
  const leagueEmoji = getLeagueEmoji(team.leagueSlug);

  // Format for sharing - team page URL is the main link
  const shareText = `${leagueEmoji} ${teamName}'s Astro Score: ${astroScore}/100 - See how the stars align for their performance!`;

  function getLeagueEmoji(leagueSlug: string) {
    switch (leagueSlug.toLowerCase()) {
      case 'mlb':
        return '⚾'; // Baseball
      case 'nba':
        return '🏀'; // Basketball
      case 'nfl':
        return '🏈'; // American Football
      default:
        return '⭐'; // Default star emoji
    }
  }

  const trackShareEvent = (platform: string) => {
    // Implement analytics tracking here
    try {
      console.log(`Shared ${teamName} via ${platform}`, {
        teamId: team.id,
        teamName: teamName,
        astroScore,
        platform,
        timestamp: new Date().toISOString()
      });
      // Example: analytics.track('team_shared', { team: team.id, platform });
    } catch (error) {
      console.error('Error tracking share event:', error);
    }
  };

  const handleShare = async () => {
    if (!navigator.share && !navigator.clipboard) {
      console.error('Web Share API and Clipboard API not supported');
      toast({
        title: 'Sharing not supported',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Prepare share data with the team page URL as the main link
      const shareData: ShareData = {
        title: `${teamName} - Full Moon Odds`,
        text: team.logo 
          ? `${shareText}\n\n${team.logo}` // Include logo URL in text as fallback
          : shareText,
        url: teamPageUrl,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        trackShareEvent('mobile_share');
      } else {
        // Fallback for desktop
        try {
          await navigator.clipboard.writeText(`${shareText} ${teamPageUrl}`);
          setCopied(true);
          
          toast({
            title: 'Link copied!',
            description: 'Team link copied to clipboard',
          });
          
          setTimeout(() => setCopied(false), 2000);
          trackShareEvent('clipboard');
        } catch (err) {
          console.error('Failed to copy:', err);
          toast({
            title: 'Failed to copy',
            description: 'Please copy the link manually',
            variant: 'destructive',
          });
        }
      }
    } catch (err) {
      // User cancelled the share, no need to show an error
      if (err.name !== 'AbortError') {
        toast({
          title: 'Sharing failed',
          description: 'Could not share team details',
          variant: 'destructive',
        });
      }
    }
  };
  
  const handlePlatformShare = (platform: 'twitter' | 'facebook') => {
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(teamPageUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(teamPageUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      trackShareEvent(platform);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(teamPageUrl)
      .then(() => {
        setCopied(true);
        toast({
          title: 'Link copied!',
          description: 'Team link copied to clipboard',
        });
        setTimeout(() => setCopied(false), 2000);
        trackShareEvent('clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        toast({
          title: 'Failed to copy',
          description: 'Please copy the link manually',
          variant: 'destructive',
        });
      });
  };
  
  return (
    <div className={`relative ${className}`}>
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
            onClick={handleCopyLink}
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

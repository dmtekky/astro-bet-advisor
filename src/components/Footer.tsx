import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Facebook, Share2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Footer: React.FC = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const { toast } = useToast();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const socialLinks = [
    { 
      name: 'Twitter', 
      icon: <Twitter className="w-5 h-5" />, 
      url: 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(window.location.href) 
    },
    { 
      name: 'Instagram', 
      icon: <Instagram className="w-5 h-5" />, 
      url: 'https://www.instagram.com/fullmoonodds' 
    },
    { 
      name: 'Facebook', 
      icon: <Facebook className="w-5 h-5" />, 
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` 
    },
  ];

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast({
      title: 'Link copied!',
      description: 'Share this link with your friends!',
    });
    setTimeout(() => setIsCopied(false), 2000);
  }, [toast]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out Full Moon Odds',
          text: 'Discover astrological insights for sports betting!',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      setIsShareOpen(!isShareOpen);
    }
  }, [isShareOpen]);

  const leagues = [
    { id: 'nba', name: 'NBA', icon: '🏀' },
    { id: 'mlb', name: 'MLB', icon: '⚾' },
    { id: 'nfl', name: 'NFL', icon: '🏈' },
    { id: 'boxing', name: 'Boxing', icon: '🥊' },
    { id: 'soccer', name: 'Soccer', icon: '⚽', comingSoon: true },
    { id: 'ncaa', name: 'NCAA Football', icon: '🏈', comingSoon: true },
  ];

  const footerLinks = [
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    { to: '/upcoming-games', label: 'Games' },
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Service' },
  ];

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Leagues */}
          <div>
            <h3 className="text-lg font-bold mb-4">Leagues</h3>
            <ul className="space-y-2">
              {leagues.map((league) => (
                <li key={league.id}>
                  <Link
                    to={league.comingSoon ? '#' : `/league/${league.id}`}
                    className={`flex items-center text-gray-400 hover:text-yellow-400 transition-colors ${
                      league.comingSoon ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={(e) => league.comingSoon && e.preventDefault()}
                  >
                    <span className="mr-2">{league.icon}</span>
                    {league.name}
                    {league.comingSoon && <span className="ml-1 text-xs text-yellow-400">(Soon)</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:info@fullmoonodds.com" 
                  className="text-gray-400 hover:text-yellow-400 flex items-center transition-colors"
                >
                  <span className="mr-2">✉️</span>
                  info@fullmoonodds.com
                </a>
              </li>

            </ul>
          </div>

          {/* About */}
          <div>
            <div 
              className="cursor-pointer mb-4"
              onClick={() => setIsAboutOpen(!isAboutOpen)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsAboutOpen(!isAboutOpen)}
            >
              <h3 className="text-lg font-bold">About Full Moon Odds</h3>
              <p className="text-gray-400 mt-2">
                Blending astrology and sports betting to provide unique insights into game predictions.
              </p>
              <div className="space-y-4 mt-4">
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border-gray-700 text-white"
                >
                  <Share2 className="w-5 h-5" />
                  Share This Page
                </Button>
                
                {isShareOpen && (
                  <div className="mt-2 p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-300">Share via</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsShareOpen(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        ×
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {socialLinks.map((social) => (
                        <a
                          key={social.name}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[80px] flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
                        >
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 mb-2">
                            {React.cloneElement(social.icon, { className: 'w-5 h-5' })}
                          </div>
                          <span className="text-xs">{social.name}</span>
                        </a>
                      ))}
                      <button
                        onClick={copyToClipboard}
                        className={`flex-1 min-w-[80px] flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                          isCopied 
                            ? 'bg-green-900/50 text-green-400' 
                            : 'hover:bg-gray-700 text-gray-300 hover:text-white'
                        }`}
                      >
                        <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 ${
                          isCopied ? 'bg-green-800/50' : 'bg-gray-700'
                        }`}>
                          <Copy className={`w-5 h-5 ${isCopied ? 'text-green-400' : ''}`} />
                        </div>
                        <span className="text-xs">{isCopied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Venusian Labs. All rights reserved.</p>
          <p className="mt-2">Not affiliated with any professional sports league.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

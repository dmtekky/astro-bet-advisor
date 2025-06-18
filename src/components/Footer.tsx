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
      url: 'https://www.instagram.com/' 
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
    <footer className="bg-gray-900 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p> 2024 AstroBet Advisor. All rights reserved.</p>
          </div>
          <div className="flex space-x-4">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-400 hover:text-white text-sm"
              >
                {link.label}
              </Link>
            ))}
            <Link 
              to="/preview/profile" 
              className="text-gray-400 hover:text-white text-sm"
              title="Preview Profile"
            >
              Profile Preview
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

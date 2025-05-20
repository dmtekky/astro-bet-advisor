import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const socialLinks = [
    { name: 'Twitter', icon: '🐦', url: '#' },
    { name: 'Instagram', icon: '📸', url: '#' },
    { name: 'Facebook', icon: '👍', url: '#' },
  ];

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
              <li>
                <a 
                  href="tel:+1234567890" 
                  className="text-gray-400 hover:text-yellow-400 flex items-center transition-colors"
                >
                  <span className="mr-2">📞</span>
                  (123) 456-7890
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
              <div className="flex space-x-4 mt-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    className="text-gray-400 hover:text-yellow-400 transition-colors duration-200 text-2xl"
                    aria-label={social.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Full Moon Odds. All rights reserved.</p>
          <p className="mt-2">Not affiliated with any professional sports league.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

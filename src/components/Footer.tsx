import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const socialLinks = [
    { name: 'Twitter', icon: '🐦', url: '#' },
    { name: 'Instagram', icon: '📸', url: '#' },
    { name: 'Facebook', icon: '👍', url: '#' },
  ];

  const footerLinks = [
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Service' },
  ];

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="md:col-span-2">
            <div 
              className="flex items-center cursor-pointer mb-4"
              onClick={() => setIsAboutOpen(!isAboutOpen)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsAboutOpen(!isAboutOpen)}
            >
              <h3 className="text-lg font-bold">About Full Moon Odds</h3>
              <span className="ml-2">{isAboutOpen ? '−' : '+'}</span>
            </div>
            
            {isAboutOpen && (
              <p className="text-gray-400 mb-4">
                Blending astrology and sports betting to provide unique insights into game predictions. 
                Our platform analyzes celestial alignments to give you an edge in your betting strategy.
              </p>
            )}
            
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

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <div className="space-y-2">
              <p className="text-gray-400">Email: info@fullmoonodds.com</p>
              <p className="text-gray-400">Phone: (555) 123-4567</p>
              <Link
                to="/contact"
                className="inline-block mt-2 px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-400 transition-colors duration-200"
              >
                Contact Form
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black">
              🌑
            </div>
            <span className="font-bold">Full Moon Odds</span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Full Moon Odds. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

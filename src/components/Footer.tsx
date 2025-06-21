import React from 'react';
import { Link } from 'react-router-dom';
import AmazonAffiliateBanner from '@/components/AmazonAffiliateBanner';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { to: '/about', label: 'About Us' },
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Service' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <>
      {/* Amazon Banner above footer */}
      <div className="border-t border-gray-100">
        <AmazonAffiliateBanner />
      </div>
      
      <footer className="bg-gray-900 text-white border-t border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p> {currentYear} Full Moon Odds. All rights reserved.</p>
            <p className="mt-2">Not affiliated with any professional sports league.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;

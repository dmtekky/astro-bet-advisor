import React, { useEffect, useState } from 'react';

const AmazonAffiliateBanner: React.FC = () => {
  // Replace with your actual Amazon affiliate link
  const amazonLink = "https://www.amazon.com/prime";

  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Start fading after 100px scroll
      const newOpacity = Math.max(0, 1 - scrollY / 200);
      setOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className="relative w-full bg-gradient-to-r from-blue-900 to-blue-600 text-white py-2 px-4 flex items-center justify-center"
      style={{ opacity }}
    >
      <div className="container mx-auto">
        <a 
          href={amazonLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="font-medium">Powered by</span>
          <img 
            src="/images/amazon-prime-logo-white.png" 
            alt="Amazon Prime" 
            className="h-5"
            onError={(e) => {
              // Fallback to text if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const text = target.parentElement?.querySelector('.fallback-text');
              if (text) text.classList.remove('hidden');
            }}
          />
          <span className="hidden fallback-text font-bold">AMAZON PRIME</span>
        </a>
      </div>
    </div>
  );
};

export default AmazonAffiliateBanner;

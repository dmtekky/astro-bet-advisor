import React, { useEffect } from 'react';

interface AdSenseProps {
  slot: string;
  format?: string;
  responsive?: boolean;
}

const AdSense: React.FC<AdSenseProps> = ({
  slot,
  format = 'auto',
  responsive = true,
}) => {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className="bg-white shadow-md rounded-lg p-4 max-w-md mx-auto text-center transition-all duration-300 hover:shadow-lg">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-YOUR_ADSENSE_PUBLISHER_ID" // Replace with your AdSense Publisher ID
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      ></ins>
    </div>
  );
};

export default AdSense;

import React from 'react';

const AmazonAffiliateBanner: React.FC = () => {
  const amazonLink = "https://www.amazon.com?&linkCode=ll2&tag=fullmoonodds-20&linkId=0fbb6f99ad5a2c3ad6a88aa0207948c8&language=en_US&ref_=as_li_ss_tl";

  return (
    <div className="w-full bg-blue-600 text-white py-1.5 px-0 flex justify-center items-center">
      <a 
        href={amazonLink} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 hover:underline"
      >
        <span className="font-bold text-sm">POWERED BY</span>
        <span className="font-bold text-yellow-300 ml-1">AMAZON PRIME</span>
      </a>
    </div>
  );
};

export default AmazonAffiliateBanner;

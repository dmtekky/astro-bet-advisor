import React from 'react';

const AmazonAffiliateBanner: React.FC = () => {
  const amazonLink = "https://www.amazon.com/amazonprime?&linkCode=ll2&tag=fullmoonodds-20&linkId=b29a0bc34867f77d625c60791d60a732&language=en_US&ref_=as_li_ss_tl";

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

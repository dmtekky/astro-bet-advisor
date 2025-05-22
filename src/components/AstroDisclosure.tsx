import React from 'react';

/**
 * Short disclosure for sidereal vs western astrology.
 */
const AstroDisclosure: React.FC = () => (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded text-xs text-yellow-900 max-w-2xl">
    <strong>Note:</strong> This app uses sidereal astrology (real star positions), which may differ from Western astrology.
  </div>
);

export default AstroDisclosure;

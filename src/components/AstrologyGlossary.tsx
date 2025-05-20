import React, { useState } from 'react';

const glossary = [
  { term: "Full Moon", definition: "The phase when the Moon is fully illuminated, often associated with heightened energy and performance." },
  { term: "Mercury Retrograde", definition: "An astrological event believed to affect communication and coordination negatively." },
  { term: "Jupiter in Cancer", definition: "A planetary position thought to enhance rebounding and emotional resilience." },
  // Add more terms as needed
];

const AstrologyGlossary: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg mb-6">
      <button
        className="font-semibold text-lg mb-2 focus:outline-none"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {open ? 'Hide' : 'Show'} Astrology Glossary
      </button>
      {open && (
        <ul className="mt-2 space-y-2">
          {glossary.map(({ term, definition }) => (
            <li key={term}>
              <span className="font-bold">{term}:</span> {definition}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AstrologyGlossary;

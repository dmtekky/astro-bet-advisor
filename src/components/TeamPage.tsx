import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import CelestialMap from "./CelestialMap";
import { calculateAstrologicalImpact, calculatePlanetarySignsImpact } from "@/lib/astroFormula";

// Dummy astrological_data for demo; replace with real data source
const astrological_data = [
  { name: "Full Moon", impact: 10, description: "Favors home teams" },
  { name: "Mars in Aries", impact: 5, description: "Boosts offense" },
  { name: "Mercury Retrograde", impact: -3, description: "Affects communication" },
];

function getTopImpact(data) {
  return data.reduce((max, curr) => (curr.impact > max.impact ? curr : max), data[0]);
}

function getSortedImpacts(data) {
  return [...data].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

const TeamPage: React.FC = () => {
  // In real app, get astrological_data from props or API
  const topImpact = getTopImpact(astrological_data);
  const sortedImpacts = getSortedImpacts(astrological_data);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Simplified Astrological Insight */}
      <div className="bg-gradient-to-r from-indigo-900 to-black text-white p-4 rounded-lg mb-6 flex items-center gap-2">
        <span className="font-semibold text-lg" data-tooltip-id="top-impact-tip" data-tooltip-content={topImpact.description}>
          {topImpact.name}: {topImpact.impact > 0 ? "+" : ""}{topImpact.impact}%
        </span>
        <Tooltip id="top-impact-tip" />
      </div>

      {/* ...Team details and stats would go here... */}

      {/* Detailed Astrological Impacts */}
      <div className="bg-gray-800 text-white p-4 rounded-lg mt-12 mb-4">
        <div className="font-bold mb-2">All Astrological Impacts</div>
        <ul className="space-y-1">
          {sortedImpacts.map(impact => (
            <li key={impact.name} className="flex items-center gap-2">
              <span className="font-semibold" data-tooltip-id={`tip-${impact.name}`} data-tooltip-content={impact.description}>
                {impact.name}:
              </span>
              <span>{impact.impact > 0 ? "+" : ""}{impact.impact}%</span>
              <Tooltip id={`tip-${impact.name}`} />
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end">
          <Link to="/celestial-map">
            <button className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-4 py-2 rounded-lg transition">View Celestial Map</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;

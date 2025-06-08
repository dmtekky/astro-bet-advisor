export default function AstroLegend() {
  return (
    <div className="mt-4 p-3 bg-gray-100 rounded shadow text-gray-700 text-sm">
      <div className="font-semibold mb-2">Astrological Events Legend</div>
      <ul className="space-y-1">
        <li><span className="font-bold">Moon Phase</span>: Emotional climate, momentum</li>
        <li><span className="font-bold">Moon Sign</span>: Mood, intuition, team chemistry</li>
        <li><span className="font-bold">Mercury in Virgo</span>: Communication, precision</li>
        <li><span className="font-bold">Venus in Gemini</span>: Social energy, teamwork</li>
        <li><span className="font-bold">Mars in Pisces</span>: Motivation, adaptability</li>
        <li><span className="font-bold">Jupiter in Cancer</span>: Luck, expansion, optimism</li>
        <li><span className="font-bold">Mercury Retrograde</span>: Disruption, unpredictability</li>
        <li><span className="font-bold">Sun-Mars Transit</span>: Drive, aggression</li>
        <li><span className="font-bold">Sun-Saturn Transit</span>: Discipline, restriction</li>
        <li><span className="font-bold">Sun-Jupiter Transit</span>: Opportunity, growth</li>
      </ul>
    </div>
  );
}

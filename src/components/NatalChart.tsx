import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';

type PlanetPosition = {
  name: string;
  symbol: string;
  sign: string;
  angle: number;
  house: number;
};

type Aspect = {
  planet1: string;
  planet2: string;
  angle: number;
  type: string;
};

interface NatalChartProps {
  birthDate: Date;
  birthTime?: string;
  birthLocation?: string;
  width?: number;
  height?: number;
}

const NatalChart: React.FC<NatalChartProps> = ({ 
  birthDate, 
  birthTime = '12:00', 
  birthLocation = 'Unknown', 
  width = 600, 
  height = 600 
}) => {
  const [planetaryPositions, setPlanetaryPositions] = useState<PlanetPosition[]>([]);
  const [aspects, setAspects] = useState<Aspect[]>([]);
  const [loading, setLoading] = useState(true);
  
  const radius = Math.min(width, height) / 2 - 40;
  const centerX = width / 2;
  const centerY = height / 2;

  // Mock data for the natal chart
  const mockPlanetaryPositions = [
    { name: 'Sun', symbol: '☉', sign: 'Leo', angle: 120, house: 5 },
    { name: 'Moon', symbol: '☽', sign: 'Aries', angle: 15, house: 1 },
    { name: 'Mercury', symbol: '☿', sign: 'Leo', angle: 110, house: 5 },
    { name: 'Venus', symbol: '♀', sign: 'Cancer', angle: 95, house: 4 },
    { name: 'Mars', symbol: '♂', sign: 'Gemini', angle: 75, house: 3 },
    { name: 'Jupiter', symbol: '♃', sign: 'Pisces', angle: 350, house: 12 },
    { name: 'Saturn', symbol: '♄', sign: 'Aquarius', angle: 320, house: 10 },
    { name: 'Uranus', symbol: '♅', sign: 'Taurus', angle: 45, house: 2 },
    { name: 'Neptune', symbol: '♆', sign: 'Pisces', angle: 10, house: 1 },
    { name: 'Pluto', symbol: '♇', sign: 'Capricorn', angle: 290, house: 9 }
  ];

  const mockAspects = [
    { planet1: 'Sun', planet2: 'Moon', angle: 45, type: 'square' },
    { planet1: 'Mercury', planet2: 'Venus', angle: 60, type: 'sextile' },
    { planet1: 'Mars', planet2: 'Jupiter', angle: 90, type: 'square' },
    { planet1: 'Saturn', planet2: 'Uranus', angle: 120, type: 'trine' },
    { planet1: 'Neptune', planet2: 'Pluto', angle: 180, type: 'opposition' }
  ];

  // Use mock data instead of API call
  useEffect(() => {
    setLoading(true);
    console.log('Using mock data for natal chart');
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      setPlanetaryPositions(mockPlanetaryPositions);
      setAspects(mockAspects);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [birthDate]);
  
  // Uncomment this to use the real API when it's working
  /*
  // Fetch natal chart data from our API
  useEffect(() => {
    const fetchNatalData = async () => {
      try {
        setLoading(true);
        
        // Format date for API: YYYY-MM-DD
        const formattedDate = birthDate.toISOString().split('T')[0];
        const requestBody = {
          birthDate: formattedDate,
          birthTime,
          birthLocation
        };
        
        console.log('Sending request to /api/astrology/natal-chart with:', requestBody);
        
        // Call our astrology API
        const response = await fetch('/api/astrology/natal-chart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`Failed to fetch natal chart data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        setPlanetaryPositions(data.positions || mockPlanetaryPositions);
        setAspects(data.aspects || mockAspects);
      } catch (err) {
        console.error('Error in fetchNatalData, using mock data instead:', err);
        setPlanetaryPositions(mockPlanetaryPositions);
        setAspects(mockAspects);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNatalData();
  }, [birthDate, birthTime, birthLocation]);
  */

  // Draw the chart after data loads
  useEffect(() => {
    if (planetaryPositions.length === 0) return;
    
    const svg = d3.select('#natal-chart-svg');
    svg.selectAll('*').remove();
    
    // Draw houses
    const houseAngles = Array.from({length: 12}, (_, i) => i * 30);
    const g = svg.append('g').attr('transform', `translate(${centerX}, ${centerY})`);
    
    // Draw house lines
    houseAngles.forEach(angle => {
      const rad = angle * Math.PI / 180;
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', Math.cos(rad) * radius)
        .attr('y2', Math.sin(rad) * radius)
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 1);
    });
    
    // Draw zodiac signs
    const signAngles = Array.from({length: 12}, (_, i) => i * 30 + 15);
    signAngles.forEach((angle, i) => {
      const rad = angle * Math.PI / 180;
      const textRadius = radius * 0.9;
      g.append('text')
        .attr('x', Math.cos(rad) * textRadius)
        .attr('y', Math.sin(rad) * textRadius)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#334155')
        .attr('font-size', 12)
        .attr('font-weight', 'bold')
        .text(['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis'][i]);
    });
    
    // Draw planets
    planetaryPositions.forEach(planet => {
      const rad = (planet.angle - 90) * Math.PI / 180;
      const planetRadius = radius * 0.7;
      
      g.append('circle')
        .attr('cx', Math.cos(rad) * planetRadius)
        .attr('cy', Math.sin(rad) * planetRadius)
        .attr('r', 10)
        .attr('fill', 'white')
        .attr('stroke', '#4f46e5')
        .attr('stroke-width', 1.5);
        
      g.append('text')
        .attr('x', Math.cos(rad) * planetRadius)
        .attr('y', Math.sin(rad) * planetRadius)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#1e293b')
        .attr('font-size', 12)
        .attr('font-weight', 'bold')
        .text(planet.symbol);
    });
    
    // Draw aspects
    aspects.forEach(aspect => {
      const planet1 = planetaryPositions.find(p => p.name === aspect.planet1);
      const planet2 = planetaryPositions.find(p => p.name === aspect.planet2);
      
      if (planet1 && planet2) {
        const rad1 = (planet1.angle - 90) * Math.PI / 180;
        const rad2 = (planet2.angle - 90) * Math.PI / 180;
        const planetRadius = radius * 0.7;
        
        g.append('line')
          .attr('x1', Math.cos(rad1) * planetRadius)
          .attr('y1', Math.sin(rad1) * planetRadius)
          .attr('x2', Math.cos(rad2) * planetRadius)
          .attr('y2', Math.sin(rad2) * planetRadius)
          .attr('stroke', getAspectColor(aspect.type))
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', aspect.type === 'sextile' ? '4,4' : 'none');
      }
    });
    
  }, [planetaryPositions, aspects]);
  
  const getAspectColor = (type: string) => {
    const colors: Record<string, string> = {
      'conjunction': '#4f46e5',
      'sextile': '#10b981',
      'square': '#ef4444',
      'trine': '#8b5cf6',
      'opposition': '#f59e0b'
    };
    return colors[type] || '#94a3b8';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Chart Visualization */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Natal Chart</h3>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-sm text-gray-600">Calculating planetary positions...</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <svg id="natal-chart-svg" width={width} height={height}></svg>
            </div>
          )}
        </div>
        
        {/* Planet Information */}
        <div className="md:w-1/3">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Planetary Positions</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500">Planet</span>
              <span className="text-sm font-medium text-gray-500">Position</span>
            </div>
            
            {planetaryPositions.map(planet => (
              <div key={planet.name} className="flex justify-between items-center py-2">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">{planet.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{planet.sign}</span>
                  <span className="block text-xs text-gray-500">House {planet.house}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Key Aspects</h4>
            <div className="space-y-2">
              {aspects.slice(0, 5).map(aspect => (
                <div key={`${aspect.planet1}-${aspect.planet2}`} className="flex items-center text-sm">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: getAspectColor(aspect.type) }}
                  ></div>
                  <span className="font-medium text-gray-900">{aspect.planet1}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="font-medium text-gray-900">{aspect.planet2}</span>
                  <span className="ml-2 text-gray-500">{aspect.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
        <p>Born on {birthDate.toLocaleDateString()} at {birthTime} in {birthLocation}</p>
      </div>
    </div>
  );
};

export default NatalChart;

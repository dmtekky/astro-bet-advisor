import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

// Simple planet data with positions and glyphs
const PLANETS = [
  { name: 'Sun', glyph: '☉', color: '#FDB813', size: 24 },
  { name: 'Moon', glyph: '☽', color: '#E8E8E8', size: 20 },
  { name: 'Mercury', glyph: '☿', color: '#A0A0A0', size: 16 },
  { name: 'Venus', glyph: '♀', color: '#E6C229', size: 18 },
  { name: 'Mars', glyph: '♂', color: '#C1440E', size: 18 },
  { name: 'Jupiter', glyph: '♃', color: '#C88B3A', size: 22 },
  { name: 'Saturn', glyph: '♄', color: '#E4D191', size: 20 },
  { name: 'Uranus', glyph: '♅', color: '#D1E7E7', size: 16 },
  { name: 'Neptune', glyph: '♆', color: '#5B5DDF', size: 16 },
  { name: 'Pluto', glyph: '♇', color: '#BDAE7F', size: 14 },
];

// Zodiac signs with their symbols and dates
const ZODIAC = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Simple calculation for planet positions (simplified for demo)
const calculatePlanetPositions = () => {
  const now = new Date();
  const time = now.getTime();
  
  // Simple animation based on current time
  const baseAngle = (time * 0.0001) % (Math.PI * 2);
  
  return PLANETS.map((planet, i) => {
    // Each planet has its own orbit and speed
    const orbitRadius = 100 + (i * 15);
    const speed = 1 / (i + 1);
    const angle = (baseAngle * speed) % (Math.PI * 2);
    
    return {
      ...planet,
      x: Math.cos(angle) * orbitRadius,
      y: Math.sin(angle) * (orbitRadius * 0.6), // Flatten the ellipse
      angle: angle * (180 / Math.PI),
      sign: ZODIAC[Math.floor(angle / (Math.PI / 6)) % 12],
      retrograde: i > 2 && Math.random() > 0.9 // Random retrograde for demo
    };
  });
};

const CelestialMap: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme } = useTheme();
  const [planets, setPlanets] = useState(calculatePlanetPositions());
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  
  // Update dimensions on mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const size = Math.min(container.clientWidth, 600);
        setDimensions({ width: size, height: size });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Animation loop
  useEffect(() => {
    const animate = () => {
      setPlanets(calculatePlanetPositions());
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Draw the celestial map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw zodiac ring
    const ringRadius = Math.min(width, height) * 0.45;
    ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw zodiac signs
    const signRadius = ringRadius + 15;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    
    ZODIAC.forEach((sign, i) => {
      const angle = (i * Math.PI * 2) / 12 - Math.PI/2;
      const x = centerX + Math.cos(angle) * signRadius;
      const y = centerY + Math.sin(angle) * signRadius;
      ctx.fillText(sign[0], x, y);
    });
    
    // Draw orbits and planets
    planets.forEach((planet) => {
      const x = centerX + planet.x;
      const y = centerY + planet.y;
      
      // Draw orbit
      ctx.beginPath();
      ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
      ctx.ellipse(centerX, centerY, Math.abs(planet.x) + 10, Math.abs(planet.y * 1.6) + 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw planet
      const isHovered = hoveredPlanet === planet.name;
      const size = isHovered ? planet.size * 1.5 : planet.size;
      
      ctx.font = `bold ${size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add glow effect on hover
      if (isHovered) {
        ctx.shadowColor = planet.color;
        ctx.shadowBlur = 15;
      }
      
      // Retrograde indicator (R)
      if (planet.retrograde) {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 10px Arial';
        ctx.fillText('R', x + 15, y - 15);
      }
      
      // Planet symbol
      ctx.fillStyle = planet.color;
      ctx.fillText(planet.glyph, x, y);
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Planet name on hover
      if (isHovered) {
        ctx.fillStyle = theme === 'dark' ? '#fff' : '#000';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(planet.name, x, y - 25);
        ctx.fillText(planet.sign, x, y + 25);
      }
    });
  }, [planets, hoveredPlanet, dimensions, theme]);
  
  return (
    <div className={`relative ${className}`}>
      <div className="relative w-full h-full">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-auto"
          onMouseMove={(e) => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Simple hit test
            const planet = planets.find(p => {
              const px = dimensions.width / 2 + p.x;
              const py = dimensions.height / 2 + p.y;
              const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
              return distance < p.size * 1.5;
            });
            
            setHoveredPlanet(planet?.name || null);
          }}
          onMouseLeave={() => setHoveredPlanet(null)}
        />
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Hover over planets for details • Current time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default CelestialMap;

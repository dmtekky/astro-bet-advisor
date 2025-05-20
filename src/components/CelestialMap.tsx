import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

// Planet data with positions, glyphs, and orbital properties
const PLANETS = [
  { 
    name: 'Sun', 
    glyph: '☉', 
    color: '#FDB813', 
    size: 32,
    orbitRadius: 0 
  },
  { 
    name: 'Mercury', 
    glyph: '☿', 
    color: '#A0A0A0', 
    size: 14,
    orbitRadius: 100,
    speed: 0.24
  },
  { 
    name: 'Venus', 
    glyph: '♀', 
    color: '#E6C229', 
    size: 18,
    orbitRadius: 150,
    speed: 0.16
  },
  { 
    name: 'Earth', 
    glyph: '🌍', 
    color: '#1E90FF', 
    size: 20,
    orbitRadius: 200,
    speed: 0.1
  },
  { 
    name: 'Mars', 
    glyph: '♂', 
    color: '#C1440E', 
    size: 16,
    orbitRadius: 260,
    speed: 0.08
  },
  { 
    name: 'Jupiter', 
    glyph: '♃', 
    color: '#C88B3A', 
    size: 28,
    orbitRadius: 340,
    speed: 0.04
  },
  { 
    name: 'Saturn', 
    glyph: '♄', 
    color: '#E4D191', 
    size: 26,
    orbitRadius: 420,
    speed: 0.02,
    hasRings: true
  },
  { 
    name: 'Uranus', 
    glyph: '♅', 
    color: '#D1E7E7', 
    size: 22,
    orbitRadius: 500,
    speed: 0.01
  },
  { 
    name: 'Neptune', 
    glyph: '♆', 
    color: '#5B5DDF', 
    size: 22,
    orbitRadius: 580,
    speed: 0.006
  },
  { 
    name: 'Pluto', 
    glyph: '♇', 
    color: '#BDAE7F', 
    size: 12,
    orbitRadius: 640,
    speed: 0.003
  }
];

// Calculate 3D position with 35 degree perspective
const calculate3DPosition = (x: number, y: number, z: number) => {
  const angle = 35 * (Math.PI / 180);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  // Apply rotation around X axis
  const y2 = y * cos - z * sin;
  const z2 = y * sin + z * cos;
  
  // Simple perspective projection
  const distance = 1000;
  const factor = distance / (distance + z2);
  
  return {
    x: x * factor,
    y: y2 * factor,
    scale: factor
  };
};

// Zodiac signs with their symbols and dates
const ZODIAC = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Calculate planet positions with 3D perspective
const calculatePlanetPositions = () => {
  const now = new Date();
  const time = now.getTime();
  
  // Base angle for animation
  const baseAngle = (time * 0.00005) % (Math.PI * 2);
  
  return PLANETS.map((planet) => {
    if (planet.orbitRadius === 0) {
      // Sun stays in the center
      return {
        ...planet,
        x: 0,
        y: 0,
        z: 0,
        scale: 1,
        angle: 0,
        retrograde: false
      };
    }
    
    // Calculate orbital position
    const angle = (baseAngle * (planet.speed || 1)) % (Math.PI * 2);
    const x = Math.cos(angle) * planet.orbitRadius;
    const y = Math.sin(angle) * (planet.orbitRadius * 0.6); // Slight elliptical orbit
    const z = Math.sin(angle * 0.5) * (planet.orbitRadius * 0.3); // Depth variation
    
    // Apply 3D perspective
    const pos = calculate3DPosition(x, y, z);
    
    return {
      ...planet,
      x: pos.x,
      y: pos.y,
      z: z,
      scale: pos.scale,
      angle: angle * (180 / Math.PI),
      retrograde: Math.random() > 0.98 // 2% chance of retrograde
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
    
    // Draw starfield background
    if (theme === 'dark') {
      ctx.fillStyle = '#0A0E17';
      ctx.fillRect(0, 0, width, height);
      
      // Draw stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.5;
        ctx.fillRect(x, y, size, size);
      }
    } else {
      // Light theme background
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(width, height) / 1.5
      );
      gradient.addColorStop(0, '#F0F4F8');
      gradient.addColorStop(1, '#D6E4F0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Draw grid lines for perspective
    ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    
    // Sort planets by z-index for proper depth rendering
    const sortedPlanets = [...planets].sort((a, b) => (a.z || 0) - (b.z || 0));
    
    // Draw orbits and planets with 3D perspective
    sortedPlanets.forEach((planet) => {
      const x = centerX + (planet.x || 0);
      const y = centerY + (planet.y || 0);
      const scale = planet.scale || 1;
      const size = planet.size * scale;
      const isHovered = hoveredPlanet === planet.name;
      
      // Skip rendering if off-screen
      if (x < -100 || x > width + 100 || y < -100 || y > height + 100) {
        return;
      }
      
      // Draw orbit path (only for planets with orbits)
      if (planet.orbitRadius > 0) {
        ctx.beginPath();
        const orbitGradient = ctx.createRadialGradient(
          centerX, centerY, planet.orbitRadius * 0.8,
          centerX, centerY, planet.orbitRadius * 1.2
        );
        orbitGradient.addColorStop(0, `${planet.color}10`);
        orbitGradient.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = orbitGradient;
        ctx.lineWidth = 1.5;
        
        // Draw elliptical orbit with perspective
        const steps = 100;
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          const orbitX = Math.cos(angle) * planet.orbitRadius;
          const orbitY = Math.sin(angle) * (planet.orbitRadius * 0.6);
          const orbitZ = Math.sin(angle * 0.5) * (planet.orbitRadius * 0.3);
          
          const orbitPos = calculate3DPosition(orbitX, orbitY, orbitZ);
          const projX = centerX + orbitPos.x;
          const projY = centerY + orbitPos.y;
          
          if (i === 0) {
            ctx.moveTo(projX, projY);
          } else {
            ctx.lineTo(projX, projY);
          }
        }
        ctx.stroke();
      }
      
      // Draw planet glow on hover
      if (isHovered) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
        gradient.addColorStop(0, `${planet.color}80`);
        gradient.addColorStop(1, `${planet.color}00`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw planet
      ctx.font = `bold ${size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add subtle shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 2;
      
      // Planet symbol
      ctx.fillStyle = planet.color;
      ctx.fillText(planet.glyph, x, y);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      
      // Retrograde indicator (R)
      if (planet.retrograde) {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = `bold ${Math.max(10, size * 0.5)}px Arial`;
        ctx.fillText('R', x + size * 0.7, y - size * 0.7);
      }
      
      // Planet name on hover
      if (isHovered) {
        // Draw connecting line to label
        ctx.strokeStyle = `${planet.color}80`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.7);
        ctx.lineTo(x, y - size * 1.5);
        ctx.stroke();
        
        // Draw label background
        const text = planet.name;
        ctx.font = 'bold 12px Arial';
        const textWidth = ctx.measureText(text).width;
        const padding = 8;
        const rectX = x - textWidth / 2 - padding;
        const rectY = y - size * 1.5 - 20;
        const rectWidth = textWidth + padding * 2;
        const rectHeight = 20;
        
        // Rounded rectangle background
        const radius = 4;
        ctx.fillStyle = theme === 'dark' ? 'rgba(20, 25, 40, 0.9)' : 'rgba(240, 245, 250, 0.9)';
        ctx.beginPath();
        ctx.moveTo(rectX + radius, rectY);
        ctx.lineTo(rectX + rectWidth - radius, rectY);
        ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
        ctx.lineTo(rectX + rectWidth, rectY + rectHeight - radius);
        ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight);
        ctx.lineTo(rectX + radius, rectY + rectHeight);
        ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - radius);
        ctx.lineTo(rectX, rectY + radius);
        ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
        ctx.closePath();
        ctx.fill();
        
        // Draw text
        ctx.fillStyle = theme === 'dark' ? '#FFFFFF' : '#1A202C';
        ctx.fillText(text, x, rectY + 14);
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
        <p>Hover over planets for details • Tilted 35° for better perspective</p>
        <p className="text-xs opacity-70 mt-1">Current time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default CelestialMap;

import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { PolarArea } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

type PlanetPosition = {
  name: string;
  symbol: string;
  sign: string;
  angle: number;
  house: number;
};

// Zodiac sign data with colors and labels
const ZODIAC_SIGNS = [
  { id: 'aries', label: 'Aries', color: 'rgba(255, 99, 132, 0.7)', borderColor: 'rgba(255, 99, 132, 1)' },
  { id: 'taurus', label: 'Taurus', color: 'rgba(54, 162, 235, 0.7)', borderColor: 'rgba(54, 162, 235, 1)' },
  { id: 'gemini', label: 'Gemini', color: 'rgba(255, 206, 86, 0.7)', borderColor: 'rgba(255, 206, 86, 1)' },
  { id: 'cancer', label: 'Cancer', color: 'rgba(75, 192, 192, 0.7)', borderColor: 'rgba(75, 192, 192, 1)' },
  { id: 'leo', label: 'Leo', color: 'rgba(153, 102, 255, 0.7)', borderColor: 'rgba(153, 102, 255, 1)' },
  { id: 'virgo', label: 'Virgo', color: 'rgba(255, 159, 64, 0.7)', borderColor: 'rgba(255, 159, 64, 1)' },
  { id: 'libra', label: 'Libra', color: 'rgba(255, 99, 132, 0.7)', borderColor: 'rgba(255, 99, 132, 1)' },
  { id: 'scorpio', label: 'Scorpio', color: 'rgba(54, 162, 235, 0.7)', borderColor: 'rgba(54, 162, 235, 1)' },
  { id: 'sagittarius', label: 'Sagittarius', color: 'rgba(255, 206, 86, 0.7)', borderColor: 'rgba(255, 206, 86, 1)' },
  { id: 'capricorn', label: 'Capricorn', color: 'rgba(75, 192, 192, 0.7)', borderColor: 'rgba(75, 192, 192, 1)' },
  { id: 'aquarius', label: 'Aquarius', color: 'rgba(153, 102, 255, 0.7)', borderColor: 'rgba(153, 102, 255, 1)' },
  { id: 'pisces', label: 'Pisces', color: 'rgba(255, 159, 64, 0.7)', borderColor: 'rgba(255, 159, 64, 1)' },
];

interface ZodiacWheelProps {
  birthDate: Date;
  birthTime?: string;
  birthLocation?: string;
  width?: number | string;
  height?: number | string;
  planetaryPositions?: PlanetPosition[];
}

const ZodiacWheel: React.FC<ZodiacWheelProps> = ({
  birthDate,
  birthTime = '12:00',
  birthLocation = 'Unknown',
  width = '100%',
  height = '400px',
  planetaryPositions = []
}) => {
  const chartRef = useRef<any>(null);

  // Process planetary positions to count planets in each sign
  const getPlanetsPerSign = () => {
    const signCounts = new Map<string, number>();
    
    // Initialize all signs with 0
    ZODIAC_SIGNS.forEach(sign => {
      signCounts.set(sign.id, 0);
    });
    
    // Count planets in each sign
    planetaryPositions.forEach(planet => {
      const signId = planet.sign.toLowerCase();
      if (signCounts.has(signId)) {
        signCounts.set(signId, (signCounts.get(signId) || 0) + 1);
      }
    });
    
    return Array.from(signCounts.values());
  };

  // Chart data
  const chartData: ChartData<'polarArea'> = {
    labels: ZODIAC_SIGNS.map(sign => sign.label),
    datasets: [
      {
        label: 'Planets in Sign',
        data: getPlanetsPerSign(),
        backgroundColor: ZODIAC_SIGNS.map(sign => sign.color),
        borderColor: ZODIAC_SIGNS.map(sign => sign.borderColor),
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions: ChartOptions<'polarArea'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        suggestedMin: 0,
        suggestedMax: 5, // Adjust based on max planets in a sign
        ticks: {
          display: false,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#fff',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw as number;
            return `${label}: ${value} planet${value !== 1 ? 's' : ''}`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  return (
    <div className="zodiac-wheel-container" style={{ width, height, position: 'relative' }}>
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold">Zodiac Wheel</h3>
        <p className="text-sm text-slate-400">
          {birthDate.toLocaleDateString()} • {birthTime} • {birthLocation}
        </p>
      </div>
      <PolarArea
        ref={chartRef}
        data={chartData}
        options={chartOptions}
      />
      
      {/* Display planetary positions */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {planetaryPositions.slice(0, 10).map((planet, index) => (
          <div key={index} className="flex items-center">
            <span className="mr-1">{planet.symbol}</span>
            <span className="font-medium">{planet.name}:</span>
            <span className="ml-1 text-slate-400">
              {planet.sign} (H{planet.house})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ZodiacWheel;

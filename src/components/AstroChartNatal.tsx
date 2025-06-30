import React, { useEffect, useRef } from 'react';
import { Chart } from '@astrodraw/astrochart';

interface AstroChartNatalProps {
  astroChartData: {
    planets: Record<string, number[]>;
    cusps: number[];
  };
  width?: number;
  height?: number;
}

const AstroChartNatal: React.FC<AstroChartNatalProps> = ({ 
  astroChartData, 
  width = 600, 
  height = 600 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || !astroChartData) return;

    // Clear previous chart if it exists
    if (chartRef.current.firstChild) {
      chartRef.current.innerHTML = '';
    }

    try {
      // Create a new chart instance
      const chart = new Chart(chartRef.current.id, width, height);
      chartInstance.current = chart;

      // Draw the radix chart with the provided data
      const radix = chart.radix(astroChartData);

      // Calculate and draw aspects
      radix.aspects();

      console.log('AstroChart rendered successfully with data:', astroChartData);
    } catch (error) {
      console.error('Error rendering AstroChart:', error);
    }
  }, [astroChartData, width, height]);

  if (!astroChartData) {
    return <div>Loading chart data...</div>;
  }

  return (
    <div className="astro-chart-container">
      <div id="astro-chart" ref={chartRef} style={{ width, height }}></div>
    </div>
  );
};

export default AstroChartNatal;

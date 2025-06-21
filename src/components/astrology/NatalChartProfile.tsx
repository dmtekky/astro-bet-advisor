import React, { useState, useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

const NatalChartProfile: React.FC = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [chartInstance, setChartInstance] = useState<Chart | null>(null);
  const [birthData, setBirthData] = useState({
    date: '',
    time: '',
    timeUnknown: false,
    city: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setBirthData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  useEffect(() => {
    // Cleanup chart on unmount
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [chartInstance]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Destroy existing chart if it exists
    if (chartInstance) {
      chartInstance.destroy();
    }

    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Create mock chart data
        const newChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
            datasets: [{
              data: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1,
            }]
          },
          options: {
            responsive: true,
            cutout: '60%',
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  boxWidth: 12,
                  padding: 10
                }
              }
            },
            animation: {
              animateScale: true,
              animateRotate: true
            }
          }
        });
        
        setChartInstance(newChartInstance);
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Natal Chart</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Birth Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={birthData.date}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Birth Time
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="time"
                name="time"
                value={birthData.time}
                onChange={handleInputChange}
                disabled={birthData.timeUnknown}
                className="flex-1 p-2 border rounded"
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="timeUnknown"
                  checked={birthData.timeUnknown}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <span className="text-sm">Unknown</span>
              </label>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Birth City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={birthData.city}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="Enter city name"
              required
            />
          </div>
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Generate Chart
          </button>
        </div>
      </form>
      
      <div className="mt-8">
        <div className="relative">
          <canvas ref={chartRef}></canvas>
          {!chartInstance && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded">
              <div className="text-center p-6">
                <p className="text-gray-600 mb-4">
                  Enter your birth information to generate your natal chart
                </p>
                <div className="w-32 h-32 mx-auto rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center">
                  <span className="text-4xl text-gray-400">♋</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NatalChartProfile;

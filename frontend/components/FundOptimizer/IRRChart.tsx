import { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface IRRChartProps {
  baselineIRR: number;
  optimizedIRR: number;
  horizonMonths: number;
}

export default function IRRChart({ baselineIRR, optimizedIRR, horizonMonths }: IRRChartProps) {
  const chartRef = useRef<ChartJS>(null);
  
  // Generate labels for each year
  const years = Math.ceil(horizonMonths / 12);
  const labels = Array.from({ length: years + 1 }, (_, i) => `Year ${i}`);
  
  // Generate data points for baseline IRR
  // We'll simulate a linear growth to the final IRR
  const baselineData = [0];
  for (let i = 1; i <= years; i++) {
    baselineData.push(baselineIRR * (i / years));
  }
  
  // Generate data points for optimized IRR
  // We'll simulate a more aggressive growth curve
  const optimizedData = [0];
  for (let i = 1; i <= years; i++) {
    // Use a slightly exponential curve for optimized IRR
    const factor = Math.pow(i / years, 1.1);
    optimizedData.push(optimizedIRR * factor);
  }
  
  // Chart data
  const data = {
    labels,
    datasets: [
      {
        label: 'Baseline IRR',
        data: baselineData.map(irr => irr * 100), // Convert to percentage
        borderColor: 'rgba(156, 163, 175, 1)', // Gray
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Optimized IRR',
        data: optimizedData.map(irr => irr * 100), // Convert to percentage
        borderColor: 'rgba(54, 255, 176, 1)', // Accent color
        backgroundColor: 'rgba(54, 255, 176, 0.2)',
        tension: 0.3,
      },
    ],
  };
  
  // Chart options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: 'rgba(156, 163, 175, 1)',
        },
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: 'rgba(156, 163, 175, 1)',
          callback: (value) => `${value}%`,
        },
        title: {
          display: true,
          text: 'IRR (%)',
          color: 'rgba(156, 163, 175, 1)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(156, 163, 175, 1)',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`,
        },
      },
    },
  };
  
  // Update chart when theme changes
  useEffect(() => {
    const updateChartColors = () => {
      if (chartRef.current) {
        chartRef.current.update();
      }
    };
    
    // Listen for theme changes
    const themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          updateChartColors();
        }
      });
    });
    
    // Start observing the document body for theme changes
    themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => {
      themeObserver.disconnect();
    };
  }, []);
  
  return <Line ref={chartRef} data={data} options={options} />;
}

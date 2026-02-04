import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const Charts = ({ simulationHistory }) => {
  const { data, options } = useMemo(() => {
    const labels = simulationHistory.map((entry, idx) => {
      const time = entry.timestamp
        ? new Date(entry.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        : `T+${idx}`;
      return `${idx + 1} • ${entry.policy || 'Scenario'} • ${time}`;
    });

    const originalCases = simulationHistory.map(
      (entry) => entry.originalCases
    );
    const reducedCases = simulationHistory.map(
      (entry) => entry.reducedCases
    );

    return {
      data: {
        labels,
        datasets: [
          {
            label: 'Projected Cases (pre-policy)',
            data: originalCases,
            borderColor: '#5bc0be',
            backgroundColor: 'rgba(91,192,190,0.2)',
            tension: 0.25,
            pointRadius: 3
          },
          {
            label: 'Projected Cases (post-policy)',
            data: reducedCases,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255,107,107,0.2)',
            tension: 0.25,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#e5e7eb',
              font: { size: 10 }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} cases`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#9ca3af',
              autoSkip: true,
              maxRotation: 0
            },
            grid: { color: 'rgba(55,65,81,0.3)' }
          },
          y: {
            ticks: {
              color: '#9ca3af'
            },
            grid: { color: 'rgba(55,65,81,0.3)' }
          }
        }
      }
    };
  }, [simulationHistory]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-gray-200">
            Policy Impact Timeline
          </h2>
          <p className="text-xs text-gray-400">
            Each run simulates total cases before and after an intervention.
          </p>
        </div>
        <div className="text-[11px] text-gray-400">
          Runs tracked:{' '}
          <span className="font-semibold text-gray-200">
            {simulationHistory.length}
          </span>
        </div>
      </div>

      {simulationHistory.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400 text-center">
          No simulations run yet. Use the Simulator to model interventions and
          visualize their impact on projected case load.
        </div>
      ) : (
        <div className="w-full h-56 sm:h-64 md:h-72 lg:h-64 xl:h-72 2xl:h-80">
          <Line data={data} options={options} />
        </div>
      )}
    </div>
  );
};

export default Charts;


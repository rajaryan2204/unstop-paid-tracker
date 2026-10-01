import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { TrendingUp, BarChart3 } from 'lucide-react';

export default function AnalyticsChart({ participants, summary }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [mode, setMode] = useState('timeline'); // 'timeline' or 'events'

  useEffect(() => {
    if (!chartRef.current || !participants || participants.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const ctx = chartRef.current.getContext('2d');

    if (mode === 'timeline') {
      const dateCounts = {};
      participants.forEach(p => {
        if (p.registered_at) {
          const d = p.registered_at.substring(0, 10);
          dateCounts[d] = (dateCounts[d] || 0) + 1;
        }
      });

      const sortedDates = Object.keys(dateCounts).sort();
      const labels = sortedDates.map(d => {
        const parts = d.split('-');
        if (parts.length === 3) {
          const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
          return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return d;
      });
      const counts = sortedDates.map(d => dateCounts[d]);

      const gradient = ctx.createLinearGradient(0, 0, 0, 180);
      gradient.addColorStop(0, 'rgba(2, 132, 199, 0.16)');
      gradient.addColorStop(0.6, 'rgba(2, 132, 199, 0.04)');
      gradient.addColorStop(1, 'rgba(2, 132, 199, 0.0)');

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Verified Registrations',
            data: counts,
            borderColor: '#0284c7',
            borderWidth: 2,
            pointBackgroundColor: '#0284c7',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 2.5,
            pointHoverRadius: 5.5,
            fill: true,
            backgroundColor: gradient,
            tension: 0.32
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#ffffff',
              bodyColor: '#38bdf8',
              borderColor: '#e2e8f0',
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                label: (context) => ` ${context.parsed.y} verified entries`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#64748b', font: { family: 'Geist, sans-serif', size: 10 } }
            },
            y: {
              grid: { color: '#f1f5f9', drawBorder: false },
              ticks: { color: '#64748b', font: { family: 'Geist, sans-serif', size: 10 }, precision: 0 }
            }
          }
        }
      });

    } else {
      // Event Distribution Bar View
      const eventCounts = {};
      participants.forEach(p => {
        const ev = p.event_name || 'Event';
        eventCounts[ev] = (eventCounts[ev] || 0) + 1;
      });

      const topEvents = Object.keys(eventCounts)
        .sort((a, b) => eventCounts[b] - eventCounts[a])
        .slice(0, 10);

      const labels = topEvents.map(e => e.length > 18 ? e.substring(0, 16) + '...' : e);
      const counts = topEvents.map(e => eventCounts[e]);

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Participants',
            data: counts,
            backgroundColor: 'rgba(2, 132, 199, 0.7)',
            borderColor: '#0284c7',
            borderWidth: 1,
            borderRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#ffffff',
              bodyColor: '#38bdf8',
              borderColor: '#e2e8f0',
              borderWidth: 1,
              padding: 10,
              displayColors: false
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#64748b', font: { family: 'Geist, sans-serif', size: 9.5 } }
            },
            y: {
              grid: { color: '#f1f5f9', drawBorder: false },
              ticks: { color: '#64748b', font: { family: 'Geist, sans-serif', size: 10 }, precision: 0 }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [participants, mode]);

  return (
    <div className="bg-white rounded-xl p-4 mb-6 border border-slate-200 shadow-xs transition-all">
      {/* Header with Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-900 tracking-tight">Event Activity & Volume</span>
          <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
            Real Unstop Data
          </span>
        </div>

        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
          <button
            onClick={() => setMode('timeline')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
              mode === 'timeline' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-sky-600" />
            <span>Timeline</span>
          </button>
          <button
            onClick={() => setMode('events')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
              mode === 'events' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-3 h-3 text-purple-600" />
            <span>Top Events</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-44 sm:h-52 relative">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}

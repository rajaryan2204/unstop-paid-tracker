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
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
      gradient.addColorStop(0.6, 'rgba(56, 189, 248, 0.08)');
      gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Verified Registrations',
            data: counts,
            borderColor: '#38bdf8',
            borderWidth: 2,
            pointBackgroundColor: '#38bdf8',
            pointBorderColor: '#0B0D11',
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
              backgroundColor: '#161A22',
              titleColor: '#F5F7FA',
              bodyColor: '#38bdf8',
              borderColor: 'rgba(255, 255, 255, 0.1)',
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
              ticks: { color: '#626A78', font: { family: 'Geist, sans-serif', size: 10 } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
              ticks: { color: '#626A78', font: { family: 'Geist, sans-serif', size: 10 }, precision: 0 }
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
            backgroundColor: 'rgba(56, 189, 248, 0.45)',
            borderColor: '#38bdf8',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#161A22',
              titleColor: '#F5F7FA',
              bodyColor: '#38bdf8',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 10,
              displayColors: false
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#626A78', font: { family: 'Geist, sans-serif', size: 9.5 } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
              ticks: { color: '#626A78', font: { family: 'Geist, sans-serif', size: 10 }, precision: 0 }
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
    <div className="surface-card rounded-xl p-4 mb-6 transition-all">
      {/* Header with Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white tracking-tight">Event Activity & Volume</span>
          <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
            Real Unstop Data
          </span>
        </div>

        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#161A22] border border-white/[0.08]">
          <button
            onClick={() => setMode('timeline')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
              mode === 'timeline' 
                ? 'bg-[#11141A] text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-sky-400" />
            <span>Timeline</span>
          </button>
          <button
            onClick={() => setMode('events')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
              mode === 'events' 
                ? 'bg-[#11141A] text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3 h-3 text-purple-400" />
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

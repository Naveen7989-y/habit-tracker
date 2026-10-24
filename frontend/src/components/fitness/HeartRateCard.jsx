import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Heart, MoreVertical, Info, Radio } from 'lucide-react';

const RESTING_ECG_SERIES = [
  { time: '00:00', bpm: 0 },
  { time: '04:00', bpm: 0 },
  { time: '08:00', bpm: 0 },
  { time: '12:00', bpm: 0 },
  { time: '16:00', bpm: 0 },
  { time: '20:00', bpm: 0 },
  { time: '24:00', bpm: 0 },
];

export default function HeartRateCard({
  currentBpm = 0,
  data = null,
  isConnected = false,
  onOpenSourceModal,
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulatedBpm, setSimulatedBpm] = useState(74);
  const [simulatedSeries, setSimulatedSeries] = useState([]);

  // Live simulation effect when toggled on
  useEffect(() => {
    let interval = null;
    if (simulating) {
      interval = setInterval(() => {
        setSimulatedBpm((prev) => {
          const delta = (Math.random() - 0.48) * 4;
          const nextBpm = Math.min(138, Math.max(68, Math.round(prev + delta)));
          setSimulatedSeries((s) => {
            const timeLabel = new Date().toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
            const nextList = [...s, { time: timeLabel, bpm: nextBpm }];
            return nextList.slice(-10);
          });
          return nextBpm;
        });
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [simulating]);

  const effectiveBpm = simulating ? simulatedBpm : currentBpm;
  const hasActiveReading = effectiveBpm > 0;

  // Chart data to display
  let chartData = RESTING_ECG_SERIES;
  if (simulating && simulatedSeries.length > 0) {
    chartData = simulatedSeries;
  } else if (data && data.length > 0) {
    chartData = data;
  }

  // Determine current heart zone
  const getZone = (bpm) => {
    if (!bpm || bpm <= 0) return { label: 'Standby', color: '#70788D' };
    if (bpm < 60) return { label: 'Resting', color: '#25D9E6' };
    if (bpm < 100) return { label: 'Warmup', color: '#39E58C' };
    if (bpm < 135) return { label: 'Fat Burn', color: '#C8FF00' };
    if (bpm < 160) return { label: 'Cardio', color: '#FFB020' };
    return { label: 'Peak Zone', color: '#FF5C67' };
  };

  const zone = getZone(effectiveBpm);

  return (
    <div className="bg-[#111522]/90 backdrop-blur-xl border border-[#242A3A] hover:border-[#C8FF00]/40 rounded-[24px] p-4 sm:p-5 relative overflow-hidden transition-all duration-300 shadow-xl group">
      {/* Ambient background glow */}
      <div
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none transition-opacity duration-700"
        style={{
          backgroundColor: hasActiveReading ? `${zone.color}20` : 'rgba(255, 92, 103, 0.08)',
        }}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 shadow-md"
            style={{
              backgroundColor: hasActiveReading ? `${zone.color}20` : '#FF5C6715',
              borderColor: hasActiveReading ? `${zone.color}45` : '#FF5C6730',
            }}
          >
            <Heart
              className={`w-4 h-4 transition-all duration-300 ${
                hasActiveReading ? 'animate-pulse scale-110' : ''
              }`}
              style={{
                color: hasActiveReading ? zone.color : '#FF5C67',
                fill: hasActiveReading ? `${zone.color}40` : '#FF5C6740',
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#F5F7FC] tracking-tight">
                Heart Rate Telemetry
              </h3>
              {hasActiveReading && (
                <span
                  className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border tracking-wider animate-fade-in"
                  style={{
                    backgroundColor: `${zone.color}18`,
                    borderColor: `${zone.color}40`,
                    color: zone.color,
                  }}
                >
                  {zone.label}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#70788D]">
              {simulating
                ? 'Live Sensor Simulation Active'
                : hasActiveReading
                ? 'Session Pulse Recorded'
                : 'Sensor Ready • Bluetooth / Wearable'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Simulation Trigger Button */}
          <button
            onClick={() => setSimulating((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
              simulating
                ? 'bg-[#FF5C67]/15 border-[#FF5C67]/40 text-[#FF5C67] shadow-[0_0_10px_rgba(255,92,103,0.25)]'
                : 'bg-[#151A29] border-[#242A3A] text-[#A4AABC] hover:text-[#C8FF00] hover:border-[#C8FF00]/40'
            }`}
            title="Toggle Live Biometric Pulse Test"
          >
            <Radio className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
            <span>{simulating ? 'Live Test' : 'Test Pulse'}</span>
          </button>

          {/* Latest Reading Highlight Badge */}
          {hasActiveReading ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-lg transition-all"
              style={{
                backgroundColor: `${zone.color}15`,
                borderColor: `${zone.color}40`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: zone.color }}
              />
              <span
                className="text-xs font-black tracking-tight"
                style={{ color: zone.color }}
              >
                {effectiveBpm} BPM
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D101B] border border-[#1D2332]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#70788D]" />
              <span className="text-xs font-semibold text-[#70788D] tracking-tight">
                -- BPM
              </span>
            </div>
          )}

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1.5 rounded-lg text-[#70788D] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors"
            title="Heart rate sensor details"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sensor Info Drawer / Alert */}
      {showInfo && (
        <div className="mb-3 p-3 bg-[#151A29] border border-[#242A3A] rounded-xl text-xs text-[#A4AABC] flex items-start gap-2.5 animate-fade-in relative z-10">
          <Info className="w-4 h-4 text-[#C8FF00] shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px] leading-relaxed">
            <p className="text-[#F5F7FC] font-semibold mb-0.5">Device Integration & ECG Sync</p>
            <p>
              Connect your Bluetooth chest strap, Apple Health, or Wear OS to stream continuous cardiac telemetry. Click <strong>Test Pulse</strong> above to simulate a live optical sensor feed.
            </p>
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className="h-32 sm:h-36 w-full -ml-2 relative">
        {!hasActiveReading && !simulating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-4 text-center">
            <p className="text-xs font-semibold text-[#F5F7FC]">
              Wearable Sensor Standby
            </p>
            <p className="text-[11px] text-[#70788D] mt-0.5 max-w-sm">
              Start an activity session or click <strong>Test Pulse</strong> to preview live dynamic biometric waves.
            </p>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="heartRateGlowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hasActiveReading ? zone.color : '#C8FF00'} stopOpacity={hasActiveReading ? 0.35 : 0.05} />
                <stop offset="90%" stopColor={hasActiveReading ? zone.color : '#C8FF00'} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#1D2332"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              stroke="#70788D"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#1D2332' }}
            />

            <YAxis
              stroke="#70788D"
              fontSize={10}
              domain={[hasActiveReading ? 50 : 0, hasActiveReading ? 160 : 120]}
              tickLine={false}
              axisLine={false}
              ticks={hasActiveReading ? [60, 90, 120, 150] : [0, 40, 80, 120]}
            />

            {hasActiveReading && (
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0D101B] border border-[#242A3A] px-2.5 py-1.5 rounded-lg shadow-xl text-xs">
                        <p className="text-[#70788D] text-[10px]">{label}</p>
                        <p className="font-bold" style={{ color: zone.color }}>
                          {payload[0].value} <span className="text-[10px] text-[#A4AABC]">BPM</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="bpm"
              stroke={hasActiveReading ? zone.color : '#242A3A'}
              strokeWidth={hasActiveReading ? 2.4 : 1}
              fillOpacity={1}
              fill="url(#heartRateGlowGrad)"
              activeDot={hasActiveReading ? {
                r: 5,
                fill: zone.color,
                stroke: '#080A12',
                strokeWidth: 2.5,
                filter: `drop-shadow(0 0 8px ${zone.color})`,
              } : false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 4 Biometric Heart Rate Zone Badges */}
      <div className="pt-3 mt-2 border-t border-[#1D2332] grid grid-cols-4 gap-2 text-center select-none">
        {[
          { label: 'Resting', range: '<60', color: '#25D9E6' },
          { label: 'Fat Burn', range: '95-125', color: '#C8FF00' },
          { label: 'Cardio', range: '125-155', color: '#FFB020' },
          { label: 'Peak', range: '155+', color: '#FF5C67' },
        ].map((z, idx) => {
          const isCurrent = hasActiveReading && zone.label.includes(z.label);
          return (
            <div
              key={idx}
              className={`p-1.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-[#151A29] shadow-md'
                  : 'bg-[#0D101B]/60 border-[#1D2332] opacity-85'
              }`}
              style={{
                borderColor: isCurrent ? `${z.color}60` : undefined,
              }}
            >
              <div className="flex items-center justify-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: z.color }}
                />
                <span
                  className="text-[10px] font-bold truncate text-[#F5F7FC]"
                  style={{ color: isCurrent ? z.color : undefined }}
                >
                  {z.label}
                </span>
              </div>
              <p className="text-[9px] text-[#70788D] font-mono mt-0.5">
                {z.range} BPM
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

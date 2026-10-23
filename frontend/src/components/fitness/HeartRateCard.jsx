import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Heart, MoreVertical, Info, Activity, Watch } from 'lucide-react';

const DEFAULT_HEART_RATE_SERIES = [
  { time: '00:00', bpm: 62 },
  { time: '02:00', bpm: 58 },
  { time: '04:00', bpm: 55 },
  { time: '06:00', bpm: 68 },
  { time: '08:00', bpm: 82 },
  { time: '10:00', bpm: 74 },
  { time: '12:00', bpm: 89 },
  { time: '14:00', bpm: 76 },
  { time: '16:00', bpm: 95 },
  { time: '18:00', bpm: 84 },
  { time: '20:00', bpm: 78 },
  { time: '22:00', bpm: 72 },
  { time: '24:00', bpm: 65 },
];

export default function HeartRateCard({
  currentBpm = 78,
  data = DEFAULT_HEART_RATE_SERIES,
  isConnected = false,
  onOpenSourceModal,
}) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="bg-[#111522] border border-[#242A3A] rounded-[22px] p-4 sm:p-5 relative overflow-hidden transition-all duration-200 hover:border-[#242A3A]/80">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF5C67]/15 border border-[#FF5C67]/30 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-[#FF5C67] fill-[#FF5C67]/40 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F5F7FC] tracking-tight">
              Heart Rate
            </h3>
            <p className="text-[11px] text-[#70788D]">
              {isConnected ? 'Live Sensor Sync' : 'Daily Trend Preview'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Latest Reading Highlight Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8FF00]/10 border border-[#C8FF00]/30 shadow-[0_0_12px_rgba(200,255,0,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-ping" />
            <span className="text-xs font-bold text-[#C8FF00] tracking-tight">
              {currentBpm} BPM
            </span>
          </div>

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
        <div className="mb-3 p-2.5 bg-[#151A29] border border-[#242A3A] rounded-xl text-xs text-[#A4AABC] flex items-start gap-2 animate-fade-in">
          <Info className="w-4 h-4 text-[#C8FF00] shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px] leading-relaxed">
            <p className="text-[#F5F7FC] font-semibold mb-0.5">Device Integration Status</p>
            <p>
              Connect your Bluetooth heart rate monitor, Wear OS, or Apple Health to view live real-time biometric telemetry.
            </p>
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className="h-32 sm:h-36 w-full -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="heartRateLimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C8FF00" stopOpacity={0.35} />
                <stop offset="90%" stopColor="#C8FF00" stopOpacity={0.0} />
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
              ticks={['00:00', '06:00', '12:00', '18:00', '24:00']}
            />

            <YAxis
              stroke="#70788D"
              fontSize={10}
              domain={[40, 120]}
              tickLine={false}
              axisLine={false}
              ticks={[40, 60, 80, 100, 120]}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#0D101B] border border-[#242A3A] px-2.5 py-1.5 rounded-lg shadow-xl text-xs">
                      <p className="text-[#70788D] text-[10px]">{label}</p>
                      <p className="text-[#C8FF00] font-bold">
                        {payload[0].value} <span className="text-[10px] text-[#A4AABC]">BPM</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="bpm"
              stroke="#C8FF00"
              strokeWidth={2.2}
              fillOpacity={1}
              fill="url(#heartRateLimeGradient)"
              activeDot={{
                r: 4.5,
                fill: '#C8FF00',
                stroke: '#080A12',
                strokeWidth: 2,
                filter: 'drop-shadow(0 0 6px #C8FF00)',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

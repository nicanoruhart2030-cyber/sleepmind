'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { SleepLog, SleepNorm } from '@/types'
import { fmtHours } from '@/lib/sleep'

interface Props {
  logs: SleepLog[]
  norm: SleepNorm
}

export function TrendChart({ logs, norm }: Props) {
  const last30 = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map((l) => ({
      date: new Date(l.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: l.hours,
    }))

  if (!last30.length)
    return (
      <div className="h-40 flex items-center justify-center text-sm text-[#A1A1AA]">
        Log sleep to see trends
      </div>
    )

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={last30} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#A1A1AA', fontFamily: 'Inter' }}
          interval={Math.ceil(last30.length / 6)}
        />
        <YAxis
          domain={[4, 12]}
          ticks={[4, 6, 8, 10, 12]}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#A1A1AA', fontFamily: 'Inter' }}
          tickFormatter={(v) => `${v}h`}
        />
        <ReferenceLine y={norm.rec} stroke="rgba(0,0,0,0.1)" strokeDasharray="3 3" strokeWidth={1} />
        <Tooltip
          cursor={{ stroke: 'rgba(0,0,0,0.06)', strokeWidth: 1 }}
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null
            return (
              <div
                style={{
                  background: '#0A0A0B',
                  color: '#fff',
                  fontSize: 11,
                  padding: '5px 9px',
                  borderRadius: 6,
                  fontFamily: 'Inter',
                }}
              >
                {fmtHours(payload[0].value as number)}
              </div>
            )
          }}
        />
        <Line
          type="monotone"
          dataKey="hours"
          stroke="#0A0A0B"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: '#0A0A0B', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

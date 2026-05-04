'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts'
import type { SleepLog, SleepNorm } from '@/types'
import { fmtHours } from '@/lib/sleep'

interface Props {
  logs: SleepLog[]
  norm: SleepNorm
}

export function WeekChart({ logs, norm }: Props) {
  const last7 = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-7)
  const data = last7.map((l) => ({
    day: new Date(l.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    hours: l.hours,
    met: l.hours >= norm.rec,
  }))

  if (!data.length)
    return (
      <div className="h-36 flex items-center justify-center text-sm text-[#A1A1AA]">
        Log sleep to see your chart
      </div>
    )

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} barSize={28} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#A1A1AA', fontFamily: 'Inter' }}
        />
        <YAxis
          domain={[0, 12]}
          ticks={[0, 4, 8, 12]}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#A1A1AA', fontFamily: 'Inter' }}
          tickFormatter={(v) => `${v}h`}
        />
        <ReferenceLine y={norm.rec} stroke="rgba(0,0,0,0.1)" strokeDasharray="3 3" strokeWidth={1} />
        <Tooltip
          cursor={false}
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
        <Bar dataKey="hours" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.met ? '#0A0A0B' : '#D4D4D8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

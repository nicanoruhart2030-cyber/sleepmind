export interface Profile {
  id: string
  name: string
  age: number
  email: string
  created_at: string
  updated_at: string
}

export interface SleepLog {
  id: string
  user_id: string
  date: string
  hours: number
  bedtime: string
  wake_time: string
  quality: number | null
  note: string
  created_at: string
}

export interface SleepNorm {
  label: string
  rec: number
  min: number
  max: number
  note: string
  growthMode: boolean
}

export interface DebtSummary {
  debt7: number
  debt14: number
  avgHours: number
  streak: number
  status: 'none' | 'mild' | 'moderate' | 'severe'
}

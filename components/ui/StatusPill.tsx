export function StatusPill({ status }: { status: 'none' | 'mild' | 'moderate' | 'severe' }) {
  const map = {
    none: { label: 'No debt', cls: 'bg-[#F0FDF4] text-[#15803D]' },
    mild: { label: 'Mild debt', cls: 'bg-[#FFFBEB] text-[#92400E]' },
    moderate: { label: 'Moderate debt', cls: 'bg-[#FEF2F2] text-[#991B1B]' },
    severe: { label: 'Severe debt', cls: 'bg-[#FEF2F2] text-[#7F1D1D]' },
  }
  const { label, cls } = map[status]
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
}

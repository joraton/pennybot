interface Props { size?: number }

export function BotMark({ size = 30 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#001f1f"/>
      <circle cx="32" cy="32" r="28.5" fill="none" stroke="#1c3e57" strokeWidth="3"/>
      <rect x="31" y="10" width="2" height="6" fill="#00f872"/>
      <circle cx="32" cy="10" r="2.8" fill="#00f872"/>
      <path d="M18 28a14 14 0 0 1 14-14v36H22a4 4 0 0 1-4-4V28z" fill="#00f872"/>
      <path d="M46 28a14 14 0 0 0-14-14v36h10a4 4 0 0 0 4-4V28z" fill="#0a5a76"/>
      <circle cx="16" cy="34" r="3" fill="#00d864"/>
      <circle cx="48" cy="34" r="3" fill="#0a5a76"/>
      <rect x="22" y="28" width="20" height="12" rx="5" fill="#031a1f"/>
      <rect x="26" y="31" width="3.6" height="6" rx="1.8" fill="#00f872"/>
      <rect x="34.4" y="31" width="3.6" height="6" rx="1.8" fill="#3afb8d"/>
    </svg>
  )
}

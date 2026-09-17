export function SignalIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={className}
    >
      <circle cx="12" cy="14" r="2.2" fill="currentColor" stroke="none" />
      <path d="M8.5 10.5a5 5 0 0 1 7 0" />
      <path d="M5.8 7.8a9 9 0 0 1 12.4 0" strokeOpacity="0.6" />
      <path d="M12 4v2.2" strokeOpacity="0.6" />
    </svg>
  );
}

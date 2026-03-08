interface EsencelabLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export default function EsencelabLogo({
  className = '',
  iconClassName = '',
  textClassName = '',
  showText = true,
}: EsencelabLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/75 bg-white/72 shadow-[0_12px_24px_-18px_rgba(20,20,20,0.75)] ${iconClassName}`}
      >
        <svg viewBox="0 0 32 32" className="h-5 w-5 text-[#111111]" aria-hidden="true">
          <path
            d="M3.5 12.7L16 7l12.5 5.7L16 18.4 3.5 12.7Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M8.8 15.3V20.1c0 1.8 3.2 3.5 7.2 3.5s7.2-1.7 7.2-3.5V15.3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M28.5 13.3v6.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="28.5" cy="20.9" r="1.4" fill="currentColor" />
        </svg>
      </span>
      {showText && (
        <span className={`text-sm font-semibold tracking-[0.16em] text-[#111111] ${textClassName}`}>
          ESENCELAB
        </span>
      )}
    </span>
  );
}


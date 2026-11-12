export const Shield = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size * 1.1} viewBox="0 0 40 44" aria-hidden="true">
    <path d="M20 2 L37 8 V22 C37 32 29 39 20 42 C11 39 3 32 3 22 V8 Z" fill="#1c2217" stroke="#d4b46a" strokeWidth="2" />
    <path d="M11 20 L20 14 L29 20 M11 27 L20 21 L29 27" fill="none" stroke="#d4b46a" strokeWidth="2.5" />
  </svg>
);

export const Arrow = () => (
  <svg className="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const DiscordLogo = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.6 5.2A17 17 0 0 0 15.4 4l-.5 1.1a15.7 15.7 0 0 0-5.8 0L8.6 4a17 17 0 0 0-4.2 1.3C1.7 9.3 1 13.2 1.3 17a17 17 0 0 0 5.2 2.6l1.1-1.8a11 11 0 0 1-1.7-.8l.4-.3a12.2 12.2 0 0 0 11.4 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.8a17 17 0 0 0 5.2-2.6c.4-4.4-.7-8.3-3.1-11.8zM8.5 14.7c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1zm7 0c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1z" />
  </svg>
);

export const Check = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <path d="M5 12l5 5 9-10" />
  </svg>
);

export const Icon = ({ d, size = 22 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d={d} />
  </svg>
);

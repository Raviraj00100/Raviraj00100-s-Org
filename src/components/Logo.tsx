import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showTagline = false }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-base font-semibold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-bold'
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Custom Geometric Voting Sphere Symbol */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 opacity-80 blur-[2px]" />
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full text-white drop-shadow"
        >
          {/* Outer Sphere Ring */}
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.2" strokeOpacity="0.85" />
          {/* Orbital Longitudinal Curve */}
          <ellipse cx="16" cy="16" rx="7" ry="14" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.45" />
          {/* Core Decision Pulse Sphere */}
          <circle cx="16" cy="16" r="4.5" fill="#8B5CF6" />
          {/* Abstract Checkmark / Voice Vector */}
          <path
            d="M11 16.5L14.5 20L21.5 12"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <span className={`${textSizes[size]} tracking-tight font-display text-slate-900 dark:text-white`}>
          Vote<span className="text-violet-600 dark:text-violet-400">Sphere</span>
        </span>
        {showTagline && (
          <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Universal Anonymous Voting
          </span>
        )}
      </div>
    </div>
  );
};

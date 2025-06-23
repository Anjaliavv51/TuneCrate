
import React from 'react';

interface MusicIconProps {
  size?: number;
  className?: string;
}

const MusicIcon: React.FC<MusicIconProps> = ({ size = 48, className = '' }) => {
  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.8}
        height={size * 0.8}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Music Note with Border */}
        <g>
          {/* Note Stem */}
          <path
            d="M12 3V17C11.4696 16.4174 10.7652 16 10 16C8.34315 16 7 17.1193 7 18.5C7 19.8807 8.34315 21 10 21C11.6569 21 13 19.8807 13 18.5V7L19 5V15C18.4696 14.4174 17.7652 14 17 14C15.3431 14 14 15.1193 14 16.5C14 17.8807 15.3431 19 17 19C18.6569 19 20 17.8807 20 16.5V3L12 3Z"
            fill="url(#musicGradient)"
            stroke="white"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Musical Notes Decoration */}
          <circle cx="10" cy="18.5" r="2" fill="url(#noteGradient)" stroke="white" strokeWidth="0.5"/>
          <circle cx="17" cy="16.5" r="2" fill="url(#noteGradient)" stroke="white" strokeWidth="0.5"/>
        </g>
        <defs>
          <linearGradient id="musicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <radialGradient id="noteGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

export default MusicIcon;

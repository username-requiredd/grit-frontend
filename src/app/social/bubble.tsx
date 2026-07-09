// components/ChatIllustration.tsx
import React from "react";

type Props = React.SVGProps<SVGSVGElement>;

export const ChatIllustration = (props: Props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width="100%"
      height="100%"
      {...props}
    >
      <defs>
        <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4D9D" />
          <stop offset="100%" stopColor="#D53F8C" />
        </linearGradient>

        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="6"
            floodColor="#000000"
            floodOpacity="0.25"
          />
        </filter>
      </defs>

      <path
        d="M 25 55 Q 35 55 35 45 Q 35 55 45 55 Q 35 55 35 65 Q 35 55 25 55 Z"
        fill="#A78BFA"
        opacity="0.8"
      />

      <path
        d="M 160 65 Q 165 65 165 60 Q 165 65 170 65 Q 165 65 165 70 Q 165 65 160 65 Z"
        fill="#A78BFA"
        opacity="0.6"
      />

      <path
        d="M 50 40
           L 120 40
           A 20 20 0 0 1 140 60
           L 140 100
           A 20 20 0 0 1 120 120
           L 65 120
           L 35 145
           L 45 115
           A 20 20 0 0 1 30 100
           L 30 60
           A 20 20 0 0 1 50 40 Z"
        fill="url(#purpleGrad)"
        filter="url(#shadow)"
      />

      <circle cx="55" cy="80" r="12" fill="#FFFFFF" opacity="0.3" />
      <rect x="75" y="72" width="45" height="6" rx="3" fill="#FFFFFF" opacity="0.3" />
      <rect x="75" y="84" width="30" height="6" rx="3" fill="#FFFFFF" opacity="0.3" />

      <path
        d="M 110 90
           L 150 90
           A 15 15 0 0 1 165 105
           L 165 135
           L 180 145
           L 150 150
           L 110 150
           A 15 15 0 0 1 95 135
           L 95 105
           A 15 15 0 0 1 110 90 Z"
        fill="url(#pinkGrad)"
        filter="url(#shadow)"
      />

      <path
        d="M 130 113
           A 6.5 6.5 0 0 0 117 113
           C 117 122, 130 132, 130 132
           C 130 132, 143 122, 143 113
           A 6.5 6.5 0 0 0 130 113 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
};
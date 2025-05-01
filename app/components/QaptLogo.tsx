'use client';

import React from 'react';

interface QaptLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function QaptLogo({ className = 'h-6 w-6', style }: QaptLogoProps) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <path
        d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z"
        fill="#0F1117"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9 12.5C9 11.672 9.672 11 10.5 11H14.5C15.328 11 16 11.672 16 12.5V16.5C16 17.328 15.328 18 14.5 18H10.5C9.672 18 9 17.328 9 16.5V12.5Z"
        fill="currentColor"
      />
      <path
        d="M18 12.5C18 11.672 18.672 11 19.5 11H21.5C22.328 11 23 11.672 23 12.5V16.5C23 17.328 22.328 18 21.5 18H19.5C18.672 18 18 17.328 18 16.5V12.5Z"
        fill="currentColor"
      />
      <path
        d="M9 19.5C9 18.672 9.672 18 10.5 18H21.5C22.328 18 23 18.672 23 19.5V21.5C23 22.328 22.328 23 21.5 23H10.5C9.672 23 9 22.328 9 21.5V19.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

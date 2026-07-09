// components/HeartIcon.tsx
import React from "react";

type Props = React.SVGProps<SVGSVGElement>;

export const HeartIcon = (props: Props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      {...props}
    >
      <path
        d="M 38 52
           C 25 35, 8 45, 18 65
           C 25 80, 50 95, 50 95
           C 50 95, 75 80, 82 65
           C 92 45, 75 35, 62 52
           L 48 66"
        fill="none"
        stroke="#8B5CF6"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={`
      group
      relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
      bg-slate-400 transition-all duration-200 ease-[cubic-bezier(0.27,0.2,0.25,1.51)]
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-50
      data-[state=checked]:bg-app-primary
      ${className}
    `}
    {...props}
    ref={ref}
  >
    {/* Effect line */}
    <span 
      className="
        absolute left-[7px] h-[3px] w-[9px] rounded-[1px] bg-white
        transition-all duration-200 ease-in-out
        group-data-[state=checked]:left-[28px]
      "
    />
    
    {/* Circle with icons */}
    <SwitchPrimitives.Thumb
      className={`
        relative flex h-[18px] w-[18px] items-center justify-center rounded-full
        bg-white shadow-[1px_1px_2px_rgba(146,146,146,0.45)]
        transition-all duration-200 ease-[cubic-bezier(0.27,0.2,0.25,1.51)]
        group-data-[state=checked]:translate-x-[22px]
        group-data-[state=checked]:shadow-[-1px_1px_2px_rgba(163,163,163,0.45)]
        translate-x-[3px]
      `}
    >
      {/* Cross icon (shown when unchecked) */}
      <svg 
        className="
          absolute h-[6px] w-[6px] text-slate-400
          transition-transform duration-200 ease-[cubic-bezier(0.27,0.2,0.25,1.51)]
          group-data-[state=checked]:scale-0
        "
        viewBox="0 0 365.696 365.696"
        fill="currentColor"
      >
        <path d="M243.188 182.86 356.32 69.726c12.5-12.5 12.5-32.766 0-45.247L341.238 9.398c-12.504-12.503-32.77-12.503-45.25 0L182.86 122.528 69.727 9.374c-12.5-12.5-32.766-12.5-45.247 0L9.375 24.457c-12.5 12.504-12.5 32.77 0 45.25l113.152 113.152L9.398 295.99c-12.503 12.503-12.503 32.769 0 45.25L24.48 356.32c12.5 12.5 32.766 12.5 45.247 0l113.132-113.132L295.99 356.32c12.503 12.5 32.769 12.5 45.25 0l15.081-15.082c12.5-12.504 12.5-32.77 0-45.25zm0 0" />
      </svg>
      
      {/* Checkmark icon (shown when checked) */}
      <svg 
        className="
          absolute h-[10px] w-[10px] text-app-primary
          transition-transform duration-200 ease-[cubic-bezier(0.27,0.2,0.25,1.51)]
          scale-0 group-data-[state=checked]:scale-100
        "
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" />
      </svg>
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };

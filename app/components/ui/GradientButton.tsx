"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
  children: React.ReactNode;
}

export function GradientButton({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: GradientButtonProps) {
  const baseClasses = "font-medium rounded-lg transition-all duration-200 flex items-center justify-center";

  const variantClasses = {
    default: "bg-gradient-to-r from-[#30E3CA] to-[#11999E] text-white hover:shadow-accent-glow hover:scale-105",
    outline: "bg-transparent border border-[#30E3CA] text-[#30E3CA] hover:bg-[#30E3CA]/10",
    ghost: "bg-transparent text-[#30E3CA] hover:bg-[#30E3CA]/10",
    secondary: "bg-dark-card-hover text-text-secondary hover:text-white",
    destructive: "bg-red-500/20 text-red-400 hover:bg-red-500/30",
    link: "bg-transparent text-[#30E3CA] hover:underline"
  };

  const sizeClasses = {
    sm: "text-sm py-1 px-3",
    md: "py-2 px-4",
    lg: "text-lg py-3 px-6",
    icon: "p-2 h-10 w-10"
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

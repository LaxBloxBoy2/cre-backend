"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", style, ...props }, ref) => {
    // Define style objects for different variants
    let variantStyle = {};

    if (variant === "default") {
      variantStyle = {
        backgroundColor: 'var(--accent)',
        color: 'var(--button-text)',
        border: 'none',
      };
    } else if (variant === "destructive") {
      variantStyle = {
        backgroundColor: 'var(--destructive)',
        color: 'var(--button-text)',
        border: 'none',
      };
    } else if (variant === "outline") {
      variantStyle = {
        backgroundColor: 'transparent',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-dark)',
      };
    } else if (variant === "secondary") {
      variantStyle = {
        backgroundColor: 'var(--bg-card-hover)',
        color: 'var(--text-primary)',
        border: 'none',
      };
    } else if (variant === "ghost") {
      variantStyle = {
        backgroundColor: 'transparent',
        color: 'var(--text-primary)',
        border: 'none',
      };
    } else if (variant === "link") {
      variantStyle = {
        backgroundColor: 'transparent',
        color: 'var(--accent)',
        border: 'none',
        textDecoration: 'underline',
      };
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "hover:opacity-90": variant === "default" || variant === "destructive",
            "hover:bg-opacity-10 hover:bg-accent": variant === "outline",
            "hover:bg-opacity-80": variant === "secondary",
            "hover:bg-opacity-10 hover:bg-accent": variant === "ghost",
            "hover:underline": variant === "link",
            "h-10 py-2 px-4": size === "default",
            "h-9 px-3 rounded-md": size === "sm",
            "h-11 px-8 rounded-md": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        style={{
          ...variantStyle,
          ...style,
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

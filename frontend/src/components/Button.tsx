'use client';

/**
 * Shared button component.
 *
 * This wraps visual variants, loading state, and motion behavior so actions
 * look and behave the same across the application.
 */
import { forwardRef, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, type = 'button', ...props }, ref) => {
    const baseStyles =
      'inline-flex min-h-[44px] items-center justify-center rounded-xl text-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4b4b4b]/30 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-[#111111] text-white hover:bg-[#2a2a2a]',
      secondary: 'bg-[#4b4b4b] text-white hover:bg-[#3f3f3f]',
      outline: 'border border-white/72 bg-white/64 text-primary hover:bg-white/78',
      ghost: 'bg-transparent text-primary hover:bg-white/60',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        type={type}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;


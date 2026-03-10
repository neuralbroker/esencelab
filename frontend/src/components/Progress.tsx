'use client';

/**
 * Shared progress components.
 *
 * These visual helpers render circular and bar-based progress indicators for
 * scores, readiness, roadmap completion, and similar dashboard metrics.
 */
import { motion } from 'framer-motion';

export function ProgressBar({ value, max = 100, className = '', barClassName = '' }: { value: number; max?: number; className?: string; barClassName?: string }) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className={`w-full bg-border rounded-full h-2 overflow-hidden ${className}`}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`bg-primary h-full rounded-full ${barClassName}`}
            />
        </div>
    );
}

export function CircularProgress({ value, max = 100, size = 120, strokeWidth = 8, className = '' }: { value: number; max?: number; size?: number; strokeWidth?: number; className?: string; }) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    className="text-border"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <motion.circle
                    className="text-primary"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-primary">{Math.round(value)}</span>
            </div>
        </div>
    );
}

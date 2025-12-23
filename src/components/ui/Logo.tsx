import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showFallback?: boolean;
}

const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
};

const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
};

export function Logo({ className, size = 'md', showFallback = true }: LogoProps) {
    const [imageError, setImageError] = useState(false);

    const handleError = () => {
        setImageError(true);
    };

    if (imageError && showFallback) {
        return (
            <div className={cn(
                "rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center",
                sizeClasses[size],
                className
            )}>
                <Shield className={cn("text-white", iconSizes[size])} />
            </div>
        );
    }

    return (
        <div className={cn(
            "rounded-full bg-white flex items-center justify-center overflow-hidden shadow-lg",
            sizeClasses[size],
            className
        )}>
            <img
                src="/logo.jpg"
                alt="Cyber Crime Wing - Tamil Nadu Police"
                className="w-full h-full object-cover"
                onError={handleError}
            />
        </div>
    );
}


import React from 'react';

export type BadgeProps = {
    children: React.ReactNode;
    color: string | 'blue' | 'green' | 'yellow' | 'red' | 'gray';
    size?: 'sm' | 'md' | 'lg';
};

export const Badge: React.FC<BadgeProps> = ({ children, color = 'gray', size = 'md' }) => {
    // const colorClasses: { [keyof BadgeProps["color"]]: string } = {
    const colorClasses: { [key: BadgeProps["color"]]: string } = {
        blue: 'bg-blue-100 text-blue-800',
        green: 'bg-green-100 text-green-800',
        yellow: 'bg-yellow-100 text-yellow-800',
        red: 'bg-red-100 text-red-800',
        gray: 'bg-slate-100 text-slate-800',
    };

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
        lg: 'px-3 py-1 text-base',
    }

    return (
        <span className={`inline-flex items-center font-medium rounded-full ${colorClasses[color]} ${sizeClasses[size]}`}>
            {children}
        </span>
    );
};

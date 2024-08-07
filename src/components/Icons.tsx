import React from 'react';

type IconProps = {
  className?: string;
};

export const EnterIcon: React.FC<IconProps> = ({ className }) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0.5 9.5H9.5C10.5609 9.5 11.5783 9.07857 12.3284 8.32843C13.0786 7.57828 13.5 6.56087 13.5 5.5C13.5 4.43913 13.0786 3.42172 12.3284 2.67157C11.5783 1.92143 10.5609 1.5 9.5 1.5H6.5" stroke="#9CA3AF" strokeWidth="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3.5 6.5L0.5 9.5L3.5 12.5" stroke="#9CA3AF" strokeWidth="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
);
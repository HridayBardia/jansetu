'use client';

import React from 'react';
import { Logo } from './common/Logo';

interface JanSetuLogoProps {
  variant?: 'full' | 'compact' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  asLink?: boolean;
}

export const JanSetuLogo: React.FC<JanSetuLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  asLink = false
}) => {
  const heightMap = {
    sm: 32,
    md: 40,
    lg: 48
  };

  const logoVariant = variant === 'compact' || variant === 'icon-only' ? 'icon-only' : 'full';

  return (
    <Logo 
      variant={logoVariant} 
      height={heightMap[size]} 
      className={className} 
      asLink={asLink} 
    />
  );
};

export default JanSetuLogo;

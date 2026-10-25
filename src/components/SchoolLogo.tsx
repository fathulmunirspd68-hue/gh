import React, { useState, useEffect } from 'react';
import { School } from 'lucide-react';

interface SchoolLogoProps {
  logoUrl?: string;
  schoolName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  logoUrl,
  schoolName,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
    xl: 'w-14 h-14',
  };

  const imgSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
    xl: 'w-20 h-20',
  };

  if (logoUrl && !hasError) {
    return (
      <img
        src={logoUrl}
        alt={`Logo ${schoolName}`}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`${imgSizes[size]} object-contain select-none ${className}`}
      />
    );
  }

  return <School className={`${iconSizes[size]} text-indigo-900 ${className}`} />;
};

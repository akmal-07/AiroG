import React from 'react';
import type { AqiBandInfo, CpcbBandKey } from '../lib/types';
import { getAqiBand, CPCB_BANDS } from '../lib/aqi';

export interface AqiBadgeProps {
  readonly aqi?: number;
  readonly bandKey?: CpcbBandKey;
  readonly showValue?: boolean;
  readonly size?: 'sm' | 'md' | 'lg' | 'xl';
  readonly className?: string;
}

const AqiBadgeComponent: React.FC<AqiBadgeProps> = ({
  aqi,
  bandKey,
  showValue = true,
  size = 'md',
  className = '',
}) => {
  const band: AqiBandInfo = React.useMemo(() => {
    if (typeof aqi === 'number') {
      return getAqiBand(aqi);
    }
    if (bandKey) {
      const match = CPCB_BANDS.find((b) => b.key === bandKey);
      if (match) return match;
    }
    return CPCB_BANDS[0]!;
  }, [aqi, bandKey]);

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-sm px-3 py-1 gap-2',
    lg: 'text-base px-4 py-1.5 gap-2.5 font-semibold',
    xl: 'text-lg px-5 py-2 gap-3 font-bold',
  }[size];

  const dotSizes = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-3.5 w-3.5',
  }[size];

  const accessibleLabel = typeof aqi === 'number'
    ? `AQI ${aqi}, ${band.label} category (CPCB scale ${band.rangeText})`
    : `${band.label} category (CPCB scale ${band.rangeText})`;

  return (
    <span
      role="status"
      aria-label={accessibleLabel}
      className={`inline-flex items-center rounded-full border font-medium ${band.badgeBg} ${band.badgeText} ${band.badgeBorder} ${sizeClasses} ${className}`}
    >
      <span
        className={`rounded-full shrink-0 ${band.dotColor} ${dotSizes}`}
        aria-hidden="true"
      />
      {typeof aqi === 'number' && showValue && (
        <span className="font-bold tabular-nums">{Math.round(aqi)}</span>
      )}
      <span>{band.label}</span>
    </span>
  );
};

export const AqiBadge = React.memo(AqiBadgeComponent);

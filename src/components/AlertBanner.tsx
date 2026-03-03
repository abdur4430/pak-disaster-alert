'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Alert } from '@/lib/types';

interface AlertBannerProps {
  alerts: Alert[];
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-900/90 border-red-500 text-red-100',
  high: 'bg-orange-900/90 border-orange-500 text-orange-100',
  medium: 'bg-yellow-900/90 border-yellow-500 text-yellow-100',
  low: 'bg-blue-900/90 border-blue-500 text-blue-100',
};

const SEVERITY_ICON_STYLES: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-blue-400',
};

export default function AlertBanner({ alerts }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alerts.length === 0) {
    return null;
  }

  // Sort alerts by severity to show the highest first
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const sorted = [...alerts].sort(
    (a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
  );

  const topAlert = sorted[0];
  const severity = topAlert.severity;
  const bannerStyle = SEVERITY_STYLES[severity] || SEVERITY_STYLES.low;
  const iconStyle = SEVERITY_ICON_STYLES[severity] || SEVERITY_ICON_STYLES.low;

  return (
    <div
      className={`w-full border-b px-4 py-3 ${bannerStyle}`}
      role="alert"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${iconStyle}`} />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">
              {topAlert.title}
            </p>
            <p className="text-xs opacity-80 truncate">
              {topAlert.description}
              {topAlert.distance > 0 && (
                <span className="ml-2">({Math.round(topAlert.distance)} km away)</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {alerts.length > 1 && (
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">
              +{alerts.length - 1} more
            </span>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="rounded-md p-1 hover:bg-white/10 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

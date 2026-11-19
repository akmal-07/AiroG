import React from 'react';
import type { PlanItem } from '@/types';

interface PlanCardProps {
  readonly item: PlanItem;
}

const PlanCardComponent: React.FC<PlanCardProps> = ({ item }) => {
  const categoryConfig = {
    routines: {
      label: 'Daily Routine',
      badgeClass: 'bg-blue-50 text-blue-900 border-blue-200',
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    'indoor hacks': {
      label: 'Indoor Protection',
      badgeClass: 'bg-purple-50 text-purple-900 border-purple-200',
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    'greener alternatives': {
      label: 'Greener Choice',
      badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      ),
    },
  }[item.category] ?? {
    label: item.category,
    badgeClass: 'bg-[#F5F5F7] text-[#1D1D1F] border-black/10',
    icon: null,
  };

  const impact = item.computedImpact;

  const impactBadgeConfig = {
    High: {
      label: 'High Impact',
      badgeClass: 'bg-emerald-50 text-emerald-950 border-emerald-300',
      dotClass: 'bg-emerald-600',
    },
    Medium: {
      label: 'Medium Impact',
      badgeClass: 'bg-blue-50 text-blue-950 border-blue-300',
      dotClass: 'bg-[#0071E3]',
    },
    Low: {
      label: 'Low Impact',
      badgeClass: 'bg-[#F5F5F7] text-[#1D1D1F] border-black/15',
      dotClass: 'bg-[#6E6E73]',
    },
    Comfort: {
      label: 'Comfort',
      badgeClass: 'bg-amber-50 text-amber-950 border-amber-300',
      dotClass: 'bg-amber-600',
    },
  }[impact?.level ?? 'Medium'];

  const displayImpactLine = impact?.line ?? item.impact;

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-black/5 bg-white p-5 sm:p-6 shadow-apple transition-all hover:shadow-apple-hover hover:border-black/10 space-y-4">
      <div>
        {/* Badges Bar: Category + Impact Level Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${categoryConfig.badgeClass}`}
          >
            {categoryConfig.icon}
            <span>{categoryConfig.label}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${impactBadgeConfig.badgeClass}`}
            role="status"
            aria-label={`Impact level: ${impactBadgeConfig.label}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${impactBadgeConfig.dotClass}`} aria-hidden="true" />
            <span>{impactBadgeConfig.label}</span>
          </span>
        </div>

        <h3 className="mt-3.5 text-base font-semibold tracking-tight text-[#1D1D1F] leading-snug">
          {item.title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-[#6E6E73]">
          {item.detail}
        </p>
      </div>

      {/* Traceable Plain-Words Impact Indicator with generous p-4 padding */}
      <div className="rounded-xl bg-[#F5F5F7] border border-black/5 p-4 space-y-2">
        <div className="flex items-start gap-1.5 text-xs text-[#1D1D1F]">
          <span className="font-semibold text-[#1D1D1F] shrink-0">Impact:</span>
          <span className="leading-normal">{displayImpactLine}</span>
        </div>

        {impact?.ruleTrace && (
          <p className="text-xs font-medium text-[#6E6E73] border-t border-black/5 pt-2 leading-relaxed">
            {impact.ruleTrace}
          </p>
        )}
      </div>
    </article>
  );
};

export const PlanCard = React.memo(PlanCardComponent);

import React from 'react';
import type { PlanItem } from '../lib/types';

interface PlanCardProps {
  readonly item: PlanItem;
}

const PlanCardComponent: React.FC<PlanCardProps> = ({ item }) => {
  const categoryConfig = {
    routines: {
      label: 'Daily Routine',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    'indoor hacks': {
      label: 'Indoor Hack',
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    'greener alternatives': {
      label: 'Greener Alternative',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      ),
    },
  }[item.category] ?? {
    label: item.category,
    badgeClass: 'bg-slate-50 text-slate-800 border-slate-200',
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
      badgeClass: 'bg-teal-50 text-teal-950 border-teal-300',
      dotClass: 'bg-teal-600',
    },
    Low: {
      label: 'Low Impact',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
      dotClass: 'bg-slate-500',
    },
    Comfort: {
      label: 'Comfort',
      badgeClass: 'bg-amber-50 text-amber-950 border-amber-300',
      dotClass: 'bg-amber-600',
    },
  }[impact?.level ?? 'Medium'];

  const displayImpactLine = impact?.line ?? item.impact;

  return (
    <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm">
      <div>
        {/* Badges Bar: Category + Impact Level Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${categoryConfig.badgeClass}`}
          >
            {categoryConfig.icon}
            <span>{categoryConfig.label}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-bold ${impactBadgeConfig.badgeClass}`}
            role="status"
            aria-label={`Impact level: ${impactBadgeConfig.label}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${impactBadgeConfig.dotClass}`} aria-hidden="true" />
            <span>{impactBadgeConfig.label}</span>
          </span>
        </div>

        <h3 className="mt-3 text-base font-bold text-slate-900 leading-snug">
          {item.title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {item.detail}
        </p>
      </div>

      {/* Traceable Plain-Words Impact Indicator */}
      <div className="mt-4 rounded-lg bg-slate-50 border border-slate-100 p-3">
        <div className="flex items-start gap-1.5 text-xs text-slate-700">
          <span className="font-bold text-slate-900 shrink-0">Impact:</span>
          <span className="leading-normal">{displayImpactLine}</span>
        </div>

        {impact?.ruleTrace && (
          <p className="mt-1.5 text-2xs font-medium text-slate-400 border-t border-slate-200/60 pt-1.5">
            {impact.ruleTrace}
          </p>
        )}
      </div>
    </article>
  );
};

export const PlanCard = React.memo(PlanCardComponent);

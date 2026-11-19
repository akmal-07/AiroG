import React from 'react';
import type { CpcbBandKey, DayImpactSummary, OutdoorWindowInfo, PlanItem } from '@/types';
import { AqiBadge } from '@/features/aqi';

export interface ImpactBarProps {
  readonly summary: DayImpactSummary;
  readonly aqi: number;
  readonly category: CpcbBandKey;
  readonly bestWindow: OutdoorWindowInfo;
  readonly city?: string;
  readonly items?: readonly PlanItem[];
}

export const ImpactBar: React.FC<ImpactBarProps> = ({
  summary,
  aqi,
  category,
  bestWindow,
  city = 'Your City',
  items = [],
}) => {
  const riskColorMap = {
    Minimal: {
      badge: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      bar: 'bg-emerald-500',
    },
    Moderate: {
      badge: 'bg-lime-50 text-lime-950 border-lime-300',
      bar: 'bg-lime-500',
    },
    Elevated: {
      badge: 'bg-amber-50 text-amber-950 border-amber-300',
      bar: 'bg-amber-500',
    },
    High: {
      badge: 'bg-orange-50 text-orange-950 border-orange-300',
      bar: 'bg-orange-500',
    },
    Severe: {
      badge: 'bg-rose-50 text-rose-950 border-rose-300',
      bar: 'bg-rose-600',
    },
  }[summary.riskCategory];

  // Zero-dependency WhatsApp family share message
  const topActionsText = items && items.length > 0
    ? items.slice(0, 3).map((it, idx) => `${idx + 1}. ${it.title}`).join('\n')
    : '• Align errands with best outdoor window\n• Keep windows sealed during peak smog\n• Use mechanical filtration indoors';

  const shareMessage = `*AiroG Air Quality Report — ${city}*\n\n` +
    `*Current AQI:* ${Math.round(aqi)} (${category})\n` +
    `*Best Outdoor Window:* ${bestWindow.windowText} (Avg AQI: ~${bestWindow.averageAqi})\n` +
    `*Peak Smog:* Around ${bestWindow.peakHour} (~${bestWindow.peakAqi} AQI)\n` +
    `*Estimated Exposure Score:* ${summary.exposureScore}/100 (${summary.riskCategory} risk)\n\n` +
    `*Key Protective Actions:*\n${topActionsText}\n\n` +
    `*Note:* General guidance, not medical advice.\n` +
    `View live report: https://airog.vercel.app`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  return (
    <section
      aria-labelledby="day-summary-heading"
      className="rounded-3xl border border-black/5 bg-white p-6 sm:p-8 shadow-apple space-y-6"
    >
      <div className="flex flex-col gap-4 border-b border-black/5 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#1D1D1F] text-white shadow-2xs" aria-hidden="true">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <h2 id="day-summary-heading" className="text-xs font-bold uppercase tracking-wider text-[#6E6E73]">
              Household Exposure & Outlook
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Zero-dependency WhatsApp Share Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share daily air quality report with family on WhatsApp"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition active:scale-95 focus-visible:outline-2 focus-visible:outline-[#25D366]"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>Share</span>
            </a>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#6E6E73]">Scale:</span>
              <AqiBadge aqi={aqi} bandKey={category} size="sm" />
            </div>
          </div>
        </div>

        {/* One-sentence day summary headline derived strictly from band + household */}
        <p className="text-base font-bold tracking-tight text-[#1D1D1F] sm:text-lg leading-snug">
          {summary.headline}
        </p>
      </div>

      {/* Exposure Score & Window Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Exposure Score (0-100 deterministic) */}
        <div className="rounded-2xl border border-black/5 bg-[#F5F5F7] p-4.5 transition-all">
          <div className="flex items-center justify-between text-xs text-[#6E6E73]">
            <span className="font-semibold text-[#1D1D1F]">Daily Exposure Score</span>
            <span
              className={`rounded-full border px-2 py-0.5 text-2xs font-bold ${riskColorMap.badge}`}
              aria-label={`Risk category: ${summary.riskCategory}`}
            >
              {summary.riskCategory}
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tabular-nums tracking-tight text-[#1D1D1F]">
              {summary.exposureScore}
            </span>
            <span className="text-xs font-medium text-[#6E6E73]">/ 100</span>
          </div>

          {/* Accessible progress gauge bar */}
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E5E5EA]"
            role="progressbar"
            aria-valuenow={summary.exposureScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Daily exposure score ${summary.exposureScore} out of 100 (${summary.riskCategory} risk)`}
          >
            <div
              className={`h-full transition-all duration-300 ${riskColorMap.bar}`}
              style={{ width: `${summary.exposureScore}%` }}
            />
          </div>
          <p className="mt-2 text-2xs text-[#6E6E73]">
            Accounts for ambient AQI, vulnerabilities & active plan protections.
          </p>
        </div>

        {/* Best Outdoor Window */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4.5 transition-all">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <svg className="h-3.5 w-3.5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Best Window Today</span>
          </div>
          <div className="mt-2.5 text-base font-bold tracking-tight text-emerald-950">
            {bestWindow.windowText}
          </div>
          <p className="mt-1.5 text-xs text-emerald-850">
            Average AQI ~{bestWindow.averageAqi} ({bestWindow.category}). Optimal time for errands.
          </p>
        </div>

        {/* Peak Smog Window */}
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-4.5 transition-all">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
            <svg className="h-3.5 w-3.5 text-rose-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Peak Smog Inversion</span>
          </div>
          <div className="mt-2.5 text-base font-bold tracking-tight text-rose-950">
            Around {bestWindow.peakHour}
          </div>
          <p className="mt-1.5 text-xs text-rose-850">
            Smog spikes to ~{bestWindow.peakAqi} AQI. Keep windows sealed tight.
          </p>
        </div>
      </div>

      {/* Disclaimers & Methodology Line */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-black/5 pt-4 text-2xs text-[#6E6E73]">
        <div className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 text-[#0071E3] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span className="font-semibold text-[#1D1D1F]">General guidance, not medical advice.</span>
        </div>
        <span className="italic">{summary.methodLine}</span>
      </div>
    </section>
  );
};

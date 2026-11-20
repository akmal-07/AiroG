import { describe, it, expect } from 'vitest';
import {
  computeDailyExposureScore,
  computeItemImpact,
  generateDayHeadline,
  generateDaySummary,
  METHOD_LINE,
} from '../utils/impact';
import type { Household, PlanItem } from '@/types';

describe('Deterministic Impact Model', () => {
  const mockHousehold: Household = {
    adults: 2,
    children: 1,
    elders: 0,
    hasAsthma: false,
    hasPurifier: true,
  };

  const sampleItems: PlanItem[] = [
    {
      id: 'item-1',
      title: 'Run HEPA Air Purifier',
      detail: 'Keep running in bedroom and living area',
      impact: 'Reduces fine particles',
      category: 'indoor hacks',
    },
    {
      id: 'item-2',
      title: 'Align Outdoor Chores to Best Window',
      detail: 'Shift tasks to 2:00 PM – 4:00 PM',
      impact: 'Avoids heavy smog peak',
      category: 'routines',
    },
    {
      id: 'item-3',
      title: 'Drink Herbal Tea',
      detail: 'Stay hydrated with warm water',
      impact: 'Throat hydration',
      category: 'indoor hacks',
    },
  ];

  it('computes daily exposure score with strict idempotency (same inputs -> exact same score)', () => {
    const scoreA = computeDailyExposureScore(312, 'Very Poor', mockHousehold, sampleItems);
    const scoreB = computeDailyExposureScore(312, 'Very Poor', mockHousehold, sampleItems);

    expect(scoreA).toBe(scoreB);
    expect(scoreA).toBeGreaterThanOrEqual(0);
    expect(scoreA).toBeLessThanOrEqual(100);
  });

  it('produces transparent rule traces for air filtration and outdoor window avoidance', () => {
    const purifierImpact = computeItemImpact(sampleItems[0]!, 'Very Poor', mockHousehold);
    expect(purifierImpact.level).toBe('High');
    expect(purifierImpact.ruleTrace).toContain('HEPA');

    const windowImpact = computeItemImpact(sampleItems[1]!, 'Very Poor', mockHousehold);
    expect(windowImpact.level).toBe('High');
    expect(windowImpact.ruleTrace).toContain('ambient pollutant concentration');

    // Verify distinct, non-repeating impact copy across diverse plan actions
    const n95Mask = computeItemImpact(
      { id: 'item-m', title: 'Wear N95 Mask Outdoors', detail: 'Ensure tight seal over nose', impact: '', category: 'routines' },
      'Very Poor',
      mockHousehold
    );
    const asthmaInhaler = computeItemImpact(
      { id: 'item-a', title: 'Keep Asthma Inhalers Accessible', detail: 'Carry rescue spacer', impact: '', category: 'routines' },
      'Very Poor',
      { ...mockHousehold, hasAsthma: true }
    );
    expect(n95Mask.line).not.toBe(asthmaInhaler.line);
    expect(n95Mask.line).toContain('N95');
    expect(asthmaInhaler.line).toContain('inhaler');

    const windowSeal = computeItemImpact(
      { id: 'item-w', title: 'Keep Windows Tightly Shut', detail: 'Prevent ingress', impact: '', category: 'indoor hacks' },
      'Very Poor',
      mockHousehold
    );
    const draftGuard = computeItemImpact(
      { id: 'item-d', title: 'Place Towel Under Door Draft', detail: 'Block ground gaps', impact: '', category: 'indoor hacks' },
      'Very Poor',
      mockHousehold
    );
    expect(windowSeal.line).not.toBe(draftGuard.line);

    const wetMop = computeItemImpact(
      { id: 'item-mp', title: 'Wet Mop Floors Twice Daily', detail: 'Trap settled particles', impact: '', category: 'indoor hacks' },
      'Very Poor',
      mockHousehold
    );
    const dampCloth = computeItemImpact(
      { id: 'item-dc', title: 'Wipe Sills with Damp Microfiber Cloth', detail: 'Lift surface film', impact: '', category: 'indoor hacks' },
      'Very Poor',
      mockHousehold
    );
    expect(wetMop.line).not.toBe(dampCloth.line);
  });

  it('tags non-particulate actions strictly as Comfort without inventing exposure reductions', () => {
    const comfortImpact = computeItemImpact(sampleItems[2]!, 'Very Poor', mockHousehold);
    expect(comfortImpact.level).toBe('Comfort');
    expect(comfortImpact.line).toBe('Comfort, not exposure.');
    expect(comfortImpact.ruleTrace).toContain('Supportive wellness measure');
  });

  it('derives one-sentence day summary headline strictly from AQI band and household', () => {
    // Very Poor + kids
    const headlineKids = generateDayHeadline('Very Poor', mockHousehold);
    expect(headlineKids).toBe('Today is a stay-indoors day for the kids.');

    // Very Poor + asthma
    const headlineAsthma = generateDayHeadline('Very Poor', { ...mockHousehold, hasAsthma: true });
    expect(headlineAsthma).toContain('sensitive airways');

    // Moderate
    const headlineMod = generateDayHeadline('Moderate', mockHousehold);
    expect(headlineMod).toContain('Moderate air conditions');
  });

  it('includes the mandatory transparent methodology line', () => {
    const summary = generateDaySummary(312, 'Very Poor', mockHousehold, sampleItems);
    expect(summary.methodLine).toBe(METHOD_LINE);
    expect(summary.methodLine).toBe('Impact is estimated from the AQI band and your household — not measured.');
  });
});

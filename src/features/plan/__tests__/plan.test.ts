import { describe, it, expect } from 'vitest';
import {
  generateRuleBasedPlan,
  PlanResponseSchema,
  PlanItemSchema,
} from '../api/plan';
import type { PlanRequestBody } from '@/types';

describe('Deterministic Plan Fallback Engine', () => {
  const mockRequest: PlanRequestBody = {
    city: 'Delhi',
    aqi: 312,
    pm25: 135.3,
    pm10: 275.0,
    category: 'Very Poor',
    bestWindow: {
      startHour: '2:00 PM',
      endHour: '4:00 PM',
      windowText: '2:00 PM – 4:00 PM',
      averageAqi: 235,
      category: 'Poor',
      peakHour: '8:00 PM',
      peakAqi: 368,
      peakCategory: 'Very Poor',
    },
    peak: {
      hour: '8:00 PM',
      aqi: 368,
    },
    household: {
      adults: 2,
      children: 2,
      elders: 1,
      hasAsthma: true,
      hasPurifier: true,
    },
  };

  it('generates 5 to 8 categorized items for Very Poor smog with vulnerable family members', () => {
    const plan = generateRuleBasedPlan(mockRequest);

    expect(plan.planType).toBe('standard plan');
    expect(plan.isFallback).toBe(true);
    expect(plan.items.length).toBeGreaterThanOrEqual(5);
    expect(plan.items.length).toBeLessThanOrEqual(8);

    const categories = new Set(plan.items.map((i) => i.category));
    expect(categories.has('routines')).toBe(true);
    expect(categories.has('indoor hacks')).toBe(true);
    expect(categories.has('greener alternatives')).toBe(true);
  });

  it('schedules outdoor routines specifically inside the best window', () => {
    const plan = generateRuleBasedPlan(mockRequest);
    const outdoorItem = plan.items.find(
      (i) => i.title.toLowerCase().includes('outdoor') || i.category === 'routines'
    );

    expect(outdoorItem).toBeDefined();
    expect(outdoorItem?.detail).toContain('2:00 PM – 4:00 PM');
  });

  it('contains targeted protective items for children, elders, and asthma', () => {
    const plan = generateRuleBasedPlan(mockRequest);

    const childProtection = plan.items.some((i) =>
      i.title.toLowerCase().includes('children') || i.detail.toLowerCase().includes('children')
    );
    expect(childProtection).toBe(true);

    const asthmaProtection = plan.items.some((i) =>
      i.title.toLowerCase().includes('asthma') || i.detail.toLowerCase().includes('inhaler')
    );
    expect(asthmaProtection).toBe(true);

    const purifierProtection = plan.items.some((i) =>
      i.title.toLowerCase().includes('purifier') || i.detail.toLowerCase().includes('purifier')
    );
    expect(purifierProtection).toBe(true);
  });

  it('strictly adheres to plain words without decimal percentages in impact', () => {
    const plan = generateRuleBasedPlan(mockRequest);
    for (const item of plan.items) {
      expect(item.impact).not.toMatch(/\d+%/);
    }
  });
});

describe('Zod Schema Validation', () => {
  it('validates compliant 5-8 item plan payloads', () => {
    const validPayload = {
      items: [
        { id: '1', title: 'Action 1', detail: 'Detail 1', impact: 'Plain impact 1', category: 'routines' },
        { id: '2', title: 'Action 2', detail: 'Detail 2', impact: 'Plain impact 2', category: 'routines' },
        { id: '3', title: 'Action 3', detail: 'Detail 3', impact: 'Plain impact 3', category: 'indoor hacks' },
        { id: '4', title: 'Action 4', detail: 'Detail 4', impact: 'Plain impact 4', category: 'indoor hacks' },
        { id: '5', title: 'Action 5', detail: 'Detail 5', impact: 'Plain impact 5', category: 'greener alternatives' },
      ],
    };

    const parsed = PlanResponseSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it('rejects plans with fewer than 5 items', () => {
    const invalidPayload = {
      items: [
        { id: '1', title: 'A', detail: 'B', impact: 'C', category: 'routines' },
      ],
    };
    const parsed = PlanResponseSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it('rejects unrecognized plan categories', () => {
    const invalidItem = {
      id: '1',
      title: 'Action',
      detail: 'Detail',
      impact: 'Impact',
      category: 'medical-intervention',
    };
    const parsed = PlanItemSchema.safeParse(invalidItem);
    expect(parsed.success).toBe(false);
  });
});

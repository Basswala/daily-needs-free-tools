import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRoas,
  computeShipping,
  computeDiscountDepth,
  computeLtv,
  computeFatigue,
  computeCashRunway,
  computeRop,
  computeAutomationRoi,
  computeEffectiveRate,
  computeChurn,
  buildUtmUrl,
  cleanAiContent,
} from '../dist/index.mjs';

test('Break-Even ROAS calculation', () => {
  const res = computeRoas({
    aov: 85,
    cogs: 22,
    shipping: 8,
    feePct: 2.9,
    feeFixed: 0.30,
    targetMarginPct: 20,
  });

  assert.equal(res.totalUnitCost, 32.765);
  assert.equal(Math.round(res.contributionMarginDollars * 100) / 100, 52.24);
  assert.equal(Math.round(res.breakevenRoas * 100) / 100, 1.63);
  assert.equal(Math.round(res.targetRoas * 100) / 100, 2.41);
});

test('Free Shipping Threshold calculation', () => {
  const res = computeShipping({
    aov: 85,
    shippingCost: 10,
    cogsPct: 35,
    paymentPct: 2.9,
    ordersPerMonth: 200,
  });

  assert.equal(res.breakEvenOrderValue > 0, true);
  assert.equal(res.shippingAsPctOfRevenue > 0, true);
  assert.equal(typeof res.verdict, 'string');
});

test('Discount Depth Break-Even calculation', () => {
  const res = computeDiscountDepth({
    price: 100,
    cogs: 30,
    shipping: 10,
    paymentPct: 2.9,
    discountPct: 20,
    unitsSold: 100,
  });

  assert.equal(res.discountedPrice, 80);
  assert.equal(res.maxDiscountPct > 0, true);
  assert.equal(res.monthlyMarginLost > 0, true);
});

test('Cash Runway calculation', () => {
  const res = computeCashRunway({
    cash: 60000,
    revenue: 20000,
    variableCostPct: 30,
    fixedCosts: 10000,
    ownerDraw: 5000,
  });

  assert.equal(res.contribution, 14000);
  assert.equal(res.netMonthly, -1000);
  assert.equal(res.burn, 1000);
  assert.equal(res.runwayMonths, 60);
  assert.equal(res.status, 'Comfortable');
});

test('Inventory Reorder Point calculation', () => {
  const res = computeRop({
    avgDaily: 40,
    leadTimeDays: 14,
    leadTimeStdDev: 3,
    serviceLevel: 95,
    onHand: 450,
    onOrder: 0,
  });

  assert.equal(res.leadTimeDemand, 560);
  assert.equal(res.safetyStock > 0, true);
  assert.equal(res.reorderPoint > 560, true);
  assert.equal(res.daysOfCover, 11.25);
});

test('Automation ROI calculation', () => {
  const res = computeAutomationRoi({
    weeklySupportHours: 8,
    weeklyOpsHours: 6,
    hourlyRate: 100,
  });

  assert.equal(res.savedHoursWeek, 10.8);
  assert.equal(res.savedHoursMonth, 47);
  assert.equal(res.annualValueRecovered, 56400);
});

test('UTM Builder URL normalization', () => {
  const url = buildUtmUrl({
    url: 'https://dailyneedsassociation.com/tools/',
    source: 'Meta',
    medium: 'Paid_Social',
    campaign: 'Spring_Launch',
  });

  assert.equal(
    url,
    'https://dailyneedsassociation.com/tools/?utm_source=meta&utm_medium=paid_social&utm_campaign=spring_launch'
  );
});

test('AI Text Cleaner sanitization', () => {
  const raw = `Sure! Here is the response you asked for:

First point with dead space


Second point.

Hope this helps!`;

  const res = cleanAiContent(raw, { platform: 'linkedin' });
  assert.equal(res.text.includes('Sure!'), false);
  assert.equal(res.text.includes('Hope this helps!'), false);
  assert.equal(res.stats.preamblesStripped >= 1, true);
});

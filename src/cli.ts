#!/usr/bin/env node

import { computeRoas } from './roas.js';
import { computeCashRunway } from './runway.js';
import { computeShipping } from './shipping.js';
import { computeRop } from './inventory.js';
import { computeAutomationRoi } from './automation.js';
import { cleanAiContent } from './text.js';

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
      result[key] = val;
    }
  }
  return result;
}

const args = process.argv.slice(2);
const command = args[0];
const params = parseArgs(args.slice(1));

function printHelp() {
  console.log(`
Daily Needs Free Tools CLI
Interactive tools live at: https://dailyneedsassociation.com/tools/

Commands:
  roas        Calculate Break-Even ROAS and Max CAC
              Options: --aov <num> --cogs <num> --shipping <num> --feePct <num> --feeFixed <num> --targetMarginPct <num>

  runway      Calculate Cash Runway and Net Monthly Burn
              Options: --cash <num> --revenue <num> --variableCostPct <num> --fixedCosts <num> --ownerDraw <num>

  shipping    Calculate Free Shipping Threshold and Margin Leak
              Options: --aov <num> --shippingCost <num> --cogsPct <num> --paymentPct <num> --ordersPerMonth <num>

  inventory   Calculate Inventory Reorder Point (ROP) & Safety Stock
              Options: --avgDaily <num> --leadTimeDays <num> --leadTimeStdDev <num> --serviceLevel <90|95|98|99> --onHand <num> --onOrder <num>

  automation  Calculate Time and Cost Saved by Deterministic Automations
              Options: --weeklySupportHours <num> --weeklyOpsHours <num> --hourlyRate <num>

  clean       Sanitize AI Text from robotic preambles and dead line voids
              Options: --text "<string>" --platform <pure|linkedin|twitter|facebook|whatsapp>
  `);
}

switch (command) {
  case 'roas': {
    const res = computeRoas({
      aov: parseFloat(params.aov || '85'),
      cogs: parseFloat(params.cogs || '22'),
      shipping: parseFloat(params.shipping || '8'),
      feePct: parseFloat(params.feePct || '2.9'),
      feeFixed: parseFloat(params.feeFixed || '0.30'),
      targetMarginPct: parseFloat(params.targetMarginPct || '20'),
    });
    console.log(JSON.stringify(res, null, 2));
    break;
  }
  case 'runway': {
    const res = computeCashRunway({
      cash: parseFloat(params.cash || '50000'),
      revenue: parseFloat(params.revenue || '15000'),
      variableCostPct: parseFloat(params.variableCostPct || '40'),
      fixedCosts: parseFloat(params.fixedCosts || '6000'),
      ownerDraw: parseFloat(params.ownerDraw || '5000'),
    });
    console.log(JSON.stringify(res, null, 2));
    break;
  }
  case 'shipping': {
    const res = computeShipping({
      aov: parseFloat(params.aov || '85'),
      shippingCost: parseFloat(params.shippingCost || '10'),
      cogsPct: parseFloat(params.cogsPct || '35'),
      paymentPct: parseFloat(params.paymentPct || '2.9'),
      ordersPerMonth: parseFloat(params.ordersPerMonth || '200'),
    });
    console.log(JSON.stringify(res, null, 2));
    break;
  }
  case 'inventory': {
    const res = computeRop({
      avgDaily: parseFloat(params.avgDaily || '40'),
      leadTimeDays: parseFloat(params.leadTimeDays || '14'),
      leadTimeStdDev: parseFloat(params.leadTimeStdDev || '3'),
      serviceLevel: (parseInt(params.serviceLevel || '95', 10) as any),
      onHand: parseFloat(params.onHand || '450'),
      onOrder: parseFloat(params.onOrder || '0'),
    });
    console.log(JSON.stringify(res, null, 2));
    break;
  }
  case 'automation': {
    const res = computeAutomationRoi({
      weeklySupportHours: parseFloat(params.weeklySupportHours || '8'),
      weeklyOpsHours: parseFloat(params.weeklyOpsHours || '6'),
      hourlyRate: parseFloat(params.hourlyRate || '100'),
    });
    console.log(JSON.stringify(res, null, 2));
    break;
  }
  case 'clean': {
    const res = cleanAiContent(params.text || '', {
      platform: (params.platform as any) || 'pure',
    });
    console.log(JSON.stringify(res, null, 2));
    break;
  }
  default:
    printHelp();
    break;
}

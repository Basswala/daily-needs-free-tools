#!/usr/bin/env node

// src/roas.ts
function computeRoas(input) {
  const feePctRate = input.feePct / 100;
  const targetMarginRate = input.targetMarginPct / 100;
  const paymentFee = input.aov * feePctRate + input.feeFixed;
  const totalUnitCost = input.cogs + input.shipping + paymentFee;
  const contributionMarginDollars = input.aov - totalUnitCost;
  const contributionMarginPct = input.aov > 0 ? contributionMarginDollars / input.aov * 100 : 0;
  const maxCac = Math.max(0, contributionMarginDollars);
  const breakevenRoas = maxCac > 0 ? input.aov / maxCac : 999;
  const targetProfitDollars = input.aov * targetMarginRate;
  const targetMaxCac = Math.max(0.01, contributionMarginDollars - targetProfitDollars);
  const targetRoas = targetMaxCac > 0 ? input.aov / targetMaxCac : 999;
  return {
    paymentFee,
    totalUnitCost,
    contributionMarginDollars,
    contributionMarginPct,
    maxCac,
    breakevenRoas,
    targetProfitDollars,
    targetMaxCac,
    targetRoas
  };
}

// src/runway.ts
function addMonths(base, months) {
  const d = new Date(base.getTime());
  const whole = Math.floor(months);
  const frac = months - whole;
  d.setMonth(d.getMonth() + whole);
  if (frac > 0)
    d.setDate(d.getDate() + Math.round(frac * 30));
  return d;
}
function computeCashRunway(input, now = new Date) {
  const variableRate = input.variableCostPct / 100;
  const variableCost = input.revenue * variableRate;
  const contribution = input.revenue - variableCost;
  const netMonthly = contribution - input.fixedCosts - input.ownerDraw;
  const burn = netMonthly < 0 ? -netMonthly : 0;
  const runwayMonths = burn > 0 ? input.cash / burn : null;
  const breakevenRevenue = 1 - variableRate > 0 ? (input.fixedCosts + input.ownerDraw) / (1 - variableRate) : 0;
  const revenueGap = Math.max(0, breakevenRevenue - input.revenue);
  let status = "Cash positive";
  if (netMonthly < 0) {
    if (runwayMonths !== null && runwayMonths >= 12)
      status = "Comfortable";
    else if (runwayMonths !== null && runwayMonths >= 6)
      status = "Watch it";
    else if (runwayMonths !== null && runwayMonths >= 3)
      status = "Act now";
    else
      status = "Critical";
  }
  return {
    variableCost,
    contribution,
    netMonthly,
    burn,
    runwayMonths,
    breakevenRevenue,
    revenueGap,
    cash6mo: input.cash + netMonthly * 6,
    cash12mo: input.cash + netMonthly * 12,
    cashOutDate: runwayMonths === null ? null : addMonths(now, runwayMonths),
    status
  };
}

// src/shipping.ts
var TARGET_SHIPPING_PCT = 0.01;
var SUBSIDY_STEP = 0.1;
var BAND_EPSILON = 0.000000001;
function computeShipping(input) {
  const threshold = input.threshold ?? input.aov;
  const variableCostRate = (input.cogsPct + input.paymentPct) / 100;
  const contributionRate = 1 - variableCostRate;
  const contributionPerOrder = input.aov * contributionRate;
  const breakEvenOrderValue = contributionRate > 0 ? input.shippingCost / contributionRate : 0;
  const monthlyShippingCost = input.shippingCost * input.ordersPerMonth;
  const monthlyRevenue = input.aov * input.ordersPerMonth;
  const shippingAsPctOfRevenue = monthlyRevenue > 0 ? monthlyShippingCost / monthlyRevenue * 100 : 0;
  const averageMarginPerOrder = contributionPerOrder - input.shippingCost;
  const marginIfChargedAtCost = contributionPerOrder;
  const aovForOnePctShipping = input.shippingCost / TARGET_SHIPPING_PCT;
  const perTenPercentSubsidy = input.shippingCost * input.ordersPerMonth * SUBSIDY_STEP;
  let verdict = "Shipping is not your leak";
  if (shippingAsPctOfRevenue > 12 + BAND_EPSILON) {
    verdict = "Shipping is eating your margin";
  } else if (shippingAsPctOfRevenue >= 6 - BAND_EPSILON) {
    verdict = "Material but manageable";
  }
  return {
    variableCostRate,
    contributionRate,
    contributionPerOrder,
    breakEvenOrderValue,
    monthlyShippingCost,
    monthlyRevenue,
    shippingAsPctOfRevenue,
    averageMarginPerOrder,
    marginIfChargedAtCost,
    aovForOnePctShipping,
    perTenPercentSubsidy,
    threshold,
    verdict
  };
}

// src/inventory.ts
var SERVICE_Z = {
  90: 1.28,
  95: 1.645,
  98: 2.05,
  99: 2.33
};
var STATUS = {
  overstock: "Overstocked (>150% ROP)",
  healthy: "Healthy stock level",
  reorder: "Reorder point reached",
  risk: "Stockout risk (below safety buffer)"
};
function computeRop(input) {
  const avgDaily = Math.max(0.1, input.avgDaily);
  const leadTimeDays = Math.max(0, input.leadTimeDays);
  const leadTimeStdDev = Math.max(0, input.leadTimeStdDev);
  const z = SERVICE_Z[input.serviceLevel] ?? SERVICE_Z[95];
  const leadTimeDemand = avgDaily * leadTimeDays;
  const safetyStock = Math.ceil(z * avgDaily * leadTimeStdDev);
  const reorderPoint = Math.ceil(leadTimeDemand + safetyStock);
  const projectedStock = Math.max(0, input.onHand) + Math.max(0, input.onOrder);
  const daysOfCover = Math.max(0, input.onHand) / avgDaily;
  const newProjectedStock = projectedStock + reorderPoint;
  const newDaysOfCover = newProjectedStock / avgDaily;
  const atRisk = projectedStock - safetyStock < leadTimeDemand;
  let statusKey;
  if (projectedStock > reorderPoint * 1.5)
    statusKey = "overstock";
  else if (projectedStock >= reorderPoint)
    statusKey = "healthy";
  else if (projectedStock >= safetyStock)
    statusKey = "reorder";
  else
    statusKey = "risk";
  return {
    z,
    serviceLevel: input.serviceLevel,
    leadTimeDemand,
    safetyStock,
    reorderPoint,
    projectedStock,
    daysOfCover,
    newProjectedStock,
    newDaysOfCover,
    atRisk,
    unitGap: reorderPoint - projectedStock,
    status: STATUS[statusKey],
    statusKey
  };
}

// src/automation.ts
function computeAutomationRoi(input) {
  const savedHoursWeek = input.weeklySupportHours * 0.75 + input.weeklyOpsHours * 0.8;
  const savedHoursMonth = Math.round(savedHoursWeek * 4.33);
  const savedHoursYear = savedHoursMonth * 12;
  const annualValueRecovered = Math.round(savedHoursYear * input.hourlyRate);
  const monthlyValueRecovered = Math.round(savedHoursMonth * input.hourlyRate);
  return {
    savedHoursWeek,
    savedHoursMonth,
    savedHoursYear,
    annualValueRecovered,
    monthlyValueRecovered
  };
}

// src/text.ts
function toUnicodeBold(str) {
  return Array.from(str).map((char) => {
    const code = char.codePointAt(0) ?? 0;
    if (code >= 65 && code <= 90)
      return String.fromCodePoint(120276 + (code - 65));
    if (code >= 97 && code <= 122)
      return String.fromCodePoint(120302 + (code - 97));
    if (code >= 48 && code <= 57)
      return String.fromCodePoint(120812 + (code - 48));
    return char;
  }).join("");
}
function cleanAiContent(raw, options = {}) {
  if (!raw) {
    return {
      text: "",
      stats: { invisibleCharactersRemoved: 0, preamblesStripped: 0, linesSaved: 0 }
    };
  }
  const {
    platform = "pure",
    stripPreambles = true,
    stripInvisibleUnicode = true,
    cleanMultipleSpaces = true,
    formatBullets = true,
    collapseDeadSpace = true,
    convertUnicodeBold = false
  } = options;
  let text = raw;
  let invisibleCharactersRemoved = 0;
  let preamblesStripped = 0;
  if (stripPreambles) {
    const preambleRegex = /^(?:(?:Sure|Certainly|Here(?:'s| is| are)|Below is|I've generated|Here's an optimized|As requested)[^\n]*?:\s*\n+)/i;
    if (preambleRegex.test(text)) {
      text = text.replace(preambleRegex, "");
      preamblesStripped++;
    }
    const signoffRegex = /\n+(?:(?:Hope this helps|Let me know if you need|Feel free to ask|Let me know what you think|Enjoy!|Happy to help!)[^\n]*)$/i;
    if (signoffRegex.test(text)) {
      text = text.replace(signoffRegex, "");
      preamblesStripped++;
    }
  }
  if (stripInvisibleUnicode) {
    const invisibleRegex = /[\u200B-\u200D\uFEFF\u00A0\u2060\u180E\u2000-\u200A]/g;
    const matches = text.match(invisibleRegex);
    if (matches)
      invisibleCharactersRemoved = matches.length;
    text = text.replace(/[\u200B-\u200D\uFEFF\u2060\u180E]/g, "");
    text = text.replace(/[\u00A0\u2000-\u200A]/g, " ");
  }
  if (cleanMultipleSpaces) {
    text = text.replace(/[ \t]{2,}/g, " ");
  }
  text = text.split(`
`).map((line) => line.trimEnd()).join(`
`);
  if (formatBullets) {
    text = text.replace(/^[ \t]*[*\-+]\s+/gm, "• ");
  }
  if (platform === "whatsapp") {
    text = text.replace(/\*\*(.*?)\*\*/g, "*$1*");
  } else if (convertUnicodeBold && ["linkedin", "facebook", "twitter", "threads", "instagram"].includes(platform)) {
    text = text.replace(/\*\*(.*?)\*\*/g, (_match, p1) => toUnicodeBold(p1));
  }
  const rawLines = (raw.match(/\n/g) || []).length;
  if (collapseDeadSpace) {
    if (platform === "facebook") {
      text = text.replace(/\n{2,}/g, `
`);
    } else if (["linkedin", "threads", "twitter", "tiktok", "instagram"].includes(platform)) {
      text = text.replace(/\n{3,}/g, `

`);
      text = text.replace(/•\s*(.*?)\n\n+(?=•)/g, `• $1
`);
    } else {
      text = text.replace(/\n{3,}/g, `

`);
    }
  }
  text = text.trim();
  const cleanedLines = (text.match(/\n/g) || []).length;
  const linesSaved = Math.max(0, rawLines - cleanedLines);
  return {
    text,
    stats: {
      invisibleCharactersRemoved,
      preamblesStripped,
      linesSaved
    }
  };
}

// src/cli.ts
function parseArgs(args) {
  const result = {};
  for (let i = 0;i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
      result[key] = val;
    }
  }
  return result;
}
var args = process.argv.slice(2);
var command = args[0];
var params = parseArgs(args.slice(1));
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
  case "roas": {
    const res = computeRoas({
      aov: parseFloat(params.aov || "85"),
      cogs: parseFloat(params.cogs || "22"),
      shipping: parseFloat(params.shipping || "8"),
      feePct: parseFloat(params.feePct || "2.9"),
      feeFixed: parseFloat(params.feeFixed || "0.30"),
      targetMarginPct: parseFloat(params.targetMarginPct || "20")
    });
    console.log(JSON.stringify(res, null, 2));
    break;
  }
  case "runway": {
    const res = computeCashRunway({
      cash: parseFloat(params.cash || "50000"),
      revenue: parseFloat(params.revenue || "15000"),
      variableCostPct: parseFloat(params.variableCostPct || "40"),
      fixedCosts: parseFloat(params.fixedCosts || "6000"),
      ownerDraw: parseFloat(params.ownerDraw || "5000")
    });
    console.log(JSON.stringify(res, null, 2));
    break;
  }
  case "shipping": {
    const res = computeShipping({
      aov: parseFloat(params.aov || "85"),
      shippingCost: parseFloat(params.shippingCost || "10"),
      cogsPct: parseFloat(params.cogsPct || "35"),
      paymentPct: parseFloat(params.paymentPct || "2.9"),
      ordersPerMonth: parseFloat(params.ordersPerMonth || "200")
    });
    console.log(JSON.stringify(res, null, 2));
    break;
  }
  case "inventory": {
    const res = computeRop({
      avgDaily: parseFloat(params.avgDaily || "40"),
      leadTimeDays: parseFloat(params.leadTimeDays || "14"),
      leadTimeStdDev: parseFloat(params.leadTimeStdDev || "3"),
      serviceLevel: parseInt(params.serviceLevel || "95", 10),
      onHand: parseFloat(params.onHand || "450"),
      onOrder: parseFloat(params.onOrder || "0")
    });
    console.log(JSON.stringify(res, null, 2));
    break;
  }
  case "automation": {
    const res = computeAutomationRoi({
      weeklySupportHours: parseFloat(params.weeklySupportHours || "8"),
      weeklyOpsHours: parseFloat(params.weeklyOpsHours || "6"),
      hourlyRate: parseFloat(params.hourlyRate || "100")
    });
    console.log(JSON.stringify(res, null, 2));
    break;
  }
  case "clean": {
    const res = cleanAiContent(params.text || "", {
      platform: params.platform || "pure"
    });
    console.log(JSON.stringify(res, null, 2));
    break;
  }
  default:
    printHelp();
    break;
}

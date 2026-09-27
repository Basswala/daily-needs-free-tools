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
// src/discount.ts
var DEFAULT_LADDER = [5, 10, 15, 20, 25, 30, 40, 50];
var TIGHT_THRESHOLD = 0.75;
function computeDiscountDepth(input) {
  const variableRate = input.paymentPct / 100;
  const fullPriceRevenue = input.price;
  const fullPriceCost = input.cogs + input.shipping;
  const fullPriceContribution = fullPriceRevenue * (1 - variableRate) - fullPriceCost;
  const discountedPrice = input.price * (1 - input.discountPct / 100);
  const discountedContribution = discountedPrice * (1 - variableRate) - fullPriceCost;
  const marginPerOrderLost = fullPriceContribution - discountedContribution;
  const netOfFees = input.price * (1 - variableRate);
  const rawMaxDiscountPct = netOfFees > 0 ? (1 - fullPriceCost / netOfFees) * 100 : 0;
  const maxDiscountPct = Math.max(0, rawMaxDiscountPct);
  const monthlyMarginNow = discountedContribution * input.unitsSold;
  const monthlyMarginAtFullPrice = fullPriceContribution * input.unitsSold;
  const monthlyMarginLost = monthlyMarginAtFullPrice - monthlyMarginNow;
  const volumeCanRecover = discountedContribution > 0;
  const extraUnitsToBreakEven = volumeCanRecover ? Math.max(0, Math.ceil(monthlyMarginLost / discountedContribution)) : null;
  const verdict = input.discountPct >= maxDiscountPct ? "lose" : input.discountPct > TIGHT_THRESHOLD * maxDiscountPct ? "tight" : "ok";
  const ladder = DEFAULT_LADDER.map((d) => {
    const priceCharged = input.price * (1 - d / 100);
    const contribution = priceCharged * (1 - variableRate) - fullPriceCost;
    return {
      discount: d,
      priceCharged,
      contribution,
      vsFullPrice: contribution - fullPriceContribution
    };
  });
  return {
    variableRate,
    fullPriceContribution,
    discountedPrice,
    discountedContribution,
    marginPerOrderLost,
    maxDiscountPct,
    monthlyMarginNow,
    monthlyMarginAtFullPrice,
    monthlyMarginLost,
    extraUnitsToBreakEven,
    verdict,
    ladder
  };
}
// src/ltv.ts
function computeLtv(input) {
  const contributionPerOrder = input.aov * input.marginPct / 100;
  const ltv = contributionPerOrder * input.ordersPerCustomer;
  const ratio = input.cac > 0 ? ltv / input.cac : 0;
  const paybackOrders = contributionPerOrder > 0 ? input.cac / contributionPerOrder : 0;
  const paybackMonths = input.ordersPerMonth > 0 ? paybackOrders / input.ordersPerMonth : 0;
  const monthlyContribution = contributionPerOrder * input.ordersPerMonth;
  const monthsToRecover = monthlyContribution > 0 ? input.cac / monthlyContribution : 0;
  let status = "Healthy";
  if (ratio < 2) {
    status = "Unsustainable";
  } else if (ratio < 3) {
    status = "Moderate";
  }
  return {
    contributionPerOrder,
    ltv,
    ratio,
    paybackOrders,
    paybackMonths,
    monthlyContribution,
    monthsToRecover,
    status
  };
}
// src/fatigue.ts
var WEEKS_PER_MONTH = 4.33;
function creativeAgeBand(weeks) {
  if (weeks < 2)
    return "Fresh";
  if (weeks <= 4)
    return "Settling";
  if (weeks <= 8)
    return "Fatiguing";
  return "Almost certainly burned";
}
function computeFatigue(input) {
  const frequency = input.reach > 0 ? input.impressions / input.reach : 0;
  const frequencyPerWeek = frequency / WEEKS_PER_MONTH;
  const ctr = input.impressions > 0 ? input.clicks / input.impressions * 100 : 0;
  const conversionRate = input.clicks > 0 ? input.conversions / input.clicks * 100 : 0;
  const cpm = input.impressions > 0 ? input.spend / input.impressions * 1000 : 0;
  const costPerClick = input.clicks > 0 ? input.spend / input.clicks : 0;
  const costPerConversion = input.conversions > 0 ? input.spend / input.conversions : 0;
  let weeksToCrossover = null;
  if (frequencyPerWeek > 0) {
    weeksToCrossover = frequencyPerWeek >= input.threshold ? 0 : (input.threshold - frequencyPerWeek) / (frequencyPerWeek / WEEKS_PER_MONTH);
  }
  const ageBand = creativeAgeBand(input.ageWeeks);
  let verdict = "unlikely";
  if (frequencyPerWeek >= input.threshold && (ageBand === "Fatiguing" || ageBand === "Almost certainly burned")) {
    verdict = "fatigued";
  } else if (frequencyPerWeek >= input.threshold * 0.8) {
    verdict = "borderline";
  }
  return {
    frequency,
    frequencyPerWeek,
    ctr,
    conversionRate,
    cpm,
    costPerClick,
    costPerConversion,
    weeksToCrossover,
    ageBand,
    verdict
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
// src/rates.ts
function computeEffectiveRate(input) {
  const billed = Math.min(input.billedHours, input.actualHours);
  const nominalRate = billed > 0 ? input.fee / billed : 0;
  const effectiveRate = input.actualHours > 0 ? input.fee / input.actualHours : 0;
  const rateGap = nominalRate - effectiveRate;
  const unbilledHours = Math.max(0, input.actualHours - billed);
  const unbilledValue = unbilledHours * nominalRate;
  const costToDeliver = input.actualHours * input.costPerHour;
  const grossMarginPct = input.fee > 0 ? (input.fee - costToDeliver) / input.fee * 100 : 0;
  const marginLostToUnbilled = unbilledHours * input.costPerHour;
  const markup = 1 + input.targetMarginPct / 100;
  const recommendedFloor = billed > 0 ? input.actualHours * input.costPerHour * markup / billed : 0;
  const hoursPerWeek = input.weeks > 0 ? input.actualHours / input.weeks : 0;
  return {
    nominalRate,
    effectiveRate,
    rateGap,
    unbilledHours,
    unbilledValue,
    costToDeliver,
    grossMarginPct,
    marginLostToUnbilled,
    recommendedFloor,
    hoursPerWeek
  };
}
// src/churn.ts
function computeChurn(input) {
  const rate = input.churnPct / 100;
  const monthlyRevenue = input.clients * input.revPerClient;
  const clientsLostPerMonth = input.clients * rate;
  const annualRevenueLost = clientsLostPerMonth * input.revPerClient * 12;
  const annualMarginLost = annualRevenueLost * (input.marginPct / 100);
  const impliedTenure = rate > 0 ? 1 / rate : 0;
  const clientsToReplacePerYear = clientsLostPerMonth * 12;
  const replacementCostPerYear = clientsToReplacePerYear * input.replacementCost;
  const impliedLifetimeValue = input.revPerClient * (input.marginPct / 100) * input.statedTenure;
  const churnHalvedSavings = annualRevenueLost / 2;
  const tenureGapPct = impliedTenure > 0 ? Math.abs(input.statedTenure - impliedTenure) / impliedTenure * 100 : 0;
  let status = "Healthy";
  if (input.churnPct > 10)
    status = "The Business Is Shrinking";
  else if (input.churnPct > 6)
    status = "Losing Real Revenue";
  else if (input.churnPct >= 3)
    status = "Watch It";
  return {
    monthlyRevenue,
    clientsLostPerMonth,
    annualRevenueLost,
    annualMarginLost,
    impliedTenure,
    clientsToReplacePerYear,
    replacementCostPerYear,
    impliedLifetimeValue,
    churnHalvedSavings,
    tenureGapPct,
    status
  };
}
// src/utm.ts
function buildUtmUrl(input) {
  const base = (input.url || "").trim();
  if (!base)
    return "";
  const parsed = new URL(base.startsWith("http://") || base.startsWith("https://") ? base : `https://${base}`);
  if (input.source?.trim())
    parsed.searchParams.set("utm_source", input.source.trim().toLowerCase());
  if (input.medium?.trim())
    parsed.searchParams.set("utm_medium", input.medium.trim().toLowerCase());
  if (input.campaign?.trim())
    parsed.searchParams.set("utm_campaign", input.campaign.trim().toLowerCase());
  if (input.content?.trim())
    parsed.searchParams.set("utm_content", input.content.trim().toLowerCase());
  if (input.term?.trim())
    parsed.searchParams.set("utm_term", input.term.trim().toLowerCase());
  return parsed.toString();
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
export {
  computeShipping,
  computeRop,
  computeRoas,
  computeLtv,
  computeFatigue,
  computeEffectiveRate,
  computeDiscountDepth,
  computeChurn,
  computeCashRunway,
  computeAutomationRoi,
  cleanAiContent,
  buildUtmUrl
};

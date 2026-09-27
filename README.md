# Daily Needs Free Operator Tools

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Interactive Live Suite](https://img.shields.io/badge/Live_Tools-Daily_Needs_Association-orange.svg)](https://dailyneedsassociation.com/tools/)

A lightweight, zero-dependency TypeScript library and CLI of client-side business calculators and growth diagnostic engines for ecommerce brands, lean agencies, and creator businesses.

All 20 tools are available as interactive web utilities at [dailyneedsassociation.com/tools/](https://dailyneedsassociation.com/tools/).

---

## Why This Exists

Most ad platforms, SaaS dashboards, and marketing tools present vanity metrics that obscure real unit economics. For example, a Meta Ads dashboard might report a 2.8x ROAS that looks profitable, while gateway processing fees, pick-and-pack fulfillment, and landed product costs mean the store is actually losing money on every order.

This library bundles pure mathematical models to calculate exact break-even floors, runway velocity, and operational efficiency without tracking, cookies, or vendor lock-in.

---

## Interactive Web Tools

Try the interactive browser versions directly on the Daily Needs Association site:

- **[Break-Even ROAS & Margin Calculator](https://dailyneedsassociation.com/tools/roas-margin-calculator/)**: Find real break-even ROAS and maximum allowable CAC from landed unit numbers.
- **[Cash Runway & Burn Calculator](https://dailyneedsassociation.com/tools/cash-runway-calculator/)**: Project months of cash remaining, zero-cash dates, and revenue break-even targets.
- **[Inventory Reorder Point & Safety Stock](https://dailyneedsassociation.com/tools/inventory-reorder-point-calculator/)**: Statistical safety buffers and dynamic ROPs to prevent stockouts.
- **[Free Shipping Threshold Calculator](https://dailyneedsassociation.com/tools/free-shipping-threshold-calculator/)**: Determine the exact basket size where free shipping stops eroding gross margin.
- **[Discount Depth & Break-Even Calculator](https://dailyneedsassociation.com/tools/discount-depth-break-even/)**: Calculate the deepest discount an order can carry before margin turns negative.
- **[LTV:CAC Ratio & Payback Velocity](https://dailyneedsassociation.com/tools/ltv-cac-calculator/)**: Measure customer lifetime contribution against acquisition cost.
- **[Ad Creative Fatigue Crossover](https://dailyneedsassociation.com/tools/ad-creative-fatigue-crossover/)**: Forecast weekly frequency saturation and audience fatigue timelines.
- **[AI Automation ROI Calculator](https://dailyneedsassociation.com/tools/automation-roi-calculator/)**: Quantify operator hours saved and annual cost recovery from workflow automations.
- **[Effective Hourly Rate & Scope Creep](https://dailyneedsassociation.com/tools/effective-hourly-rate-calculator/)**: Expose true realized hourly rates on fixed-fee client projects.
- **[Client Churn Revenue at Risk](https://dailyneedsassociation.com/tools/client-churn-revenue-at-risk/)**: Model annual revenue and profit destruction caused by monthly client churn.
- **[UTM Campaign URL Builder](https://dailyneedsassociation.com/tools/utm-builder/)**: Generate clean, normalized tracking links for Meta, TikTok, and Klaviyo.
- **[AI Text Sanitizer & Social Formatter](https://dailyneedsassociation.com/tools/ai-text-cleaner/)**: Strip robotic LLM preambles, dead paragraph voids, and format for social platforms.

Explore the complete directory of 20 free operator tools at [dailyneedsassociation.com/tools/](https://dailyneedsassociation.com/tools/).

---

## Installation

Install via npm:

\`\`\`bash
npm install daily-needs-free-tools
\`\`\`

Or clone the repository:

\`\`\`bash
git clone https://github.com/Basswala/daily-needs-free-tools.git
cd daily-needs-free-tools
npm install
npm run build
\`\`\`

---

## Quick Start (TypeScript / JavaScript)

\`\`\`typescript
import {
  computeRoas,
  computeCashRunway,
  computeRop,
  computeShipping,
  cleanAiContent
} from 'daily-needs-free-tools';

// 1. Calculate Real Break-Even ROAS
const roas = computeRoas({
  aov: 85,
  cogs: 22,
  shipping: 8,
  feePct: 2.9,
  feeFixed: 0.30,
  targetMarginPct: 20
});

console.log(\`Break-Even ROAS: \${roas.breakevenRoas.toFixed(2)}x\`);
console.log(\`Target ROAS:     \${roas.targetRoas.toFixed(2)}x\`);
console.log(\`Max CAC:         $\${roas.maxCac.toFixed(2)}\`);

// 2. Calculate Cash Runway
const runway = computeCashRunway({
  cash: 75000,
  revenue: 25000,
  variableCostPct: 35,
  fixedCosts: 12000,
  ownerDraw: 6000
});

console.log(\`Net Position:    $\${runway.netMonthly}/mo\`);
console.log(\`Runway:          \${runway.runwayMonths?.toFixed(1)} months\`);
console.log(\`Status:          \${runway.status}\`);

// 3. Calculate Inventory Reorder Point (ROP)
const inventory = computeRop({
  avgDaily: 40,
  leadTimeDays: 14,
  leadTimeStdDev: 3,
  serviceLevel: 95,
  onHand: 450,
  onOrder: 0
});

console.log(\`Safety Stock:    \${inventory.safetyStock} units\`);
console.log(\`Reorder Point:   \${inventory.reorderPoint} units\`);
console.log(\`Days of Cover:   \${inventory.daysOfCover.toFixed(1)} days\`);

// 4. Sanitize AI Text for Social Media
const clean = cleanAiContent(\`Sure, here is your summary:

Key finding about ecommerce conversion rates.

Hope this helps!\`, { platform: 'linkedin' });

console.log(clean.text);
// "Key finding about ecommerce conversion rates."
\`\`\`

---

## Command Line Interface (CLI)

Run directly via npx or link locally:

\`\`\`bash
# Calculate Break-Even ROAS
npx dna-tools roas --aov 85 --cogs 22 --shipping 8 --targetMarginPct 20

# Calculate Cash Runway
npx dna-tools runway --cash 60000 --revenue 20000 --fixedCosts 8000 --ownerDraw 5000

# Calculate Reorder Point
npx dna-tools inventory --avgDaily 40 --leadTimeDays 14 --leadTimeStdDev 3 --onHand 300

# Sanitize AI Output
npx dna-tools clean --text "Sure! Here is your post..." --platform linkedin
\`\`\`

---

## Tool Reference & Formulas

### 1. Break-Even ROAS & Max CAC
- **Formula**:
  - \`Payment Fee = (AOV * feePct) + feeFixed\`
  - \`Contribution Margin = AOV - (COGS + Shipping + Payment Fee)\`
  - \`Max CAC = Contribution Margin\`
  - \`Break-Even ROAS = AOV / Max CAC\`
  - \`Target Max CAC = Contribution Margin - (AOV * targetMarginPct)\`
  - \`Target ROAS = AOV / Target Max CAC\`

### 2. Free Shipping Threshold
- **Formula**:
  - \`Variable Cost Rate = (COGS% + Gateway Fee%)\`
  - \`Contribution Rate = 1 - Variable Cost Rate\`
  - \`Break-Even Order Value = Shipping Cost / Contribution Rate\`

### 3. Inventory Reorder Point (ROP)
- **Formula**:
  - \`Lead Time Demand = Average Daily Sales * Lead Time (days)\`
  - \`Safety Stock = Z-Score * Average Daily Sales * Lead Time Std Dev\`
  - \`Reorder Point = Lead Time Demand + Safety Stock\`

### 4. Cash Runway
- **Formula**:
  - \`Contribution = Revenue * (1 - Variable Cost%)\`
  - \`Net Monthly = Contribution - Fixed Costs - Owner Draw\`
  - \`Burn = Net Monthly < 0 ? -Net Monthly : 0\`
  - \`Runway (months) = Cash Reserves / Monthly Burn\`

---

## Contributing

Pull requests and issues are welcome. If you operate an ecommerce store or agency and have specific formulas or edge cases you would like added, please open an issue on GitHub.

---

## License & Attribution

Built and maintained by **[Daily Needs Association](https://dailyneedsassociation.com)**, an AI operations agency based in Melbourne, Australia.

Released under the [MIT License](LICENSE).

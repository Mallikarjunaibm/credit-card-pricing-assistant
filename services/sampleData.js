/**
 * Pre-loaded Industry Sample Specifications for Credit Card Network Pricing
 */

const sampleRequirements = [
  {
    id: 'sample-ic-plus-plus',
    title: 'Global E-Commerce Interchange++ (IC++) Pricing Engine Spec',
    description: 'Enterprise specification for unbundled pass-through Interchange, Card Brand Assessments, and Acquirer Markup with 3DS incentives.',
    category: 'Interchange++',
    content: `Title: Global E-Commerce Merchant Pricing Specification (Interchange++ Model)

1. Executive Summary & Objective:
Implement an automated billing and settlement engine for enterprise E-commerce merchants that unbundles card processing costs into three transparent tiers: Issuer Interchange, Card Brand Network Assessments, and Acquirer Processing Markup.

2. Functional Scope & Channel Eligibility:
- Channels: E-commerce Website, In-App mobile SDK, and MOTO virtual terminal.
- Merchant Categories: General Retail (MCC 5311), Digital Goods (MCC 5815), Subscription Services (MCC 5968).
- Supported Card Brands: Visa, Mastercard, American Express OptBlue, Discover.

3. Pricing Rules & Fee Components:
3.1. Issuer Interchange Pass-Through:
- Visa CPS E-Commerce Consumer Credit: 1.65% + $0.10
- Visa Signature / Infinite Premium Credit: 2.30% + $0.10
- Visa Regulated Debit (Durbin Amendment covered issuers): 0.05% + $0.21 + $0.01 (fraud prevention)
- Mastercard Digital Commerce Standard: 1.75% + $0.10
- Mastercard World Elite Consumer: 2.20% + $0.10
- Downgrade Penalty: Transactions missing 3-D Secure or AVS verification downgrade to Standard Interchange (2.95% + $0.20).

3.2. Card Brand Network Assessment & Switch Fees:
- Visa Brand Assessment Fee: 0.14% of gross settled volume
- Visa NABU (Network Access and Brand Usage Fee): $0.0195 per authorization message
- Mastercard Assessment Fee: 0.1375% of gross settled volume
- Mastercard Base Authorization Fee: $0.0195 per authorization message
- Network Tokenization Rebate: Transactions utilizing Visa VTS or Mastercard MDES receive a $0.02 credit against gateway auth fees.

3.3. Acquirer / Processor Markup (Tiered by Monthly GMV):
- Tier 1 (Volume $0 to $100,000 / month): 25 basis points (0.25%) + $0.10 per transaction
- Tier 2 (Volume $100,001 to $500,000 / month): 18 basis points (0.18%) + $0.08 per transaction
- Tier 3 (Volume > $500,000 / month): 12 basis points (0.12%) + $0.05 per transaction

3.4. Regional & Cross-Border Surcharges:
- Domestic US transactions: 0.00% surcharge
- Intra-Regional (Canada / Mexico): +0.80% Card Scheme Cross-Border fee
- Inter-Regional International: +1.20% Scheme Cross-Border fee + 1.00% FX Currency Settlement Markup

4. Business Rules & Settlement Logic:
- Net Settlement Formula: Net Payout = Gross Sales - (Interchange + Assessment + Processor Markup + Fixed Fees) - Refunds.
- Rounding Rule: Intermediate calculations carry 4 decimal places; final billing statement lines are rounded Half-Up to 2 decimal places.
- Monthly Minimum: Merchant must generate minimum $50.00 in processor markup per calendar month; shortfall is debited on the 1st of following month.`
  },
  {
    id: 'sample-tiered-smb',
    title: 'Retail POS Tiered Merchant Discount Rate (Qualified / Non-Qualified)',
    description: 'Traditional 3-tier merchant pricing specification for physical POS terminals with surcharge buckets.',
    category: 'Tiered MDR',
    content: `Title: Retail POS 3-Tier Merchant Discount Rate (MDR) Specification

1. Overview:
This specification defines the 3-tier pricing engine for small-and-medium business (SMB) merchants operating physical point-of-sale (POS) countertop EMV terminals.

2. Tier Classification & Qualification Matrix:
2.1. Qualified Tier (Lowest Rate):
- Eligible Transactions: Swiped or EMV Chip & PIN / Contactless transactions with standard non-rewards consumer debit or credit cards.
- Pricing Rate: 1.79% + $0.15 per settled transaction.

2.2. Mid-Qualified Tier:
- Eligible Transactions: Keyed-in transactions with AVS address match, consumer loyalty rewards cards, and business basic cards.
- Pricing Rate: 2.49% + $0.20 per settled transaction.

2.3. Non-Qualified Tier (Highest Rate):
- Eligible Transactions: Keyed-in transactions without AVS, corporate purchasing cards, high-tier travel rewards cards, foreign cross-border cards, and batch settled > 48 hours post-authorization.
- Pricing Rate: 3.49% + $0.25 per settled transaction.

3. Ancillary Operational Fees:
- Monthly Statement & PCI Compliance Fee: $19.95 per active MID.
- Batch Settlement Fee: $0.25 per daily terminal batch closure.
- Chargeback Administrative Handling Fee: $25.00 per formal dispute retrieval.
- Wireless 4G Terminal SIM Gateway Access: $10.00 per month per terminal.

4. Settlement & Reserve Rules:
- Daily batch settlement occurs at 23:00 EST with T+2 ACH merchant deposit.
- Negative batch balance (due to heavy refunds or chargebacks) is debited immediately from merchant primary DDA account.`
  },
  {
    id: 'sample-cross-border-fx',
    title: 'Cross-Border Multi-Currency & Dynamic Currency Surcharge Specification',
    description: 'International card processing engine with multi-currency interchange, Dynamic Currency Conversion (DCC), and scheme access surcharges.',
    category: 'Cross-Border & FX',
    content: `Title: Multi-Currency & Cross-Border Payment Pricing Specification

1. Scope:
Global travel, airline, and hospitality platform supporting 140+ transaction currencies and multi-currency merchant settlement in USD, EUR, GBP, JPY, and AUD.

2. Interchange & Card Scheme Fee Matrices:
2.1. Domestic vs Intra-EEA vs Inter-Regional Interchange:
- Intra-EEA Consumer Credit (capped under EU Interchange Fee Regulation): 0.30% ad-valorem.
- Intra-EEA Consumer Debit (capped under EU IFR): 0.20% ad-valorem.
- Inter-Regional Cross-Border (e.g. US card used in EU): Standard non-capped interchange (1.90% to 2.65% + €0.15).

2.2. Card Brand International Assessments:
- Visa International Service Assessment (ISA) - Single Currency: 0.80%
- Visa International Service Assessment (ISA) - Cross Currency: 1.20%
- Mastercard Cross-Border Assessment: 0.90% to 1.30% based on cardholder issuing country tier.

3. Dynamic Currency Conversion (DCC) Revenue Split:
- When cardholder opts to pay in home currency at point of checkout:
  - FX Mark-up applied to spot mid-market rate: 3.25%
  - Revenue Split: 1.50% credited to Merchant as FX Rebate, 1.00% retained by Payment Gateway, 0.75% Acquirer FX margin.
  - Merchant is exempt from standard 1.20% cross-border scheme surcharge when DCC is accepted.

4. Calculation & Settlement Rules:
- FX Conversion Rate locked at authorization timestamp for 15 minutes.
- Foreign exchange rounding: Converted amounts rounded according to target currency decimal precision (JPY = 0 decimals, USD/EUR/GBP = 2 decimals, BHD = 3 decimals).`
  },
  {
    id: 'sample-network-rebate',
    title: 'Card Network Enterprise Volume Incentive & Quarterly Rebate Program',
    description: 'High-volume marketplace routing rules, quarterly GMV rebate escalators, and processing commitment SLAs.',
    category: 'Incentives & Rebates',
    content: `Title: Enterprise Merchant Routing & Card Network Quarterly Volume Rebate Program

1. Purpose:
Defines the dynamic volume incentive calculator for tier-1 marketplace platforms processing over $500M annual card volume.

2. Network Incentive Thresholds & Rebate Slabs:
2.1. Quarterly Processed GMV Rebate Matrix:
- Slab A ($50M - $100M Quarterly GMV): 2.5 basis points (0.025%) volume rebate credit on total scheme assessments.
- Slab B ($100.01M - $250M Quarterly GMV): 4.0 basis points (0.040%) volume rebate credit.
- Slab C (> $250M Quarterly GMV): 6.0 basis points (0.060%) volume rebate credit + $0.005 discount on every authorized message fee.

2.2. Strategic Routing Commitment:
- If merchant routes >= 65% of dual-badge debit transactions through specific domestic PIN debit network (Pulse / Star / NYCE / Accel), merchant receives additional 1.5 bps routing bonus.

3. Clawback & Shortfall Penalties:
- In the event quarterly volume drops below $50M baseline, previous quarter's rebate tier is rescinded and a 1.0 bps operational adjustment fee is levied on net merchant settlement.

4. Accounting & Disbursement:
- Rebate amounts calculated within 15 calendar days post quarter-end.
- Disbursed as billing credit offset against next month's interchange invoice.`
  }
];

module.exports = sampleRequirements;

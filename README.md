# Credit Card Network Pricing Assistant

An AI-powered enterprise assistant built for Product Managers, Business Analysts, Pricing Analysts, and Technology teams to create, review, improve, and validate requirements related to credit card network pricing, interchange fees, merchant pricing, network incentives, and analytics platforms.

Integrated with **IBM Consulting Advantage (ICA)** / **IBM watsonx Agent**.

---

## 🌟 Key Capabilities & Requirements Coverage

### 1. BR-1: Requirements Quality Assessment
- **Incomplete Acceptance Criteria Detection**: Scans PRDs and user stories for missing edge cases (e.g. refunds, chargebacks, reversals, rounding rules, tax treatment, channel qualification).
- **Pricing Logic Inconsistency Detector**: Flags boundary overlaps in volume brackets, margin inversions on micropayments, and regulatory discrepancies (e.g. Durbin Amendment US Debit caps).
- **Gherkin Conversion**: Automatically generates standardized `Given-When-Then` acceptance criteria.

### 2. BR-2: Pricing Domain Validation
- Validates requirements against core payment network pricing models:
  - **Issuer Interchange Fees**: (Visa CPS, Mastercard Digital Commerce, Amex OptBlue, Durbin Regulated Debit).
  - **Network Assessment Fees**: (Visa Brand Assessment 0.14%, Mastercard 0.1375%).
  - **Network Access & Switch Fees**: (Visa NABU, Mastercard Base Auth, 3DS Authentication, Network Tokenization).
  - **Merchant Discount Rates (MDR)**: (Interchange++ pass-through, Blended Flat-Rate, 3-Tier Qualified / Non-Qualified).
  - **Network Incentives & Volume Rebates**: (Quarterly GMV milestones, routing incentives, clawbacks).

### 3. FR-3: Pricing Rule Identification
- Automatically extracts and tabulates:
  - **Fixed Fees**: Authorization fees, monthly gateway minimums, batch settlement, chargeback fees.
  - **Percentage-based Fees**: Ad-valorem interchange rates, scheme assessments, processor basis points (bps).
  - **Tiered Pricing**: Volume slabs, marginal tiers, ticket-size brackets.
  - **Regional Pricing**: Domestic, Intra-EEA, Inter-regional cross-border surcharges, FX conversion splits.

### 4. FR-4: Business Rule Extraction
- Extracts structured, applicable rules:
  - **Eligibility Criteria**: Merchant Category Codes (MCC), Card tiers (Consumer vs Commercial), POS Entry Modes, 3DS authentication status.
  - **Pricing Conditions**: Trigger events, qualification rules, fallback actions, evaluation windows.
  - **Fee Calculation Logic**: Exact algebraic formulas with rounding rules and variable definitions.

### 5. Interactive Fee Waterfall Simulator & Copilot
- Real-time transaction simulator testing amount, network, card tier, channel, cross-border status, and markup.
- Interactive AI Copilot connected to IBM Consulting Advantage (ICA).

---

## 🚀 Quick Start

### 1. Installation
```bash
cd credit-card-pricing-assistant
npm install
```

### 2. Environment Configuration
The `.env` file is pre-configured with the ICA credentials:
```env
PORT=3000
ICA_API_KEY=your-ica-api-key
ICA_ENDPOINT=https://api.ibm.com/ica/v1/agent
ICA_ASSISTANT_ID=your-assistant-id
ICA_PROJECT_ID=your-project-id
ICA_AGENT_ID=your-agent-id
```

### 3. Start the Server
```bash
npm start
```
Open your browser at: `http://localhost:3000`

---

## 📁 Pre-Loaded Industry Templates
1. **Global E-Commerce Interchange++ (IC++) Spec**
2. **Retail POS 3-Tier Merchant Discount Rate (MDR) Spec**
3. **Cross-Border Multi-Currency & Dynamic Currency Surcharge Spec**
4. **Card Network Enterprise Volume Incentive & Quarterly Rebate Program**

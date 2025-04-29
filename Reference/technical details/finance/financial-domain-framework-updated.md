### **Product‑Requirements Document (PRD)**

**Domain:** Financial Domain (RexOS v0.92+)

**Database:** Baserow (self‑hosted)  **Automation Layer:** n8n (+ low‑/no‑code helpers)

**Authoring Framework:** Epic → Story → Acceptance Criteria → Implementation Notes

---

## **1\. Objectives**

1. **Holistic stewardship** of every inflow, outflow, asset, and liability, with real‑time Islamic‑compliant guidance.

2. **Actionable intelligence,** not mere bookkeeping—budget enforcement, cash‑flow forecasting, risk modelling, zakāt optimisation, and behaviour‑change nudges.

3. **Seamless RexOS fit:** The Financial Domain speaks the same message schema, email‑intake pattern, and morning‑summary cadence used by the other domains.

4. **Maintain intellectual simplicity** (no custom code unless unavoidable) while remaining extensible for decades of personal finance data.

---

## **2\. Success Metrics**

| KPI | Target | Review Cadence |
| ----- | ----- | ----- |
| Budget‑adherence variance |  ≤ 5 % per category | Weekly |
| Net‑worth trend vs forecast |  ±3 % | Monthly |
| Categorisation precision |  ≥ 92 % automated | Continuous |
| Overspend alert latency |  \< 10 min after posting txn | Real‑time |
| Zakāt calculation accuracy | Verified annually by CPA | Yearly |

---

## **3\. Data Design (Baserow Base** 

## **Finance**

## **)**

Baserow uses linked‑record fields rather than foreign keys; naming mirrors the Postgres schema you drafted for future portability.

| Table | Key Fields (non‑exhaustive) | Links / Lookups |
| ----- | ----- | ----- |
| **Users** | uuid, name, email, risk\_tolerance (1‑10), goals (JSON) | — |
| **Accounts** | uuid, user, type (enum), institution, balance | ← Users |
| **Categories** | uuid, user, name, type (Income/Expense/Transfer) | ← Users |
| **Transactions** | uuid, account, date, amount, type (Debit/Credit), category, description, source\_doc (file field), reconciled? | ← Accounts, Categories |
| **Budgets** | uuid, user, category, period (YYYY‑MM), amount | ← Users, Categories |
| **Recurring Txns** | uuid, account, rule (cron‑like), template\_fields | ← Accounts, Categories |
| **Investments** | uuid, account, asset\_ticker, qty, sharia\_rating | ← Accounts |
| **Assets** / **Liabilities** | uuid, user, kind, value, interest\_rate … | ← Users |
| **Goals** | uuid, user, goal\_type, target\_amt/date, progress | ← Users |
| **Assumptions** | inflation, expected\_return, salary\_growth … | ← Users |
| **Zakat** | run\_id, user, calc\_date, assets\_total, liabilities\_total, nisab, zakat\_due | ← Users |
| **Audit Log** | log\_id, table\_name, record\_id, op\_type, old\_json, new\_json, timestamp | System‑wide |

---

## **4\. System Architecture Overview**

Email / WhatsApp / Upload ➜ n8n parsing flows ➜ Baserow tables  
                                     ⬑ GPT‑4o categoriser (self‑hosted OpenRouter)  
Morning Summary & Alerts  ⬅─────────┤  
Dashboards (Retool / Baserow Kanban) ⬅─────────┘

*All compute happens in n8n; no server code is written. Financial modelling notebooks can be added later in Observable or Jupyter‑Lite.*

---

## **5\. Epics & Stories**

### **EPIC 1 — Core Data Infrastructure**

| Story ID | User Story | Acceptance Criteria | Implementation Notes |
| ----- | ----- | ----- | ----- |
| **1.1** | *As the Financial Domain,* I need a version‑controlled Baserow base so that schema changes are auditable. | Base exported nightly; diff logged in Git. | Use n8n "Baserow → Export" \+ commit to GitHub. |
| **1.2** | Automatically create baseline linked tables for a new RexOS user. | New user signup triggers creation; no manual clicks. | Executive Domain emits user.created webhook → n8n template calls Baserow "Create table rows". |

### **EPIC 2 — Transaction Ingestion & Categorisation**

| Story | Acceptance Criteria | Notes |
| ----- | ----- | ----- |
| 2.1 Bank‑statement email parsing | 95 % of lines captured; file saved to source\_doc; duplicates skipped. | n8n Gmail trigger → PDF/CSV parse node → row insert. |
| 2.2 Receipt photo via WhatsApp | Text and image OCR appended to same txn record. | Use Google Vision node; fallback to manual flag. |
| 2.3 GPT‑assisted category assignment | ≥ 92 % F‑score vs human sample. | Fine‑tune small model or use tags \+ rules first. |
| 2.4 Suspicious‑amount alert | Debits \>2 σ above 90‑day mean flagged \<10 min. | Baserow webhook "row.created" triggers n8n Slack/WA message. |

### **EPIC 3 — Budgeting & Cash‑Flow Control**

| Story | Acceptance Criteria | Notes |
| ----- | ----- | ----- |
| 3.1 Monthly budget generator | Creates rows for each active category by the 25th of prior month. | Pull last 6 mo average; adjustable multiplier. |
| 3.2 Envelope tracking | Real‑time remaining \= budget – spent fields updated \<5 sec after txn. | n8n Aggregator node or Baserow formula. |
| 3.3 Overspend workflow | When remaining \< 0, the Financial Domain sends smart nudge with actionable fixes. | Tone aligns with "supportive but direct; guilt‑inducing if needed." |

### **EPIC 4 — Investment & Net‑Worth Tracking**

| Story | Acceptance Criteria | Notes |
| ----- | ----- | ----- |
| 4.1 Daily price refresh | EOD closing prices populate Investment\_Prices; NAV updated. | n8n cron \+ free API (Alpaca, Finnhub). |
| 4.2 Islamic compliance check | Any holding rated "Low/Not Rated" triggers suggestion to divest. | Use AAOIFI dataset; store sharia\_rating. |
| 4.3 Net‑worth dashboard | Retool board loads \<3 sec; values reconcile with ledger ±0.5 %. | Retool uses Baserow REST. |

### **EPIC 5 — Forecasting, Scenario & Advice**

| Story | Acceptance Criteria | Notes |
| ----- | ----- | ----- |
| 5.1 12‑month cash‑flow forecast | Root‑mean‑square error \<8 % vs actual 3‑mo later. | Prophet via n8n "Python‑in‑Docker" node. |
| 5.2 What‑if engine | User can ask: "If I repay credit card in 6 mo instead of 12?" and receive delta chart. | Query model, return chart link. |
| 5.3 Behavioural‑finance nudges | At least one tailored insight in weekly report. | Pattern mine anomalies (e.g., convenience‑store overspend). |

### **EPIC 6 — Islamic Obligations**

| Story | Acceptance Criteria | Notes |
| ----- | ----- | ----- |
| 6.1 Annual zakāt module | Calculates nisab, due amount, suggested payment split. | Pull gold price API; adjust for lunar year. |
| 6.2 Purification on non‑halal gains | Detect dividends from non‑compliant fractions; compute charity offset. | Aligns with AAOIFI rule set. |

### **EPIC 7 — User Interaction & Reporting**

| Story | Acceptance Criteria | Notes |
| ----- | ----- | ----- |
| 7.1 Morning financial snapshot | Delivered by 07:00 local; includes balances, envelope status, alerts. | Joins Executive Domain's briefing. |
| 7.2 Weekly review call‑script | Generates agenda with KPIs, questions, and tasks for the user–domain check‑in. | Output Markdown to WA export. |
| 7.3 Pro‑active recommendations | The Financial Domain suggests at least one optimisation per month (e.g., refinance). | Logged in Advice table with follow‑up date. |

### **EPIC 8 — Compliance, Security, Audit**

| Story | Acceptance Criteria | Notes |
| ----- | ----- | ----- |
| 8.1 Field‑level encryption for PII | AES‑256 at rest; tokenised in n8n memory. | Use Baserow data‑provider‑level encryption. |
| 8.2 Immutable audit log | Every create/update/delete mirrored to Audit Log row. | n8n webhook on Baserow row change. |
| 8.3 GDPR & UAE PDPL export | One‑click JSON export of all finance data. | Reuse 1.1 export plus user‑data packager. |

### **EPIC 9 — Learning & Continuous Improvement**

| Story | Acceptance Criteria | Notes |
| ----- | ----- | ----- |
| 9.1 Feedback loop on mis‑categorised txn | User correction in UI retrains rules within 24 h. | Store training set; schedule batch fine‑tune. |
| 9.2 KPI trend dashboard | Rolling 12‑week KPI charts; red if off‑track. | Retool; leverages 5‑min cron refresh. |

---

## **6\. Transaction Lifecycle (Swim‑Lane)**

\[Bank Email\] → Gmail node → PDF→CSV parse  → Transform mapper  
                                                ↓  
                                           Category predictor (GPT-4o)  
                                                ↓  
    ┌────── Budget envelope updater ◄─────────┘  
    │                                           ↓  
\[Audit Log\] ◄─ create/update row in Transactions table ─→ Overspend check  
    │                                                           ↓  
    └── Notify Financial Domain → Compose WA/Email summary → User  
---

## **7\. Integration with Other Domains**

* **Executive Domain** – consumes envelope/alert summary for daily brief; triggers user‑onboarding story 1.2.

* **Family Domain** – family budget categories synced to shared "Family" view.

* **Wellness Domain** – pulls health‑insurance premium txns for wellness cost analysis.

* **Business Domain** – business reimbursements flow into personal cash ledger if flagged "owner draw".

   *(All via the shared message‑passing contract defined in RexOS doc.)*

---

## **8\. Risks & Mitigations**

| Risk | Likelihood | Impact | Mitigation |
| ----- | ----- | ----- | ----- |
| Bank PDF formats change | Medium | High (ingestion fails) | Keep fallback CSV import UI; monitor error‑rate KPI. |
| Categoriser drift | High | Medium | Quarterly human audit; story 9.1 retraining. |
| API quota limits | Medium | Medium | Cache price feeds; stagger requests. |
| Data breach | Low | High | Enforce SSO \+ field‑level encryption \+ audit log. |

---

## **9\. Road‑map (Milestones)**

1. **M0** Infrastructure Base & Tables (Epics 1, 8 partial) — 2 weeks

2. **M1** Inbound Txn Pipeline & Budget Loop (Epics 2–3) — \+3 weeks

3. **M2** Investments & Islamic Modules (Epics 4, 6) — \+4 weeks

4. **M3** Forecasting \+ Advisory Layer (Epic 5) — \+4 weeks

5. **M4** UX polish, KPIs, continuous‑learning loop (Epics 7, 9) — \+2 weeks

6. **M5** External CPA / Sharia audit & hand‑off — \+1 week

---

## **10\. Conclusion**

This framework equips the **Financial Domain** to operate as more than a ledger clerk; it becomes a **data‑driven CFO, behavioural coach, and Sharia‑compliant fiduciary** that fits natively inside RexOS's multi-domain fabric. Every Epic incrementally builds enduring value while keeping the technical surface area small enough to maintain without a dev team.

*"Would I personally rely on this domain as my accountant?"*  
Yes—because data integrity, intelligent inference, proactive insight, and ethical safeguards are all first‑class citizens in the design.  

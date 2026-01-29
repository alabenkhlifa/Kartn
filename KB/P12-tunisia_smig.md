# 💰 Tunisia SMIG & SMAG 2025-2026

## Knowledge Base Entry - Minimum Wage & FCR Eligibility

---

## 📋 Overview

The **SMIG** (Salaire Minimum Interprofessionnel Garanti) is the legal minimum wage in Tunisia for non-agricultural
sectors. It's **critical for FCR eligibility** as the "Une Voiture pour Chaque Famille" program uses SMIG multiples as
income thresholds.

**Legal Basis:** Décret N° 2024-419 du 9 juillet 2024

---

## 💵 Current SMIG Rates (Effective January 1, 2025)

### Non-Agricultural Sector (SMIG)

| Regime            | Monthly (TND) | Hourly (TND) |
|-------------------|---------------|--------------|
| **48 hours/week** | **528.320**   | 2.540        |
| **40 hours/week** | **448.238**   | 2.586        |

### Agricultural Sector (SMAG)

| Type       | Rate               |
|------------|--------------------|
| Daily wage | **20.320 TND/day** |

### Mandatory Allowances (Added to Base)

| Allowance              | Amount (TND/month) |
|------------------------|--------------------|
| Indemnité de transport | 36.112             |
| Indemnité de présence  | 2.080              |
| **Total Allowances**   | **38.192**         |

### Complete SMIG Package (48h regime)

| Component       | Amount (TND) |
|-----------------|--------------|
| Base salary     | 528.320      |
| + Transport     | 36.112       |
| + Presence      | 2.080        |
| **Gross Total** | **566.512**  |

---

## 🚗 FCR Eligibility Thresholds

### "Une Voiture pour Chaque Famille" Income Limits

The program uses **SMIG multiples** to determine eligibility:

| Family Type    | Multiplier | Max Revenue (TND/month) | Max Revenue (TND/year) |
|----------------|------------|-------------------------|------------------------|
| **Individual** | 10× SMIG   | **5,283.20**            | **63,398.40**          |
| **Couple**     | 14× SMIG   | **7,396.48**            | **88,757.76**          |

> ⚠️ These are **gross revenue** limits (before deductions)

### Quick Eligibility Check

```
If Individual:
  Monthly gross salary ≤ 5,283.20 TND → ✅ Eligible
  Monthly gross salary > 5,283.20 TND → ❌ Not eligible

If Married Couple (combined income):
  Combined monthly gross ≤ 7,396.48 TND → ✅ Eligible
  Combined monthly gross > 7,396.48 TND → ❌ Not eligible
```

---

## 📊 SMIG Evolution (Historical)

| Year     | 48h Rate (TND)   | Increase |
|----------|------------------|----------|
| 2023     | 459.048          | -        |
| May 2024 | 491.504          | +7.0%    |
| Jan 2025 | 528.320          | +7.5%    |
| Jan 2026 | ~568 (projected) | ~7%      |

**Total increase 2024-2025:** +14.5% cumulative

---

## 🧮 Net Salary Calculation (SMIG Worker)

### Deductions from Gross

| Deduction             | Rate  | Amount (TND) |
|-----------------------|-------|--------------|
| CNSS (employee share) | 9.68% | 51.14        |
| IRPP (income tax)     | ~15%  | ~65.72       |
| **Total Deductions**  |       | ~116.86      |

### Approximate Net Salary

| Gross                     | Deductions | Net          |
|---------------------------|------------|--------------|
| 528.320                   | ~116.86    | **~411 TND** |
| 566.512 (with allowances) | ~130       | **~436 TND** |

---

## 🏢 Employer Costs

### Social Contributions (2025 Rates)

| Contribution          | Rate       |
|-----------------------|------------|
| CNSS - Employer share | 17.07%     |
| CNSS - Employee share | 9.68%      |
| **Total CNSS**        | **26.75%** |

### Total Cost per SMIG Employee

| Component                | Amount (TND) |
|--------------------------|--------------|
| Gross salary             | 528.320      |
| + Employer CNSS (17.07%) | 90.18        |
| + Allowances             | 38.192       |
| **Total Employer Cost**  | **~656.69**  |

---

## 🤖 Chatbot Integration Logic

### Eligibility Questions to Ask

```javascript
// Question 1: Family status
"Êtes-vous marié(e) ou célibataire?"
- Célibataire → threshold = 5283.20
TND
- Marié(e) → threshold = 7396.48
TND

// Question 2: Income verification
"Quel est votre salaire brut mensuel?"
- If
célibataire: check
if ≤
5283.20
- If
marié: "Quel est le salaire combiné du couple?"
check
if ≤
7396.48

// Question 3: Existing vehicle
"Possédez-vous déjà une voiture de moins de 8 ans?"
- Oui → ❌ Not
eligible
- Non → Continue

// Question 4: Previous benefit
"Avez-vous déjà bénéficié de la voiture populaire?"
- Oui → ❌ Not
eligible
- Non → ✅ Eligible
!
```

### Income Converter Tool

```javascript
function checkFCREligibility(monthlyGross, isMarried) {
    const SMIG_48H = 528.320;
    const threshold = isMarried ? SMIG_48H * 14 : SMIG_48H * 10;

    return {
        eligible: monthlyGross <= threshold,
        threshold: threshold,
        margin: threshold - monthlyGross
    };
}

// Examples:
checkFCREligibility(3000, false);
// → { eligible: true, threshold: 5283.20, margin: 2283.20 }

checkFCREligibility(8000, true);
// → { eligible: false, threshold: 7396.48, margin: -603.52 }
```

---

## 📈 Comparison with Cost of Living

| Metric                        | Amount (TND) |
|-------------------------------|--------------|
| SMIG net (48h)                | ~411         |
| Rent (small apt, modest area) | 400-600      |
| Estimated decent living wage  | ~4,000       |
| Average national salary       | ~924         |

> ⚠️ A SMIG worker earns only ~13% of what's needed for "decent living" according to INS data

---

## 🔗 Official Resources

| Resource                | URL                            |
|-------------------------|--------------------------------|
| CNSS Portal             | https://www.cnss.tn            |
| Tax Calculator          | https://impots.finances.gov.tn |
| JORT (Official Journal) | https://www.iort.gov.tn        |

---

## 📝 Key Points for Chatbot

1. **SMIG 2025 (48h):** 528.320 TND/month
2. **Individual FCR limit:** ≤ 5,283.20 TND/month (10× SMIG)
3. **Couple FCR limit:** ≤ 7,396.48 TND/month (14× SMIG)
4. **These are GROSS income** - before tax deductions
5. **2026 increase expected** but not yet officially decreed

---

## ⚠️ Important Disclaimers

- SMIG rates may change with new decrees in 2026
- FCR eligibility rules await "décrets d'application"
- Revenue verification process not yet specified
- Always verify with official sources before advising users

---

*Last Updated: January 2026*
*Sources: JORT, CNSS Circular 2024-419, Ministry of Social Affairs, Loi de Finances 2026*
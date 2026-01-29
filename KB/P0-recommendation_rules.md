# 🎯 Car Recommendation Rules - Knowledge Base

## Matching Logic & Decision Engine for Tunisia Car Import Chatbot

> **Last Updated:** January 26, 2026  
> **Status:** Production Ready  
> **Purpose:** Define all logic for matching users to optimal car choices

---

## 📋 Table of Contents

1. [User Profile Schema](#1-user-profile-schema)
2. [Eligibility Rules & Decision Trees](#2-eligibility-rules--decision-trees)
3. [Budget Calculation Logic](#3-budget-calculation-logic)
4. [Car Matching Rules](#4-car-matching-rules)
5. [Scoring & Ranking Algorithm](#5-scoring--ranking-algorithm)
6. [Recommendation Scenarios](#6-recommendation-scenarios)
7. [Edge Cases & Warnings](#7-edge-cases--warnings)
8. [Conversation Flow Design](#8-conversation-flow-design)

---

## 1. User Profile Schema

### 1.1 Complete User Profile Structure

```python
from dataclasses import dataclass, field
from typing import Optional, List
from enum import Enum
from datetime import date


class ResidencyStatus(Enum):
    TRE_ABROAD = "tre_abroad"  # Living abroad 2+ years
    TRE_RECENT = "tre_recent"  # Abroad <2 years
    RESIDENT_TUNISIA = "resident"  # Lives in Tunisia
    DUAL_SITUATION = "dual"  # Complex situation


class FamilyStatus(Enum):
    SINGLE = "single"
    MARRIED_NO_KIDS = "married_no_kids"
    MARRIED_WITH_KIDS = "married_with_kids"
    SINGLE_PARENT = "single_parent"
    DIVORCED = "divorced"
    WIDOWED = "widowed"


class PaymentMethod(Enum):
    CASH_TND = "cash_tnd"
    TRE_FAMILY_HELP = "tre_family"  # Don from relative abroad
    ALLOCATION_TOURISTIQUE = "allocation"
    BANK_CREDIT = "bank_credit"
    LEASING = "leasing"
    MIXED = "mixed"
    UNKNOWN = "unknown"


class FuelPreference(Enum):
    NO_PREFERENCE = "any"
    ESSENCE = "essence"
    DIESEL = "diesel"
    HYBRID = "hybrid"
    HYBRID_RECHARGEABLE = "phev"
    ELECTRIC = "electric"


class BodyPreference(Enum):
    NO_PREFERENCE = "any"
    CITADINE = "citadine"
    BERLINE = "berline"
    SUV = "suv"
    BREAK = "break"
    MONOSPACE = "monospace"


@dataclass
class UserProfile:
    """Complete user profile for car recommendation"""

    # === IDENTITY & RESIDENCY ===
    residency_status: ResidencyStatus
    years_abroad: Optional[int] = None  # For TRE
    country_of_residence: Optional[str] = None  # "FR", "DE", "IT", etc.
    days_in_tunisia_per_year: Optional[int] = None

    # === FAMILY STATUS ===
    family_status: FamilyStatus = FamilyStatus.SINGLE
    num_adults: int = 1  # For allocation calculation
    num_children: int = 0
    num_children_under_10: int = 0

    # === INCOME (for eligibility) ===
    monthly_gross_income_tnd: Optional[float] = None
    spouse_monthly_income_tnd: Optional[float] = None
    is_income_declared: bool = True  # Has tax filings

    # === CURRENT VEHICLE OWNERSHIP ===
    owns_car: bool = False
    current_car_age_years: Optional[int] = None
    used_voiture_populaire: bool = False
    used_fcr_before: bool = False
    years_since_last_fcr: Optional[int] = None

    # === BUDGET ===
    total_budget_tnd: float = 0
    max_monthly_payment_tnd: Optional[float] = None  # For financing
    has_savings_abroad_eur: Optional[float] = None

    # === PAYMENT METHOD ===
    payment_method: PaymentMethod = PaymentMethod.UNKNOWN
    has_tre_family_contact: bool = False
    tre_max_help_eur: Optional[float] = None

    # === PREFERENCES ===
    fuel_preference: FuelPreference = FuelPreference.NO_PREFERENCE
    body_preference: BodyPreference = BodyPreference.NO_PREFERENCE
    preferred_brands: List[str] = field(default_factory=list)
    avoided_brands: List[str] = field(default_factory=list)
    min_year: Optional[int] = None
    max_mileage_km: Optional[int] = None
    needs_automatic: bool = False

    # === LOCATION & USAGE ===
    governorate: Optional[str] = None  # For EV charging assessment
    city: Optional[str] = None
    daily_commute_km: Optional[int] = None
    frequent_intercity_travel: bool = False
    has_home_parking: bool = False  # For EV charging

    # === PRIORITIES (1-5 scale) ===
    priority_low_price: int = 3
    priority_reliability: int = 3
    priority_fuel_economy: int = 3
    priority_comfort: int = 3
    priority_brand_prestige: int = 3
    priority_parts_availability: int = 3
```

### 1.2 Data Collection Questions Mapping

| Profile Field              | Question to Ask (FR)                                                | Question to Ask (AR)                               |
|----------------------------|---------------------------------------------------------------------|----------------------------------------------------|
| `residency_status`         | "Habitez-vous actuellement en Tunisie ou à l'étranger?"             | "هل تسكن حاليا في تونس أو في الخارج؟"              |
| `years_abroad`             | "Depuis combien d'années habitez-vous à l'étranger?"                | "منذ كم سنة تسكن في الخارج؟"                       |
| `family_status`            | "Êtes-vous marié(e)? Avez-vous des enfants?"                        | "هل أنت متزوج؟ هل لديك أطفال؟"                     |
| `monthly_gross_income_tnd` | "Quel est votre salaire brut mensuel?"                              | "ما هو راتبك الشهري الخام؟"                        |
| `owns_car`                 | "Possédez-vous actuellement une voiture?"                           | "هل تملك سيارة حاليا؟"                             |
| `total_budget_tnd`         | "Quel est votre budget total en dinars?"                            | "ما هي ميزانيتك الإجمالية بالدينار؟"               |
| `has_tre_family_contact`   | "Avez-vous de la famille à l'étranger qui peut vous aider à payer?" | "هل لديك عائلة في الخارج يمكنها مساعدتك في الدفع؟" |
| `governorate`              | "Dans quel gouvernorat habitez-vous?"                               | "في أي ولاية تسكن؟"                                |
| `daily_commute_km`         | "Combien de km parcourez-vous par jour?"                            | "كم كيلومتر تقطع يوميا؟"                           |

---

## 2. Eligibility Rules & Decision Trees

### 2.1 Master Eligibility Calculator

```python
from dataclasses import dataclass
from typing import Tuple, List

# Constants (2026 values)
SMIG_48H_2025 = 528.320  # TND/month
FCR_TRE_MIN_YEARS_ABROAD = 2
FCR_TRE_MAX_DAYS_IN_TUNISIA = 183
FCR_TRE_MIN_YEARS_BETWEEN = 10
FCR_TRE_MAX_CAR_AGE = 5
FCR_FAMILLE_MAX_CAR_AGE = 8


@dataclass
class EligibilityResult:
    eligible: bool
    regime: str
    reasons: List[str]
    warnings: List[str]
    tax_benefit_description: str
    estimated_tax_rate: float  # As decimal (0.25 = 25%)


def check_all_eligibility(user: UserProfile) -> dict:
    """
    Check eligibility for all car import regimes
    Returns dict with results for each regime
    """
    return {
        "fcr_tre": check_fcr_tre_eligibility(user),
        "fcr_famille": check_fcr_famille_eligibility(user),
        "voiture_populaire": check_voiture_populaire_eligibility(user),
        "regular_import": EligibilityResult(
            eligible=True,
            regime="regular",
            reasons=["Tout le monde peut importer au régime commun"],
            warnings=["Taxes très élevées (150-250% de la valeur)"],
            tax_benefit_description="Aucun avantage fiscal",
            estimated_tax_rate=1.5  # ~150% average
        )
    }


def check_fcr_tre_eligibility(user: UserProfile) -> EligibilityResult:
    """
    FCR Renouvelable for Tunisians Residing Abroad
    Legal basis: Décret n°370 du 19/06/2024
    """
    reasons = []
    warnings = []
    eligible = True

    # Check 1: Must be TRE
    if user.residency_status not in [ResidencyStatus.TRE_ABROAD, ResidencyStatus.TRE_RECENT]:
        eligible = False
        reasons.append("❌ Vous devez résider à l'étranger")

    # Check 2: Minimum 2 years abroad
    if user.years_abroad is not None and user.years_abroad < FCR_TRE_MIN_YEARS_ABROAD:
        eligible = False
        reasons.append(f"❌ Minimum 2 ans à l'étranger requis (vous: {user.years_abroad} ans)")
    elif user.years_abroad is not None and user.years_abroad >= 2:
        reasons.append(f"✅ {user.years_abroad} ans à l'étranger (≥2 ans requis)")

    # Check 3: Max 183 days in Tunisia per year
    if user.days_in_tunisia_per_year is not None:
        if user.days_in_tunisia_per_year > FCR_TRE_MAX_DAYS_IN_TUNISIA:
            eligible = False
            reasons.append(f"❌ Maximum 183 jours/an en Tunisie (vous: {user.days_in_tunisia_per_year})")
        else:
            reasons.append(f"✅ {user.days_in_tunisia_per_year} jours/an en Tunisie (≤183 requis)")

    # Check 4: 10 years since last FCR
    if user.used_fcr_before and user.years_since_last_fcr is not None:
        if user.years_since_last_fcr < FCR_TRE_MIN_YEARS_BETWEEN:
            eligible = False
            reasons.append(f"❌ 10 ans minimum entre deux FCR (dernier: il y a {user.years_since_last_fcr} ans)")
        else:
            reasons.append(f"✅ Dernier FCR il y a {user.years_since_last_fcr} ans (≥10 ans requis)")

    # Warnings
    if user.has_tre_family_contact is False:
        warnings.append("⚠️ Sans famille TRE, le paiement en Europe sera difficile")

    if eligible:
        return EligibilityResult(
            eligible=True,
            regime="fcr_tre",
            reasons=reasons,
            warnings=warnings,
            tax_benefit_description="25% des droits (essence ≤2000cc, diesel ≤2500cc) ou 30% (plus gros moteurs)",
            estimated_tax_rate=0.25
        )
    else:
        return EligibilityResult(
            eligible=False,
            regime="fcr_tre",
            reasons=reasons,
            warnings=warnings,
            tax_benefit_description="Non éligible",
            estimated_tax_rate=0
        )


def check_fcr_famille_eligibility(user: UserProfile) -> EligibilityResult:
    """
    FCR Famille Résidente (Article 55 - Loi de Finances 2026)
    "Une Voiture pour Chaque Famille"
    """
    reasons = []
    warnings = []
    eligible = True

    # Check 1: Must be resident in Tunisia
    if user.residency_status != ResidencyStatus.RESIDENT_TUNISIA:
        eligible = False
        reasons.append("❌ Vous devez résider en Tunisie")
    else:
        reasons.append("✅ Résident en Tunisie")

    # Check 2: Income ceiling
    is_married = user.family_status in [
        FamilyStatus.MARRIED_NO_KIDS,
        FamilyStatus.MARRIED_WITH_KIDS
    ]

    if is_married:
        income_limit = SMIG_48H_2025 * 14  # ~7,396 TND for couples
        combined_income = (user.monthly_gross_income_tnd or 0) + (user.spouse_monthly_income_tnd or 0)

        if combined_income > income_limit:
            eligible = False
            reasons.append(f"❌ Revenu couple ({combined_income:,.0f} TND) > plafond ({income_limit:,.0f} TND)")
        elif combined_income > 0:
            margin = income_limit - combined_income
            reasons.append(f"✅ Revenu couple ({combined_income:,.0f} TND) ≤ plafond ({income_limit:,.0f} TND)")
            if margin < 500:
                warnings.append(f"⚠️ Vous êtes proche du plafond (marge: {margin:,.0f} TND)")
    else:
        income_limit = SMIG_48H_2025 * 10  # ~5,283 TND for individuals
        income = user.monthly_gross_income_tnd or 0

        if income > income_limit:
            eligible = False
            reasons.append(f"❌ Revenu ({income:,.0f} TND) > plafond ({income_limit:,.0f} TND)")
        elif income > 0:
            margin = income_limit - income
            reasons.append(f"✅ Revenu ({income:,.0f} TND) ≤ plafond ({income_limit:,.0f} TND)")
            if margin < 500:
                warnings.append(f"⚠️ Vous êtes proche du plafond (marge: {margin:,.0f} TND)")

    # Check 3: No car less than 8 years old
    if user.owns_car and user.current_car_age_years is not None:
        if user.current_car_age_years < 8:
            eligible = False
            reasons.append(f"❌ Vous possédez une voiture de {user.current_car_age_years} ans (<8 ans)")
        else:
            reasons.append(f"✅ Voiture actuelle de {user.current_car_age_years} ans (≥8 ans OK)")
    elif not user.owns_car:
        reasons.append("✅ Pas de voiture actuellement")

    # Check 4: Never used Voiture Populaire
    if user.used_voiture_populaire:
        eligible = False
        reasons.append("❌ Vous avez déjà bénéficié de la Voiture Populaire")

    # Check 5: One-time benefit
    # (This would need historical data - flag as warning)
    warnings.append("⚠️ Ce bénéfice est UNIQUE (une seule fois par famille)")

    # Payment method warning
    if not user.has_tre_family_contact and user.payment_method != PaymentMethod.ALLOCATION_TOURISTIQUE:
        warnings.append("⚠️ Pensez à la méthode de paiement (allocation touristique ou don TRE)")

    if eligible:
        return EligibilityResult(
            eligible=True,
            regime="fcr_famille",
            reasons=reasons,
            warnings=warnings,
            tax_benefit_description="DC 10% + TVA 7% (thermique) ou DC 0% + TVA 7% (électrique/hybride)",
            estimated_tax_rate=0.17  # ~17% total for thermal
        )
    else:
        return EligibilityResult(
            eligible=False,
            regime="fcr_famille",
            reasons=reasons,
            warnings=warnings,
            tax_benefit_description="Non éligible",
            estimated_tax_rate=0
        )


def check_voiture_populaire_eligibility(user: UserProfile) -> EligibilityResult:
    """
    Voiture Populaire - Subsidized new cars
    """
    reasons = []
    warnings = []
    eligible = True

    # Check 1: Income ceiling
    is_married = user.family_status in [
        FamilyStatus.MARRIED_NO_KIDS,
        FamilyStatus.MARRIED_WITH_KIDS
    ]

    if is_married:
        income_limit = SMIG_48H_2025 * 15  # ~7,925 TND for couples
        combined_income = (user.monthly_gross_income_tnd or 0) + (user.spouse_monthly_income_tnd or 0)
        if combined_income > income_limit:
            eligible = False
            reasons.append(f"❌ Revenu couple ({combined_income:,.0f} TND) > plafond ({income_limit:,.0f} TND)")
    else:
        income_limit = SMIG_48H_2025 * 10  # ~5,283 TND for individuals
        income = user.monthly_gross_income_tnd or 0
        if income > income_limit:
            eligible = False
            reasons.append(f"❌ Revenu ({income:,.0f} TND) > plafond ({income_limit:,.0f} TND)")

    # Check 2: No car in last 5 years
    if user.owns_car and user.current_car_age_years is not None:
        if user.current_car_age_years < 5:
            eligible = False
            reasons.append(f"❌ Vous avez possédé une voiture dans les 5 dernières années")

    # Check 3: 7 years since last Voiture Populaire
    if user.used_voiture_populaire:
        eligible = False
        reasons.append("❌ Vous avez déjà bénéficié de la Voiture Populaire (attendre 7 ans)")

    # Warnings
    warnings.append("⚠️ Liste d'attente très longue (1-5 ans selon le modèle)")
    warnings.append("⚠️ Modèles limités: ≤4 CV, ≤1200cc, prix 29-35k TND")

    if eligible:
        return EligibilityResult(
            eligible=True,
            regime="voiture_populaire",
            reasons=reasons,
            warnings=warnings,
            tax_benefit_description="Prix subventionné (29,000-35,000 TND)",
            estimated_tax_rate=0  # Already included in price
        )
    else:
        return EligibilityResult(
            eligible=False,
            regime="voiture_populaire",
            reasons=reasons,
            warnings=warnings,
            tax_benefit_description="Non éligible",
            estimated_tax_rate=0
        )
```

### 2.2 Visual Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER WANTS TO BUY A CAR                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Where do you currently live? │
              └───────────────────────────────┘
                     │                 │
          ┌─────────┘                 └─────────┐
          ▼                                     ▼
   ┌─────────────┐                      ┌─────────────┐
   │  ABROAD     │                      │  TUNISIA    │
   │  (TRE)      │                      │  (Resident) │
   └─────────────┘                      └─────────────┘
          │                                     │
          ▼                                     ▼
┌───────────────────┐              ┌───────────────────────┐
│ ≥2 years abroad?  │              │ Income ≤ 10/14× SMIG? │
│ ≤183 days/year TN │              │ No car <8 years?      │
│ ≥10 yrs since FCR │              │ Never used VP?        │
└───────────────────┘              └───────────────────────┘
    │           │                      │           │
   YES         NO                     YES         NO
    │           │                      │           │
    ▼           ▼                      ▼           ▼
┌────────┐  ┌────────┐           ┌──────────┐  ┌────────────┐
│FCR TRE │  │Regular │           │FCR       │  │Check       │
│25% tax │  │Import  │           │Famille   │  │Voiture     │
│        │  │~150%   │           │~17% tax  │  │Populaire   │
└────────┘  └────────┘           └──────────┘  └────────────┘
    │                                  │              │
    ▼                                  ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│              CHECK CAR COMPATIBILITY                         │
│  • FCR TRE: ≤5 yrs, essence ≤2000cc, diesel ≤2500cc        │
│  • FCR Famille: ≤8 yrs, essence ≤1600cc, diesel ≤1900cc    │
│  • Voiture Populaire: NEW, ≤4CV, ≤1200cc                   │
│  • Electric/Hybrid: Always eligible for FCR Famille         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Budget Calculation Logic

### 3.1 Reverse Budget Calculator

```python
from dataclasses import dataclass
from typing import Optional


@dataclass
class CostBreakdown:
    """Detailed cost breakdown for a car import"""
    car_price_eur: float
    shipping_eur: float
    insurance_eur: float
    cif_eur: float
    cif_tnd: float

    # Taxes
    droits_douane_tnd: float
    taxe_consommation_tnd: float
    tva_tnd: float
    tfd_tnd: float  # Taxe de formalité douanière

    # Fees
    homologation_tnd: float
    registration_tnd: float

    # Totals
    total_taxes_tnd: float
    total_cost_tnd: float

    # Comparison
    savings_vs_regular: float
    tax_rate_effective: float


class BudgetCalculator:
    """
    Calculate costs and reverse-engineer max car prices from budgets
    """

    # Exchange rate (should be fetched dynamically)
    EUR_TND_RATE = 3.40

    # Shipping estimates by origin
    SHIPPING_ESTIMATES = {
        "DE": 1200,  # Germany - RoRo or drive to Marseille
        "FR": 900,  # France - Ferry from Marseille
        "IT": 800,  # Italy - Ferry from Genoa
        "BE": 1100,  # Belgium
        "default": 1000
    }

    # Tax rates by engine size (thermal vehicles)
    DC_RATES_ESSENCE = {
        1000: 0.16,
        1300: 0.16,
        1500: 0.30,
        1700: 0.38,
        2000: 0.52,
        2200: 0.67,
        2400: 0.67,
        9999: 0.67
    }

    DC_RATES_DIESEL = {
        1500: 0.38,
        1700: 0.38,
        1900: 0.40,
        2100: 0.55,
        2300: 0.63,
        2500: 0.70,
        2700: 0.88,
        2800: 0.88,
        9999: 0.88
    }

    def get_dc_rate(self, engine_cc: int, fuel_type: str) -> float:
        """Get consumption tax rate based on engine size"""
        rates = self.DC_RATES_ESSENCE if fuel_type == "essence" else self.DC_RATES_DIESEL
        for cc_limit, rate in sorted(rates.items()):
            if engine_cc <= cc_limit:
                return rate
        return list(rates.values())[-1]

    def calculate_full_cost(
            self,
            car_price_eur: float,
            origin_country: str,
            engine_cc: int,
            fuel_type: str,  # "essence", "diesel", "electric", "hybrid_rechargeable"
            regime: str,  # "fcr_tre", "fcr_famille", "regular"
            eu_origin: bool = True
    ) -> CostBreakdown:
        """
        Calculate total cost including all taxes and fees
        """
        # === CIF Calculation ===
        shipping_eur = self.SHIPPING_ESTIMATES.get(origin_country, self.SHIPPING_ESTIMATES["default"])
        insurance_eur = car_price_eur * 0.015  # ~1.5% of car value
        cif_eur = car_price_eur + shipping_eur + insurance_eur
        cif_tnd = cif_eur * self.EUR_TND_RATE

        # === Tax Calculation Based on Regime ===

        if fuel_type in ["electric", "hybrid_rechargeable"]:
            # Electric/PHEV: 0% DD, 0% DC, 7% TVA
            droits_douane_tnd = 0
            taxe_consommation_tnd = 0
            tva_rate = 0.07
        elif regime == "fcr_tre":
            # FCR TRE: 25% of normal taxes
            # First calculate normal taxes
            dd_rate = 0 if eu_origin else 0.20
            dc_rate = self.get_dc_rate(engine_cc, fuel_type)

            dd_normal = cif_tnd * dd_rate
            dc_normal = (cif_tnd + dd_normal) * dc_rate
            tva_normal = (cif_tnd + dd_normal + dc_normal) * 0.19
            total_normal = dd_normal + dc_normal + tva_normal

            # FCR TRE = 25% of total
            total_fcr = total_normal * 0.25
            droits_douane_tnd = total_fcr * 0.1  # Approximate split
            taxe_consommation_tnd = total_fcr * 0.6
            tva_rate = 0  # Already included in 25%

        elif regime == "fcr_famille":
            # FCR Famille: DD 0% (EU), DC 10%, TVA 7%
            droits_douane_tnd = 0 if eu_origin else cif_tnd * 0.10
            taxe_consommation_tnd = (cif_tnd + droits_douane_tnd) * 0.10
            tva_rate = 0.07

        else:  # Regular import
            # Full taxes
            dd_rate = 0 if eu_origin else 0.20
            dc_rate = self.get_dc_rate(engine_cc, fuel_type)

            droits_douane_tnd = cif_tnd * dd_rate
            taxe_consommation_tnd = (cif_tnd + droits_douane_tnd) * dc_rate
            tva_rate = 0.19

        # TVA calculation
        tva_tnd = (cif_tnd + droits_douane_tnd + taxe_consommation_tnd) * tva_rate

        # TFD (3% of duties)
        tfd_tnd = (droits_douane_tnd + taxe_consommation_tnd) * 0.03

        # Fixed fees
        homologation_tnd = 800  # Approximate
        registration_tnd = 500  # Approximate (varies by CV)

        # Totals
        total_taxes_tnd = droits_douane_tnd + taxe_consommation_tnd + tva_tnd + tfd_tnd
        total_cost_tnd = cif_tnd + total_taxes_tnd + homologation_tnd + registration_tnd

        # Calculate regular cost for comparison
        if regime != "regular":
            regular_cost = self.calculate_full_cost(
                car_price_eur, origin_country, engine_cc, fuel_type, "regular", eu_origin
            )
            savings_vs_regular = regular_cost.total_cost_tnd - total_cost_tnd
        else:
            savings_vs_regular = 0

        tax_rate_effective = total_taxes_tnd / cif_tnd if cif_tnd > 0 else 0

        return CostBreakdown(
            car_price_eur=car_price_eur,
            shipping_eur=shipping_eur,
            insurance_eur=insurance_eur,
            cif_eur=cif_eur,
            cif_tnd=cif_tnd,
            droits_douane_tnd=droits_douane_tnd,
            taxe_consommation_tnd=taxe_consommation_tnd,
            tva_tnd=tva_tnd,
            tfd_tnd=tfd_tnd,
            homologation_tnd=homologation_tnd,
            registration_tnd=registration_tnd,
            total_taxes_tnd=total_taxes_tnd,
            total_cost_tnd=total_cost_tnd,
            savings_vs_regular=savings_vs_regular,
            tax_rate_effective=tax_rate_effective
        )

    def max_car_price_for_budget(
            self,
            budget_tnd: float,
            origin_country: str,
            engine_cc: int,
            fuel_type: str,
            regime: str,
            eu_origin: bool = True
    ) -> float:
        """
        Reverse calculation: Given a budget, what's the max EUR car price?
        Uses binary search for accuracy
        """
        low, high = 1000, 100000  # EUR range

        while high - low > 100:  # €100 precision
            mid = (low + high) / 2
            cost = self.calculate_full_cost(mid, origin_country, engine_cc, fuel_type, regime, eu_origin)

            if cost.total_cost_tnd <= budget_tnd:
                low = mid
            else:
                high = mid

        return int(low)

    def budget_breakdown_by_regime(
            self,
            budget_tnd: float,
            origin_country: str = "DE",
            engine_cc: int = 1400,
            fuel_type: str = "essence"
    ) -> dict:
        """
        Show what car price is achievable under each regime
        """
        regimes = ["fcr_tre", "fcr_famille", "regular"]
        results = {}

        for regime in regimes:
            max_price = self.max_car_price_for_budget(
                budget_tnd, origin_country, engine_cc, fuel_type, regime
            )
            cost = self.calculate_full_cost(
                max_price, origin_country, engine_cc, fuel_type, regime
            )
            results[regime] = {
                "max_car_price_eur": max_price,
                "total_cost_tnd": cost.total_cost_tnd,
                "tax_rate": f"{cost.tax_rate_effective:.1%}"
            }

        # Add electric comparison
        max_price_ev = self.max_car_price_for_budget(
            budget_tnd, origin_country, 0, "electric", "fcr_famille"
        )
        cost_ev = self.calculate_full_cost(
            max_price_ev, origin_country, 0, "electric", "fcr_famille"
        )
        results["fcr_famille_electric"] = {
            "max_car_price_eur": max_price_ev,
            "total_cost_tnd": cost_ev.total_cost_tnd,
            "tax_rate": f"{cost_ev.tax_rate_effective:.1%}"
        }

        return results
```

### 3.2 Quick Reference Tables

#### Maximum Car Price by Budget (FCR TRE)

| Budget TND | Max EUR Price | Example Cars                    |
|------------|---------------|---------------------------------|
| 50,000     | ~€11,000      | Polo 2021, Clio 2020            |
| 70,000     | ~€16,000      | Golf 2021, 308 2020             |
| 90,000     | ~€21,000      | Golf 2022, Tucson 2021          |
| 120,000    | ~€29,000      | Golf GTI, Tiguan 2022           |
| 150,000    | ~€38,000      | Audi A3 2023, BMW 320i          |
| 200,000    | ~€51,000      | BMW 330i, Mercedes C300         |
| 300,000    | ~€77,000      | BMW 5-Series, Mercedes E-Class  |
| 400,000    | ~€103,000     | BMW 7-Series, Mercedes S-Class  |

> ⚠️ **Note for budgets >150k TND:** Most cars in this price range exceed FCR engine limits (>2000cc essence). Consider electric vehicles or verify the exact engine displacement before purchase.

#### Maximum Car Price by Budget (FCR Famille - Thermal)

| Budget TND | Max EUR Price | Example Cars                   |
|------------|---------------|--------------------------------|
| 50,000     | ~€12,500      | Polo 2020, i20 2019            |
| 70,000     | ~€18,000      | Golf 2020, 308 2019            |
| 90,000     | ~€24,000      | Tucson 2020, 3008 2019         |
| 120,000    | ~€34,000      | Tiguan 2021, 3008 GT 2020      |
| 150,000    | ~€43,000      | Q3 2022, GLA 2021              |
| 200,000    | ~€58,000      | Q5 2022, GLC 2021              |
| 300,000    | ~€87,000      | Q7 2023, GLE 2022              |

> ⚠️ **Note for budgets >120k TND:** FCR Famille has stricter engine limits (≤1600cc essence, ≤1900cc diesel). Most cars >€40,000 exceed these limits. **Electric vehicles are strongly recommended** for high budgets as they have no engine limit restrictions.

#### Maximum Car Price by Budget (FCR Famille - Electric)

| Budget TND | Max EUR Price | Example Cars                    |
|------------|---------------|---------------------------------|
| 70,000     | ~€19,000      | MG4, Dacia Spring               |
| 90,000     | ~€25,000      | BYD Dolphin                     |
| 120,000    | ~€34,000      | BYD Atto 3, Hyundai Kona EV     |
| 150,000    | ~€43,000      | Tesla Model 3 SR (used)         |
| 200,000    | ~€58,000      | Tesla Model 3 LR, BMW iX3       |
| 300,000    | ~€87,000      | Tesla Model S, BMW iX           |
| 400,000    | ~€116,000     | Mercedes EQS, Porsche Taycan    |

> ✅ **Electric vehicles:** No engine limit restrictions under FCR. With only 7% TVA (no DC), EVs offer the best tax efficiency for high budgets.

---

## 4. Car Matching Rules

### 4.1 Technical Constraints by Regime

```python
@dataclass
class CarConstraints:
    """Technical constraints for car eligibility"""
    max_age_years: int
    max_cc_essence: Optional[int]
    max_cc_diesel: Optional[int]
    electric_allowed: bool
    phev_allowed: bool
    hev_restrictions: Optional[str]


CAR_CONSTRAINTS = {
    "fcr_tre": CarConstraints(
        max_age_years=5,
        max_cc_essence=2000,
        max_cc_diesel=2500,
        electric_allowed=True,
        phev_allowed=True,
        hev_restrictions=None
    ),
    "fcr_famille": CarConstraints(
        max_age_years=8,
        max_cc_essence=1600,
        max_cc_diesel=1900,
        electric_allowed=True,
        phev_allowed=True,
        hev_restrictions="essence ≤1700cc only for 50% benefit"
    ),
    "voiture_populaire": CarConstraints(
        max_age_years=0,  # New only
        max_cc_essence=1200,
        max_cc_diesel=None,  # Diesel not available
        electric_allowed=False,
        phev_allowed=False,
        hev_restrictions="Not available"
    )
}

# High-Price Car Considerations (for cars > €40,000):
# - Most exceed FCR engine limits (>2000cc essence, >2500cc diesel)
# - Common luxury cars that EXCEED FCR limits:
#   - BMW 330i, 530i, X5 (most variants >2000cc)
#   - Mercedes C300, E-Class, GLE (most variants >2000cc)
#   - Audi A4 45 TFSI, A6, Q7 (most variants >2000cc)
# - FCR-compatible options at high budgets:
#   - Electric vehicles (Tesla, BMW i-series, Mercedes EQ) - always eligible
#   - Small-engine luxury (A-Class, 1-Series 118i) - verify exact CC
#   - Hybrid rechargeable versions (may have smaller engines)
# - For regular import (no FCR): ~150-250% taxes apply, no engine limits


def check_car_compatibility(
        car_year: int,
        engine_cc: int,
        fuel_type: str,
        regime: str
) -> Tuple[bool, List[str]]:
    """
    Check if a specific car meets regime requirements
    """
    if regime not in CAR_CONSTRAINTS:
        return True, []

    constraints = CAR_CONSTRAINTS[regime]
    issues = []

    # Age check
    current_year = 2026
    car_age = current_year - car_year
    if car_age > constraints.max_age_years:
        issues.append(f"Véhicule trop ancien: {car_age} ans > {constraints.max_age_years} ans max")

    # Engine size check
    if fuel_type == "essence" and constraints.max_cc_essence:
        if engine_cc > constraints.max_cc_essence:
            issues.append(f"Cylindrée essence trop élevée: {engine_cc}cc > {constraints.max_cc_essence}cc")

    if fuel_type == "diesel" and constraints.max_cc_diesel:
        if engine_cc > constraints.max_cc_diesel:
            issues.append(f"Cylindrée diesel trop élevée: {engine_cc}cc > {constraints.max_cc_diesel}cc")

    # Electric/Hybrid checks
    if fuel_type == "electric" and not constraints.electric_allowed:
        issues.append("Véhicules électriques non éligibles pour ce régime")

    if fuel_type == "hybrid_rechargeable" and not constraints.phev_allowed:
        issues.append("Hybrides rechargeables non éligibles pour ce régime")

    compatible = len(issues) == 0
    return compatible, issues
```

### 4.2 Smart Car Filters for Search

```python
def build_search_filters(user: UserProfile, eligibility: dict) -> dict:
    """
    Build optimized search filters based on user profile and eligibility
    """
    filters = {
        "price_max_eur": None,
        "year_min": None,
        "engine_cc_max": None,
        "fuel_types": [],
        "body_types": [],
        "sources": []
    }

    # Determine best regime
    if eligibility["fcr_tre"].eligible:
        best_regime = "fcr_tre"
        filters["year_min"] = 2021  # Max 5 years old
        filters["engine_cc_max"] = 2000  # Essence limit (most common)
    elif eligibility["fcr_famille"].eligible:
        best_regime = "fcr_famille"
        filters["year_min"] = 2018  # Max 8 years old
        filters["engine_cc_max"] = 1600  # Essence limit
    else:
        best_regime = "regular"
        filters["year_min"] = 2015
        filters["engine_cc_max"] = None

    # Calculate max price based on budget
    calculator = BudgetCalculator()
    if user.total_budget_tnd > 0:
        # Use average engine size for estimate
        avg_cc = filters["engine_cc_max"] or 1400
        filters["price_max_eur"] = calculator.max_car_price_for_budget(
            user.total_budget_tnd,
            "DE",  # Default origin
            avg_cc,
            "essence",
            best_regime
        )

    # Fuel type preferences
    if user.fuel_preference == FuelPreference.NO_PREFERENCE:
        filters["fuel_types"] = ["essence", "diesel", "hybrid", "hybrid_rechargeable", "electric"]
    elif user.fuel_preference == FuelPreference.ELECTRIC:
        filters["fuel_types"] = ["electric", "hybrid_rechargeable"]
    else:
        filters["fuel_types"] = [user.fuel_preference.value]

    # Body type preferences
    if user.body_preference != BodyPreference.NO_PREFERENCE:
        filters["body_types"] = [user.body_preference.value]

    # Prioritize EV if user is in Tunis/Sousse (better charging)
    ev_friendly_regions = ["tunis", "ariana", "ben_arous", "sousse", "monastir", "nabeul"]
    if user.governorate and user.governorate.lower() in ev_friendly_regions:
        if "electric" not in filters["fuel_types"]:
            filters["fuel_types"].append("electric")

    # Sources
    if best_regime in ["fcr_tre", "fcr_famille"]:
        filters["sources"] = ["mobile_de", "autoscout24", "leboncoin"]
    else:
        filters["sources"] = ["automobile_tn"]  # Local market

    return filters
```

---

## 5. Scoring & Ranking Algorithm

### 5.1 Multi-Factor Scoring System

```python
from typing import List
import math


@dataclass
class CarScore:
    """Scoring result for a car listing"""
    car_id: str
    total_score: float  # 0-100
    component_scores: dict
    rank: int
    recommendation_strength: str  # "excellent", "good", "fair", "poor"


class CarRankingEngine:
    """
    Rank cars based on multiple factors and user priorities
    """

    # Brand reliability scores (1-10)
    BRAND_RELIABILITY = {
        "toyota": 9.5, "lexus": 9.5, "honda": 9.0, "mazda": 8.5,
        "hyundai": 8.0, "kia": 8.0, "suzuki": 8.0,
        "volkswagen": 7.5, "skoda": 7.5, "seat": 7.0,
        "peugeot": 7.0, "renault": 7.0, "citroen": 6.5,
        "ford": 7.0, "opel": 7.0,
        "bmw": 7.0, "mercedes": 7.0, "audi": 7.0,
        "fiat": 6.0, "alfa romeo": 5.5,
        "default": 6.5
    }

    # Parts availability in Tunisia (1-10)
    PARTS_AVAILABILITY = {
        "peugeot": 9.5, "renault": 9.5, "citroen": 9.0,
        "volkswagen": 8.5, "toyota": 8.5, "hyundai": 8.5, "kia": 8.5,
        "fiat": 8.0, "opel": 8.0, "suzuki": 8.0,
        "ford": 7.0, "nissan": 7.5, "honda": 7.0,
        "bmw": 6.5, "mercedes": 6.5, "audi": 6.5,
        "default": 5.0
    }

    def calculate_score(
            self,
            car: dict,  # Car listing from database
            user: UserProfile,
            cost_breakdown: CostBreakdown
    ) -> CarScore:
        """
        Calculate comprehensive score for a car
        """
        scores = {}

        # === 1. PRICE SCORE (0-25 points) ===
        # How well does the price fit the budget?
        budget_ratio = cost_breakdown.total_cost_tnd / user.total_budget_tnd
        if budget_ratio <= 0.7:
            scores["price"] = 25  # Under budget is great
        elif budget_ratio <= 0.9:
            scores["price"] = 22
        elif budget_ratio <= 1.0:
            scores["price"] = 18
        elif budget_ratio <= 1.1:
            scores["price"] = 10  # Slightly over budget
        else:
            scores["price"] = 5  # Significantly over budget

        # === 2. AGE/YEAR SCORE (0-20 points) ===
        car_age = 2026 - car.get("year", 2020)
        if car_age <= 2:
            scores["age"] = 20
        elif car_age <= 4:
            scores["age"] = 17
        elif car_age <= 6:
            scores["age"] = 13
        elif car_age <= 8:
            scores["age"] = 8
        else:
            scores["age"] = 3

        # === 3. MILEAGE SCORE (0-15 points) ===
        mileage = car.get("mileage_km", 100000)
        if mileage < 30000:
            scores["mileage"] = 15
        elif mileage < 60000:
            scores["mileage"] = 13
        elif mileage < 100000:
            scores["mileage"] = 10
        elif mileage < 150000:
            scores["mileage"] = 6
        else:
            scores["mileage"] = 2

        # === 4. RELIABILITY SCORE (0-15 points) ===
        brand = car.get("brand", "").lower()
        reliability = self.BRAND_RELIABILITY.get(brand, self.BRAND_RELIABILITY["default"])
        scores["reliability"] = (reliability / 10) * 15

        # === 5. PARTS AVAILABILITY SCORE (0-10 points) ===
        parts = self.PARTS_AVAILABILITY.get(brand, self.PARTS_AVAILABILITY["default"])
        scores["parts"] = (parts / 10) * 10

        # === 6. FUEL EFFICIENCY SCORE (0-10 points) ===
        fuel_type = car.get("fuel_type", "essence")
        engine_cc = car.get("engine_cc", 1400)

        if fuel_type == "electric":
            scores["efficiency"] = 10
        elif fuel_type == "hybrid_rechargeable":
            scores["efficiency"] = 9
        elif fuel_type == "hybrid":
            scores["efficiency"] = 8
        elif fuel_type == "diesel" and engine_cc <= 1600:
            scores["efficiency"] = 7
        elif fuel_type == "essence" and engine_cc <= 1200:
            scores["efficiency"] = 7
        elif engine_cc <= 1600:
            scores["efficiency"] = 5
        else:
            scores["efficiency"] = 3

        # === 7. USER PREFERENCE MATCH (0-5 points) ===
        preference_score = 0

        # Brand preference
        if user.preferred_brands and brand in [b.lower() for b in user.preferred_brands]:
            preference_score += 2
        if user.avoided_brands and brand in [b.lower() for b in user.avoided_brands]:
            preference_score -= 3

        # Body type preference
        if user.body_preference != BodyPreference.NO_PREFERENCE:
            if car.get("body_type") == user.body_preference.value:
                preference_score += 2

        # Transmission preference
        if user.needs_automatic and car.get("transmission") == "automatic":
            preference_score += 1

        scores["preferences"] = max(0, min(5, preference_score + 2.5))  # Normalize to 0-5

        # === APPLY USER PRIORITY WEIGHTS ===
        weighted_total = 0

        # Price weight (user priority 1-5)
        price_weight = user.priority_low_price / 3
        weighted_total += scores["price"] * price_weight

        # Reliability weight
        reliability_weight = user.priority_reliability / 3
        weighted_total += scores["reliability"] * reliability_weight

        # Efficiency weight
        efficiency_weight = user.priority_fuel_economy / 3
        weighted_total += scores["efficiency"] * efficiency_weight

        # Parts weight
        parts_weight = user.priority_parts_availability / 3
        weighted_total += scores["parts"] * parts_weight

        # Add non-weighted components
        weighted_total += scores["age"] + scores["mileage"] + scores["preferences"]

        # Normalize to 0-100
        total_score = min(100, weighted_total)

        # Determine recommendation strength
        if total_score >= 80:
            strength = "excellent"
        elif total_score >= 65:
            strength = "good"
        elif total_score >= 50:
            strength = "fair"
        else:
            strength = "poor"

        return CarScore(
            car_id=car.get("id", ""),
            total_score=round(total_score, 1),
            component_scores=scores,
            rank=0,  # Set during ranking
            recommendation_strength=strength
        )

    def rank_cars(
            self,
            cars: List[dict],
            user: UserProfile,
            calculator: BudgetCalculator,
            regime: str
    ) -> List[CarScore]:
        """
        Rank a list of cars and return sorted scores
        """
        scored_cars = []

        for car in cars:
            # Calculate cost for this car
            cost = calculator.calculate_full_cost(
                car.get("price", 0),
                car.get("country", "DE"),
                car.get("engine_cc", 1400),
                car.get("fuel_type", "essence"),
                regime
            )

            # Score the car
            score = self.calculate_score(car, user, cost)
            score.car_id = car.get("id", "")
            scored_cars.append((car, score, cost))

        # Sort by total score descending
        scored_cars.sort(key=lambda x: x[1].total_score, reverse=True)

        # Assign ranks
        result = []
        for rank, (car, score, cost) in enumerate(scored_cars, 1):
            score.rank = rank
            result.append({
                "car": car,
                "score": score,
                "cost": cost
            })

        return result
```

### 5.2 Scoring Weights Summary

| Factor             | Max Points | Weight Affected By            |
|--------------------|------------|-------------------------------|
| Price fit          | 25         | `priority_low_price`          |
| Vehicle age        | 20         | Fixed                         |
| Mileage            | 15         | Fixed                         |
| Brand reliability  | 15         | `priority_reliability`        |
| Parts availability | 10         | `priority_parts_availability` |
| Fuel efficiency    | 10         | `priority_fuel_economy`       |
| User preferences   | 5          | Direct match                  |
| **TOTAL**          | **100**    |                               |

---

## 6. Recommendation Scenarios

### 6.1 Scenario Handlers

```python
class RecommendationEngine:
    """
    High-level recommendation logic for common user scenarios
    """

    def __init__(self):
        self.calculator = BudgetCalculator()
        self.ranker = CarRankingEngine()

    def scenario_tre_with_budget(
            self,
            user: UserProfile,
            available_cars: List[dict]
    ) -> dict:
        """
        Scenario: "I'm TRE with X budget, what can I get?"
        """
        # Filter cars for FCR TRE compatibility
        eligible_cars = [
            car for car in available_cars
            if check_car_compatibility(
                car["year"], car["engine_cc"], car["fuel_type"], "fcr_tre"
            )[0]
        ]

        # Filter by budget
        max_price = self.calculator.max_car_price_for_budget(
            user.total_budget_tnd, "DE", 1400, "essence", "fcr_tre"
        )
        affordable_cars = [c for c in eligible_cars if c["price"] <= max_price]

        # Rank and get top recommendations
        ranked = self.ranker.rank_cars(affordable_cars, user, self.calculator, "fcr_tre")

        return {
            "regime": "FCR TRE (25% des droits)",
            "budget_tnd": user.total_budget_tnd,
            "max_car_price_eur": max_price,
            "total_matches": len(affordable_cars),
            "top_recommendations": ranked[:10],
            "advice": self._generate_tre_advice(user, ranked)
        }

    def scenario_import_vs_local(
            self,
            user: UserProfile,
            target_model: str,
            local_price_tnd: float,
            import_price_eur: float,
            engine_cc: int,
            fuel_type: str
    ) -> dict:
        """
        Scenario: "Should I buy locally or import?"
        """
        results = {}

        # Local purchase
        results["local"] = {
            "price_tnd": local_price_tnd,
            "source": "Concessionnaire Tunisie",
            "pros": ["Pas de démarches d'import", "Garantie locale", "Immatriculation immédiate"],
            "cons": ["Prix souvent plus élevé", "Choix limité"]
        }

        # Import scenarios
        for regime in ["fcr_tre", "fcr_famille", "regular"]:
            eligibility = check_all_eligibility(user)
            if not eligibility[regime].eligible and regime != "regular":
                continue

            cost = self.calculator.calculate_full_cost(
                import_price_eur, "DE", engine_cc, fuel_type, regime
            )

            savings = local_price_tnd - cost.total_cost_tnd

            results[regime] = {
                "price_tnd": cost.total_cost_tnd,
                "car_price_eur": import_price_eur,
                "source": f"Import Europe ({regime.upper()})",
                "savings_vs_local": savings,
                "savings_percent": (savings / local_price_tnd * 100) if savings > 0 else 0,
                "pros": self._get_import_pros(regime),
                "cons": self._get_import_cons(regime),
                "breakdown": cost
            }

        # Generate recommendation
        best_option = min(results.items(), key=lambda x: x[1]["price_tnd"])

        return {
            "comparison": results,
            "recommendation": best_option[0],
            "recommendation_reason": f"Option la moins chère: {best_option[1]['price_tnd']:,.0f} TND"
        }

    def scenario_electric_vs_thermal(
            self,
            user: UserProfile,
            budget_tnd: float
    ) -> dict:
        """
        Scenario: "Should I get electric or thermal?"
        """
        # Calculate max prices for each
        max_thermal = self.calculator.max_car_price_for_budget(
            budget_tnd, "DE", 1400, "essence", "fcr_famille"
        )
        max_electric = self.calculator.max_car_price_for_budget(
            budget_tnd, "DE", 0, "electric", "fcr_famille"
        )

        # Running cost comparison (15,000 km/year, 5 years)
        annual_km = 15000
        years = 5

        # Thermal: 7L/100km × 2.525 TND/L
        thermal_fuel_cost = (annual_km / 100) * 7 * 2.525 * years

        # Electric: 17 kWh/100km × 0.25 TND/kWh (average tier)
        electric_cost = (annual_km / 100) * 17 * 0.25 * years

        # Vignette comparison (assume 7CV)
        thermal_vignette = 280 * years  # Diesel 7CV
        electric_vignette = 280 * 0.5 * years  # 50% reduction

        # Maintenance
        thermal_maintenance = 800 * years
        electric_maintenance = 400 * years

        # EV charging feasibility
        ev_feasible = self._assess_ev_feasibility(user)

        return {
            "thermal": {
                "max_car_price_eur": max_thermal,
                "purchase_tax_rate": "17% (DC 10% + TVA 7%)",
                "5_year_running_cost_tnd": thermal_fuel_cost + thermal_vignette + thermal_maintenance,
                "fuel_cost_monthly": thermal_fuel_cost / (years * 12),
                "pros": [
                    "Plus grand choix de véhicules",
                    "Pas de souci d'autonomie",
                    "Infrastructure existante"
                ],
                "cons": [
                    "Coût carburant élevé",
                    "Vignette complète",
                    "Entretien plus coûteux"
                ]
            },
            "electric": {
                "max_car_price_eur": max_electric,
                "purchase_tax_rate": "7% (DC 0% + TVA 7%)",
                "5_year_running_cost_tnd": electric_cost + electric_vignette + electric_maintenance,
                "fuel_cost_monthly": electric_cost / (years * 12),
                "charging_feasibility": ev_feasible,
                "pros": [
                    "Taxes quasi-nulles (0% DC)",
                    "Coût énergie 5× moins cher",
                    "Vignette -50%",
                    "Moins d'entretien"
                ],
                "cons": [
                    "Infrastructure de recharge limitée",
                    "Autonomie à planifier",
                    "Choix de véhicules restreint"
                ]
            },
            "recommendation": self._ev_vs_thermal_recommendation(user, ev_feasible)
        }

    def _assess_ev_feasibility(self, user: UserProfile) -> dict:
        """Assess if EV is practical for this user"""
        score = 0
        factors = []

        # Location
        ev_friendly = ["tunis", "ariana", "ben_arous", "sousse", "monastir", "nabeul", "sfax"]
        if user.governorate and user.governorate.lower() in ev_friendly:
            score += 30
            factors.append("✅ Région avec bornes de recharge")
        else:
            factors.append("⚠️ Peu de bornes dans votre région")

        # Home charging
        if user.has_home_parking:
            score += 40
            factors.append("✅ Parking privé (recharge à domicile possible)")
        else:
            score.append("❌ Pas de parking privé (recharge difficile)")

        # Daily commute
        if user.daily_commute_km and user.daily_commute_km < 100:
            score += 20
            factors.append(f"✅ Trajet quotidien ({user.daily_commute_km} km) dans l'autonomie")
        elif user.daily_commute_km and user.daily_commute_km > 150:
            factors.append(f"⚠️ Trajet long ({user.daily_commute_km} km) - vérifier autonomie")

        # Intercity travel
        if not user.frequent_intercity_travel:
            score += 10
            factors.append("✅ Pas de longs trajets fréquents")
        else:
            factors.append("⚠️ Trajets interurbains - planifier les recharges")

        return {
            "score": score,
            "verdict": "Recommandé" if score >= 60 else "Possible avec planification" if score >= 40 else "Difficile",
            "factors": factors
        }

    def _ev_vs_thermal_recommendation(self, user: UserProfile, ev_feasibility: dict) -> str:
        """Generate final EV vs thermal recommendation"""
        if ev_feasibility["score"] >= 70:
            return "🔋 ÉLECTRIQUE FORTEMENT RECOMMANDÉ - Vous économiserez ~40% sur 5 ans"
        elif ev_feasibility["score"] >= 50:
            return "🔋 ÉLECTRIQUE POSSIBLE - Considérez un hybride rechargeable comme alternative"
        elif ev_feasibility["score"] >= 30:
            return "⚡ HYBRIDE RECHARGEABLE RECOMMANDÉ - Meilleur compromis pour votre situation"
        else:
            return "⛽ THERMIQUE RECOMMANDÉ - L'infrastructure EV n'est pas adaptée à votre situation"
```

### 6.2 Common Scenario Examples

#### Example 1: TRE with 80,000 TND

```python
# User input
user = UserProfile(
    residency_status=ResidencyStatus.TRE_ABROAD,
    years_abroad=5,
    total_budget_tnd=80000,
    fuel_preference=FuelPreference.NO_PREFERENCE,
    has_tre_family_contact=True
)

# Expected output
{
    "regime": "FCR TRE",
    "max_car_price_eur": 19500,
    "recommended_cars": [
        {"brand": "Volkswagen", "model": "Golf 1.4 TSI", "year": 2022, "price_eur": 18500},
        {"brand": "Peugeot", "model": "308 1.2 PureTech", "year": 2022, "price_eur": 17000},
        {"brand": "Toyota", "model": "Corolla 1.8", "year": 2021, "price_eur": 19000}
    ],
    "advice": "Avec 80,000 TND et le régime FCR TRE, vous pouvez viser des véhicules jusqu'à ~19,500€ en Europe. Privilégiez les moteurs ≤2000cc essence pour rester dans les limites FCR."
}
```

#### Example 2: Resident comparing import vs local

```python
# Golf 8 comparison
{
    "model": "VW Golf 8 1.4 TSI",
    "local_tunisia": {
        "price_tnd": 145000,
        "source": "Ennakl"
    },
    "import_fcr_famille": {
        "car_price_eur": 22000,
        "total_tnd": 95000,
        "savings": 50000,
        "savings_percent": "34%"
    },
    "recommendation": "IMPORT via FCR Famille - Économie de 50,000 TND!"
}
```

---

## 7. Edge Cases & Warnings

### 7.1 Critical Edge Cases

```python
class EdgeCaseHandler:
    """
    Handle edge cases and generate appropriate warnings
    """

    def check_all_edge_cases(self, user: UserProfile, car: dict) -> List[str]:
        """Run all edge case checks and return warnings"""
        warnings = []

        warnings.extend(self._check_cc_limit_edge(car))
        warnings.extend(self._check_income_edge(user))
        warnings.extend(self._check_payment_feasibility(user))
        warnings.extend(self._check_car_age_edge(car))
        warnings.extend(self._check_brand_availability(car))
        warnings.extend(self._check_ev_infrastructure(user, car))
        warnings.extend(self._check_high_budget_edge(user))

        return warnings

    def _check_cc_limit_edge(self, car: dict) -> List[str]:
        """
        Check if car is dangerously close to CC limits
        """
        warnings = []
        cc = car.get("engine_cc", 0)
        fuel = car.get("fuel_type", "essence")

        # FCR TRE limits
        if fuel == "essence" and 1950 <= cc <= 2000:
            warnings.append(
                "⚠️ ATTENTION CYLINDRÉE: Ce véhicule est à la limite FCR TRE (2000cc). "
                "Vérifiez la carte grise exacte - certaines versions peuvent dépasser légèrement."
            )
        elif fuel == "essence" and cc > 2000:
            warnings.append(
                f"❌ HORS LIMITE FCR TRE: {cc}cc > 2000cc maximum pour essence. "
                "Vous paierez 30% au lieu de 25%."
            )

        if fuel == "diesel" and 2450 <= cc <= 2500:
            warnings.append(
                "⚠️ ATTENTION CYLINDRÉE: Ce véhicule est à la limite FCR TRE diesel (2500cc)."
            )

        # FCR Famille limits (stricter)
        if fuel == "essence" and 1550 <= cc <= 1600:
            warnings.append(
                "⚠️ LIMITE FCR FAMILLE: Ce véhicule est à la limite (1600cc essence). "
                "Assurez-vous que la version exacte ne dépasse pas."
            )
        elif fuel == "essence" and cc > 1600:
            warnings.append(
                f"❌ NON ÉLIGIBLE FCR FAMILLE: {cc}cc > 1600cc max (essence). "
                "Considérez un modèle avec moteur plus petit ou électrique."
            )

        if fuel == "diesel" and 1850 <= cc <= 1900:
            warnings.append(
                "⚠️ LIMITE FCR FAMILLE: Ce véhicule est à la limite diesel (1900cc)."
            )
        elif fuel == "diesel" and cc > 1900:
            warnings.append(
                f"❌ NON ÉLIGIBLE FCR FAMILLE: {cc}cc > 1900cc max (diesel)."
            )

        return warnings

    def _check_income_edge(self, user: UserProfile) -> List[str]:
        """
        Check if user is close to income thresholds
        """
        warnings = []

        is_married = user.family_status in [FamilyStatus.MARRIED_NO_KIDS, FamilyStatus.MARRIED_WITH_KIDS]
        income_limit = SMIG_48H_2025 * 14 if is_married else SMIG_48H_2025 * 10

        total_income = (user.monthly_gross_income_tnd or 0) + (user.spouse_monthly_income_tnd or 0)

        if total_income > 0:
            margin = income_limit - total_income
            margin_percent = (margin / income_limit) * 100

            if 0 < margin < 300:
                warnings.append(
                    f"⚠️ REVENUS LIMITE: Vous êtes à seulement {margin:.0f} TND du plafond. "
                    "Une augmentation de salaire pourrait vous rendre inéligible. "
                    "Conseil: Importez rapidement avant tout changement de situation."
                )
            elif margin < 0 and margin > -500:
                warnings.append(
                    f"⚠️ LÉGÈREMENT HORS LIMITE: Vous dépassez de {abs(margin):.0f} TND. "
                    "Vérifiez: Le calcul se base sur le BRUT, pas le net. "
                    "Des déductions peuvent réduire votre revenu imposable."
                )

        return warnings

    def _check_payment_feasibility(self, user: UserProfile) -> List[str]:
        """
        Check if user can realistically pay for the car
        """
        warnings = []

        if user.residency_status == ResidencyStatus.RESIDENT_TUNISIA:
            # Resident trying to buy from Europe
            if not user.has_tre_family_contact:
                warnings.append(
                    "⚠️ PAIEMENT DIFFICILE: Sans famille TRE, payer un vendeur en Europe "
                    "sera compliqué. Options: "
                    "(1) Allocation touristique (~3,500€ max pour couple) "
                    "(2) Demande d'autorisation BCT "
                    "(3) Trouver un contact TRE de confiance"
                )

            # Check if allocation is enough
            allocation_max = user.num_adults * 1760 + min(user.num_children, 2) * 880  # Rough EUR estimate
            if user.total_budget_tnd > 0:
                max_car_price = user.total_budget_tnd / 4  # Very rough estimate for EUR price
                if max_car_price > allocation_max and not user.has_tre_family_contact:
                    warnings.append(
                        f"⚠️ ALLOCATION INSUFFISANTE: Votre allocation (~{allocation_max:.0f}€) "
                        f"ne couvrira pas une voiture à ce budget. Vous aurez besoin d'un don TRE."
                    )

        return warnings

    def _check_car_age_edge(self, car: dict) -> List[str]:
        """
        Check car age edge cases
        """
        warnings = []
        car_year = car.get("year", 2020)
        car_age = 2026 - car_year

        # FCR TRE: 5 years
        if car_age == 5:
            warnings.append(
                "⚠️ ÂGE LIMITE FCR TRE: Ce véhicule a exactement 5 ans. "
                "Il ne sera plus éligible l'année prochaine si vous tardez."
            )

        # FCR Famille: 8 years
        if car_age == 8:
            warnings.append(
                "⚠️ ÂGE LIMITE FCR FAMILLE: Ce véhicule a 8 ans (limite max). "
                "Vérifiez la date exacte de première immatriculation."
            )

        # Depreciation warning for older cars
        if car_age >= 6:
            warnings.append(
                f"💡 CONSEIL: À {car_age} ans, la dépréciation ralentit. "
                "Mais vérifiez l'historique d'entretien et le kilométrage."
            )

        return warnings

    def _check_brand_availability(self, car: dict) -> List[str]:
        """
        Warn about parts availability for rare brands
        """
        warnings = []
        brand = car.get("brand", "").lower()

        rare_brands = {
            "alfa romeo": "pièces rares et chères en Tunisie",
            "land rover": "entretien coûteux, peu de mécaniciens spécialisés",
            "jaguar": "pièces importées uniquement, délais longs",
            "porsche": "très peu de pièces disponibles localement",
            "subaru": "réseau limité, pièces sur commande",
            "ssangyong": "marque peu connue, pièces difficiles",
            "mahindra": "réseau en développement"
        }

        if brand in rare_brands:
            warnings.append(
                f"⚠️ DISPONIBILITÉ PIÈCES: {brand.title()} - {rare_brands[brand]}. "
                "Budget d'entretien à prévoir plus élevé."
            )

        # Chinese brands warning
        chinese_brands = ["chery", "geely", "byd", "great wall", "haval", "mg", "jac"]
        if brand in chinese_brands:
            warnings.append(
                f"💡 MARQUE CHINOISE: {brand.title()} - Le réseau de pièces se développe. "
                "Vérifiez la présence d'un concessionnaire agréé en Tunisie."
            )

        return warnings

    def _check_ev_infrastructure(self, user: UserProfile, car: dict) -> List[str]:
        """
        Warn about EV charging challenges
        """
        warnings = []
        fuel = car.get("fuel_type", "")

        if fuel not in ["electric", "hybrid_rechargeable"]:
            return warnings

        # Location check
        limited_regions = [
            "jendouba", "kasserine", "sidi_bouzid", "siliana", "kef",
            "tataouine", "kebili", "tozeur", "gafsa"
        ]

        if user.governorate and user.governorate.lower() in limited_regions:
            warnings.append(
                f"⚠️ INFRASTRUCTURE EV LIMITÉE: Dans la région de {user.governorate}, "
                "les bornes de recharge sont très rares. Recharge à domicile indispensable."
            )

        # Home charging
        if not user.has_home_parking:
            warnings.append(
                "❌ PAS DE PARKING PRIVÉ: La recharge à domicile sera difficile. "
                "Les bornes publiques sont encore rares en Tunisie. "
                "Un hybride rechargeable ou thermique serait plus pratique."
            )

        # Long commute
        if user.daily_commute_km and user.daily_commute_km > 150:
            warnings.append(
                f"⚠️ TRAJET LONG ({user.daily_commute_km} km/jour): "
                "Vérifiez que l'autonomie du véhicule couvre vos besoins avec une marge de sécurité."
            )

        return warnings

    def _check_high_budget_edge(self, user: UserProfile) -> List[str]:
        """
        Warn about FCR limits for high budgets
        At high budgets (>150k TND), most cars exceed FCR engine limits
        """
        warnings = []

        if user.total_budget_tnd >= 200000:
            warnings.append(
                "💡 BUDGET ÉLEVÉ: À ce niveau de budget (~200k+ TND), la plupart des voitures "
                "dépassent les limites FCR (2000cc essence / 2500cc diesel). Considérez: "
                "(1) Véhicule électrique (pas de limite CC, taxes minimales 7% TVA) "
                "(2) Import régulier si le modèle souhaité n'est pas FCR-compatible "
                "(3) Vérifiez attentivement la cylindrée exacte avant achat"
            )
        elif user.total_budget_tnd >= 150000:
            warnings.append(
                "💡 BUDGET CONSÉQUENT: Avec 150k+ TND, certaines voitures peuvent dépasser "
                "les limites FCR. Privilégiez les motorisations ≤2.0L essence ou les véhicules "
                "électriques pour maximiser vos avantages fiscaux."
            )

        return warnings
```

### 7.2 Warning Message Templates

| Situation                 | Warning Level | Message                                                  |
|---------------------------|---------------|----------------------------------------------------------|
| CC at 98-100% of limit    | ⚠️ Yellow     | "Véhicule à la limite - vérifiez la carte grise exacte"  |
| CC over limit             | ❌ Red         | "Non éligible pour ce régime"                            |
| Income 0-5% under limit   | ⚠️ Yellow     | "Proche du plafond - importez rapidement"                |
| Income 0-10% over limit   | ⚠️ Yellow     | "Vérifiez le calcul - des déductions peuvent aider"      |
| No TRE contact + resident | ⚠️ Yellow     | "Paiement en Europe sera difficile"                      |
| Rare brand                | 💡 Info       | "Pièces détachées limitées - budget entretien à prévoir" |
| Car age = max limit       | ⚠️ Yellow     | "Véhicule à la limite d'âge - ne tardez pas"             |
| EV + rural area           | ⚠️ Yellow     | "Infrastructure de recharge très limitée"                |
| EV + no home parking      | ❌ Red         | "Recharge difficile - considérez un hybride"             |
| Budget ≥ 150k TND         | 💡 Info       | "Budget élevé - vérifiez compatibilité FCR moteur"       |
| Budget ≥ 200k TND         | ⚠️ Yellow     | "Plupart des voitures dépassent limites FCR - VE recommandé" |

---

## 8. Conversation Flow Design

### 8.1 Question Priority Order

```python
QUESTION_FLOW = [
    # Phase 1: Eligibility (MUST ASK)
    {
        "id": "residency",
        "question_fr": "Habitez-vous actuellement en Tunisie ou à l'étranger?",
        "question_ar": "هل تسكن حاليا في تونس أو في الخارج؟",
        "options": ["En Tunisie", "À l'étranger"],
        "maps_to": "residency_status",
        "required": True,
        "follow_up": {
            "À l'étranger": ["years_abroad", "country_residence"]
        }
    },
    {
        "id": "years_abroad",
        "question_fr": "Depuis combien d'années habitez-vous à l'étranger?",
        "options": ["< 2 ans", "2-5 ans", "5-10 ans", "> 10 ans"],
        "maps_to": "years_abroad",
        "required": True,
        "condition": "residency == abroad"
    },
    {
        "id": "family_status",
        "question_fr": "Quelle est votre situation familiale?",
        "options": ["Célibataire", "Marié(e) sans enfants", "Marié(e) avec enfants",
                    "Divorcé(e)/Veuf(ve) avec enfants"],
        "maps_to": "family_status",
        "required": True
    },
    {
        "id": "income",
        "question_fr": "Quel est votre revenu mensuel brut (ou celui du couple)?",
        "type": "number_or_range",
        "options": ["< 3,000 TND", "3,000-5,000 TND", "5,000-7,500 TND", "> 7,500 TND", "Je préfère ne pas dire"],
        "maps_to": "monthly_gross_income_tnd",
        "required": False,  # Can skip but affects recommendations
        "condition": "residency == tunisia"
    },

    # Phase 2: Budget (MUST ASK)
    {
        "id": "budget",
        "question_fr": "Quel est votre budget total pour l'achat de la voiture?",
        "type": "number",
        "hint": "Incluez tout: prix voiture + frais + taxes",
        "maps_to": "total_budget_tnd",
        "required": True
    },
    {
        "id": "payment_method",
        "question_fr": "Comment comptez-vous payer la voiture en Europe?",
        "options": [
            "J'ai de la famille à l'étranger qui peut m'aider",
            "Je vais utiliser mon allocation touristique",
            "Je ne sais pas encore",
            "Autre"
        ],
        "maps_to": "payment_method",
        "required": True,
        "condition": "residency == tunisia AND regime == fcr_famille"
    },

    # Phase 3: Preferences (OPTIONAL but helpful)
    {
        "id": "fuel_preference",
        "question_fr": "Quel type de carburant préférez-vous?",
        "options": ["Pas de préférence", "Essence", "Diesel", "Hybride", "Électrique"],
        "maps_to": "fuel_preference",
        "required": False
    },
    {
        "id": "body_preference",
        "question_fr": "Quel type de carrosserie recherchez-vous?",
        "options": ["Pas de préférence", "Citadine", "Berline", "SUV/Crossover", "Monospace", "Break"],
        "maps_to": "body_preference",
        "required": False
    },
    {
        "id": "location",
        "question_fr": "Dans quel gouvernorat habitez-vous?",
        "type": "select",
        "options": ["Tunis", "Ariana", "Ben Arous", "Sousse", "Sfax", "Nabeul", "Autre"],
        "maps_to": "governorate",
        "required": False,
        "note": "Important pour évaluer la faisabilité électrique"
    },

    # Phase 4: Usage (OPTIONAL)
    {
        "id": "daily_km",
        "question_fr": "Combien de km parcourez-vous en moyenne par jour?",
        "options": ["< 30 km", "30-50 km", "50-100 km", "> 100 km"],
        "maps_to": "daily_commute_km",
        "required": False,
        "condition": "fuel_preference IN [hybrid, electric]"
    }
]
```

### 8.2 Response Templates

```python
RESPONSE_TEMPLATES = {
    "eligibility_confirmed": {
        "fcr_tre": """
🎉 **Bonne nouvelle!** Vous êtes éligible au régime **FCR TRE**.

**Ce que ça signifie:**
- Vous ne payez que **25%** des droits normaux
- Véhicules jusqu'à **5 ans** d'âge
- Moteur: essence ≤2000cc, diesel ≤2500cc

Avec votre budget de **{budget:,.0f} TND**, vous pouvez viser des voitures jusqu'à **~{max_eur:,.0f}€** en Europe.
        """,

        "fcr_famille": """
🎉 **Bonne nouvelle!** Vous êtes éligible à **"Une Voiture pour Chaque Famille"** (FCR Article 55).

**Ce que ça signifie:**
- Taxe de consommation réduite à **10%** (au lieu de 30-88%)
- TVA à **7%** (au lieu de 19%)
- Véhicules jusqu'à **8 ans** d'âge

⚡ **Bonus Électrique/Hybride:** 0% de taxe de consommation!

Avec votre budget de **{budget:,.0f} TND**, vous pouvez viser:
- Thermique: ~**{max_thermal:,.0f}€**
- Électrique: ~**{max_electric:,.0f}€**
        """,

        "not_eligible": """
😔 Malheureusement, vous n'êtes pas éligible aux régimes FCR.

**Raisons:**
{reasons}

**Options disponibles:**
1. **Marché local** - Achetez chez un concessionnaire tunisien
2. **Voiture d'occasion** - Site automobile.tn
3. **Voiture Populaire** - Si vous êtes éligible (attente longue)
        """
    },

    "recommendation_intro": """
📊 **Voici mes recommandations pour vous:**

Budget: **{budget:,.0f} TND** | Régime: **{regime}** | Max voiture: **{max_eur:,.0f}€**
    """,

    "car_card": """
🚗 **{rank}. {brand} {model}** ({year})
- 💰 Prix: **{price_eur:,.0f}€** → Total TND: **{total_tnd:,.0f} TND**
- 🔧 Moteur: {engine_cc}cc {fuel_type}
- 📍 Origine: {country}
- 📏 Kilométrage: {mileage:,} km
- ⭐ Score: **{score}/100** ({strength})
- 🔗 [Voir l'annonce]({url})
    """,

    "import_vs_local": """
📊 **Comparaison: {model}**

| Option | Prix Final | Économie |
|--------|-----------|----------|
| 🇹🇳 Concessionnaire Tunisie | {local_price:,.0f} TND | - |
| 🇪🇺 Import {regime} | {import_price:,.0f} TND | **{savings:,.0f} TND** ({savings_pct:.0f}%) |

**Recommandation:** {recommendation}
    """,

    "warning_template": """
⚠️ **Attention:**
{warnings}
    """
}
```

### 8.3 Conversation State Machine

```
┌─────────────────────┐
│      START          │
│  "Salam! Je suis    │
│  votre assistant    │
│  voiture"           │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   ASK: Residency    │
│   "Où habitez-vous?"│
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌────────┐  ┌────────┐
│ ABROAD │  │TUNISIA │
└───┬────┘  └───┬────┘
    │           │
    ▼           ▼
┌────────────┐ ┌────────────┐
│ASK: Years  │ │ASK: Income │
│abroad      │ │& Family    │
└───┬────────┘ └───┬────────┘
    │              │
    ▼              ▼
┌─────────────────────────────┐
│  CALCULATE ELIGIBILITY      │
│  → FCR TRE or Famille       │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│     ASK: Budget             │
│  "Quel est votre budget?"   │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│    ASK: Preferences         │
│  Fuel, Body, Brand...       │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   SEARCH & RANK CARS        │
│   Apply all filters         │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│   PRESENT RECOMMENDATIONS   │
│   Top 5-10 matches          │
└─────────────┬───────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌──────────┐      ┌──────────┐
│ USER     │      │ USER     │
│ REFINES  │      │ SELECTS  │
│ CRITERIA │      │ A CAR    │
└────┬─────┘      └────┬─────┘
     │                 │
     │                 ▼
     │           ┌──────────────┐
     │           │ SHOW DETAILS │
     │           │ + Cost       │
     │           │ + Procedure  │
     │           │ + Warnings   │
     │           └──────────────┘
     │
     ▼
┌─────────────────────────────┐
│   LOOP: More questions?     │
│   Compare? Electric vs      │
│   thermal? etc.             │
└─────────────────────────────┘
```

---

## 📊 Quick Reference Summary

### Eligibility Cheat Sheet

| Regime      | Who               | Income Limit | Car Age | CC Limit (Essence) | CC Limit (Diesel) | Tax Rate   |
|-------------|-------------------|--------------|---------|--------------------|-------------------|------------|
| FCR TRE     | TRE 2+ yrs abroad | None         | ≤5 yrs  | ≤2000cc            | ≤2500cc           | 25%        |
| FCR Famille | Resident          | ≤10/14× SMIG | ≤8 yrs  | ≤1600cc            | ≤1900cc           | ~17%       |
| Voiture Pop | Low income        | ≤10/15× SMIG | NEW     | ≤1200cc            | N/A               | Subsidized |
| Regular     | Anyone            | None         | Any     | Any                | Any               | 150-250%   |

### Budget → Max Car Price (Quick Lookup)

| Budget TND | FCR TRE (€) | FCR Famille Thermal (€) | FCR Famille EV (€) | Regular Import (€) |
|------------|-------------|-------------------------|--------------------|--------------------|
| 40,000     | 8,500       | 9,500                   | 11,500             | 6,000              |
| 60,000     | 13,500      | 15,500                  | 17,500             | 10,000             |
| 80,000     | 19,000      | 21,500                  | 24,000             | 14,000             |
| 100,000    | 24,500      | 28,000                  | 31,000             | 18,000             |
| 120,000    | 30,000      | 34,000                  | 38,000             | 22,000             |
| 150,000    | 38,000      | 43,000                  | 48,000             | 28,000             |
| 200,000    | 51,000      | 58,000                  | 64,000             | 38,000             |
| 300,000    | 77,000      | 87,000                  | 97,000             | 58,000             |
| 400,000    | 103,000     | 116,000                 | 129,000            | 78,000             |

> **Note:** For cars >€40,000, most exceed FCR engine limits. Regular import column shows max price without FCR benefits (~150% taxes).

---

## 📝 Change Log

| Date       | Change                                            |
|------------|---------------------------------------------------|
| 2026-01-26 | Initial recommendation rules KB created           |
|            | Added complete user profile schema                |
|            | Added eligibility decision trees with Python code |
|            | Added budget calculator with reverse calculation  |
|            | Added car matching constraints                    |
|            | Added multi-factor scoring algorithm              |
|            | Added recommendation scenarios                    |
|            | Added comprehensive edge case handling            |
|            | Added conversation flow design                    |
| 2026-01-29 | Extended budget tables to 400k TND                |
|            | Added Regular Import column to budget lookup      |
|            | Added high-budget edge case handler               |
|            | Added high-price car considerations note          |
|            | Added high-budget warnings to warning templates   |

---

*This document defines the complete recommendation logic for the Tunisia Car Import Chatbot. All calculations should be
validated against the tax KB (tunisia-douane-kb-2026) and FCR law KB (tunisia-car-kb).*
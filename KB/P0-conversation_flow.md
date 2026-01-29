# 🤖 Tunisia Car Import Chatbot - Conversation Flow Design
## Knowledge Base Entry - UX & Dialogue Management

> **Last Updated:** January 26, 2026
> **Status:** Production Ready
> **Purpose:** Define conversation design, user intents, dialogue flows, and response templates

---

## 📋 Table of Contents
1. [Conversation Goals & Principles](#1-conversation-goals--principles)
2. [User Intents Taxonomy](#2-user-intents-taxonomy)
3. [Conversation State Machine](#3-conversation-state-machine)
4. [Question Sequence & Logic](#4-question-sequence--logic)
5. [Response Templates](#5-response-templates)
6. [Multi-turn Context Management](#6-multi-turn-context-management)
7. [Language & Cultural Considerations](#7-language--cultural-considerations)
8. [Error Handling & Fallbacks](#8-error-handling--fallbacks)
9. [Sample Conversations](#9-sample-conversations)
10. [Persona & Tone Guidelines](#10-persona--tone-guidelines)

---

## 1. Conversation Goals & Principles

### 1.1 Primary Goals

| Priority | Goal | Success Metric |
|----------|------|----------------|
| 🔴 P0 | **Determine eligibility** for FCR/Une Voiture/Voiture Populaire | User knows their regime within 5 questions |
| 🔴 P0 | **Calculate realistic budget** including all taxes & fees | Accurate total cost estimate (±5%) |
| 🟠 P1 | **Recommend suitable cars** matching criteria | 3-5 relevant recommendations per query |
| 🟠 P1 | **Explain procedures** clearly | User understands next steps |
| 🟡 P2 | **Compare options** (import vs local, EV vs thermal) | Clear decision framework |
| 🟡 P2 | **Build confidence** in the import process | User feels informed, not overwhelmed |

### 1.2 Design Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHATBOT DESIGN PRINCIPLES                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. PROGRESSIVE DISCLOSURE                                       │
│     → Don't overwhelm with all info at once                     │
│     → Reveal complexity gradually as needed                     │
│     → Start simple, go deep on request                          │
│                                                                  │
│  2. MOBILE-FIRST                                                 │
│     → 80% of Tunisian users will be on mobile                   │
│     → Keep responses concise                                    │
│     → Use bullet points and emojis for scannability             │
│                                                                  │
│  3. BILINGUAL FLUENCY                                           │
│     → Default to French, switch to Arabic seamlessly            │
│     → Understand Tunisian Derja input                           │
│     → Use familiar local terms (كرهبة, FCR, دوان)               │
│                                                                  │
│  4. TRUST THROUGH TRANSPARENCY                                  │
│     → Show calculation breakdowns                               │
│     → Cite sources (Loi de Finances 2026, etc.)                │
│     → Acknowledge limitations and uncertainties                 │
│                                                                  │
│  5. ACTIONABLE OUTCOMES                                          │
│     → Every conversation should end with clear next steps       │
│     → Provide links to car listings, documents, contacts        │
│     → Offer to save/share conversation summary                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 User Journey Map

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY STAGES                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  AWARENESS          CONSIDERATION         DECISION          ACTION        │
│  ─────────          ─────────────         ────────          ──────        │
│                                                                           │
│  "Can I even        "What car can        "This Golf        "How do I     │
│   import a car?"     I afford?"           looks good"       actually      │
│                                                              do it?"      │
│       │                  │                    │                 │         │
│       ▼                  ▼                    ▼                 ▼         │
│  ┌─────────┐        ┌─────────┐         ┌─────────┐       ┌─────────┐    │
│  │Eligibi- │        │Budget & │         │Compare &│       │Procedure│    │
│  │lity     │───────▶│Recommend│────────▶│Select   │──────▶│Guide    │    │
│  │Check    │        │Cars     │         │Car      │       │         │    │
│  └─────────┘        └─────────┘         └─────────┘       └─────────┘    │
│                                                                           │
│  CHATBOT FOCUS: ████████████████████████████████████░░░░░░░░░░░░░░░░░░   │
│                 [Main chatbot value]              [Handoff to human/docs] │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. User Intents Taxonomy

### 2.1 Primary Intents

| Intent ID | Intent Name | Example Utterances (FR) | Example Utterances (AR/Derja) |
|-----------|-------------|------------------------|-------------------------------|
| `eligibility_check` | Check FCR eligibility | "Suis-je éligible au FCR?", "Est-ce que je peux importer une voiture?" | "نجم نجيب كرهبة من برا؟", "عندي الحق في FCR؟" |
| `car_recommendation` | Get car suggestions | "Quelle voiture pour 80,000 DT?", "Suggère-moi des SUV" | "شنية الكرهبة اللي تجيني ب80 ألف؟" |
| `price_calculation` | Calculate total cost | "Combien coûtera cette Golf au total?", "Calcule-moi les taxes" | "قداش باش تكلفني هالكرهبة؟" |
| `procedure_info` | Learn about process | "Quels documents pour le FCR?", "C'est quoi les étapes?" | "شنية الوثائق اللي نحتاجهم؟" |
| `comparison` | Compare options | "Importer ou acheter local?", "Électrique ou essence?" | "نجيبها من برا ولا نشريها من هنا؟" |
| `general_question` | General information | "C'est quoi Une Voiture pour Chaque Famille?" | "شنيا سيارة لكل عائلة؟" |

### 2.2 Secondary Intents

| Intent ID | Intent Name | Example Utterances |
|-----------|-------------|-------------------|
| `budget_update` | Modify stated budget | "En fait mon budget est 70,000 pas 60,000" |
| `preference_change` | Change preferences | "Non, plutôt un SUV", "Je préfère diesel finalement" |
| `car_details` | Get details on specific car | "Dis-moi plus sur cette Peugeot 308" |
| `save_session` | Save conversation | "Envoie-moi un résumé par email" |
| `restart` | Start over | "On recommence", "Efface tout" |
| `human_handoff` | Speak to human | "Je veux parler à quelqu'un", "Agent humain" |

### 2.3 Out-of-Scope Intents

| Intent ID | Example | Handling |
|-----------|---------|----------|
| `off_topic` | "Quel temps fait-il?" | Polite redirect |
| `illegal_request` | "Comment éviter les taxes?" | Clear refusal + explanation |
| `competitor_inquiry` | "C'est mieux que [autre service]?" | Neutral response |
| `personal_advice` | "Est-ce un bon investissement?" | Disclaimer + factual info |

### 2.4 Intent Detection Patterns

```python
INTENT_PATTERNS = {
    "eligibility_check": {
        "keywords_fr": ["éligible", "eligible", "droit", "peut", "peux", "importer", "fcr", "une voiture"],
        "keywords_ar": ["نجم", "عندي الحق", "يمكنني", "اجيب"],
        "patterns": [
            r"(suis|est)-?(je|ce que je)?.*(éligible|eligible)",
            r"(puis|peux|peut)-?(je)?.*importer",
            r"(ai|a)-?(je)?.*droit"
        ]
    },
    "car_recommendation": {
        "keywords_fr": ["recommande", "suggère", "propose", "quelle voiture", "quel suv", "pour.*budget"],
        "keywords_ar": ["شنية", "وش", "اقترح", "نصحني"],
        "patterns": [
            r"(quelle|quel).*(voiture|suv|berline)",
            r"(recommande|suggère|propose).*voiture",
            r"avec.*(budget|dinars|tnd|dt)"
        ]
    },
    "price_calculation": {
        "keywords_fr": ["combien", "coût", "total", "taxes", "prix", "calcule"],
        "keywords_ar": ["قداش", "كم", "سوم"],
        "patterns": [
            r"combien.*(coûte|couter|total|taxes)",
            r"calcul.*(prix|coût|taxe)",
            r"(prix|coût).*(total|final)"
        ]
    },
    "procedure_info": {
        "keywords_fr": ["document", "papier", "étape", "procédure", "comment", "délai"],
        "keywords_ar": ["وثائق", "أوراق", "كيفاش", "خطوات"],
        "patterns": [
            r"(quel|quels).*(document|papier)",
            r"(étape|procédure|démarche)",
            r"comment.*(importer|faire|procéder)"
        ]
    },
    "comparison": {
        "keywords_fr": ["ou", "versus", "vs", "comparer", "différence", "mieux"],
        "keywords_ar": ["ولا", "أحسن", "الفرق"],
        "patterns": [
            r"(importer|import).*(ou|vs).*(local|tunisie)",
            r"(électrique|diesel).*(ou|vs).*(essence|thermique)",
            r"(mieux|meilleur).*(importer|acheter)"
        ]
    }
}
```

---

## 3. Conversation State Machine

### 3.1 High-Level Flow Diagram

```
                              ┌─────────────────┐
                              │     START       │
                              │   (Greeting)    │
                              └────────┬────────┘
                                       │
                                       ▼
                         ┌─────────────────────────┐
                         │   DETECT USER INTENT    │
                         │   (What do they want?)  │
                         └───────────┬─────────────┘
                                     │
           ┌─────────────┬───────────┼───────────┬─────────────┐
           │             │           │           │             │
           ▼             ▼           ▼           ▼             ▼
    ┌──────────┐  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ELIGIBILITY│  │ CAR REC  │ │  PRICE   │ │PROCEDURE │ │ GENERAL  │
    │  CHECK   │  │  FLOW    │ │   CALC   │ │   INFO   │ │   Q&A    │
    └────┬─────┘  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
         │             │           │           │             │
         └─────────────┴───────────┴───────────┴─────────────┘
                                   │
                                   ▼
                         ┌─────────────────────────┐
                         │   CONTEXT ENRICHMENT    │
                         │  (Collect missing info) │
                         └───────────┬─────────────┘
                                     │
                                     ▼
                         ┌─────────────────────────┐
                         │      RESPOND &          │
                         │    RECOMMEND/INFORM     │
                         └───────────┬─────────────┘
                                     │
                                     ▼
                         ┌─────────────────────────┐
                         │   FOLLOW-UP PROMPT      │
                         │   (More questions?)     │
                         └───────────┬─────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
             ┌──────────┐    ┌──────────────┐  ┌──────────┐
             │  NEW     │    │   REFINE     │  │   END    │
             │ QUESTION │    │   CRITERIA   │  │ SESSION  │
             └──────────┘    └──────────────┘  └──────────┘
```

### 3.2 Detailed State Definitions

```python
from enum import Enum
from typing import Optional, List, Dict

class ConversationState(Enum):
    """All possible conversation states"""

    # Entry states
    START = "start"
    GREETING = "greeting"

    # Eligibility flow
    ASKING_RESIDENCY = "asking_residency"
    ASKING_YEARS_ABROAD = "asking_years_abroad"
    ASKING_FAMILY_STATUS = "asking_family_status"
    ASKING_INCOME = "asking_income"
    ASKING_CURRENT_CAR = "asking_current_car"
    ELIGIBILITY_RESULT = "eligibility_result"

    # Budget & preferences flow
    ASKING_BUDGET = "asking_budget"
    ASKING_FUEL_PREF = "asking_fuel_pref"
    ASKING_BODY_PREF = "asking_body_pref"
    ASKING_PAYMENT_METHOD = "asking_payment_method"
    ASKING_LOCATION = "asking_location"

    # Recommendation flow
    SHOWING_RECOMMENDATIONS = "showing_recommendations"
    CAR_DETAILS = "car_details"
    PRICE_BREAKDOWN = "price_breakdown"
    COMPARISON_MODE = "comparison_mode"

    # Procedure flow
    PROCEDURE_OVERVIEW = "procedure_overview"
    DOCUMENTS_LIST = "documents_list"
    TIMELINE_INFO = "timeline_info"

    # Terminal states
    SUMMARY = "summary"
    HANDOFF = "handoff"
    END = "end"

    # Error states
    CLARIFICATION_NEEDED = "clarification_needed"
    OUT_OF_SCOPE = "out_of_scope"

class ConversationContext:
    """Maintains context across conversation turns"""

    def __init__(self):
        self.state: ConversationState = ConversationState.START
        self.turn_count: int = 0

        # User profile (progressive collection)
        self.residency: Optional[str] = None  # "tunisia" | "abroad"
        self.years_abroad: Optional[int] = None
        self.country_abroad: Optional[str] = None
        self.family_status: Optional[str] = None
        self.monthly_income: Optional[float] = None
        self.spouse_income: Optional[float] = None
        self.owns_car: Optional[bool] = None
        self.car_age: Optional[int] = None
        self.used_voiture_populaire: Optional[bool] = None

        # Budget & preferences
        self.budget_tnd: Optional[float] = None
        self.fuel_preference: Optional[str] = None
        self.body_preference: Optional[str] = None
        self.brand_preferences: List[str] = []
        self.brand_exclusions: List[str] = []
        self.needs_automatic: bool = False
        self.governorate: Optional[str] = None
        self.has_tre_contact: Optional[bool] = None

        # Eligibility results
        self.eligible_regimes: List[str] = []
        self.best_regime: Optional[str] = None

        # Recommendation state
        self.shown_cars: List[str] = []
        self.selected_car_id: Optional[str] = None
        self.comparison_cars: List[str] = []

        # Conversation history
        self.history: List[Dict] = []

        # Language preference
        self.language: str = "fr"  # "fr" | "ar" | "derja"

    def get_missing_for_eligibility(self) -> List[str]:
        """Return list of missing fields needed for eligibility check"""
        missing = []
        if self.residency is None:
            missing.append("residency")
        if self.residency == "abroad" and self.years_abroad is None:
            missing.append("years_abroad")
        if self.residency == "tunisia":
            if self.monthly_income is None:
                missing.append("monthly_income")
            if self.family_status is None:
                missing.append("family_status")
            if self.owns_car is None:
                missing.append("owns_car")
        return missing

    def get_missing_for_recommendation(self) -> List[str]:
        """Return list of missing fields for car recommendation"""
        missing = []
        if self.budget_tnd is None:
            missing.append("budget")
        # Fuel and body are optional but helpful
        return missing

    def can_determine_eligibility(self) -> bool:
        """Check if we have enough info to determine eligibility"""
        return len(self.get_missing_for_eligibility()) == 0

    def can_recommend_cars(self) -> bool:
        """Check if we have enough info to recommend cars"""
        return (
            self.can_determine_eligibility() and
            len(self.get_missing_for_recommendation()) == 0
        )
```

### 3.3 State Transition Rules

```python
STATE_TRANSITIONS = {
    ConversationState.START: {
        "greeting_detected": ConversationState.GREETING,
        "eligibility_intent": ConversationState.ASKING_RESIDENCY,
        "car_rec_intent": ConversationState.ASKING_RESIDENCY,  # Need eligibility first
        "price_calc_intent": ConversationState.ASKING_RESIDENCY,
        "procedure_intent": ConversationState.PROCEDURE_OVERVIEW,
        "general_question": ConversationState.GREETING  # Answer then prompt
    },

    ConversationState.GREETING: {
        "has_question": "route_to_intent",
        "no_question": ConversationState.ASKING_RESIDENCY
    },

    ConversationState.ASKING_RESIDENCY: {
        "abroad": ConversationState.ASKING_YEARS_ABROAD,
        "tunisia": ConversationState.ASKING_FAMILY_STATUS,
        "unclear": ConversationState.CLARIFICATION_NEEDED
    },

    ConversationState.ASKING_YEARS_ABROAD: {
        "sufficient_years": ConversationState.ASKING_BUDGET,  # FCR TRE likely eligible
        "insufficient_years": ConversationState.ELIGIBILITY_RESULT,  # Not eligible for TRE
        "unclear": ConversationState.CLARIFICATION_NEEDED
    },

    ConversationState.ASKING_FAMILY_STATUS: {
        "answered": ConversationState.ASKING_INCOME,
        "skip": ConversationState.ASKING_INCOME
    },

    ConversationState.ASKING_INCOME: {
        "answered": ConversationState.ASKING_CURRENT_CAR,
        "skip": ConversationState.ASKING_CURRENT_CAR,
        "too_high": ConversationState.ELIGIBILITY_RESULT  # Early exit - not eligible
    },

    ConversationState.ASKING_CURRENT_CAR: {
        "no_car": ConversationState.ELIGIBILITY_RESULT,
        "old_car": ConversationState.ELIGIBILITY_RESULT,
        "recent_car": ConversationState.ELIGIBILITY_RESULT  # Not eligible for Une Voiture
    },

    ConversationState.ELIGIBILITY_RESULT: {
        "eligible_any": ConversationState.ASKING_BUDGET,
        "not_eligible": ConversationState.SUMMARY,  # Show alternatives
        "wants_details": ConversationState.PROCEDURE_OVERVIEW
    },

    ConversationState.ASKING_BUDGET: {
        "answered": ConversationState.ASKING_FUEL_PREF,
        "wants_help": ConversationState.ASKING_BUDGET  # Explain budget ranges
    },

    ConversationState.ASKING_FUEL_PREF: {
        "answered": ConversationState.ASKING_BODY_PREF,
        "skip": ConversationState.ASKING_BODY_PREF,
        "electric": ConversationState.ASKING_LOCATION  # Need to check EV feasibility
    },

    ConversationState.ASKING_BODY_PREF: {
        "answered": ConversationState.SHOWING_RECOMMENDATIONS,
        "skip": ConversationState.SHOWING_RECOMMENDATIONS
    },

    ConversationState.SHOWING_RECOMMENDATIONS: {
        "select_car": ConversationState.CAR_DETAILS,
        "refine_search": ConversationState.ASKING_FUEL_PREF,
        "compare": ConversationState.COMPARISON_MODE,
        "new_search": ConversationState.ASKING_BUDGET,
        "satisfied": ConversationState.PROCEDURE_OVERVIEW
    },

    ConversationState.CAR_DETAILS: {
        "show_price": ConversationState.PRICE_BREAKDOWN,
        "back_to_list": ConversationState.SHOWING_RECOMMENDATIONS,
        "procedure": ConversationState.PROCEDURE_OVERVIEW
    },

    ConversationState.PRICE_BREAKDOWN: {
        "proceed": ConversationState.PROCEDURE_OVERVIEW,
        "different_car": ConversationState.SHOWING_RECOMMENDATIONS,
        "compare_local": ConversationState.COMPARISON_MODE
    },

    ConversationState.PROCEDURE_OVERVIEW: {
        "documents": ConversationState.DOCUMENTS_LIST,
        "timeline": ConversationState.TIMELINE_INFO,
        "done": ConversationState.SUMMARY
    },

    ConversationState.SUMMARY: {
        "new_question": "route_to_intent",
        "save": ConversationState.END,
        "done": ConversationState.END
    }
}
```

---

## 4. Question Sequence & Logic

### 4.1 Core Question Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    QUESTION SEQUENCE FLOWCHART                           │
└─────────────────────────────────────────────────────────────────────────┘

PHASE 1: ELIGIBILITY DETERMINATION (Required)
═══════════════════════════════════════════════

Q1: RESIDENCY
┌─────────────────────────────────────────────────────────────────────────┐
│ "Bonjour! 🚗 Pour vous aider à trouver la meilleure option,            │
│  habitez-vous actuellement en Tunisie ou à l'étranger?"                │
│                                                                         │
│  [🇹🇳 En Tunisie]     [🌍 À l'étranger]                                 │
└─────────────────────────────────────────────────────────────────────────┘
         │                              │
         │                              ▼
         │               Q1b: YEARS ABROAD
         │               ┌─────────────────────────────────┐
         │               │ "Depuis combien de temps        │
         │               │  habitez-vous à l'étranger?"    │
         │               │                                 │
         │               │  [< 2 ans] [2-5 ans]           │
         │               │  [5-10 ans] [> 10 ans]         │
         │               └─────────────────────────────────┘
         │                              │
         ▼                              │
Q2: FAMILY STATUS                       │
┌──────────────────────────┐            │
│ "Quelle est votre        │            │
│  situation familiale?"   │            │
│                          │            │
│  [Célibataire]           │            │
│  [Marié(e) sans enfants] │            │
│  [Marié(e) avec enfants] │            │
│  [Parent isolé]          │            │
└──────────────────────────┘            │
         │                              │
         ▼                              │
Q3: INCOME (Tunisia residents only)     │
┌──────────────────────────┐            │
│ "Quel est votre revenu   │            │
│  mensuel BRUT?"          │            │
│  (ou du couple si marié) │            │
│                          │◄───────────┘
│  [< 3,000 TND]           │    (TRE skip to Q5)
│  [3,000-5,000 TND]       │
│  [5,000-7,500 TND]       │
│  [> 7,500 TND]           │
│  [Je préfère ne pas dire]│
└──────────────────────────┘
         │
         ▼
Q4: CURRENT CAR OWNERSHIP
┌──────────────────────────────────────────────────────────────┐
│ "Possédez-vous actuellement une voiture?"                    │
│                                                              │
│  [Non, pas de voiture]                                       │
│  [Oui, de plus de 8 ans]                                     │
│  [Oui, de moins de 8 ans] ──► ⚠️ Not eligible for Une Voiture│
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                 📊 ELIGIBILITY CALCULATION                    │
│                                                              │
│  Based on answers, determine:                                │
│  • FCR TRE eligible?                                         │
│  • FCR Famille (Une Voiture) eligible?                       │
│  • Voiture Populaire eligible?                               │
│  • Regular market only?                                      │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
SHOW ELIGIBILITY RESULT
═══════════════════════


PHASE 2: BUDGET & PREFERENCES (After eligibility confirmed)
═══════════════════════════════════════════════════════════════

Q5: BUDGET
┌──────────────────────────────────────────────────────────────┐
│ "Quel est votre budget TOTAL en dinars tunisiens?"          │
│  (incluant tous les frais: voiture + transport + taxes)     │
│                                                              │
│  💡 Avec votre régime {regime}, voici les fourchettes:       │
│     • 40-60k TND → voitures citadines                       │
│     • 60-90k TND → berlines, petits SUV                     │
│     • 90-120k TND → SUV, berlines premium                   │
│     • > 120k TND → premium, électriques                     │
│                                                              │
│  [Entrez un montant] ou [Fourchette]                        │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
Q6: PAYMENT METHOD (Tunisia residents for import)
┌──────────────────────────────────────────────────────────────┐
│ "Comment comptez-vous payer la voiture en Europe?"          │
│                                                              │
│  [J'ai de la famille TRE qui peut m'aider] ✅ Recommended    │
│  [Je vais utiliser mon allocation touristique]              │
│  [Je vais demander une autorisation BCT]                    │
│  [Je ne sais pas encore] ──► Show explanation               │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
Q7: FUEL PREFERENCE
┌──────────────────────────────────────────────────────────────┐
│ "Quel type de carburant préférez-vous?"                     │
│                                                              │
│  [🔥 Essence]                                                │
│  [⛽ Diesel]                                                 │
│  [🔋 Électrique] ──► 💡 "Excellent choix! 0% taxes!"        │
│  [⚡ Hybride rechargeable] ──► 💡 "0% taxes aussi!"         │
│  [🚗 Pas de préférence]                                     │
└──────────────────────────────────────────────────────────────┘
         │
         │ (If EV/PHEV selected)
         ▼
Q7b: EV FEASIBILITY CHECK
┌──────────────────────────────────────────────────────────────┐
│ "Pour un véhicule électrique, quelques questions:"          │
│                                                              │
│ Q7b-1: "Avez-vous un parking privé/garage?"                 │
│        [Oui] ✅ [Non] ⚠️                                     │
│                                                              │
│ Q7b-2: "Combien de km parcourez-vous par jour?"             │
│        [< 50 km] ✅ [50-100 km] ✅ [> 100 km] ⚠️             │
│                                                              │
│ Q7b-3: "Faites-vous souvent des trajets interurbains?"      │
│        [Rarement] ✅ [Parfois] [Souvent] ⚠️                  │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
Q8: BODY TYPE PREFERENCE
┌──────────────────────────────────────────────────────────────┐
│ "Quel type de véhicule recherchez-vous?"                    │
│                                                              │
│  [🚙 Citadine] - Petite, économique, ville                  │
│  [🚗 Berline] - Familiale, confortable                      │
│  [🚐 SUV/Crossover] - Spacieux, polyvalent                  │
│  [🚐 Monospace] - Famille nombreuse                         │
│  [🚙 Break] - Coffre spacieux                               │
│  [❔ Pas de préférence]                                     │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
Q9: LOCATION (Optional but helpful)
┌──────────────────────────────────────────────────────────────┐
│ "Dans quel gouvernorat habitez-vous?"                       │
│  (Pour évaluer l'infrastructure de recharge si électrique)  │
│                                                              │
│  [Tunis/Grand Tunis] [Sousse] [Sfax] [Nabeul]              │
│  [Autre région] [Je préfère ne pas dire]                    │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
READY TO RECOMMEND CARS
═══════════════════════
```

### 4.2 Question Objects Definition

```python
QUESTIONS = {
    "residency": {
        "id": "residency",
        "phase": "eligibility",
        "required": True,
        "text": {
            "fr": "Habitez-vous actuellement en Tunisie ou à l'étranger?",
            "ar": "هل تسكن حاليا في تونس أو في الخارج؟",
            "derja": "وين ساكن توا؟ في تونس ولا في الخارج؟"
        },
        "options": [
            {"value": "tunisia", "label_fr": "🇹🇳 En Tunisie", "label_ar": "في تونس"},
            {"value": "abroad", "label_fr": "🌍 À l'étranger", "label_ar": "في الخارج"}
        ],
        "skip_allowed": False,
        "follow_up": {
            "abroad": "years_abroad",
            "tunisia": "family_status"
        }
    },

    "years_abroad": {
        "id": "years_abroad",
        "phase": "eligibility",
        "required": True,
        "condition": "context.residency == 'abroad'",
        "text": {
            "fr": "Depuis combien de temps habitez-vous à l'étranger?",
            "ar": "منذ كم سنة تسكن في الخارج؟"
        },
        "options": [
            {"value": 1, "label_fr": "Moins de 2 ans", "eligible_fcr_tre": False},
            {"value": 3, "label_fr": "2-5 ans", "eligible_fcr_tre": True},
            {"value": 7, "label_fr": "5-10 ans", "eligible_fcr_tre": True},
            {"value": 12, "label_fr": "Plus de 10 ans", "eligible_fcr_tre": True}
        ],
        "validation": {
            "min": 0,
            "max": 50,
            "type": "integer"
        }
    },

    "family_status": {
        "id": "family_status",
        "phase": "eligibility",
        "required": True,
        "condition": "context.residency == 'tunisia'",
        "text": {
            "fr": "Quelle est votre situation familiale?",
            "ar": "ما هي حالتك العائلية؟"
        },
        "options": [
            {"value": "single", "label_fr": "Célibataire", "smig_multiplier": 10},
            {"value": "married_no_kids", "label_fr": "Marié(e) sans enfants", "smig_multiplier": 14},
            {"value": "married_with_kids", "label_fr": "Marié(e) avec enfants", "smig_multiplier": 14},
            {"value": "single_parent", "label_fr": "Parent isolé", "smig_multiplier": 10}
        ]
    },

    "income": {
        "id": "income",
        "phase": "eligibility",
        "required": False,  # Can skip but affects recommendations
        "condition": "context.residency == 'tunisia'",
        "text": {
            "fr": "Quel est votre revenu mensuel BRUT? (ou celui du couple si marié)",
            "ar": "ما هو دخلك الشهري الخام؟"
        },
        "options": [
            {"value": 2500, "label_fr": "Moins de 3,000 TND", "eligible_fcr_famille": True},
            {"value": 4000, "label_fr": "3,000 - 5,000 TND", "eligible_fcr_famille": True},
            {"value": 6000, "label_fr": "5,000 - 7,500 TND", "eligible_fcr_famille": "depends"},
            {"value": 9000, "label_fr": "Plus de 7,500 TND", "eligible_fcr_famille": False},
            {"value": None, "label_fr": "Je préfère ne pas dire", "eligible_fcr_famille": "unknown"}
        ],
        "help_text": {
            "fr": "Le plafond pour 'Une Voiture pour Chaque Famille' est ~5,280 TND (célibataire) ou ~7,400 TND (couple).",
            "ar": "الحد الأقصى للبرنامج هو ~5,280 دينار (أعزب) أو ~7,400 دينار (متزوج)"
        }
    },

    "current_car": {
        "id": "current_car",
        "phase": "eligibility",
        "required": True,
        "text": {
            "fr": "Possédez-vous actuellement une voiture?",
            "ar": "هل تملك سيارة حاليا؟"
        },
        "options": [
            {"value": "none", "label_fr": "Non, pas de voiture", "eligible": True},
            {"value": "old", "label_fr": "Oui, de plus de 8 ans", "eligible": True},
            {"value": "recent", "label_fr": "Oui, de moins de 8 ans", "eligible": False}
        ],
        "warning_for": {
            "recent": "⚠️ Avec une voiture de moins de 8 ans, vous n'êtes pas éligible à 'Une Voiture pour Chaque Famille'."
        }
    },

    "budget": {
        "id": "budget",
        "phase": "preferences",
        "required": True,
        "text": {
            "fr": "Quel est votre budget TOTAL en dinars tunisiens?",
            "ar": "ما هي ميزانيتك الإجمالية بالدينار التونسي؟"
        },
        "type": "number",
        "validation": {
            "min": 20000,
            "max": 500000,
            "step": 5000
        },
        "suggestions": [40000, 60000, 80000, 100000, 120000, 150000],
        "help_text": {
            "fr": "Ce montant doit inclure: prix de la voiture + transport + taxes + immatriculation"
        }
    },

    "payment_method": {
        "id": "payment_method",
        "phase": "preferences",
        "required": True,
        "condition": "context.residency == 'tunisia' AND context.best_regime IN ['fcr_famille']",
        "text": {
            "fr": "Comment comptez-vous payer la voiture en Europe?",
            "ar": "كيف ستدفع ثمن السيارة في أوروبا؟"
        },
        "options": [
            {
                "value": "tre_help",
                "label_fr": "J'ai de la famille TRE qui peut m'aider",
                "recommended": True,
                "follow_up": "tre_max_amount"
            },
            {
                "value": "allocation",
                "label_fr": "Je vais utiliser mon allocation touristique (~3,500€ max)",
                "warning": "Montant limité"
            },
            {
                "value": "bct",
                "label_fr": "Je vais demander une autorisation BCT",
                "warning": "Processus long"
            },
            {
                "value": "unknown",
                "label_fr": "Je ne sais pas encore",
                "trigger": "payment_explanation"
            }
        ]
    },

    "fuel_preference": {
        "id": "fuel_preference",
        "phase": "preferences",
        "required": False,
        "text": {
            "fr": "Quel type de carburant préférez-vous?",
            "ar": "ما نوع الوقود الذي تفضله؟"
        },
        "options": [
            {"value": "essence", "label_fr": "🔥 Essence", "icon": "⛽"},
            {"value": "diesel", "label_fr": "⛽ Diesel", "icon": "⛽"},
            {"value": "electric", "label_fr": "🔋 Électrique", "highlight": "💡 0% taxes!", "icon": "🔋"},
            {"value": "hybrid_rechargeable", "label_fr": "⚡ Hybride rechargeable", "highlight": "💡 0% taxes!", "icon": "⚡"},
            {"value": "hybrid", "label_fr": "🔄 Hybride non-rechargeable", "icon": "🔄"},
            {"value": "any", "label_fr": "🚗 Pas de préférence", "icon": "🚗"}
        ],
        "ev_followup": ["has_parking", "daily_km", "intercity_travel"]
    },

    "body_preference": {
        "id": "body_preference",
        "phase": "preferences",
        "required": False,
        "text": {
            "fr": "Quel type de véhicule recherchez-vous?",
            "ar": "ما نوع السيارة التي تبحث عنها؟"
        },
        "options": [
            {"value": "citadine", "label_fr": "🚙 Citadine", "desc": "Petite, économique"},
            {"value": "berline", "label_fr": "🚗 Berline", "desc": "Familiale, confortable"},
            {"value": "suv", "label_fr": "🚐 SUV/Crossover", "desc": "Spacieux, polyvalent"},
            {"value": "monospace", "label_fr": "🚐 Monospace", "desc": "Famille nombreuse"},
            {"value": "break", "label_fr": "🚙 Break", "desc": "Grand coffre"},
            {"value": "any", "label_fr": "❔ Pas de préférence", "desc": ""}
        ]
    },

    "governorate": {
        "id": "governorate",
        "phase": "preferences",
        "required": False,
        "text": {
            "fr": "Dans quel gouvernorat habitez-vous?",
            "ar": "في أي ولاية تسكن؟"
        },
        "options": [
            {"value": "tunis", "label_fr": "Tunis / Grand Tunis", "ev_friendly": True},
            {"value": "sousse", "label_fr": "Sousse", "ev_friendly": True},
            {"value": "sfax", "label_fr": "Sfax", "ev_friendly": True},
            {"value": "nabeul", "label_fr": "Nabeul", "ev_friendly": True},
            {"value": "other_coast", "label_fr": "Autre (côte)", "ev_friendly": "partial"},
            {"value": "interior", "label_fr": "Intérieur du pays", "ev_friendly": False},
            {"value": "skip", "label_fr": "Je préfère ne pas dire", "ev_friendly": "unknown"}
        ],
        "purpose": "EV charging infrastructure assessment"
    }
}
```

### 4.3 Adaptive Question Logic

```python
def get_next_question(context: ConversationContext) -> Optional[dict]:
    """
    Determine the next question to ask based on current context
    Uses smart ordering to minimize questions while maximizing value
    """

    # Phase 1: Eligibility (must complete)
    if context.residency is None:
        return QUESTIONS["residency"]

    if context.residency == "abroad":
        if context.years_abroad is None:
            return QUESTIONS["years_abroad"]
        # TRE path: Skip income/family questions, go to budget
        if context.budget_tnd is None:
            return QUESTIONS["budget"]

    if context.residency == "tunisia":
        if context.family_status is None:
            return QUESTIONS["family_status"]

        if context.monthly_income is None:
            return QUESTIONS["income"]

        if context.owns_car is None:
            return QUESTIONS["current_car"]

        # Check eligibility before continuing
        eligibility = calculate_eligibility(context)
        if not any(eligibility.values()):
            # Not eligible for any program - can still show market options
            context.eligible_regimes = []
            return None  # Proceed to eligibility result

        if context.budget_tnd is None:
            return QUESTIONS["budget"]

        # Payment method for Tunisia residents importing
        if context.has_tre_contact is None and context.best_regime in ["fcr_famille"]:
            return QUESTIONS["payment_method"]

    # Phase 2: Preferences (can be skipped)
    if context.budget_tnd is not None:
        if context.fuel_preference is None:
            return QUESTIONS["fuel_preference"]

        # EV follow-up questions
        if context.fuel_preference in ["electric", "hybrid_rechargeable"]:
            if context.governorate is None:
                return QUESTIONS["governorate"]

        if context.body_preference is None:
            return QUESTIONS["body_preference"]

    # All questions answered
    return None

def should_skip_question(question_id: str, context: ConversationContext) -> bool:
    """
    Determine if a question should be skipped based on context
    """
    skip_rules = {
        "years_abroad": context.residency != "abroad",
        "family_status": context.residency != "tunisia",
        "income": context.residency != "tunisia",
        "current_car": context.residency != "tunisia",
        "payment_method": context.residency != "tunisia" or context.best_regime == "fcr_tre",
        "governorate": context.fuel_preference not in ["electric", "hybrid_rechargeable"]
    }
    return skip_rules.get(question_id, False)
```

---

## 5. Response Templates

### 5.1 Greeting Templates

```python
GREETINGS = {
    "initial": {
        "fr": """
🚗 **Bienvenue sur l'Assistant Voiture Tunisie!**

Je suis là pour vous aider à:
• Vérifier votre éligibilité aux programmes FCR
• Trouver la voiture idéale selon votre budget
• Calculer le coût total d'importation
• Vous guider dans les démarches

**Commençons!** Où habitez-vous actuellement?

🇹🇳 [En Tunisie]     🌍 [À l'étranger]
        """,
        "ar": """
🚗 **مرحبا بك في مساعد السيارات تونس!**

أنا هنا لمساعدتك في:
• التحقق من أهليتك لبرامج FCR
• إيجاد السيارة المثالية حسب ميزانيتك
• حساب التكلفة الإجمالية للاستيراد
• إرشادك في الإجراءات

**لنبدأ!** أين تسكن حاليا؟

🇹🇳 [في تونس]     🌍 [في الخارج]
        """
    },

    "returning_user": {
        "fr": """
👋 **Re-bonjour!**

Je vois que vous étiez intéressé par {last_car_model}.
Voulez-vous continuer ou commencer une nouvelle recherche?

[Continuer]  [Nouvelle recherche]
        """
    }
}
```

### 5.2 Eligibility Result Templates

```python
ELIGIBILITY_TEMPLATES = {
    "fcr_tre_eligible": {
        "fr": """
🎉 **Excellente nouvelle!** Vous êtes éligible au **FCR TRE**.

**Ce que ça signifie pour vous:**
• Vous ne payez que **25%** des droits normaux
• Véhicules jusqu'à **5 ans** d'âge
• Moteur: essence ≤2000cc, diesel ≤2500cc
• Électrique/Hybride: aucune limite de cylindrée

📊 **Avec votre budget de {budget:,.0f} TND:**
• Vous pouvez viser des voitures jusqu'à **~{max_eur:,.0f}€** en Europe
• Économie estimée vs import normal: **{savings:,.0f} TND**

🔋 **Astuce:** Les véhicules électriques bénéficient de 0% de taxes!

Passons aux préférences pour vous recommander des voitures.
        """,
        "ar": """
🎉 **أخبار ممتازة!** أنت مؤهل لـ **FCR TRE**.

**ماذا يعني هذا لك:**
• تدفع فقط **25%** من الرسوم العادية
• سيارات حتى **5 سنوات** عمر
• المحرك: بنزين ≤2000cc، ديزل ≤2500cc

📊 **بميزانيتك {budget:,.0f} دينار:**
• يمكنك استهداف سيارات حتى **~{max_eur:,.0f}€** في أوروبا
        """
    },

    "fcr_famille_eligible": {
        "fr": """
🎉 **Bonne nouvelle!** Vous êtes éligible à **"Une Voiture pour Chaque Famille"** (Article 55).

**Ce que ça signifie pour vous:**
• Taxe de consommation: **10%** (au lieu de 30-88%)
• TVA: **7%** (au lieu de 19%)
• Véhicules jusqu'à **8 ans** d'âge

⚡ **BONUS Électrique/Hybride rechargeable:**
• Taxe de consommation: **0%** (exonéré!)
• TVA: **7%**
• Cela peut représenter **30-40%** d'économie supplémentaire!

📊 **Avec votre budget de {budget:,.0f} TND:**
• Thermique: voitures jusqu'à **~{max_thermal:,.0f}€**
• Électrique: voitures jusqu'à **~{max_ev:,.0f}€**

⚠️ **Important:** Ce bénéfice est **unique** (une seule fois par famille).
        """,
        "ar": """
🎉 **خبر سار!** أنت مؤهل لـ **"سيارة لكل عائلة"** (المادة 55).

**ماذا يعني هذا لك:**
• ضريبة الاستهلاك: **10%** (بدلا من 30-88%)
• الأداء على القيمة المضافة: **7%** (بدلا من 19%)
• سيارات حتى **8 سنوات** عمر

⚡ **مكافأة السيارات الكهربائية:**
• ضريبة الاستهلاك: **0%** (معفاة!)
        """
    },

    "voiture_populaire_eligible": {
        "fr": """
✅ Vous pourriez être éligible à la **Voiture Populaire**.

**Caractéristiques:**
• Voitures neuves subventionnées
• Prix: 29,000 - 35,000 TND
• Modèles: ≤4 CV, ≤1200cc

⚠️ **Attention:** Liste d'attente longue (1-5 ans selon le modèle).

**Recommandation:** Envisagez aussi "Une Voiture pour Chaque Famille"
qui offre plus de choix avec des délais plus courts.

Voulez-vous explorer les deux options?
        """
    },

    "not_eligible_any": {
        "fr": """
😔 **Malheureusement**, vous n'êtes pas éligible aux programmes d'avantages fiscaux.

**Raisons:**
{reasons}

**Mais ne vous découragez pas!** Voici vos options:

1. **Marché local (concessionnaires)**
   • Pas de démarches d'import
   • Garantie et service après-vente
   • Prix fixes, négociables

2. **Occasion en Tunisie**
   • Site automobile.tn
   • Prix plus accessibles
   • Pas de taxes d'import

3. **Attendre un changement de situation**
   • Revenus qui baissent
   • Voiture actuelle vieillit

Souhaitez-vous explorer les options du marché local?
        """,
        "ar": """
😔 **للأسف**، أنت غير مؤهل لبرامج الامتيازات الجبائية.

**الأسباب:**
{reasons}

**لكن لا تيأس!** إليك خياراتك:

1. **السوق المحلي (الوكلاء)**
2. **سيارات مستعملة في تونس**
3. **انتظار تغيير وضعيتك**
        """
    },

    "partial_eligibility": {
        "fr": """
📊 **Votre situation d'éligibilité:**

{eligibility_table}

**Recommandation:** {recommendation}

Voulez-vous continuer avec {best_regime}?
        """
    }
}
```

### 5.3 Car Recommendation Templates

```python
RECOMMENDATION_TEMPLATES = {
    "intro": {
        "fr": """
📊 **Voici mes recommandations pour vous:**

**Profil:** {regime} | Budget: {budget:,.0f} TND | Max voiture: ~{max_eur:,.0f}€
**Préférences:** {fuel_pref} | {body_pref}

───────────────────────────────
        """
    },

    "car_card": {
        "fr": """
**{rank}. {brand} {model}** ({year}) {flag}

💰 **Prix:** {price_eur:,.0f}€ → Total: **{total_tnd:,.0f} TND**
🔧 Moteur: {engine_cc}cc {fuel_type} | {cv_din} ch
📍 Origine: {country} ({city})
📏 Kilométrage: {mileage:,} km
⭐ Score: **{score}/100** - {strength}

🔗 [Voir l'annonce]({url})

───────────────────────────────
        """,
        "ar": """
**{rank}. {brand} {model}** ({year}) {flag}

💰 **السعر:** {price_eur:,.0f}€ → الإجمالي: **{total_tnd:,.0f} دينار**
🔧 المحرك: {engine_cc}cc {fuel_type}
📏 المسافة: {mileage:,} كم

───────────────────────────────
        """
    },

    "car_card_compact": {
        "fr": """
{rank}. **{brand} {model}** ({year}) - {price_eur:,.0f}€ → **{total_tnd:,.0f} TND** | {mileage:,} km
        """
    },

    "no_results": {
        "fr": """
😕 **Aucun véhicule ne correspond exactement à vos critères.**

**Suggestions:**
• Augmenter le budget (actuellement {budget:,.0f} TND)
• Accepter une voiture plus ancienne
• Élargir les préférences de carburant/carrosserie

**Critères les plus restrictifs:**
{restrictive_criteria}

[Modifier le budget]  [Modifier les préférences]  [Voir des alternatives]
        """
    },

    "few_results": {
        "fr": """
📋 J'ai trouvé **{count} véhicule(s)** correspondant à vos critères.

💡 **Conseil:** Pour plus de choix, vous pourriez:
• Augmenter légèrement le budget
• Accepter un kilométrage plus élevé

{car_list}
        """
    }
}
```

### 5.4 Price Breakdown Templates

```python
PRICE_BREAKDOWN_TEMPLATES = {
    "detailed": {
        "fr": """
📊 **Détail du coût pour: {brand} {model} ({year})**

**1. Prix d'achat en Europe**
   • Prix affiché: **{car_price_eur:,.0f}€**

**2. Frais de transport**
   • Shipping ({origin} → Tunisie): ~{shipping_eur:,.0f}€
   • Assurance transport: ~{insurance_eur:,.0f}€
   • **Sous-total CIF:** {cif_eur:,.0f}€ ≈ **{cif_tnd:,.0f} TND**

**3. Taxes et droits ({regime})**
   • Droits de douane: {dd_tnd:,.0f} TND
   • Taxe de consommation ({dc_rate}%): {dc_tnd:,.0f} TND
   • TVA ({tva_rate}%): {tva_tnd:,.0f} TND
   • Taxe formalité (3%): {tfd_tnd:,.0f} TND
   • **Sous-total taxes:** {total_taxes_tnd:,.0f} TND

**4. Frais administratifs**
   • Homologation: ~{homologation_tnd:,.0f} TND
   • Immatriculation: ~{registration_tnd:,.0f} TND
   • **Sous-total admin:** ~{admin_total_tnd:,.0f} TND

═══════════════════════════════════════
**💰 COÛT TOTAL ESTIMÉ: {total_tnd:,.0f} TND**
═══════════════════════════════════════

{comparison_note}
        """,
        "ar": """
📊 **تفاصيل التكلفة لـ: {brand} {model} ({year})**

**1. سعر الشراء في أوروبا:** {car_price_eur:,.0f}€

**2. مصاريف النقل:** {cif_tnd:,.0f} دينار

**3. الضرائب والرسوم ({regime}):** {total_taxes_tnd:,.0f} دينار

═══════════════════════════════════════
**💰 التكلفة الإجمالية المقدرة: {total_tnd:,.0f} دينار**
═══════════════════════════════════════
        """
    },

    "comparison": {
        "fr": """
📊 **Comparaison: {model}**

| Option | Prix Final | Économie |
|--------|-----------|----------|
| 🇹🇳 Concessionnaire | {local_price:,.0f} TND | - |
| 🇪🇺 Import {regime} | {import_price:,.0f} TND | **{savings:,.0f} TND** ({savings_pct:.0f}%) |

**{recommendation}**
        """
    },

    "ev_vs_thermal": {
        "fr": """
⚡ **Comparaison: Électrique vs Thermique**

| Critère | 🔋 Électrique | ⛽ Thermique |
|---------|--------------|-------------|
| **Prix max (€)** | {ev_max_eur:,.0f}€ | {thermal_max_eur:,.0f}€ |
| **Taxes** | 7% (TVA seule) | 17%+ |
| **Carburant/an** | ~{ev_fuel_cost:,.0f} TND | ~{thermal_fuel_cost:,.0f} TND |
| **Vignette** | -50% | Plein tarif |
| **Entretien** | -50% | Normal |

**Sur 5 ans, économie électrique:** ~{total_ev_savings:,.0f} TND

**Verdict:** {ev_recommendation}
        """
    }
}
```

### 5.5 Procedure Templates

```python
PROCEDURE_TEMPLATES = {
    "fcr_tre_steps": {
        "fr": """
📋 **Procédure FCR TRE - Les étapes**

**AVANT LE DÉPART (en Europe)**
1. ✅ Acheter la voiture (max 5 ans, cc conforme)
2. ✅ Obtenir: carte grise, certificat de conformité, contrôle technique
3. ✅ Organiser le transport (ferry ou RoRo)
4. ✅ Importer les devises en Tunisie (preuve bancaire)

**À L'ARRIVÉE EN TUNISIE**
5. ✅ Dédouanement au port (déclaration en douane)
6. ✅ Choisir: Franchise Totale (RS) ou Partielle (TN)
7. ✅ Payer les droits (si franchise partielle: 25%)
8. ✅ Obtenir permis de circulation temporaire

**POST-IMPORT (sous 3 mois)**
9. ✅ Visite technique (homologation ATTT)
10. ✅ Assurance tous risques
11. ✅ Immatriculation définitive (carte grise)

**⏱️ Délai total estimé:** 5-13 semaines

📄 [Voir la liste des documents]  ⏱️ [Voir le calendrier détaillé]
        """
    },

    "fcr_famille_steps": {
        "fr": """
📋 **Procédure "Une Voiture pour Chaque Famille" - Les étapes**

**⚠️ IMPORTANT:** Décret d'application en attente (prévu sous 6 mois)

**ÉTAPES PRÉVISIONNELLES**

1. **Vérifier l'éligibilité**
   • Revenu ≤ 10/14× SMIG
   • Pas de voiture < 8 ans
   • Jamais bénéficié de Voiture Populaire

2. **Préparer le financement**
   • Option 1: Don TRE (famille à l'étranger)
   • Option 2: Allocation touristique (~3,500€ max)
   • Option 3: Autorisation BCT

3. **Trouver et acheter la voiture en Europe**
   • Max 8 ans d'âge
   • Essence ≤1600cc OU Diesel ≤1900cc
   • Ou électrique/hybride (pas de limite cc)

4. **Importer et dédouaner**
   • Taxe consommation: 10% (0% pour électrique)
   • TVA: 7%

5. **Immatriculer**
   • ⚠️ Interdiction de revente: 5 ans

📄 [Voir la liste des documents]  ❓ [En savoir plus sur le financement]
        """
    },

    "documents_checklist": {
        "fr": """
📋 **Documents requis pour {regime}**

**📁 DOCUMENTS PERSONNELS**
{personal_docs}

**📁 DOCUMENTS VÉHICULE (origine)**
{vehicle_docs}

**📁 DOCUMENTS FINANCIERS**
{financial_docs}

**📁 DOCUMENTS À OBTENIR EN TUNISIE**
{tunisia_docs}

💡 **Conseil:** Préparez des copies certifiées de tous les documents.
⚠️ **Important:** Les originaux sont exigés pour le dédouanement.
        """
    },

    "timeline": {
        "fr": """
⏱️ **Calendrier d'importation - {regime}**

```
Semaine 1-2:   🔍 Recherche et achat du véhicule
               📋 Collecte des documents

Semaine 2-3:   🚢 Organisation du transport
               💰 Virement des devises

Semaine 3-5:   ⛴️ Transport maritime/ferry

Semaine 5-6:   🏛️ Dédouanement au port
               📝 Paiement des droits

Semaine 6-8:   🔧 Visite technique ATTT
               🛡️ Souscription assurance
               📄 Immatriculation

Semaine 8+:    🚗 Véhicule prêt à rouler!
```

**⏱️ Durée totale moyenne:** {avg_duration}
**⚠️ Facteurs de délai:** {delay_factors}
        """
    }
}
```

---

## 6. Multi-turn Context Management

### 6.1 Context Persistence Rules

```python
class ContextManager:
    """
    Manages conversation context across turns
    """

    # Fields that should NEVER be forgotten once set
    PERSISTENT_FIELDS = [
        "residency",
        "years_abroad",
        "family_status",
        "monthly_income",
        "owns_car",
        "used_voiture_populaire",
        "eligible_regimes",
        "best_regime"
    ]

    # Fields that can be updated mid-conversation
    MUTABLE_FIELDS = [
        "budget_tnd",
        "fuel_preference",
        "body_preference",
        "brand_preferences",
        "brand_exclusions",
        "needs_automatic",
        "governorate"
    ]

    # Fields that reset when user asks for new search
    SEARCH_FIELDS = [
        "shown_cars",
        "selected_car_id",
        "comparison_cars"
    ]

    def handle_correction(self, field: str, new_value, context: ConversationContext) -> str:
        """
        Handle user corrections like "Actually my budget is 70,000 not 60,000"
        Returns acknowledgment message
        """
        old_value = getattr(context, field, None)
        setattr(context, field, new_value)

        # Recalculate affected data
        if field == "budget_tnd":
            # Recalculate max car prices
            context.shown_cars = []  # Clear old recommendations
            return f"✅ J'ai mis à jour votre budget: {old_value:,.0f} → **{new_value:,.0f} TND**. Je recalcule les recommandations..."

        if field == "fuel_preference":
            context.shown_cars = []
            return f"✅ Préférence carburant mise à jour: **{new_value}**. Nouvelles recommandations en cours..."

        if field in self.PERSISTENT_FIELDS:
            # Major change - may affect eligibility
            context.eligible_regimes = []  # Force recalculation
            return f"⚠️ Changement important détecté. Je recalcule votre éligibilité..."

        return f"✅ Mis à jour: **{field}** = {new_value}"

    def detect_correction_intent(self, user_message: str) -> Optional[tuple]:
        """
        Detect if user is correcting previous information
        Returns (field, new_value) or None
        """
        correction_patterns = [
            # Budget corrections
            (r"(?:en fait|non|pardon|erreur).+budget.+(\d[\d\s]*)", "budget_tnd"),
            (r"(\d[\d\s]*)\s*(?:pas|et non|au lieu de)", "budget_tnd"),
            (r"budget.*(?:est|c'est)\s+(\d[\d\s]*)", "budget_tnd"),

            # Preference corrections
            (r"(?:non|plutôt|finalement).*(essence|diesel|électrique|hybride)", "fuel_preference"),
            (r"(?:non|plutôt|finalement).*(suv|berline|citadine)", "body_preference"),

            # Income corrections
            (r"(?:en fait|non).+revenu.+(\d[\d\s]*)", "monthly_income"),

            # Residency corrections
            (r"(?:en fait|non).+(?:habite|vis).+(tunisie|étranger|abroad)", "residency"),
        ]

        message_lower = user_message.lower()

        for pattern, field in correction_patterns:
            match = re.search(pattern, message_lower)
            if match:
                raw_value = match.group(1)
                parsed_value = self._parse_value(raw_value, field)
                return (field, parsed_value)

        return None

    def _parse_value(self, raw: str, field: str):
        """Parse raw string value to appropriate type"""
        if field in ["budget_tnd", "monthly_income"]:
            # Remove spaces and parse as number
            return float(raw.replace(" ", "").replace(",", ""))

        fuel_map = {
            "essence": "essence", "benzine": "essence", "بنزين": "essence",
            "diesel": "diesel", "gasoil": "diesel", "مازوت": "diesel",
            "électrique": "electric", "electrique": "electric", "كهرباء": "electric",
            "hybride": "hybrid", "هجين": "hybrid"
        }
        if field == "fuel_preference":
            return fuel_map.get(raw.lower(), raw)

        body_map = {
            "suv": "suv", "4x4": "suv",
            "berline": "berline", "sedan": "berline",
            "citadine": "citadine", "petite": "citadine"
        }
        if field == "body_preference":
            return body_map.get(raw.lower(), raw)

        return raw

    def handle_topic_switch(self, new_intent: str, context: ConversationContext) -> str:
        """
        Handle when user switches topics mid-conversation
        """
        current_state = context.state

        # Save current progress
        checkpoint = self._create_checkpoint(context)

        topic_switch_messages = {
            "eligibility_check": "D'accord, vérifions d'abord votre éligibilité.",
            "car_recommendation": "Bien sûr, passons aux recommandations de voitures.",
            "price_calculation": "Pas de problème, calculons les coûts.",
            "procedure_info": "Voici les informations sur la procédure.",
            "comparison": "Comparons les options disponibles.",
        }

        return topic_switch_messages.get(
            new_intent,
            "D'accord, que souhaitez-vous savoir?"
        )

    def summarize_context(self, context: ConversationContext, lang: str = "fr") -> str:
        """
        Generate a summary of current conversation context
        """
        if lang == "fr":
            summary_parts = []

            if context.residency:
                loc = "en Tunisie" if context.residency == "tunisia" else "à l'étranger"
                summary_parts.append(f"📍 Résidence: {loc}")

            if context.best_regime:
                regime_names = {
                    "fcr_tre": "FCR TRE (25%)",
                    "fcr_famille": "Une Voiture pour Chaque Famille",
                    "voiture_populaire": "Voiture Populaire",
                    "regular": "Marché régulier"
                }
                summary_parts.append(f"📋 Régime: {regime_names.get(context.best_regime, context.best_regime)}")

            if context.budget_tnd:
                summary_parts.append(f"💰 Budget: {context.budget_tnd:,.0f} TND")

            if context.fuel_preference and context.fuel_preference != "any":
                summary_parts.append(f"⛽ Carburant: {context.fuel_preference}")

            if context.body_preference and context.body_preference != "any":
                summary_parts.append(f"🚗 Type: {context.body_preference}")

            return "\n".join(summary_parts) if summary_parts else "Aucune information collectée."

        return ""
```

### 6.2 Conversation Memory

```python
class ConversationMemory:
    """
    Tracks conversation history and enables references to past exchanges
    """

    def __init__(self, max_turns: int = 50):
        self.max_turns = max_turns
        self.turns: List[Dict] = []
        self.key_facts: Dict[str, Any] = {}
        self.mentioned_cars: List[str] = []
        self.user_reactions: Dict[str, str] = {}  # car_id -> "liked", "disliked", "neutral"

    def add_turn(self, role: str, content: str, metadata: dict = None):
        """Add a conversation turn"""
        turn = {
            "role": role,  # "user" or "assistant"
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        self.turns.append(turn)

        # Keep only last max_turns
        if len(self.turns) > self.max_turns:
            self.turns = self.turns[-self.max_turns:]

    def extract_reference(self, user_message: str) -> Optional[dict]:
        """
        Detect when user references something from earlier
        "cette voiture", "la Golf", "le premier", etc.
        """
        reference_patterns = {
            "this_car": [
                r"cette voiture", r"celle-ci", r"celle-là",
                r"هذه السيارة", r"هاذي الكرهبة"
            ],
            "numbered": [
                r"(?:la |le )?(premi[eè]re?|deuxi[eè]me|troisi[eè]me|(\d+)[eè]me)",
                r"num[ée]ro (\d+)", r"la (\d+)"
            ],
            "by_brand": [
                r"(?:la |le )?(golf|polo|308|clio|tucson|corolla)",
            ],
            "previous": [
                r"(?:la |le )?pr[ée]c[ée]dente?",
                r"(?:celle |celui )d'avant"
            ]
        }

        message_lower = user_message.lower()

        for ref_type, patterns in reference_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, message_lower)
                if match:
                    return self._resolve_reference(ref_type, match, message_lower)

        return None

    def _resolve_reference(self, ref_type: str, match, message: str) -> Optional[dict]:
        """Resolve a reference to actual data"""
        if ref_type == "this_car" and self.mentioned_cars:
            return {"type": "car", "id": self.mentioned_cars[-1]}

        if ref_type == "numbered":
            # Extract number
            groups = match.groups()
            if groups[0] in ["première", "premier", "first"]:
                idx = 0
            elif groups[0] in ["deuxième", "second"]:
                idx = 1
            elif groups[0] in ["troisième", "third"]:
                idx = 2
            else:
                idx = int(groups[1] or groups[0]) - 1

            if idx < len(self.mentioned_cars):
                return {"type": "car", "id": self.mentioned_cars[idx]}

        if ref_type == "by_brand":
            brand_model = match.group(1).lower()
            for car_id in self.mentioned_cars:
                if brand_model in car_id.lower():
                    return {"type": "car", "id": car_id}

        return None

    def track_car_mention(self, car_id: str):
        """Track when a car is mentioned/shown"""
        if car_id not in self.mentioned_cars:
            self.mentioned_cars.append(car_id)

    def track_user_reaction(self, car_id: str, reaction: str):
        """Track user's reaction to a car"""
        self.user_reactions[car_id] = reaction

    def get_liked_cars(self) -> List[str]:
        """Get cars user showed interest in"""
        return [cid for cid, reaction in self.user_reactions.items() if reaction == "liked"]
```

---

## 7. Language & Cultural Considerations

### 7.1 Language Detection & Switching

```python
class LanguageHandler:
    """
    Handle multilingual conversations
    Primary: French | Secondary: Arabic (MSA) | Tertiary: Tunisian Derja
    """

    # Common Tunisian Derja terms related to cars
    DERJA_VOCABULARY = {
        # Car-related
        "كرهبة": "voiture",
        "كراهب": "voitures",
        "طوموبيل": "automobile",
        "سيارة شعبية": "voiture populaire",
        "FCR": "FCR",
        "فسيار": "FCR",
        "دوان": "douane",
        "الدوانة": "la douane",

        # Actions
        "نجيب": "importer/acheter",
        "نشري": "acheter",
        "باش نجيب": "je veux importer",

        # Questions
        "قداش": "combien",
        "شنية": "quoi/quel",
        "كيفاش": "comment",
        "وين": "où",
        "علاش": "pourquoi",

        # Affirmations
        "إي": "oui",
        "أيه": "oui",
        "لا": "non",
        "باهي": "d'accord/bien",
        "صحيح": "exact/vrai"
    }

    def detect_language(self, text: str) -> str:
        """
        Detect the language of user input
        Returns: "fr" | "ar" | "derja" | "mixed"
        """
        # Count character types
        arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
        latin_chars = len(re.findall(r'[a-zA-ZÀ-ÿ]', text))
        total_chars = arabic_chars + latin_chars

        if total_chars == 0:
            return "fr"  # Default

        arabic_ratio = arabic_chars / total_chars

        if arabic_ratio > 0.7:
            # Check for Derja-specific terms
            text_lower = text.lower()
            derja_score = sum(1 for term in self.DERJA_VOCABULARY if term in text)
            if derja_score > 0:
                return "derja"
            return "ar"
        elif arabic_ratio > 0.3:
            return "mixed"
        else:
            return "fr"

    def get_response_language(self, detected: str, user_preference: str = None) -> str:
        """
        Determine response language based on detection and preference
        """
        if user_preference:
            return user_preference

        # Derja input → French response (most Tunisians prefer reading French)
        if detected == "derja":
            return "fr"

        # Mixed → French (safest)
        if detected == "mixed":
            return "fr"

        return detected

    def translate_key_terms(self, text: str, from_lang: str, to_lang: str) -> str:
        """
        Translate key terms while keeping the rest
        Used for Derja→French understanding
        """
        if from_lang == "derja" and to_lang == "fr":
            result = text
            for derja, french in self.DERJA_VOCABULARY.items():
                result = result.replace(derja, french)
            return result
        return text

    def localize_number(self, number: float, lang: str) -> str:
        """
        Format numbers according to locale
        """
        if lang in ["ar", "derja"]:
            # Arabic numerals with comma separator
            return f"{number:,.0f}".replace(",", " ")
        else:
            # French format with space separator
            return f"{number:,.0f}".replace(",", " ")

    def localize_currency(self, amount: float, currency: str, lang: str) -> str:
        """
        Format currency according to locale
        """
        formatted = self.localize_number(amount, lang)

        if currency == "TND":
            if lang in ["ar", "derja"]:
                return f"{formatted} دينار"
            return f"{formatted} TND"
        elif currency == "EUR":
            return f"{formatted}€"

        return f"{formatted} {currency}"
```

### 7.2 Cultural Sensitivity Rules

```python
CULTURAL_GUIDELINES = {
    "greetings": {
        "use_religious": False,  # Avoid "Inshallah" in bot responses (let user initiate)
        "time_appropriate": True,  # "Bonjour" vs "Bonsoir"
        "formal_default": True,   # Use "vous" by default
    },

    "tone": {
        "avoid_pushy_sales": True,  # Tunisians distrust aggressive selling
        "acknowledge_bureaucracy": True,  # Validate frustration with admin
        "family_oriented": True,  # Frame benefits in family terms
        "practical_focus": True,  # Focus on value, not luxury
    },

    "topics_to_handle_carefully": [
        "income_questions",  # Many prefer not to disclose
        "informal_payments",  # Sfinja system - mention factually, don't encourage
        "political_references",  # Avoid completely
        "regional_stereotypes",  # Avoid completely
    ],

    "positive_framings": {
        "budget_constraint": "Avec votre budget, vous pouvez accéder à...",
        "not_eligible": "Cette option n'est pas disponible, mais voici des alternatives...",
        "waiting_period": "Le temps d'attente vous permet de mieux préparer...",
        "used_car": "Une voiture de 3-5 ans offre le meilleur rapport qualité-prix...",
    }
}

def apply_cultural_filter(response: str, context: ConversationContext) -> str:
    """
    Apply cultural sensitivity filters to bot responses
    """
    # Add family framing if user mentioned family
    if context.family_status in ["married_with_kids", "single_parent"]:
        response = response.replace(
            "pour vous",
            "pour votre famille"
        )

    # Soften any references to inability to help
    response = response.replace(
        "je ne peux pas",
        "je ne suis pas en mesure de"
    )

    # Avoid direct "no" - reframe positively
    response = response.replace(
        "Non, vous n'êtes pas éligible",
        "Cette option n'est pas disponible dans votre situation actuelle"
    )

    return response
```

### 7.3 Common Tunisian Expressions & Responses

```python
TUNISIAN_EXPRESSIONS = {
    # Positive reactions
    "باهي": "acknowledge_positive",
    "ممتاز": "acknowledge_positive",
    "تمام": "acknowledge_positive",
    "برشا باهي": "very_positive",

    # Negative/Concern
    "غالي": "price_concern",
    "ياسر": "too_much",
    "برشا": "a_lot",
    "صعيب": "difficult_concern",

    # Questions
    "شنوة": "what_question",
    "علاش": "why_question",
    "كيفاش": "how_question",

    # Requests
    "عطيني": "give_me",
    "وريني": "show_me",
    "فسرلي": "explain_to_me",
    "قارنلي": "compare_for_me",
}

def handle_tunisian_expression(expression: str, context: ConversationContext) -> str:
    """
    Generate appropriate response for Tunisian expressions
    """
    intent = TUNISIAN_EXPRESSIONS.get(expression.strip())

    responses = {
        "acknowledge_positive": "Parfait! On continue?",
        "very_positive": "Excellent! Je suis content que ça vous convienne.",
        "price_concern": "Je comprends que le prix soit une préoccupation. Voulez-vous voir des options moins chères?",
        "difficult_concern": "Ne vous inquiétez pas, je vais simplifier les choses. Qu'est-ce qui vous semble compliqué?",
        "what_question": "Que souhaitez-vous savoir exactement?",
        "how_question": "Je vais vous expliquer étape par étape.",
        "show_me": "Bien sûr, voici ce que j'ai trouvé:",
        "compare_for_me": "Je vais comparer les options pour vous:",
    }

    return responses.get(intent, "Je vous écoute, continuez...")
```

---

## 8. Error Handling & Fallbacks

### 8.1 Error Types & Responses

```python
class ErrorHandler:
    """
    Handle various error scenarios gracefully
    """

    ERROR_RESPONSES = {
        "ambiguous_input": {
            "fr": """
🤔 Je ne suis pas sûr de comprendre. Pouvez-vous préciser?

Vous pouvez me demander:
• Votre éligibilité FCR
• Des recommandations de voitures
• Le calcul du coût total
• Les étapes de la procédure
            """,
            "ar": """
🤔 لم أفهم جيدا. هل يمكنك التوضيح؟

يمكنك أن تسألني عن:
• أهليتك لـ FCR
• توصيات السيارات
• حساب التكلفة الإجمالية
            """
        },

        "missing_required_info": {
            "fr": """
⚠️ J'ai besoin de quelques informations pour vous aider:

{missing_fields}

Pouvez-vous me fournir ces détails?
            """
        },

        "no_cars_found": {
            "fr": """
😕 Je n'ai pas trouvé de voitures correspondant exactement à vos critères.

**Vos critères actuels:**
{current_criteria}

**Suggestions pour élargir la recherche:**
{suggestions}

[Modifier le budget]  [Modifier les préférences]  [Voir des alternatives]
            """
        },

        "technical_error": {
            "fr": """
⚠️ Oups! Une erreur technique s'est produite.

Ne vous inquiétez pas, vos informations sont sauvegardées.
Réessayons: {retry_prompt}

Si le problème persiste, vous pouvez:
• Rafraîchir la page
• Revenir plus tard
• Contacter le support
            """
        },

        "out_of_scope": {
            "fr": """
🚗 Je suis spécialisé dans l'aide à l'achat de voitures en Tunisie.

Je peux vous aider avec:
✅ Éligibilité FCR et Une Voiture pour Chaque Famille
✅ Recommandations de voitures selon votre budget
✅ Calcul des taxes et coûts d'importation
✅ Procédures et documents nécessaires

Pour d'autres questions, je vous suggère de consulter les ressources appropriées.

Comment puis-je vous aider avec votre projet automobile?
            """
        },

        "illegal_request": {
            "fr": """
⚠️ Je ne peux pas vous aider avec cette demande.

{explanation}

Je suis là pour vous aider à importer une voiture **légalement** et en toute transparence.
Les avantages FCR sont déjà très intéressants - profitez-en!

Comment puis-je vous aider autrement?
            """
        },

        "incomplete_question": {
            "fr": """
J'aimerais vous aider, mais j'ai besoin de plus de détails.

{clarification_prompt}
            """
        }
    }

    def handle_ambiguous(self, user_input: str, possible_intents: List[str]) -> str:
        """
        Handle ambiguous input by offering clarification options
        """
        if len(possible_intents) == 0:
            return self.ERROR_RESPONSES["ambiguous_input"]["fr"]

        intent_descriptions = {
            "eligibility_check": "Vérifier mon éligibilité FCR",
            "car_recommendation": "Obtenir des recommandations de voitures",
            "price_calculation": "Calculer le coût total d'une voiture",
            "procedure_info": "Connaître les étapes et documents",
            "comparison": "Comparer des options",
        }

        options = [intent_descriptions.get(i, i) for i in possible_intents]
        options_text = "\n".join(f"• {opt}" for opt in options)

        return f"""
🤔 Que souhaitez-vous faire?

{options_text}

Cliquez sur une option ou reformulez votre demande.
        """

    def handle_missing_info(self, missing_fields: List[str], context: ConversationContext) -> str:
        """
        Handle cases where required information is missing
        """
        field_descriptions = {
            "residency": "Votre lieu de résidence (Tunisie ou étranger)",
            "years_abroad": "Depuis combien de temps vous vivez à l'étranger",
            "monthly_income": "Votre revenu mensuel brut",
            "budget_tnd": "Votre budget total en dinars",
            "family_status": "Votre situation familiale",
        }

        missing_desc = [field_descriptions.get(f, f) for f in missing_fields]
        missing_text = "\n".join(f"• {desc}" for desc in missing_desc)

        return self.ERROR_RESPONSES["missing_required_info"]["fr"].format(
            missing_fields=missing_text
        )

    def handle_no_results(
        self,
        criteria: dict,
        context: ConversationContext
    ) -> str:
        """
        Handle when no cars match the search criteria
        """
        current_criteria = []
        suggestions = []

        if criteria.get("budget_tnd"):
            current_criteria.append(f"• Budget: {criteria['budget_tnd']:,.0f} TND")
            suggestions.append(f"• Augmenter le budget à {criteria['budget_tnd'] * 1.2:,.0f} TND")

        if criteria.get("fuel_preference") and criteria["fuel_preference"] != "any":
            current_criteria.append(f"• Carburant: {criteria['fuel_preference']}")
            suggestions.append("• Accepter d'autres types de carburant")

        if criteria.get("body_preference") and criteria["body_preference"] != "any":
            current_criteria.append(f"• Type: {criteria['body_preference']}")
            suggestions.append("• Élargir le type de carrosserie")

        if criteria.get("max_mileage"):
            current_criteria.append(f"• Kilométrage max: {criteria['max_mileage']:,} km")
            suggestions.append(f"• Accepter jusqu'à {criteria['max_mileage'] * 1.5:,.0f} km")

        return self.ERROR_RESPONSES["no_cars_found"]["fr"].format(
            current_criteria="\n".join(current_criteria) or "Aucun critère spécifique",
            suggestions="\n".join(suggestions) or "Aucune suggestion disponible"
        )

    def handle_out_of_scope(self, detected_topic: str) -> str:
        """
        Handle off-topic requests gracefully
        """
        topic_redirects = {
            "weather": "Pour la météo, consultez meteo.tn",
            "news": "Pour les actualités, consultez les sites d'information tunisiens",
            "other_products": "Je suis spécialisé uniquement dans les voitures",
            "personal_advice": "Pour des conseils personnalisés, consultez un professionnel",
        }

        extra_info = topic_redirects.get(detected_topic, "")

        response = self.ERROR_RESPONSES["out_of_scope"]["fr"]
        if extra_info:
            response = f"{extra_info}\n\n{response}"

        return response

    def handle_illegal_request(self, request_type: str) -> str:
        """
        Handle requests for illegal activities
        """
        explanations = {
            "tax_evasion": "Les taxes douanières sont obligatoires et contrôlées. Les avantages FCR offrent déjà des réductions légales significatives.",
            "document_fraud": "Les documents falsifiés sont détectés par les services douaniers et entraînent de lourdes pénalités.",
            "smuggling": "L'importation non déclarée est un délit grave en Tunisie.",
            "bribery": "Je ne peux pas conseiller sur les paiements informels.",
        }

        explanation = explanations.get(
            request_type,
            "Cette demande concerne une activité illégale."
        )

        return self.ERROR_RESPONSES["illegal_request"]["fr"].format(
            explanation=explanation
        )
```

### 8.2 Fallback Conversation Flows

```python
FALLBACK_FLOWS = {
    "confusion_recovery": {
        "triggers": [
            "user_says_confused",
            "multiple_clarification_requests",
            "no_progress_3_turns"
        ],
        "response": """
🔄 **Reprenons depuis le début de manière simplifiée.**

Je vais vous poser quelques questions simples pour vous aider.

**Question 1:** Vous voulez acheter une voiture, c'est bien ça?
        """,
        "follow_up": "simplified_eligibility_flow"
    },

    "frustration_recovery": {
        "triggers": [
            "user_expresses_frustration",
            "repeated_errors",
            "user_threatens_to_leave"
        ],
        "response": """
😔 Je suis désolé si ce n'est pas clair. Je vais simplifier.

**Votre situation en résumé:**
{context_summary}

**Ce que je vous recommande maintenant:**
{immediate_recommendation}

Est-ce que ça répond à votre besoin principal?
        """
    },

    "information_overload_recovery": {
        "triggers": [
            "user_asks_to_slow_down",
            "user_says_too_much_info"
        ],
        "response": """
📝 D'accord, allons-y étape par étape.

**L'essentiel à retenir:**
{key_point_1}

On continue quand vous êtes prêt(e). Des questions sur ce point?
        """
    },

    "human_handoff": {
        "triggers": [
            "user_requests_human",
            "complex_edge_case",
            "repeated_failures"
        ],
        "response": """
👤 Je comprends que vous préférez parler à quelqu'un.

**Options disponibles:**
1. 📧 Envoyer un email à support@example.com
2. 📞 Appeler le +216 XX XXX XXX (Lun-Ven, 9h-17h)
3. 💬 Laisser vos coordonnées pour être rappelé

En attendant, voici un résumé de notre conversation:
{conversation_summary}

Que préférez-vous?
        """
    }
}
```

---

## 9. Sample Conversations

### 9.1 Scenario: TRE avec bon budget

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 1: TRE en France, budget 100,000 TND                           │
│ Objectif: Import d'une berline essence via FCR TRE                      │
└─────────────────────────────────────────────────────────────────────────┘

🤖 BOT: Bienvenue! 🚗 Je suis votre assistant pour l'achat de voiture en
        Tunisie. Habitez-vous actuellement en Tunisie ou à l'étranger?

        🇹🇳 [En Tunisie]     🌍 [À l'étranger]

👤 USER: À l'étranger

🤖 BOT: Parfait! Depuis combien de temps habitez-vous à l'étranger?

        [< 2 ans]  [2-5 ans]  [5-10 ans]  [> 10 ans]

👤 USER: 5 ans en France

🤖 BOT: 🎉 Excellente nouvelle! Avec 5 ans en France, vous êtes éligible
        au régime **FCR TRE**.

        **Ce que ça signifie:**
        • Vous ne payez que **25%** des droits normaux
        • Véhicules jusqu'à **5 ans** d'âge
        • Moteur: essence ≤2000cc, diesel ≤2500cc

        Quel est votre budget total en dinars tunisiens?
        (Ce montant doit inclure: voiture + transport + taxes)

        💡 Fourchettes indicatives:
        • 60-80k TND → Citadines, petites berlines
        • 80-100k TND → Berlines, SUV compacts
        • 100-130k TND → SUV, berlines premium

👤 USER: J'ai environ 100 000 dinars

🤖 BOT: Avec **100,000 TND** et le régime FCR TRE, vous pouvez viser des
        voitures jusqu'à environ **~24,500€** en Europe.

        Quel type de carburant préférez-vous?

        [🔥 Essence]  [⛽ Diesel]  [🔋 Électrique]  [🚗 Pas de préférence]

👤 USER: Essence

🤖 BOT: Et quel type de véhicule recherchez-vous?

        [🚙 Citadine]  [🚗 Berline]  [🚐 SUV]  [❔ Pas de préférence]

👤 USER: Berline

🤖 BOT: 📊 **Voici mes recommandations pour vous:**

        **Profil:** FCR TRE | Budget: 100,000 TND | Max: ~24,500€
        **Préférences:** Essence | Berline

        ───────────────────────────────

        **1. Volkswagen Golf 1.4 TSI** (2022) 🇩🇪
        💰 Prix: 19,500€ → Total: **~82,000 TND**
        🔧 1395cc Essence | 150 ch | Automatique
        📏 45,000 km
        ⭐ Score: **87/100** - Excellent
        🔗 [Voir l'annonce](https://mobile.de/...)

        ───────────────────────────────

        **2. Peugeot 308 1.2 PureTech** (2022) 🇩🇪
        💰 Prix: 17,800€ → Total: **~76,000 TND**
        🔧 1199cc Essence | 130 ch | Manuelle
        📏 38,000 km
        ⭐ Score: **85/100** - Excellent
        🔗 [Voir l'annonce](https://mobile.de/...)

        ───────────────────────────────

        **3. Toyota Corolla 1.8** (2021) 🇩🇪
        💰 Prix: 21,000€ → Total: **~88,000 TND**
        🔧 1798cc Essence | 140 ch | CVT
        📏 52,000 km
        ⭐ Score: **89/100** - Excellent
        🔗 [Voir l'annonce](https://mobile.de/...)

        ───────────────────────────────

        Voulez-vous:
        [📊 Détails d'une voiture]  [🔄 Autres critères]  [📋 Procédure]

👤 USER: Détails sur la Golf

🤖 BOT: 📊 **Détail du coût: Volkswagen Golf 1.4 TSI (2022)**

        **1. Prix d'achat en Europe**
        • Prix affiché: **19,500€**

        **2. Frais de transport**
        • Shipping (Allemagne → Tunisie): ~1,200€
        • Assurance transport: ~290€
        • **Sous-total CIF:** 20,990€ ≈ **71,366 TND**

        **3. Taxes FCR TRE (25%)**
        • Calcul: 25% des droits normaux
        • **Taxes estimées:** ~10,500 TND

        **4. Frais administratifs**
        • Homologation ATTT: ~800 TND
        • Immatriculation: ~500 TND

        ═══════════════════════════════════════
        **💰 COÛT TOTAL ESTIMÉ: ~82,000 TND**
        ═══════════════════════════════════════

        💡 **Comparaison:** Une Golf neuve chez Ennakl coûte ~145,000 TND.
        **Économie:** ~63,000 TND (43%)!

        [📋 Voir la procédure]  [🔙 Autres voitures]  [📧 Sauvegarder]

👤 USER: Montre-moi la procédure

🤖 BOT: 📋 **Procédure FCR TRE - Les étapes pour votre Golf**

        **AVANT LE DÉPART (en France/Allemagne)**
        1. ✅ Acheter la Golf (vérifier: ≤5 ans, 1395cc ✓)
        2. ✅ Obtenir: carte grise allemande, certificat de conformité
        3. ✅ Faire le contrôle technique
        4. ✅ Organiser le transport (ferry Marseille ou RoRo)
        5. ✅ Transférer les devises en Tunisie (preuve bancaire)

        **À L'ARRIVÉE EN TUNISIE**
        6. ✅ Dédouanement au port de Radès
        7. ✅ Choisir: Franchise Totale (RS) ou Partielle (TN)
        8. ✅ Payer les 25% de droits
        9. ✅ Obtenir permis de circulation temporaire

        **POST-IMPORT (sous 3 mois)**
        10. ✅ Visite technique ATTT
        11. ✅ Assurance tous risques
        12. ✅ Immatriculation définitive

        **⏱️ Délai total:** 6-10 semaines

        📄 [Liste des documents]  ⏱️ [Calendrier détaillé]
        ❓ [Questions fréquentes]

👤 USER: Merci, c'est très clair!

🤖 BOT: 🎉 Avec plaisir! Voici un résumé de notre échange:

        📋 **Votre situation:**
        • Régime: FCR TRE (25% des taxes)
        • Budget: 100,000 TND
        • Voiture recommandée: VW Golf 1.4 TSI 2022
        • Coût estimé: ~82,000 TND
        • Économie vs neuf local: ~63,000 TND

        📧 Voulez-vous recevoir ce résumé par email?

        Bonne chance pour votre projet! 🚗
        N'hésitez pas à revenir si vous avez d'autres questions.
```

### 9.2 Scenario: Résident éligible Une Voiture

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 2: Famille résidente, revenu modeste, éligible FCR Famille     │
│ Objectif: Découvrir les options avec "Une Voiture pour Chaque Famille" │
└─────────────────────────────────────────────────────────────────────────┘

🤖 BOT: Bienvenue! 🚗 Habitez-vous en Tunisie ou à l'étranger?

        🇹🇳 [En Tunisie]     🌍 [À l'étranger]

👤 USER: في تونس (En Tunisie)

🤖 BOT: Parfait! Pour vérifier votre éligibilité aux programmes d'aide,
        j'ai quelques questions.

        Quelle est votre situation familiale?

        [Célibataire]  [Marié(e) sans enfants]
        [Marié(e) avec enfants]  [Parent isolé]

👤 USER: Marié avec 2 enfants

🤖 BOT: Quel est le revenu mensuel BRUT de votre couple (les deux salaires)?

        💡 Le plafond pour "Une Voiture pour Chaque Famille" est ~7,400 TND
        pour un couple.

        [< 3,000 TND]  [3,000-5,000 TND]  [5,000-7,500 TND]  [> 7,500 TND]

👤 USER: Entre 4000 et 5000

🤖 BOT: Possédez-vous actuellement une voiture?

        [Non, pas de voiture]  [Oui, de plus de 8 ans]  [Oui, de moins de 8 ans]

👤 USER: Non, on n'a pas de voiture

🤖 BOT: 🎉 **Excellente nouvelle!** Vous êtes éligible à
        **"Une Voiture pour Chaque Famille"** (Article 55).

        **Vos avantages:**
        • Taxe de consommation: **10%** (au lieu de 30-88%)
        • TVA: **7%** (au lieu de 19%)
        • Véhicules jusqu'à **8 ans** d'âge

        ⚡ **BONUS:** Si vous choisissez électrique/hybride rechargeable:
        • Taxe de consommation: **0%** (totalement exonéré!)

        ⚠️ **Important:** Ce bénéfice est **unique** (une seule fois par famille).

        Quel est votre budget total en dinars?

👤 USER: On a environ 60 mille dinars

🤖 BOT: Avec **60,000 TND** et le régime FCR Famille:
        • Voiture thermique: jusqu'à **~15,500€**
        • Voiture électrique: jusqu'à **~17,500€** (0% taxes!)

        Comment comptez-vous payer la voiture en Europe?

        [J'ai de la famille TRE qui peut aider] ✅ Recommandé
        [Allocation touristique (~3,500€ max)]
        [Je ne sais pas encore]

👤 USER: J'ai un cousin en France

🤖 BOT: Parfait! Votre cousin pourra payer le vendeur en Europe, et vous
        le remboursez en dinars en Tunisie. C'est la méthode la plus courante.

        Quel type de carburant préférez-vous?

        [🔥 Essence]  [⛽ Diesel]
        [🔋 Électrique] 💡 0% taxes!
        [🚗 Pas de préférence]

👤 USER: On hésite entre essence et électrique

🤖 BOT: ⚡ **Comparaison: Électrique vs Essence pour vous**

        | Critère | 🔋 Électrique | 🔥 Essence |
        |---------|--------------|------------|
        | **Budget max (€)** | ~17,500€ | ~15,500€ |
        | **Taxes import** | 7% (TVA seule) | ~17% |
        | **Carburant/mois** | ~30 TND | ~150 TND |
        | **Vignette/an** | ~65 TND | ~130 TND |

        **Questions pour l'électrique:**
        • Avez-vous un parking/garage pour recharger à domicile?
        • Combien de km faites-vous par jour?
        • Faites-vous souvent des trajets interurbains?

👤 USER: On a un garage, on fait 40km par jour, rarement des longs trajets

🤖 BOT: ✅ **L'électrique est une excellente option pour vous!**

        • Garage ✅ → Recharge à domicile facile
        • 40 km/jour ✅ → Largement dans l'autonomie
        • Peu de longs trajets ✅ → Pas de souci d'autonomie

        📊 **Recommandations électriques:**

        **1. BYD Dolphin** (2023) 🇩🇪
        💰 15,500€ → Total: **~56,000 TND**
        🔋 44 kWh | Autonomie: ~400 km
        📏 25,000 km
        ⭐ Score: **91/100** - Excellent

        **2. MG4 Standard** (2023) 🇩🇪
        💰 16,800€ → Total: **~60,000 TND**
        🔋 51 kWh | Autonomie: ~450 km
        📏 18,000 km
        ⭐ Score: **88/100** - Excellent

        **Économie sur 5 ans vs essence:**
        • Carburant: ~7,200 TND économisés
        • Vignette: ~325 TND économisés
        • Entretien: ~2,000 TND économisés
        • **Total: ~9,500 TND économisés!**

        [📊 Plus de détails]  [🔥 Voir options essence]  [📋 Procédure]

👤 USER: La BYD m'intéresse, c'est fiable?

🤖 BOT: 🔍 **BYD Dolphin - Analyse fiabilité**

        **Points positifs:**
        ✅ BYD = 1er constructeur mondial de VE
        ✅ Technologie batterie LFP (plus sûre, durable)
        ✅ Garantie batterie: 8 ans ou 200,000 km
        ✅ Concessionnaire en Tunisie (Hélios Cars)
        ✅ Pièces détachées de plus en plus disponibles

        **Points d'attention:**
        ⚠️ Marque relativement nouvelle en Tunisie
        ⚠️ Réseau de réparation encore limité
        ⚠️ Valeur de revente incertaine

        **Verdict:** 🌟 Recommandé pour votre usage

        Le fait qu'il y ait un concessionnaire officiel en Tunisie est
        un gros avantage pour le SAV.

        Voulez-vous voir le détail des coûts pour cette voiture?

👤 USER: Oui s'il te plaît

🤖 BOT: 📊 **Détail du coût: BYD Dolphin (2023)**

        **1. Prix en Europe:** 15,500€

        **2. Transport:** ~1,100€
        • Shipping: 950€
        • Assurance: 150€

        **3. CIF Total:** 16,600€ ≈ **56,440 TND**

        **4. Taxes FCR Famille (Électrique)**
        • Taxe consommation: **0 TND** (exonéré!)
        • TVA 7%: **3,951 TND**
        • TFD: **119 TND**

        **5. Frais admin:** ~1,300 TND

        ═══════════════════════════════════════
        **💰 COÛT TOTAL: ~55,810 TND**
        ═══════════════════════════════════════

        ✅ Dans votre budget de 60,000 TND
        💰 Il vous reste ~4,200 TND pour:
        • Installation borne de recharge: ~2,500 TND
        • Première année d'assurance: ~1,200 TND

        [📋 Voir procédure]  [📧 Sauvegarder]  [❓ Questions]
```

### 9.3 Scenario: Utilisateur non éligible

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 3: Résident avec revenu trop élevé, voiture récente           │
│ Objectif: Rediriger vers les alternatives (marché local)               │
└─────────────────────────────────────────────────────────────────────────┘

🤖 BOT: Bienvenue! 🚗 Habitez-vous en Tunisie ou à l'étranger?

👤 USER: En Tunisie

🤖 BOT: Quelle est votre situation familiale?

👤 USER: Marié, 1 enfant

🤖 BOT: Quel est le revenu mensuel BRUT de votre couple?

        💡 Plafond FCR Famille: ~7,400 TND pour un couple.

👤 USER: Environ 9000 dinars

🤖 BOT: ⚠️ Je note que votre revenu (~9,000 TND) dépasse le plafond de
        ~7,400 TND pour "Une Voiture pour Chaque Famille".

        Une dernière question: Possédez-vous actuellement une voiture?

👤 USER: Oui, une Clio de 2020

🤖 BOT: 😔 **Malheureusement**, vous n'êtes pas éligible aux programmes
        FCR ou Une Voiture pour Chaque Famille.

        **Raisons:**
        • ❌ Revenu (~9,000 TND) > plafond (7,400 TND)
        • ❌ Voiture actuelle < 8 ans (Clio 2020 = 6 ans)

        **Mais ne vous découragez pas!** Voici vos meilleures options:

        ───────────────────────────────

        **Option 1: Marché local (concessionnaires)**
        ✅ Pas de démarches d'import compliquées
        ✅ Garantie constructeur
        ✅ Financement disponible (crédit auto, leasing)
        ❌ Prix plus élevés qu'en Europe

        **Option 2: Occasion en Tunisie**
        ✅ Prix plus accessibles
        ✅ Pas de taxes d'import
        ✅ Voiture déjà immatriculée
        → Site: automobile.tn

        **Option 3: Attendre un changement de situation**
        • Votre Clio aura 8 ans en 2028
        • Un changement de revenu pourrait vous rendre éligible

        ───────────────────────────────

        Souhaitez-vous explorer les options du marché local?
        Je peux vous montrer les prix des concessionnaires tunisiens.

👤 USER: Oui, montrez-moi les prix locaux pour un SUV

🤖 BOT: 📊 **SUV disponibles chez les concessionnaires tunisiens**

        **Segment compact (les plus populaires):**

        | Modèle | Prix TND | Motorisation |
        |--------|----------|--------------|
        | Hyundai Tucson | 125,000-155,000 | Essence 1.6 |
        | Kia Sportage | 130,000-165,000 | Essence/Diesel |
        | Peugeot 3008 | 145,000-175,000 | Essence 1.2-1.6 |
        | VW Tiguan | 165,000-210,000 | Essence/Diesel |

        **Segment plus accessible:**

        | Modèle | Prix TND | Motorisation |
        |--------|----------|--------------|
        | Hyundai Creta | 85,000-105,000 | Essence 1.5 |
        | Kia Seltos | 95,000-115,000 | Essence 1.5 |
        | Suzuki Vitara | 90,000-110,000 | Essence 1.4 |

        **Marques chinoises (meilleur rapport équipement/prix):**

        | Modèle | Prix TND | Note |
        |--------|----------|------|
        | Geely Coolray | 75,000-95,000 | Bien équipé |
        | Chery Tiggo 4 | 70,000-85,000 | Bon rapport qualité/prix |
        | Haval Jolion | 95,000-115,000 | Design moderne |

        💡 **Conseil:** Pour les marques chinoises, vérifiez la disponibilité
        des pièces détachées avant l'achat.

        Quel budget avez-vous en tête?

👤 USER: Autour de 100 000 dinars

🤖 BOT: Avec **100,000 TND**, voici mes recommandations:

        **🏆 Meilleur choix global:**
        **Hyundai Creta 1.5 Smart** - ~95,000 TND
        ✅ Marque fiable
        ✅ Excellent réseau SAV en Tunisie
        ✅ Bonnes finitions

        **💰 Meilleur rapport qualité/prix:**
        **Geely Coolray** - ~85,000 TND
        ✅ Très bien équipé (toit panoramique, écran tactile)
        ✅ Design moderne
        ⚠️ Marque moins connue, pièces à vérifier

        **🔄 Option occasion récente:**
        Kia Sportage 2021-2022 - ~90,000-100,000 TND
        ✅ Plus grand que Creta
        ✅ Garantie constructeur transférable
        → Chercher sur automobile.tn

        ───────────────────────────────

        **💳 Options de financement:**
        • Crédit auto: ~11-13% sur 5-7 ans
        • Leasing: ~4,000 TND/mois (Creta)

        Voulez-vous plus de détails sur un modèle spécifique?
```

### 9.4 Scenario: Comparaison import vs local

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 4: Utilisateur veut comparer import FCR vs achat local         │
│ Objectif: Comparaison détaillée avec recommandation                     │
└─────────────────────────────────────────────────────────────────────────┘

👤 USER: Je suis TRE depuis 3 ans, je veux comparer: acheter une Golf
        en Allemagne avec FCR ou l'acheter neuve en Tunisie

🤖 BOT: Excellente question! Comparons les deux options pour une
        **Volkswagen Golf**.

        📊 **Comparaison: Golf Import FCR TRE vs Golf Neuve Tunisie**

        ═══════════════════════════════════════════════════════════════

        **🇪🇺 OPTION 1: Import Allemagne (FCR TRE)**

        | Élément | Détail |
        |---------|--------|
        | Modèle | Golf 1.4 TSI 2022 |
        | État | Occasion (~40,000 km) |
        | Prix Europe | ~19,000€ |
        | Transport | ~1,200€ |
        | Taxes (25%) | ~17,000 TND |
        | **TOTAL** | **~85,000 TND** |

        ✅ Avantages:
        • Prix final 40% moins cher
        • Voiture récente (2-3 ans)
        • Plus d'équipements (version allemande)

        ❌ Inconvénients:
        • Démarches administratives
        • Délai: 6-10 semaines
        • Pas de garantie constructeur
        • Kilométrage existant

        ═══════════════════════════════════════════════════════════════

        **🇹🇳 OPTION 2: Achat Neuf Tunisie (Ennakl)**

        | Élément | Détail |
        |---------|--------|
        | Modèle | Golf 1.4 TSI 2025 |
        | État | Neuf (0 km) |
        | **Prix final** | **~145,000 TND** |

        ✅ Avantages:
        • Neuve, 0 km
        • Garantie constructeur 2-3 ans
        • Aucune démarche d'import
        • Disponible immédiatement
        • SAV Ennakl en Tunisie

        ❌ Inconvénients:
        • Prix 70% plus élevé
        • Équipements parfois réduits vs Europe

        ═══════════════════════════════════════════════════════════════

        **📊 VERDICT:**

        | Critère | Import FCR | Neuf Tunisie | Gagnant |
        |---------|------------|--------------|---------|
        | Prix | 85,000 TND | 145,000 TND | 🏆 Import |
        | Garantie | Non | 2-3 ans | 🏆 Neuf |
        | Démarches | Complexes | Simples | 🏆 Neuf |
        | Délai | 6-10 sem. | Immédiat | 🏆 Neuf |
        | État | ~40k km | 0 km | 🏆 Neuf |

        **💰 Économie avec import FCR: ~60,000 TND (41%)**

        **🎯 Ma recommandation:**

        Si vous êtes à l'aise avec les démarches administratives et
        n'avez pas besoin de la voiture immédiatement, **l'import FCR**
        offre un excellent rapport qualité-prix.

        L'économie de 60,000 TND peut couvrir:
        • 3-4 ans d'entretien et assurance
        • Une extension de garantie privée
        • Des équipements supplémentaires

        Voulez-vous que je vous montre des Golf disponibles en Allemagne?

        [🔍 Voir les Golf]  [📋 Procédure détaillée]  [❓ Plus de questions]

👤 USER: Oui montre-moi les Golf disponibles

🤖 BOT: 📊 **Volkswagen Golf disponibles en Allemagne (FCR TRE compatible)**

        Filtres: ≤5 ans | ≤2000cc | Essence

        ───────────────────────────────

        **1. VW Golf 1.4 TSI Style** (2022) 🇩🇪 Munich
        💰 18,900€ → **~83,000 TND** total
        🔧 1395cc | 150 ch | DSG Automatique
        📏 42,000 km | Gris métallisé
        ⭐ Score: 89/100
        🔗 [Voir sur mobile.de]

        ───────────────────────────────

        **2. VW Golf 1.5 TSI Life** (2023) 🇩🇪 Berlin
        💰 22,500€ → **~95,000 TND** total
        🔧 1498cc | 130 ch | Manuelle
        📏 28,000 km | Blanc
        ⭐ Score: 92/100
        🔗 [Voir sur mobile.de]

        ───────────────────────────────

        **3. VW Golf 1.4 TSI** (2021) 🇩🇪 Francfort
        💰 16,500€ → **~74,000 TND** total
        🔧 1395cc | 125 ch | Manuelle
        📏 58,000 km | Noir
        ⭐ Score: 85/100
        🔗 [Voir sur mobile.de]

        ───────────────────────────────

        💡 **Conseil:** La Golf #3 à 74,000 TND est un excellent deal -
        vous économisez **71,000 TND** vs le neuf!

        [📊 Détails prix]  [🔄 Plus d'options]  [📋 Procédure]
```

---

## 10. Persona & Tone Guidelines

### 10.1 Bot Persona Definition

```yaml
Persona:
  name: "Sayarti" (سيارتي - Ma Voiture)
  role: "Assistant expert en import automobile pour la Tunisie"

  personality_traits:
    - Patient et pédagogue
    - Pragmatique et orienté solutions
    - Transparent sur les limitations
    - Culturellement sensible
    - Optimiste mais réaliste

  communication_style:
    formality: "Semi-formel (vouvoiement par défaut)"
    emoji_usage: "Modéré (pour structurer, pas décorer)"
    humor: "Léger et approprié (jamais sarcastique)"
    technical_level: "Adaptatif (simplifier par défaut, détailler sur demande)"

  voice_characteristics:
    - Utilise des analogies locales quand pertinent
    - Évite le jargon technique sauf si nécessaire
    - Reconnaît les frustrations liées à la bureaucratie
    - Célèbre les petites victoires (éligibilité, bons deals)

  things_to_avoid:
    - Ton condescendant
    - Promesses impossibles
    - Jugements sur les choix de l'utilisateur
    - Références politiques
    - Stéréotypes régionaux
```

### 10.2 Tone Examples

```python
TONE_EXAMPLES = {
    "encouraging": {
        "good": "🎉 Excellente nouvelle! Vous êtes éligible au FCR TRE.",
        "bad": "Vous avez de la chance d'être éligible."
    },

    "explaining_bad_news": {
        "good": "Malheureusement, avec votre revenu actuel, ce programme n'est pas accessible. Mais voici d'autres options intéressantes...",
        "bad": "Non, vous n'êtes pas éligible. Votre revenu est trop élevé."
    },

    "technical_explanation": {
        "good": "La taxe de consommation (DC) dépend de la taille du moteur. Plus le moteur est gros, plus la taxe est élevée. Pour votre Golf 1.4, c'est dans la tranche basse.",
        "bad": "Le DC est calculé selon la cylindrée avec des paliers progressifs définis par la loi de finances."
    },

    "handling_confusion": {
        "good": "Je comprends que ça peut sembler compliqué. Reprenons ensemble, étape par étape. Votre question principale est...?",
        "bad": "C'est pourtant simple. Relisez ce que j'ai écrit."
    },

    "acknowledging_bureaucracy": {
        "good": "Oui, les démarches administratives en Tunisie peuvent être longues. Je vais vous aider à vous préparer pour que tout se passe au mieux.",
        "bad": "C'est comme ça en Tunisie, il faut s'y faire."
    },

    "price_sensitivity": {
        "good": "Avec votre budget de 60,000 TND, voici les meilleures options. L'important est de trouver le meilleur rapport qualité-prix pour votre famille.",
        "bad": "60,000 TND c'est un petit budget, vous n'aurez pas beaucoup de choix."
    },

    "celebrating_savings": {
        "good": "💰 En important via FCR, vous économisez ~50,000 TND par rapport au prix local. C'est l'équivalent de 2 ans de carburant!",
        "bad": "Vous économisez 50,000 TND."
    }
}
```

### 10.3 Response Length Guidelines

```python
RESPONSE_LENGTH = {
    "greeting": {
        "target": "3-5 lines",
        "max": "8 lines",
        "note": "Court et accueillant, poser une question claire"
    },

    "eligibility_result": {
        "target": "8-12 lines",
        "max": "15 lines",
        "note": "Résultat clair + explication + prochaine étape"
    },

    "car_recommendation_list": {
        "target": "3-5 voitures",
        "max": "7 voitures",
        "note": "Format compact, détails sur demande"
    },

    "price_breakdown": {
        "target": "15-20 lines",
        "max": "25 lines",
        "note": "Détaillé mais scannable, utiliser tableaux"
    },

    "procedure_overview": {
        "target": "10-15 lines",
        "max": "20 lines",
        "note": "Étapes numérotées, liens vers détails"
    },

    "error_message": {
        "target": "3-5 lines",
        "max": "8 lines",
        "note": "Problème + solution + alternative"
    },

    "quick_answer": {
        "target": "1-3 lines",
        "max": "5 lines",
        "note": "Réponse directe aux questions simples"
    }
}

def check_response_length(response: str, response_type: str) -> dict:
    """Check if response meets length guidelines"""
    lines = response.strip().split('\n')
    line_count = len([l for l in lines if l.strip()])

    guideline = RESPONSE_LENGTH.get(response_type, RESPONSE_LENGTH["quick_answer"])

    # Parse target (e.g., "3-5 lines" -> 4)
    target = int(guideline["target"].split("-")[1].split()[0])
    max_lines = int(guideline["max"].split()[0])

    return {
        "line_count": line_count,
        "target": target,
        "max": max_lines,
        "is_ok": line_count <= max_lines,
        "is_optimal": line_count <= target,
        "suggestion": "Raccourcir" if line_count > max_lines else "OK"
    }
```

### 10.4 Emoji Usage Guidelines

```python
EMOJI_GUIDELINES = {
    "allowed_contexts": [
        "section_headers",      # 📊 Recommandations
        "status_indicators",    # ✅ Éligible, ❌ Non éligible
        "highlights",           # 💰 Économie, ⚠️ Attention
        "country_flags",        # 🇹🇳 🇩🇪 🇫🇷
        "vehicle_types",        # 🚗 🔋 ⛽
    ],

    "avoid": [
        "excessive_decoration",  # Ne pas mettre d'emoji à chaque phrase
        "emotional_manipulation", # Pas de 😢😭 pour créer de l'empathie
        "replacing_words",       # Écrire "voiture" pas 🚗 seul
    ],

    "max_per_message": 8,
    "max_consecutive": 2,

    "standard_emojis": {
        "success": "✅",
        "failure": "❌",
        "warning": "⚠️",
        "info": "💡",
        "money": "💰",
        "car": "🚗",
        "electric": "🔋",
        "fuel": "⛽",
        "document": "📋",
        "chart": "📊",
        "time": "⏱️",
        "location": "📍",
        "link": "🔗",
        "celebration": "🎉",
        "thinking": "🤔",
        "sad": "😔",
    }
}
```

---

## 📊 Quick Reference Summary

### Conversation Flow Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONVERSATION FLOW QUICK REFERENCE                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. GREET → 2. DETERMINE USER TYPE → 3. CHECK ELIGIBILITY               │
│                                                                          │
│  4. COLLECT BUDGET → 5. COLLECT PREFERENCES → 6. SHOW RECOMMENDATIONS   │
│                                                                          │
│  7. DETAILED VIEW (on request) → 8. PROCEDURE INFO → 9. SUMMARY/END     │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  MINIMUM QUESTIONS FOR ELIGIBILITY:                                      │
│  • TRE: Residency + Years abroad (2 questions)                          │
│  • Resident: Residency + Family + Income + Car (4 questions)            │
│                                                                          │
│  MINIMUM QUESTIONS FOR RECOMMENDATIONS:                                  │
│  • Eligibility questions + Budget (1 additional)                        │
│  • Optional: Fuel + Body + Location (3 additional)                      │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  KEY INTENTS TO DETECT:                                                  │
│  • eligibility_check    → Route to eligibility flow                     │
│  • car_recommendation   → Route to recommendation flow                  │
│  • price_calculation    → Show detailed cost breakdown                  │
│  • procedure_info       → Show steps and documents                      │
│  • comparison           → Compare options side-by-side                  │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  RESPONSE PRIORITIES:                                                    │
│  1. Answer the user's question                                          │
│  2. Provide actionable next step                                        │
│  3. Offer related options                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Language Detection Quick Rules

| Input Contains | Detected Language | Respond In |
|----------------|-------------------|------------|
| Arabic script only | Arabic/Derja | French (default) |
| French only | French | French |
| Mixed Arabic + French | Mixed | French |
| Derja keywords (كرهبة, قداش) | Derja | French |
| User requests Arabic | User preference | Arabic |

### Error Recovery Quick Actions

| Error Type | Immediate Action | Follow-up |
|------------|------------------|-----------|
| Ambiguous input | Offer clarification options | Ask simpler question |
| No results | Show criteria + suggestions | Offer to modify |
| Technical error | Apologize + retry prompt | Offer alternatives |
| Out of scope | Redirect politely | Show what bot can do |
| User frustrated | Acknowledge + simplify | Offer human handoff |

---

## 📝 Change Log

| Date | Change |
|------|--------|
| 2026-01-26 | Initial chatbot flow KB created |
| | Added conversation goals and principles |
| | Added user intents taxonomy with patterns |
| | Added conversation state machine |
| | Added question sequence with logic |
| | Added response templates (all categories) |
| | Added multi-turn context management |
| | Added language & cultural considerations |
| | Added error handling & fallbacks |
| | Added 4 complete sample conversations |
| | Added persona & tone guidelines |

---

*This document defines the complete conversation design for the Tunisia Car Import Chatbot. It should be used in conjunction with the recommendation rules KB and scraping schema KB for full implementation.*
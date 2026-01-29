# KarTN RAG - Conversation Flow Design

## Knowledge Base Entry - UX & Dialogue Management

> **Last Updated:** January 29, 2026
> **Status:** Production Ready
> **Purpose:** Define conversation design, user intents, dialogue flows, and response templates

---

## Table of Contents

1. [Conversation Goals & Principles](#1-conversation-goals--principles)
2. [User Intents Taxonomy](#2-user-intents-taxonomy)
3. [Conversation State Machine](#3-conversation-state-machine)
4. [Question Sequence & Logic](#4-question-sequence--logic)
5. [Response Templates](#5-response-templates)
6. [Number Parsing Logic](#6-number-parsing-logic)
7. [Multi-turn Context Management](#7-multi-turn-context-management)
8. [Language & Cultural Considerations](#8-language--cultural-considerations)
9. [Error Handling & Fallbacks](#9-error-handling--fallbacks)
10. [Sample Conversations](#10-sample-conversations)
11. [Persona & Tone Guidelines](#11-persona--tone-guidelines)

---

## 1. Conversation Goals & Principles

### 1.1 Primary Goals

| Priority | Goal | Success Metric |
|----------|------|----------------|
| P0 | **Show car recommendations fast** | Recommendations within 2 questions |
| P0 | **Calculate realistic budget** | Accurate total cost estimate |
| P1 | **Explain procedures on request** | Clear next steps when asked |
| P2 | **Compare options** | Clear decision framework |

### 1.2 Design Principles

```
LEAN CHATBOT DESIGN PRINCIPLES

1. MINIMUM QUESTIONS
   - Only 2 required: Residency + Budget
   - Eligibility info shown, not verified upfront
   - Details on request only

2. ULTRA-SHORT RESPONSES
   - 2-4 lines maximum per response
   - No decorative content
   - Direct and actionable

3. MOBILE-FIRST
   - Quick buttons for common actions
   - Scannable formatting

4. BILINGUAL FLUENCY
   - Default to French
   - Understand Tunisian Derja input
   - Switch to Arabic on request

5. PROGRESSIVE DISCLOSURE
   - Show cars first, details on demand
   - Procedure info only when requested
```

### 1.3 User Journey Map

```
Q0: What do you want to do?
├── 1. Find me a car        → Residency → Budget → SHOW CARS
├── 2. Calculate import cost → Ask car details → SHOW PRICE
└── 3. Understand the process → SHOW PROCEDURE → Suggest path 1
```

---

## 2. User Intents Taxonomy

### 2.1 Primary Intents

| Intent ID | Intent Name | Example Utterances (FR) |
|-----------|-------------|-------------------------|
| `car_recommendation` | Get car suggestions | "Quelle voiture pour 80,000 DT?" |
| `price_calculation` | Calculate total cost | "Combien coûtera cette Golf?" |
| `procedure_info` | Learn about process | "C'est quoi les étapes?" |
| `comparison` | Compare options | "Import ou local?" |

### 2.2 Secondary Intents

| Intent ID | Intent Name | Example |
|-----------|-------------|---------|
| `budget_update` | Modify budget | "Mon budget est 70,000" |
| `car_details` | Get details | "Plus sur cette Peugeot" |
| `restart` | Start over | "On recommence" |

### 2.3 Intent Detection Patterns

```python
INTENT_PATTERNS = {
    "car_recommendation": {
        "keywords_fr": ["recommande", "suggère", "quelle voiture", "budget"],
        "keywords_ar": ["شنية", "نصحني"],
    },
    "price_calculation": {
        "keywords_fr": ["combien", "coût", "total", "prix"],
        "keywords_ar": ["قداش", "كم"],
    },
    "procedure_info": {
        "keywords_fr": ["étape", "procédure", "comment", "document"],
        "keywords_ar": ["كيفاش", "خطوات"],
    }
}
```

---

## 3. Conversation State Machine

### 3.1 Flow Diagram with 3 Paths

```
                         ┌────────────────┐
                         │ GOAL_SELECTION │
                         │      Q0        │
                         └───────┬────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
    ┌─────────────┐      ┌──────────────┐      ┌──────────────┐
    │ 1. Find car │      │ 2. Calculate │      │ 3. Procedure │
    │   (START)   │      │    cost      │      │     info     │
    └──────┬──────┘      └──────┬───────┘      └──────┬───────┘
           │                    │                     │
           ▼                    ▼                     │
    ┌─────────────┐      ┌──────────────┐            │
    │ASKING_BUDGET│      │COST_CALCULATOR│           │
    └──────┬──────┘      │(enter details)│           │
           │             └──────┬───────┘            │
           ▼                    │                    │
    ┌─────────────┐             ▼                    │
    │SHOWING_CARS │◄───  SHOW PRICE                  │
    └──────┬──────┘                                  │
           │                                         │
           ├────────────────────────────────────────┘
           │ "Ready to find a car?"
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌──────────┐ ┌──────────┐
│CAR_DETAILS│ │PROCEDURE │
└──────────┘ └──────────┘
```

### 3.2 State Definitions

```python
from enum import Enum
from typing import Optional, List


class ConversationState(Enum):
    """Conversation states - 8 total"""
    GOAL_SELECTION = "goal_selection"  # Q0: What do you want to do?
    START = "start"                     # Path 1: Ask Residency
    ASKING_BUDGET = "asking_budget"     # Path 1: Ask Budget
    SHOWING_CARS = "showing_cars"       # Path 1: Show recommendations
    CAR_DETAILS = "car_details"         # Car detail view
    PROCEDURE_INFO = "procedure_info"   # Path 3: Procedure overview
    COST_CALCULATOR = "cost_calculator" # Path 2: Calculate import cost
    END = "end"


class ConversationContext:
    """Minimal context tracking"""

    def __init__(self):
        self.state: ConversationState = ConversationState.GOAL_SELECTION

        # User goal (from Q0)
        self.goal: Optional[str] = None  # "find_car" | "calculate" | "procedure"

        # Core fields (for path 1)
        self.residency: Optional[str] = None  # "tunisia" | "abroad"
        self.budget_tnd: Optional[float] = None

        # Cost calculator fields (for path 2)
        self.car_model: Optional[str] = None
        self.car_year: Optional[int] = None
        self.car_price_eur: Optional[float] = None

        # Display state
        self.shown_cars: List[str] = []
        self.selected_car_id: Optional[str] = None

        # Language
        self.language: str = "fr"

    def can_show_cars(self) -> bool:
        """Ready to show recommendations"""
        return self.residency is not None and self.budget_tnd is not None
```

### 3.3 State Transition Rules

```python
STATE_TRANSITIONS = {
    ConversationState.GOAL_SELECTION: {
        "goal_find_car": ConversationState.START,
        "goal_calculate": ConversationState.COST_CALCULATOR,
        "goal_procedure": ConversationState.PROCEDURE_INFO,
    },

    ConversationState.START: {
        "residency_answered": ConversationState.ASKING_BUDGET,
    },

    ConversationState.ASKING_BUDGET: {
        "budget_answered": ConversationState.SHOWING_CARS,
    },

    ConversationState.SHOWING_CARS: {
        "select_car": ConversationState.CAR_DETAILS,
        "procedure_request": ConversationState.PROCEDURE_INFO,
        "new_search": ConversationState.ASKING_BUDGET,
    },

    ConversationState.CAR_DETAILS: {
        "back_to_list": ConversationState.SHOWING_CARS,
        "procedure_request": ConversationState.PROCEDURE_INFO,
    },

    ConversationState.PROCEDURE_INFO: {
        "ready_to_find": ConversationState.START,  # Path 3 → Path 1 transition
        "back_to_goals": ConversationState.GOAL_SELECTION,
        "back_to_cars": ConversationState.SHOWING_CARS,
        "done": ConversationState.END,
    },

    ConversationState.COST_CALCULATOR: {
        "car_details_provided": "show_price",  # Show calculated price
        "ready_to_find": ConversationState.START,  # Path 2 → Path 1 transition
        "back_to_goals": ConversationState.GOAL_SELECTION,
    }
}
```

---

## 4. Question Sequence & Logic

### 4.1 Three-Path Wizard

```
Q0: GOAL SELECTION (determines path)
┌──────────────────────────────────────────┐
│ Bienvenue! Qu'est-ce que vous voulez     │
│ faire?                                   │
│                                          │
│ 1. Trouver une voiture                   │
│ 2. Calculer le coût d'import             │
│ 3. Comprendre la procédure               │
└──────────────────────────────────────────┘
         │
    ┌────┴────┬────────────┐
    ▼         ▼            ▼
  Path 1    Path 2       Path 3
    │         │            │
    ▼         ▼            ▼
Q1: RESIDENCY  Enter car   SHOW
    │         details      PROCEDURE
    ▼         │            │
Q2: BUDGET    ▼            ▼
    │       SHOW         "Ready to
    ▼       PRICE         find a car?"
SHOW CARS                  │
                           └─→ Path 1
```

### 4.2 Question Definitions

```python
QUESTIONS = {
    "goal": {
        "id": "goal",
        "required": True,
        "text": {
            "fr": "Bienvenue! Qu'est-ce que vous voulez faire?",
            "ar": "مرحبا! شنوة تحب تعمل؟"
        },
        "options": [
            {"value": "find_car", "label_fr": "Trouver une voiture", "number": 1},
            {"value": "calculate", "label_fr": "Calculer le coût d'import", "number": 2},
            {"value": "procedure", "label_fr": "Comprendre la procédure", "number": 3}
        ]
    },

    "residency": {
        "id": "residency",
        "required": True,
        "text": {
            "fr": "Vous êtes en Tunisie ou à l'étranger?",
            "ar": "في تونس ولا في الخارج؟"
        },
        "options": [
            {"value": "tunisia", "label_fr": "En Tunisie", "number": 1},
            {"value": "abroad", "label_fr": "À l'étranger", "number": 2}
        ]
    },

    "budget": {
        "id": "budget",
        "required": True,
        "text": {
            "fr": "Quel est votre budget en TND?",
            "ar": "قداش ميزانيتك؟"
        },
        "type": "number",
        "suggestions": [
            {"value": 50000, "label_fr": "50k", "number": 1},
            {"value": 70000, "label_fr": "70k", "number": 2},
            {"value": 90000, "label_fr": "90k", "number": 3},
            {"value": 120000, "label_fr": "120k", "number": 4},
            {"value": 150000, "label_fr": "150k", "number": 5},
            {"value": 200000, "label_fr": "200k", "number": 6},
            {"value": 300000, "label_fr": "300k+", "number": 7}
        ]
    },

    "car_details": {
        "id": "car_details",
        "required": True,
        "text": {
            "fr": "Entrez les détails de la voiture:\nModèle, année, prix en €",
            "ar": "أدخل تفاصيل الكرهبة:\nالموديل، السنة، السعر باليورو"
        },
        "type": "text",
        "example": "Golf 7, 2020, 15000€"
    }
}
```

### 4.3 Question Logic

```python
def get_next_question(context: ConversationContext) -> Optional[dict]:
    """Return next question or None if ready for action"""

    # Q0: Goal selection
    if context.goal is None:
        return QUESTIONS["goal"]

    # Path 1: Find car flow
    if context.goal == "find_car":
        if context.residency is None:
            return QUESTIONS["residency"]
        if context.budget_tnd is None:
            return QUESTIONS["budget"]
        return None  # Ready to show cars

    # Path 2: Cost calculator
    if context.goal == "calculate":
        if context.car_model is None:
            return QUESTIONS["car_details"]
        return None  # Ready to show price

    # Path 3: Procedure info
    if context.goal == "procedure":
        return None  # Immediately show procedure

    return None
```

---

## 5. Response Templates

### 5.1 Goal Selection - Q0 (3-4 lines)

```python
GREETINGS = {
    "initial": {
        "fr": """Bienvenue! Qu'est-ce que vous voulez faire?

1. Trouver une voiture
2. Calculer le coût d'import
3. Comprendre la procédure""",

        "ar": """مرحبا! شنوة تحب تعمل؟

1. نلقى كرهبة
2. نحسب كم يكلف الاستيراد
3. نفهم الإجراءات"""
    }
}
```

### 5.2 Residency Question - Q1 (2-3 lines)

```python
RESIDENCY_TEMPLATES = {
    "default": {
        "fr": """Vous êtes en Tunisie ou à l'étranger?

1. En Tunisie
2. À l'étranger""",

        "ar": """في تونس ولا في الخارج؟

1. في تونس
2. في الخارج"""
    }
}
```

### 5.3 Budget Question - Q2 (3-4 lines)

```python
BUDGET_TEMPLATES = {
    "abroad": {
        "fr": """Quel est votre budget total en TND?
💰 Avec le FCR TRE, vous payez 25% des taxes.

1. 50k    2. 70k    3. 90k    4. 120k
5. 150k   6. 200k   7. 300k+"""
    },

    "tunisia": {
        "fr": """Quel est votre budget total en TND?
💰 Programme FCR Famille: taxes réduites (10% au lieu de 30-88%).

1. 50k    2. 70k    3. 90k    4. 120k
5. 150k   6. 200k   7. 300k+"""
    }
}
```

### 5.4 Cost Calculator - Path 2 (2-3 lines)

```python
COST_CALCULATOR_TEMPLATES = {
    "prompt": {
        "fr": """Entrez les détails de la voiture:
Modèle, année, prix en € (ex: Golf 7, 2020, 15000€)""",

        "ar": """أدخل تفاصيل الكرهبة:
الموديل، السنة، السعر باليورو (مثال: Golf 7, 2020, 15000€)"""
    },

    "result": {
        "fr": """{brand} {model} ({year}): {price_eur}€
Transport: ~{shipping}€ | Taxes: {taxes} TND
💰 Total estimé: {total} TND

Prêt à chercher une voiture? [Oui] [Non]"""
    }
}
```

### 5.5 Procedure Overview - Path 3 (4-5 lines)

```python
PROCEDURE_TEMPLATES = {
    "overview": {
        "fr": """Procédure d'import (FCR):
1. Acheter en Europe (max 5 ans, ≤2000cc essence/≤2500cc diesel)
2. Transport maritime (~3-4 semaines)
3. Dédouanement + immatriculation
[Voir documents] [Voir délais]

Prêt à trouver une voiture? [Oui] [Non]"""
    },

    "transition": {
        "fr": """Prêt à chercher une voiture?

1. Oui, trouver une voiture
2. Non, revenir au menu"""
    }
}
```

### 5.6 Car Recommendations (3-4 lines per car)

```python
RECOMMENDATION_TEMPLATES = {
    "car_card": {
        "fr": """{rank}. {brand} {model} ({year})
💰 {price_eur}€ → {total_tnd} TND | {mileage}km
{eligibility_note}
[Détails] [Voir annonce]"""
    },

    "intro": {
        "fr": """Voici {count} voitures pour {budget} TND ({regime}):"""
    },

    "selection_prompt": {
        "fr": """Tapez le numéro (1, 2, 3...) pour voir les détails."""
    }
}
```

### 5.7 Price Breakdown (4 lines max)

```python
PRICE_TEMPLATES = {
    "summary": {
        "fr": """{brand} {model}: {price_eur}€
Transport: ~{shipping}€ | Taxes ({regime}): {taxes} TND
💰 Total: {total} TND
✅ Économie vs local: {savings} TND"""
    }
}
```

### 5.8 Error Templates (2-3 lines)

```python
ERROR_TEMPLATES = {
    "no_results": {
        "fr": """Pas de voitures à ce budget.
Augmentez à {suggested} TND ou élargissez les critères.
[Modifier budget]"""
    },

    "unclear": {
        "fr": """Je peux vous aider avec:
1. Trouver une voiture
2. Calculer le coût d'import
3. Comprendre la procédure"""
    }
}
```

---

## 6. Number Parsing Logic

### 6.1 Global UX Pattern: Numbered Options

Every question with choices follows this pattern:

```
Bot: [Question]
1. [Option A]
2. [Option B]
3. [Option C]

User can respond with:
- Number: "1", "2", "3"
- Full text: "Option A", "option a"
- Partial match: "option", "A"
```

### 6.2 Number Parsing Implementation

```python
from typing import Optional, List, Dict


def parse_numbered_response(user_input: str, options: List[Dict]) -> Optional[str]:
    """
    Parse user input against numbered options.

    Args:
        user_input: Raw user message
        options: List of {"value": str, "label_fr": str, "number": int}

    Returns:
        Matched option value or None
    """
    text = user_input.strip().lower()

    # Try exact number match (e.g., "1", "2", "3")
    if text.isdigit():
        idx = int(text) - 1
        if 0 <= idx < len(options):
            return options[idx]["value"]

    # Try text match (full or partial)
    for opt in options:
        label = opt.get("label_fr", "").lower()
        if text == label or text in label or label in text:
            return opt["value"]

    return None


# Usage example
def handle_goal_selection(user_input: str) -> Optional[str]:
    """Handle Q0 goal selection"""
    options = [
        {"value": "find_car", "label_fr": "Trouver une voiture", "number": 1},
        {"value": "calculate", "label_fr": "Calculer le coût d'import", "number": 2},
        {"value": "procedure", "label_fr": "Comprendre la procédure", "number": 3}
    ]
    return parse_numbered_response(user_input, options)


# Test cases
assert handle_goal_selection("1") == "find_car"
assert handle_goal_selection("2") == "calculate"
assert handle_goal_selection("trouver") == "find_car"
assert handle_goal_selection("CALCULER") == "calculate"
assert handle_goal_selection("procédure") == "procedure"
```

### 6.3 Applying to All Questions

| Question | Options Format |
|----------|---------------|
| Q0: Goal | 1. Trouver  2. Calculer  3. Procédure |
| Q1: Residency | 1. En Tunisie  2. À l'étranger |
| Q2: Budget | 1. 50k  2. 70k  3. 90k  4. 120k  5. 150k  6. 200k  7. 300k+ |
| Car selection | 1. [Car A]  2. [Car B]  3. [Car C] |

---

## 7. Multi-turn Context Management

### 6.1 Context Tracking (Minimal)

```python
class ContextManager:
    """Simplified context management"""

    # Only track essential fields
    TRACKED_FIELDS = ["residency", "budget_tnd", "shown_cars", "selected_car_id"]

    def update_budget(self, new_budget: float, context: ConversationContext) -> str:
        """Handle budget updates"""
        old = context.budget_tnd
        context.budget_tnd = new_budget
        context.shown_cars = []  # Reset recommendations
        return f"✅ Budget: {old:,.0f} → {new_budget:,.0f} TND"

    def summarize(self, context: ConversationContext) -> str:
        """Generate brief context summary"""
        loc = "Tunisie" if context.residency == "tunisia" else "Étranger"
        return f"{loc} | {context.budget_tnd:,.0f} TND"
```

### 6.2 Reference Resolution

```python
def resolve_car_reference(user_message: str, context: ConversationContext) -> Optional[str]:
    """Resolve 'cette voiture', 'la Golf', 'le premier'"""

    patterns = {
        "this": ["cette", "celle-ci", "هاذي"],
        "first": ["premier", "1er", "الأول"],
        "second": ["deuxième", "2ème", "الثاني"],
    }

    message = user_message.lower()

    if any(p in message for p in patterns["this"]):
        return context.shown_cars[-1] if context.shown_cars else None

    if any(p in message for p in patterns["first"]):
        return context.shown_cars[0] if context.shown_cars else None

    if any(p in message for p in patterns["second"]):
        return context.shown_cars[1] if len(context.shown_cars) > 1 else None

    return None
```

---

## 8. Language & Cultural Considerations

### 8.1 Language Detection

```python
def detect_language(text: str) -> str:
    """Detect fr | ar | derja"""
    arabic_chars = len([c for c in text if '\u0600' <= c <= '\u06FF'])
    total = len(text.replace(" ", ""))

    if total == 0:
        return "fr"

    if arabic_chars / total > 0.5:
        return "ar"

    return "fr"


def get_response_language(detected: str) -> str:
    """Always respond in French unless explicitly requested"""
    return "fr"  # Tunisians prefer reading French
```

### 8.2 Derja Vocabulary

```python
DERJA_TERMS = {
    "كرهبة": "voiture",
    "قداش": "combien",
    "نجيب": "importer",
    "باهي": "d'accord",
}
```

---

## 9. Error Handling & Fallbacks

### 9.1 Error Responses (2-3 lines each)

```python
ERROR_RESPONSES = {
    "ambiguous": """Je n'ai pas compris. Reformulez ou choisissez:
[Voir voitures] [Calculer prix] [Procédure]""",

    "no_cars": """Pas de résultats pour {budget} TND.
[Augmenter budget] [Modifier critères]""",

    "out_of_scope": """Je suis spécialisé dans l'import auto en Tunisie.
[Voir voitures] [Calculer prix]"""
}
```

### 9.2 Fallback Flow

```python
def handle_error(error_type: str, context: ConversationContext) -> str:
    """Return appropriate short error response"""
    return ERROR_RESPONSES.get(error_type, ERROR_RESPONSES["ambiguous"])
```

---

## 10. Sample Conversations

### 10.1 Scenario: Path 1 - TRE Quick Flow (with Q0)

```
USER: Bonjour

BOT: Bienvenue! Qu'est-ce que vous voulez faire?

     1. Trouver une voiture
     2. Calculer le coût d'import
     3. Comprendre la procédure

USER: 1

BOT: Vous êtes en Tunisie ou à l'étranger?

     1. En Tunisie
     2. À l'étranger

USER: 2

BOT: Quel est votre budget en TND?
     💰 FCR TRE: vous payez 25% des taxes.

     1. 50k    2. 70k    3. 90k    4. 120k+

USER: 100 000

BOT: 3 voitures pour 100k TND (FCR TRE):

     1. VW Golf 1.4 TSI (2022)
        💰 19,500€ → 82,000 TND | 45km

     2. Peugeot 308 (2022)
        💰 17,800€ → 76,000 TND | 38km

     3. Toyota Corolla (2021)
        💰 21,000€ → 88,000 TND | 52km

     Tapez le numéro (1, 2, 3) pour voir les détails.

USER: 1

BOT: VW Golf 1.4 TSI: 19,500€
     Transport: ~1,200€ | Taxes (25%): ~10,500 TND
     💰 Total: ~82,000 TND
     ✅ Économie vs local: ~63,000 TND
```

### 10.2 Scenario: Path 2 - Cost Calculator

```
USER: Salut

BOT: Bienvenue! Qu'est-ce que vous voulez faire?

     1. Trouver une voiture
     2. Calculer le coût d'import
     3. Comprendre la procédure

USER: 2

BOT: Entrez les détails de la voiture:
     Modèle, année, prix en € (ex: Golf 7, 2020, 15000€)

USER: Peugeot 308, 2021, 18000€

BOT: Peugeot 308 (2021): 18,000€
     Transport: ~1,100€ | Taxes: ~9,800 TND
     💰 Total estimé: 78,000 TND

     Prêt à chercher une voiture?
     1. Oui, trouver une voiture
     2. Non, revenir au menu

USER: 1

BOT: Vous êtes en Tunisie ou à l'étranger?

     1. En Tunisie
     2. À l'étranger

[Continues to Path 1 flow...]
```

### 10.3 Scenario: Path 3 - Procedure Info

```
USER: Bonjour

BOT: Bienvenue! Qu'est-ce que vous voulez faire?

     1. Trouver une voiture
     2. Calculer le coût d'import
     3. Comprendre la procédure

USER: 3

BOT: Procédure d'import (FCR):
     1. Acheter en Europe (max 5 ans, ≤2000cc essence/≤2500cc diesel)
     2. Transport maritime (~3-4 semaines)
     3. Dédouanement + immatriculation

     Prêt à trouver une voiture?
     1. Oui, trouver une voiture
     2. Non, revenir au menu

USER: oui

BOT: Vous êtes en Tunisie ou à l'étranger?

     1. En Tunisie
     2. À l'étranger

[Continues to Path 1 flow...]
```

### 10.4 Scenario: Résident Tunisie (Path 1)

```
USER: Salam

BOT: Bienvenue! Qu'est-ce que vous voulez faire?

     1. Trouver une voiture
     2. Calculer le coût d'import
     3. Comprendre la procédure

USER: trouver une voiture

BOT: Vous êtes en Tunisie ou à l'étranger?

     1. En Tunisie
     2. À l'étranger

USER: 1

BOT: Quel est votre budget en TND?
     💰 Programme FCR Famille: taxes 10% (au lieu de 30-88%).

     1. 50k    2. 70k    3. 90k    4. 120k+

USER: 60 mille

BOT: 3 voitures pour 60k TND (FCR Famille):

     1. BYD Dolphin (2023)
        💰 15,500€ → 56,000 TND | 25km
        ✅ Électrique: 0% taxe conso

     2. Dacia Sandero (2022)
        💰 12,000€ → 52,000 TND | 35km

     3. Peugeot 208 (2021)
        💰 13,500€ → 58,000 TND | 42km

     Tapez le numéro (1, 2, 3) pour voir les détails.
```

### 10.5 Scenario: Budget Update

```
USER: En fait mon budget c'est 80 000

BOT: ✅ Budget: 60,000 → 80,000 TND

     3 voitures pour 80k TND:

     1. Hyundai Tucson (2022)
        💰 18,000€ → 75,000 TND | 40km

     2. ...

     Tapez le numéro pour voir les détails.
```

### 10.6 Scenario: Comparison Request

```
USER: Import ou local c'est mieux?

BOT: VW Golf - Import vs Local:
     Import FCR: ~82,000 TND (occasion 2022)
     Local neuf: ~145,000 TND
     💰 Économie: 63,000 TND (43%)
     ❌ Pas de garantie | ✅ Disponible de suite (local)
```

### 10.7 Scenario: High Budget (300k TND)

```
USER: Bonjour

BOT: Bienvenue! Qu'est-ce que vous voulez faire?

     1. Trouver une voiture
     2. Calculer le coût d'import
     3. Comprendre la procédure

USER: 1

BOT: Vous êtes en Tunisie ou à l'étranger?

     1. En Tunisie
     2. À l'étranger

USER: 2

BOT: Quel est votre budget en TND?
     💰 FCR TRE: vous payez 25% des taxes.

     1. 50k    2. 70k    3. 90k    4. 120k
     5. 150k   6. 200k   7. 300k+

USER: 300000

BOT: 💡 BUDGET ÉLEVÉ: Avec 300k TND, vous avez plusieurs options:

     1. FCR TRE (25% taxes) - voitures jusqu'à ~77,000€
        ⚠️ Limité aux moteurs ≤2000cc essence / ≤2500cc diesel

     2. Import Régulier (~150% taxes) - voitures jusqu'à ~55,000€
        ✅ Pas de limite moteur

     3. Véhicule Électrique (7% TVA) - voitures jusqu'à ~90,000€
        ✅ Pas de limite, taxes minimales

     Quel type vous intéresse?
     1. FCR (moteur standard)
     2. Électrique
     3. Tous types

USER: 1

BOT: 3 voitures pour 300k TND (FCR TRE):

     1. BMW 320i (2023)
        💰 55,000€ → 235,000 TND | 25km
        ⚠️ Vérifiez: moteur 2.0L à la limite FCR

     2. Mercedes A250 (2023)
        💰 48,000€ → 205,000 TND | 30km
        ✅ Moteur 2.0L compatible FCR

     3. Audi A4 40 TFSI (2022)
        💰 52,000€ → 222,000 TND | 38km
        ✅ Moteur 2.0L compatible FCR

     💡 Note: À ce budget, la plupart des voitures >50k€
     dépassent les limites FCR. Considérez un VE pour
     plus de choix sans contrainte moteur.

     Tapez le numéro (1, 2, 3) pour voir les détails.
```

---

## 11. Persona & Tone Guidelines

### 11.1 Bot Persona

```yaml
Persona:
  name: "KarTN"
  role: "Assistant import auto Tunisie"

  style:
    - Direct et concis
    - Pas de décoration inutile
    - Factuel

  avoid:
    - Réponses longues
    - Emojis décoratifs
    - Ton condescendant
```

### 11.2 Response Length Guidelines

```python
RESPONSE_LENGTH = {
    "greeting": {"target": "2-3 lines", "max": "3 lines"},
    "car_list": {"target": "3-4 lines per car", "max": "4 lines"},
    "price_breakdown": {"target": "4 lines", "max": "4 lines"},
    "procedure": {"target": "4 lines", "max": "4 lines"},
    "error": {"target": "2-3 lines", "max": "3 lines"},
}
```

### 11.3 Emoji Guidelines

```python
EMOJI_GUIDELINES = {
    "allowed": ["✅", "❌", "💰"],  # Success, failure, money only
    "max_per_message": 3,

    "usage": {
        "✅": "Positive info, eligibility met",
        "❌": "Negative info, eligibility not met",
        "💰": "Price/savings highlight"
    }
}
```

### 11.4 Tone Examples

```python
TONE_EXAMPLES = {
    "good": {
        "greeting": "Bienvenue! Vous êtes en Tunisie ou à l'étranger?",
        "price": "Total: 82,000 TND. Économie vs local: 63,000 TND.",
        "no_results": "Pas de voitures à ce budget. Augmentez ou modifiez."
    },

    "avoid": {
        "greeting": "🚗 Bienvenue sur l'Assistant Voiture Tunisie! 🎉 Je suis là pour vous aider...",
        "price": "💰 Excellente nouvelle! Voici le détail complet et exhaustif...",
        "no_results": "😕 Malheureusement, je n'ai pas trouvé de véhicules..."
    }
}
```

---

## Quick Reference Summary

### Flow Cheat Sheet

```
Q0: Goal Selection
├── 1. Find car    → Q1: Residency → Q2: Budget → SHOW CARS
├── 2. Calculate   → Enter details → SHOW PRICE → [Offer path 1]
└── 3. Procedure   → SHOW PROCEDURE → [Offer path 1]
```

### Questions Required

| Path | Questions |
|------|-----------|
| Path 1: Find car | Goal + Residency + Budget (3) |
| Path 2: Calculate | Goal + Car details (2) |
| Path 3: Procedure | Goal only (1) |

### States Count

| Version | States |
|---------|--------|
| Previous | 6 |
| Current | 8 (added GOAL_SELECTION, COST_CALCULATOR) |

### Response Length

| Type | Lines |
|------|-------|
| Q0 Goal | 4-5 |
| Q1 Residency | 3-4 |
| Q2 Budget | 3-4 |
| Car card | 3-4 |
| Price | 4 |
| Procedure | 5 |
| Error | 2-3 |

### Numbered Options Pattern

All questions with choices use numbered format:
```
1. Option A    2. Option B    3. Option C
```
User can respond with: "1", "2", "Option A", "option a"

### Emojis Allowed

- ✅ Success/eligible
- ❌ Failure/not eligible
- 💰 Money/savings

---

## Change Log

| Date | Change |
|------|--------|
| 2026-01-26 | Initial chatbot flow KB created |
| 2026-01-29 | Simplified to 2-question wizard |
|  | Reduced states from 25+ to 6 |
|  | Set response max to 2-4 lines |
|  | Limited emojis to ✅❌💰 only |
|  | Removed upfront eligibility verification |
|  | Rewrote all sample conversations |
| 2026-01-29 | Added Q0 Goal Selection with 3 paths |
|  | States increased from 6 to 8 |
|  | Added numbered options pattern globally |
|  | Added Path 2 (Cost Calculator) |
|  | Added Path 3 → Path 1 transitions |
|  | Added number parsing logic section |
|  | Updated all sample conversations with Q0 |
| 2026-01-29 | Extended budget options to 300k+ TND |
|  | Added high-budget scenario (10.7) |
|  | Updated budget templates with 7 tiers |

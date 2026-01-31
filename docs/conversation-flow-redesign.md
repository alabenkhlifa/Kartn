# Conversation Flow

## GOAL_SELECTION

```
GOAL_SELECTION
       │
       ├── 1. Buy a car        ✓
       ├── 2. FCR procedures   ✓
       ├── 3. Compare cars     ✓
       ├── 4. EV info          ✓
       ├── 5. Browse offers    ✓
       └── 6. Popular cars     ✓
```

## Persistence

- Conversations persist across page reloads
- "New Conversation" button to start fresh
- If car data has changed (due to scraping updates):
  - Block message input
  - Only option: start a new conversation

## END_CONVERSATION

- Shows "New Conversation" button
- User cannot continue, must start fresh

## Option 1: Buy a Car

```
GOAL_SELECTION
       │
       └── 1. Buy a car
               │
               ▼
       BUY_LOCATION_SELECTION
               │
               ├── a. From Tunisia
               │       │
               │       ▼
               │   CONDITION_SELECTION
               │       │
               │       ├── New
               │       ├── Used
               │       └── Don't matter
               │               │
               │               ▼
               │       FUEL_TYPE_SELECTION
               │       (options + "Don't matter")
               │               │
               │               ▼
               │       BODY_TYPE_SELECTION
               │       (options + "Don't matter")
               │               │
               │               ▼
               │       BUDGET_SELECTION
               │               │
               │               ▼
               │       SHOW_RESULTS (5 cars)
               │       - Score (x/100 matching needs)
               │       - Photo (if available)
               │       - Price, year, mileage, etc.
               │       - Expandable for more details
               │       - Link to original offer
               │       (if no matches: "No cars match your criteria")
               │               │
               │               ▼
               │       MORE_RESULTS_PROMPT
               │       (loop until all shown)
               │
               └── b. From Abroad
                       │
                       ▼
                   ABROAD_OPTION_SELECTION
                       │
                       ├── FCR TRE (Tunisian Resident Abroad) ──┐
                       ├── FCR Famille (Law 55) ────────────────┼──▶ CONDITION_SELECTION ──▶ (same flow as 1.a)
                       ├── Check FCR TRE eligibility ──▶ (same as Option 2.a flow)           (shows all Europe cars)
                       ├── Check FCR Famille eligibility ──▶ (same as Option 2.b flow)
                       └── Just see offers ─────────────────────┘
```

## Option 2: FCR Procedures

```
GOAL_SELECTION
       │
       └── 2. FCR procedures
               │
               ▼
       FCR_TYPE_SELECTION
               │
               ├── a. FCR TRE (Tunisian Resident Abroad)
               │       │
               │       ▼
               │   FCR_TRE_QUESTIONS
               │   (follow embedded data flow)
               │   - How long have you been living abroad?
               │   - ...other questions from embedded data
               │       │
               │       ▼
               │   SHOW_FCR_TRE_INFO
               │   (personalized response based on answers)
               │       │
               │       ▼
               │   END_CONVERSATION
               │
               └── b. FCR Famille (2026 LAW)
                       │
                       ▼
                   FCR_FAMILLE_QUESTIONS
                   (follow embedded data flow)
                   - Do you have a car younger than 8 years?
                   - Do you have a voiture populaire?
                   - ...other eligibility questions from embedded data
                       │
                       ▼
                   SHOW_FCR_FAMILLE_ELIGIBILITY
                   (personalized eligibility response based on answers)
                       │
                       ▼
                   END_CONVERSATION
```

## Option 3: Compare Cars

```
GOAL_SELECTION
       │
       └── 3. Compare cars
               │
               ▼
       CAR_COMPARISON_INPUT
       (user enters 2 cars, e.g. "Golf 2019 1.2 Petrol vs Golf 2019 1.6 Diesel")
               │
               ▼
       SHOW_COMPARISON_TABLE
       (LLM generates comprehensive comparison table)
               │
               ▼
       END_CONVERSATION
```

## Option 4: EV Info

```
GOAL_SELECTION
       │
       └── 4. EV info
               │
               ▼
       EV_TOPIC_SELECTION
               │
               ├── a. Learn more about Hybrid, PHEV or EV
               │       │
               │       ▼
               │   SHOW_EV_DIFFERENCES
               │   (brief explanation of Hybrid vs PHEV vs EV)
               │       │
               │       ▼
               │   END_CONVERSATION
               │
               ├── b. New EV Law
               │       │
               │       ▼
               │   SHOW_EV_LAW_INFO
               │   (from embedded data)
               │       │
               │       ▼
               │   END_CONVERSATION
               │
               ├── c. Charging stations
               │       │
               │       ▼
               │   SHOW_CHARGING_STATIONS_COUNT
               │   (X stations from embedded data)
               │       │
               │       ▼
               │   LOCATION_SELECTION
               │   (only show locations with charging stations)
               │       │
               │       ▼
               │   SHOW_CITY_STATIONS
               │   - Count of stations in selected city
               │   - List of stations with:
               │     - Name
               │     - Location
               │     - Charging power (if available)
               │     - Number of spots (if available)
               │       │
               │       ▼
               │   END_CONVERSATION
               │
               └── d. Installing solar panels
                       │
                       ▼
                   SHOW_SOLAR_PANELS_INFO
                   (from embedded data)
                       │
                       ▼
                   END_CONVERSATION
```

## Option 5: Browse Offers

```
GOAL_SELECTION
       │
       └── 5. Browse offers
               │
               ▼
       ORIGIN_SELECTION
               │
               ├── a. Tunisian Cars
               └── b. European Cars
                       │
                       ▼
             CONDITION_SELECTION
                       │
                       ├── Used
                       ├── New
                       └── Don't matter
                               │
                               ▼
                   FUEL_TYPE_SELECTION
                   (options + "Don't matter")
                               │
                               ▼
                   BODY_TYPE_SELECTION
                   (options + "Don't matter")
                               │
                               ▼
                     BUDGET_SELECTION
                               │
                               ▼
                      SHOW_RESULTS (5 cars)
                      - Score (x/100 matching needs)
                      - Photo (if available)
                      - Price, year, mileage, etc.
                      - Expandable for more details
                      - Link to original offer
                      (if no matches: "No cars match your criteria")
                               │
                               ▼
                   MORE_RESULTS_PROMPT
                     (loop until all shown)
```

## Option 6: Popular Cars (Subsidized)

```
GOAL_SELECTION
       │
       └── 6. Popular cars
               │
               ▼
       POPULAR_CARS_SELECTION
               │
               ├── a. Check my eligibility
               │       │
               │       ▼
               │   POPULAR_CAR_ELIGIBILITY_QUESTIONS
               │   (from embedded data)
               │   - What is your salary?
               │   - ...other eligibility questions
               │       │
               │       ▼
               │   SHOW_ELIGIBILITY_RESULT
               │   (eligible or not, with explanation)
               │       │
               │       ▼
               │   END_CONVERSATION
               │
               └── b. See available models in Tunisia
                       │
                       ▼
                   SHOW_POPULAR_MODELS
                   (from car database where is_populaire = true)
                       │
                       ▼
                   END_CONVERSATION
```
# Chat Function Testing Commands

## Prerequisites

Start the edge function locally:
```bash
npx supabase functions serve chat --env-file supabase/.env.local
```

## Quick Tests

### All Languages Welcome Message
```bash
echo "=== French ===" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d '{"message": "Bonjour"}' | jq -r '.message' && \
echo "" && \
echo "=== Arabic ===" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d '{"message": "مرحبا"}' | jq -r '.message' && \
echo "" && \
echo "=== Derja ===" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d '{"message": "أحكيلي"}' | jq -r '.message'
```

## Full Flow Tests

### Car Search Wizard (TRE)
```bash
echo "=== FLOW: Car Search Wizard (TRE) ===" && \
echo "" && \
echo "Step 1: Greeting" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d '{"message": "Bonjour"}' > /tmp/resp1.json && \
cat /tmp/resp1.json | jq -r '.message' && \
CONV_ID=$(cat /tmp/resp1.json | jq -r '.conversation_id') && \
echo "" && \
echo "Step 2: Select option 1 (Find car)" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d "{\"message\": \"1\", \"conversation_id\": \"$CONV_ID\"}" > /tmp/resp2.json && \
cat /tmp/resp2.json | jq -r '.message' && \
echo "" && \
echo "Step 3: Select residency 2 (TRE)" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d "{\"message\": \"2\", \"conversation_id\": \"$CONV_ID\"}" > /tmp/resp3.json && \
cat /tmp/resp3.json | jq -r '.message' && \
echo "" && \
echo "Step 4: Enter budget 70000" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d "{\"message\": \"70000\", \"conversation_id\": \"$CONV_ID\"}" > /tmp/resp4.json && \
cat /tmp/resp4.json | jq -r '.message'
```

### Car Search (Tunisia Resident)
```bash
echo "=== FLOW: Car Search (Tunisia Resident) ===" && \
echo "" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d '{"message": "Bonjour"}' > /tmp/tn1.json && \
CONV_ID=$(cat /tmp/tn1.json | jq -r '.conversation_id') && \
echo "Step 1: Greeting -> Step 2: Option 1" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d "{\"message\": \"1\", \"conversation_id\": \"$CONV_ID\"}" > /tmp/tn2.json && \
cat /tmp/tn2.json | jq -r '.message' && \
echo "" && \
echo "Step 3: Select residency 1 (Tunisia)" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d "{\"message\": \"1\", \"conversation_id\": \"$CONV_ID\"}" > /tmp/tn3.json && \
cat /tmp/tn3.json | jq -r '.message' && \
echo "" && \
echo "Step 4: Budget option 1 (50k)" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d "{\"message\": \"1\", \"conversation_id\": \"$CONV_ID\"}" > /tmp/tn4.json && \
cat /tmp/tn4.json | jq -r '.message'
```

### Cost Calculator Flow
```bash
echo "=== FLOW: Cost Calculator ===" && \
echo "" && \
echo "Step 1: Greeting" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d '{"message": "Bonjour"}' > /tmp/cost1.json && \
cat /tmp/cost1.json | jq -r '.message' && \
CONV_ID=$(cat /tmp/cost1.json | jq -r '.conversation_id') && \
echo "" && \
echo "Step 2: Select option 2 (Cost calculator)" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d "{\"message\": \"2\", \"conversation_id\": \"$CONV_ID\"}" > /tmp/cost2.json && \
cat /tmp/cost2.json | jq -r '.message'
```

### Procedures Flow
```bash
echo "=== FLOW: Procedures ===" && \
echo "" && \
echo "Step 1: Greeting" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d '{"message": "Bonjour"}' > /tmp/proc1.json && \
cat /tmp/proc1.json | jq -r '.message' && \
CONV_ID=$(cat /tmp/proc1.json | jq -r '.conversation_id') && \
echo "" && \
echo "Step 2: Select option 3 (Procedures)" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d "{\"message\": \"3\", \"conversation_id\": \"$CONV_ID\"}" > /tmp/proc2.json && \
cat /tmp/proc2.json | jq -r '.message'
```

### Arabic Flow
```bash
echo "=== FLOW: Arabic ===" && \
echo "" && \
echo "Step 1: Arabic greeting" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d '{"message": "مرحبا"}' > /tmp/ar1.json && \
cat /tmp/ar1.json | jq -r '.message' && \
CONV_ID=$(cat /tmp/ar1.json | jq -r '.conversation_id') && \
echo "" && \
echo "Step 2: Select 1 (car search)" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d "{\"message\": \"1\", \"conversation_id\": \"$CONV_ID\"}" > /tmp/ar2.json && \
cat /tmp/ar2.json | jq -r '.message'
```

## Run All Tests
```bash
# Run all flows sequentially
echo "========================================" && \
echo "        CHAT FUNCTION TEST SUITE       " && \
echo "========================================" && \
echo "" && \
echo "=== French ===" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d '{"message": "Bonjour"}' | jq -r '.message' && \
echo "" && \
echo "=== Arabic ===" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d '{"message": "مرحبا"}' | jq -r '.message' && \
echo "" && \
echo "=== Derja ===" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d '{"message": "أحكيلي"}' | jq -r '.message' && \
echo "" && \
echo "=== Car Search (TRE) Full Flow ===" && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d '{"message": "Bonjour"}' > /tmp/resp1.json && \
CONV_ID=$(cat /tmp/resp1.json | jq -r '.conversation_id') && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d "{\"message\": \"1\", \"conversation_id\": \"$CONV_ID\"}" > /tmp/resp2.json && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d "{\"message\": \"2\", \"conversation_id\": \"$CONV_ID\"}" > /tmp/resp3.json && \
curl -s 'http://127.0.0.1:54321/functions/v1/chat' -H 'Content-Type: application/json' -d "{\"message\": \"70000\", \"conversation_id\": \"$CONV_ID\"}" > /tmp/resp4.json && \
cat /tmp/resp4.json | jq -r '.message' && \
echo "" && \
echo "=== All tests completed ==="
```

---

# Recommend Function Testing Commands

## Prerequisites

Start the edge functions locally:
```bash
npx supabase functions serve --env-file supabase/.env.local
```

## API Endpoint

```
POST http://127.0.0.1:54321/functions/v1/recommend
```

Required headers:
- `Content-Type: application/json`
- `Authorization: Bearer <anon_key>`

## Quick Tests

### Test with specific filters (essence + used + SUV)
```bash
curl -s 'http://127.0.0.1:54321/functions/v1/recommend' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  -d '{
    "filters": {
      "fuel_type": "essence",
      "condition": "used",
      "body_type": "suv",
      "budget_tnd": 100000
    },
    "limit": 5,
    "include_cost_breakdown": true
  }' | jq '.'
```

### Test with "Don't matter" filters (all 'any')
```bash
curl -s 'http://127.0.0.1:54321/functions/v1/recommend' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  -d '{
    "filters": {
      "fuel_type": "any",
      "condition": "any",
      "body_type": "any",
      "budget_tnd": 80000
    },
    "limit": 5
  }' | jq '.'
```

### Test with mixed filters (diesel + any condition + any body)
```bash
curl -s 'http://127.0.0.1:54321/functions/v1/recommend' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  -d '{
    "filters": {
      "fuel_type": "diesel",
      "condition": "any",
      "body_type": "any",
      "budget_tnd": 120000
    },
    "limit": 5
  }' | jq '.'
```

### Test electric cars only
```bash
curl -s 'http://127.0.0.1:54321/functions/v1/recommend' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  -d '{
    "filters": {
      "fuel_type": "electric",
      "condition": "any",
      "body_type": "any",
      "budget_tnd": 100000
    },
    "limit": 5
  }' | jq '.'
```

### Test new cars only
```bash
curl -s 'http://127.0.0.1:54321/functions/v1/recommend' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  -d '{
    "filters": {
      "fuel_type": "any",
      "condition": "new",
      "body_type": "any",
      "budget_tnd": 150000
    },
    "limit": 5
  }' | jq '.'
```

## Verification Tests

### Verify multi-factor scoring (score breakdown visible)
```bash
curl -s 'http://127.0.0.1:54321/functions/v1/recommend' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  -d '{
    "filters": {
      "fuel_type": "any",
      "condition": "any",
      "body_type": "any",
      "budget_tnd": 100000
    },
    "limit": 3
  }' | jq '.recommendations[] | {brand: .car.brand, model: .car.model, score: .score, strength: .recommendation_strength, breakdown: .score_breakdown}'
```

### Verify diversity check (max 2 of same model)
```bash
curl -s 'http://127.0.0.1:54321/functions/v1/recommend' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  -d '{
    "filters": {
      "fuel_type": "essence",
      "condition": "used",
      "body_type": "suv",
      "budget_tnd": 100000
    },
    "limit": 10
  }' | jq '[.recommendations[] | "\(.car.brand) \(.car.model)"] | group_by(.) | map({model: .[0], count: length})'
```

### Verify sorting by score (highest first)
```bash
curl -s 'http://127.0.0.1:54321/functions/v1/recommend' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
  -d '{
    "filters": {
      "fuel_type": "any",
      "condition": "any",
      "body_type": "any",
      "budget_tnd": 150000
    },
    "limit": 10
  }' | jq '[.recommendations[].score]'
```

## Expected Response Structure

```json
{
  "total": 63,
  "limit": 5,
  "offset": 0,
  "recommendations": [
    {
      "car": {
        "id": "autoscout24_xxx",
        "brand": "Toyota",
        "model": "yaris",
        "year": 2024,
        "price_eur": 15000,
        "fuel_type": "essence",
        "mileage_km": 20000,
        "body_type": "Kleinwagen",
        "country": "DE",
        "source": "autoscout24",
        "fcr_tre_eligible": true,
        "fcr_famille_eligible": true
      },
      "rank": 1,
      "estimated_total_tnd": 65000,
      "score": 85.5,
      "score_breakdown": {
        "price_fit": 23,
        "age": 18,
        "mileage": 11,
        "reliability": 14,
        "parts_availability": 9,
        "fuel_efficiency": 7,
        "preference_match": 2.5,
        "practicality": 2
      },
      "recommendation_strength": "excellent",
      "fcr_eligible": {
        "tre": true,
        "famille": true
      }
    }
  ]
}
```

## Scoring System Reference

| Factor             | Max Points | Description                          |
|--------------------|------------|--------------------------------------|
| Price fit          | 23         | Sweet spot at 70-90% of budget       |
| Age                | 18         | Newer cars score higher              |
| Mileage            | 14         | Lower mileage = better               |
| Reliability        | 15         | Brand reputation (Toyota=14, Fiat=9) |
| Parts availability | 10         | Local market presence                |
| Fuel efficiency    | 10         | EV=7 when "any", EV=10 when selected |
| Preference match   | 5          | Matches user's specific filters      |
| Practicality       | 5          | Local TN=5, EU imports=2, other=1    |

**Key behaviors:**
- FCR regime: Cost estimation respects user's `fcr_regime` parameter (regime_commun = full import taxes)
- Electric bias: When `fuel_type=any`, EVs score 7 (same as efficient thermals), not 10
- Local bonus: Tunisian cars get +5 practicality points for immediate availability

**Recommendation strength:**
- Excellent: score >= 75
- Good: score 60-74
- Fair: score 45-59
- Poor: score < 45

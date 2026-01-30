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

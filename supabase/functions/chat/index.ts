import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { classifyQuery } from './classifier.ts';
import { generateResponse, getOffTopicResponse } from './generator.ts';
import { retrieve } from './retrieval.ts';
import { getOrCreateConversation, updateConversation, getNextState } from './state.ts';
import { getTemplate, formatScoredCarResults, formatCalculationResult, getProcedureDetail } from './templates.ts';
import { parseGoal, parseCarOrigin, parseResidency, parseBudget, parseFcrFamille, parseFuelType, parseCarType, parseCondition, parsePrice, parseEngineCC, parseCalcFuelType, parseYesNo, parseProcedure, isGreeting, isReset } from './parser.ts';
import { rankCars, getTopRecommendations } from './scoring.ts';
import { ChatRequest, ChatResponse, ConversationState, Language, CalcFuelType } from './types.ts';
import { calculateTax, compareFCRRegimes } from './calculator.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse request
    const body: ChatRequest = await req.json();
    const { message, conversation_id } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const huggingfaceKey = Deno.env.get('HUGGINGFACE_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    if (!groqApiKey) {
      throw new Error('Missing GROQ_API_KEY environment variable');
    }

    if (!huggingfaceKey) {
      throw new Error('Missing HUGGINGFACE_API_KEY environment variable');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing message: "${message.substring(0, 100)}..."`);

    // Step 1: Get or create conversation
    const conversation = await getOrCreateConversation(conversation_id, supabase);
    console.log(`Conversation ${conversation.id}: state=${conversation.state}`);

    // Step 2: Detect language (quick classification)
    const classification = await classifyQuery(message, groqApiKey);
    let language: Language = classification.language;

    // Only update language if classifier has high confidence
    // Numbers like "1", "2" produce low confidence and should not override stored language
    if (conversation.language !== language && classification.confidence >= 0.7) {
      await updateConversation(conversation.id, { language }, supabase);
      conversation.language = language;
    } else if (classification.confidence < 0.7) {
      // Preserve existing conversation language for ambiguous inputs
      language = conversation.language;
    }

    // Step 3: Handle reset or greeting
    if (isReset(message) || (isGreeting(message) && conversation.state === 'goal_selection')) {
      await updateConversation(conversation.id, {
        state: 'goal_selection',
        goal: null,
        car_origin: null,
        residency: null,
        fcr_famille: false,
        fuel_preference: null,
        car_type_preference: null,
        condition_preference: null,
        budget_tnd: null,
        calc_price_eur: null,
        calc_engine_cc: null,
        calc_fuel_type: null,
        selected_procedure: null,
      }, supabase);

      return sendResponse({
        message: getTemplate('goal_selection', language),
        intent: 'general_info',
        language,
        conversation_id: conversation.id,
      });
    }

    // Step 4: Process based on current state
    let newState: ConversationState = conversation.state;
    let responseMessage: string;

    switch (conversation.state) {
      case 'goal_selection': {
        const goal = parseGoal(message);
        if (goal) {
          newState = getNextState('goal_selection', { goal });
          await updateConversation(conversation.id, { state: newState, goal }, supabase);
          responseMessage = getTemplate(newState, language);
        } else {
          // Didn't understand, show options again
          responseMessage = getTemplate('goal_selection', language);
        }
        break;
      }

      case 'asking_car_origin': {
        const carOrigin = parseCarOrigin(message);
        if (carOrigin) {
          newState = getNextState('asking_car_origin', { carOrigin });
          await updateConversation(conversation.id, { state: newState, car_origin: carOrigin }, supabase);
          conversation.car_origin = carOrigin;
          responseMessage = getTemplate(newState, language);
        } else {
          responseMessage = getTemplate('asking_car_origin', language);
        }
        break;
      }

      case 'asking_residency': {
        const residency = parseResidency(message);
        if (residency) {
          newState = getNextState('asking_residency', { residency });
          await updateConversation(conversation.id, { state: newState, residency }, supabase);
          responseMessage = getTemplate(newState, language);
        } else {
          responseMessage = getTemplate('asking_residency', language);
        }
        break;
      }

      case 'asking_fcr_famille': {
        const fcrFamille = parseFcrFamille(message);
        if (fcrFamille !== null) {
          newState = getNextState('asking_fcr_famille', { hasFcrFamille: true });
          await updateConversation(conversation.id, { state: newState, fcr_famille: fcrFamille }, supabase);
          conversation.fcr_famille = fcrFamille;
          responseMessage = getTemplate(newState, language);
        } else {
          responseMessage = getTemplate('asking_fcr_famille', language);
        }
        break;
      }

      case 'asking_fuel_type': {
        const fuelType = parseFuelType(message);
        if (fuelType) {
          newState = getNextState('asking_fuel_type', { hasFuelType: true });
          await updateConversation(conversation.id, { state: newState, fuel_preference: fuelType }, supabase);
          conversation.fuel_preference = fuelType;
          responseMessage = getTemplate(newState, language);
        } else {
          responseMessage = getTemplate('asking_fuel_type', language);
        }
        break;
      }

      case 'asking_car_type': {
        const carType = parseCarType(message);
        if (carType) {
          const isTunisiaFlow = conversation.car_origin === 'tunisia';
          newState = getNextState('asking_car_type', { hasCarType: true, isTunisiaFlow });
          await updateConversation(conversation.id, { state: newState, car_type_preference: carType }, supabase);
          conversation.car_type_preference = carType;

          // For Tunisia flow, we go directly to showing_cars
          if (newState === 'showing_cars') {
            // Build search filters for Tunisia flow
            const searchFilters: import('./types.ts').CarSearchFilters = {
              budget_max: conversation.budget_tnd || undefined,
              country: 'TN', // Local market only
            };

            // Apply fuel type preference
            if (conversation.fuel_preference && conversation.fuel_preference !== 'any') {
              searchFilters.fuel_type = conversation.fuel_preference as 'essence' | 'diesel' | 'electric' | 'hybrid' | 'hybrid_rechargeable';
            }

            // Apply car type preference
            if (carType !== 'any') {
              const carTypeToBodyType: Record<string, string> = {
                suv: 'suv',
                sedan: 'berline',
                compact: 'citadine',
              };
              searchFilters.body_type = (carTypeToBodyType[carType] || carType) as 'suv' | 'berline' | 'citadine' | 'break' | 'monospace' | 'compact';
            }

            // Apply condition preference
            if (conversation.condition_preference && conversation.condition_preference !== 'any') {
              searchFilters.condition = conversation.condition_preference as 'new' | 'used';
            }

            // Search for cars
            const context = await retrieve(
              `voiture budget ${conversation.budget_tnd} TND`,
              'car_search',
              searchFilters,
              supabase,
              huggingfaceKey
            );

            // Score and rank the cars
            const rankedCars = rankCars(context.cars, conversation);
            const topRecommendations = getTopRecommendations(rankedCars, 5);

            responseMessage = formatScoredCarResults(topRecommendations, language);

            return sendResponse({
              message: responseMessage,
              intent: 'car_search',
              language,
              conversation_id: conversation.id,
              cars: topRecommendations,
            });
          }

          responseMessage = getTemplate(newState, language);
        } else {
          responseMessage = getTemplate('asking_car_type', language);
        }
        break;
      }

      case 'asking_condition': {
        const condition = parseCondition(message);
        if (condition) {
          newState = getNextState('asking_condition', { hasCondition: true });
          await updateConversation(conversation.id, { state: newState, condition_preference: condition }, supabase);
          conversation.condition_preference = condition;
          responseMessage = getTemplate(newState, language);
        } else {
          responseMessage = getTemplate('asking_condition', language);
        }
        break;
      }

      case 'asking_budget': {
        const budget = parseBudget(message);
        if (budget) {
          const isTunisiaFlow = conversation.car_origin === 'tunisia';
          newState = getNextState('asking_budget', { hasBudget: true, isTunisiaFlow });
          await updateConversation(conversation.id, { state: newState, budget_tnd: budget }, supabase);
          conversation.budget_tnd = budget;

          // Tunisia flow: budget → fuel_type (continue wizard)
          if (isTunisiaFlow) {
            responseMessage = getTemplate(newState, language);
            break;
          }

          // Import flow: budget → showing_cars (search and show results)
          // Build search filters based on conversation state
          const searchFilters: import('./types.ts').CarSearchFilters = {
            budget_max: budget,
          };

          // Apply FCR eligibility filters (import flow only)
          if (conversation.residency === 'abroad') {
            // TRE: FCR TRE eligible cars
            searchFilters.fcr_tre_only = true;
          } else if (conversation.residency === 'local' && conversation.fcr_famille) {
            // Tunisia resident with TRE family: FCR Famille eligible cars
            searchFilters.fcr_famille_only = true;
          }

          // Apply fuel type preference
          if (conversation.fuel_preference && conversation.fuel_preference !== 'any') {
            searchFilters.fuel_type = conversation.fuel_preference as 'essence' | 'diesel' | 'electric' | 'hybrid' | 'hybrid_rechargeable';
          }

          // Apply car type preference
          if (conversation.car_type_preference && conversation.car_type_preference !== 'any') {
            // Map our car type preferences to body types
            const carTypeToBodyType: Record<string, string> = {
              suv: 'suv',
              sedan: 'berline',
              compact: 'citadine',
            };
            searchFilters.body_type = (carTypeToBodyType[conversation.car_type_preference] || conversation.car_type_preference) as 'suv' | 'berline' | 'citadine' | 'break' | 'monospace' | 'compact';
          }

          // Apply condition preference (new vs used)
          if (conversation.condition_preference && conversation.condition_preference !== 'any') {
            searchFilters.condition = conversation.condition_preference as 'new' | 'used';
          }

          // Search for cars (returns unranked candidates)
          const context = await retrieve(
            `voiture budget ${budget} TND`,
            'car_search',
            searchFilters,
            supabase,
            huggingfaceKey
          );

          // Score and rank the cars based on multiple criteria
          const rankedCars = rankCars(context.cars, conversation);

          // Get top recommendations with diversity
          const topRecommendations = getTopRecommendations(rankedCars, 5);

          responseMessage = formatScoredCarResults(topRecommendations, language);

          return sendResponse({
            message: responseMessage,
            intent: 'car_search',
            language,
            conversation_id: conversation.id,
            cars: topRecommendations,
          });
        } else {
          responseMessage = getTemplate('asking_budget', language);
        }
        break;
      }

      case 'showing_cars': {
        // For showing_cars, use the full LLM flow for follow-up questions
        if (classification.intent === 'off_topic') {
          return sendResponse({
            message: getOffTopicResponse(language),
            intent: 'off_topic',
            language,
            conversation_id: conversation.id,
          });
        }

        // Retrieve context and generate response
        const context = await retrieve(
          message,
          classification.intent,
          classification.filters,
          supabase,
          huggingfaceKey
        );

        const { message: llmResponse, calculation } = await generateResponse(
          message,
          classification,
          context,
          groqApiKey
        );

        const response: ChatResponse = {
          message: llmResponse,
          intent: classification.intent,
          language,
          conversation_id: conversation.id,
        };

        if (context.knowledge_chunks.length > 0) {
          response.sources = [...new Set(context.knowledge_chunks.map((c) => c.source))];
        }

        if (context.cars.length > 0) {
          response.cars = context.cars;
        }

        if (calculation) {
          response.calculation = calculation;
        }

        return sendResponse(response);
      }

      // Cost calculator flow
      case 'asking_calc_price': {
        const price = parsePrice(message);
        if (price) {
          newState = 'asking_calc_engine';
          await updateConversation(conversation.id, {
            state: newState,
            calc_price_eur: price
          }, supabase);
          responseMessage = getTemplate('asking_calc_engine', language);
        } else {
          responseMessage = getTemplate('asking_calc_price', language);
        }
        break;
      }

      case 'asking_calc_engine': {
        const engine = parseEngineCC(message);
        if (engine) {
          newState = 'asking_calc_fuel';
          await updateConversation(conversation.id, {
            state: newState,
            calc_engine_cc: engine
          }, supabase);
          responseMessage = getTemplate('asking_calc_fuel', language);
        } else {
          responseMessage = getTemplate('asking_calc_engine', language);
        }
        break;
      }

      case 'asking_calc_fuel': {
        const fuel = parseCalcFuelType(message);
        if (fuel) {
          newState = 'showing_calculation';
          await updateConversation(conversation.id, {
            state: newState,
            calc_fuel_type: fuel
          }, supabase);

          // Perform calculation - compare all FCR regimes
          const calculation = compareFCRRegimes({
            price_eur: conversation.calc_price_eur || undefined,
            engine_cc: conversation.calc_engine_cc || undefined,
            fuel_type: fuel as 'essence' | 'diesel' | 'electric',
          });

          // Format with "Ready to find a car?" question
          responseMessage = formatCalculationResult(calculation, language);

          return sendResponse({
            message: responseMessage,
            intent: 'cost_calculation',
            language,
            conversation_id: conversation.id,
            calculation
          });
        } else {
          responseMessage = getTemplate('asking_calc_fuel', language);
        }
        break;
      }

      case 'showing_calculation': {
        // User has seen calculation, now answering "ready to find car?"
        const ready = parseYesNo(message);
        if (ready === true) {
          newState = 'asking_car_origin';
          await updateConversation(conversation.id, {
            state: newState,
            goal: 'find_car',
            // Reset calc fields for fresh car search
            calc_price_eur: null,
            calc_engine_cc: null,
            calc_fuel_type: null,
          }, supabase);
          responseMessage = getTemplate('asking_car_origin', language);
        } else if (ready === false) {
          newState = 'goal_selection';
          await updateConversation(conversation.id, {
            state: newState,
            calc_price_eur: null,
            calc_engine_cc: null,
            calc_fuel_type: null,
          }, supabase);
          responseMessage = getTemplate('goal_selection', language);
        } else {
          // Re-show the transition question
          const retryMessage: Record<Language, string> = {
            french: `Voulez-vous chercher une voiture maintenant?
1. Oui
2. Non, retour au menu`,
            arabic: `تحب تلقى كرهبة توا؟
1. نعم
2. لا، رجوع للقائمة`,
            derja: `تحب تلقى كرهبة توا؟
1. إيه
2. لا، نرجع للقائمة`,
          };
          responseMessage = retryMessage[language];
        }
        break;
      }

      // Procedure info flow
      case 'procedure_info': {
        const procedure = parseProcedure(message);
        if (procedure) {
          newState = 'showing_procedure_detail';
          await updateConversation(conversation.id, {
            state: newState,
            selected_procedure: procedure
          }, supabase);
          responseMessage = getProcedureDetail(procedure, language);
        } else {
          responseMessage = getTemplate('procedure_info', language);
        }
        break;
      }

      case 'showing_procedure_detail': {
        // User has seen procedure details, now answering "ready to find car?"
        const ready = parseYesNo(message);
        if (ready === true) {
          newState = 'asking_car_origin';
          await updateConversation(conversation.id, {
            state: newState,
            goal: 'find_car',
            selected_procedure: null,
          }, supabase);
          responseMessage = getTemplate('asking_car_origin', language);
        } else if (ready === false) {
          newState = 'goal_selection';
          await updateConversation(conversation.id, {
            state: newState,
            selected_procedure: null,
          }, supabase);
          responseMessage = getTemplate('goal_selection', language);
        } else {
          // Re-show the transition question
          const retryMessage: Record<Language, string> = {
            french: `Voulez-vous chercher une voiture maintenant?
1. Oui
2. Non, retour au menu`,
            arabic: `تحب تلقى كرهبة توا؟
1. نعم
2. لا، رجوع للقائمة`,
            derja: `تحب تلقى كرهبة توا؟
1. إيه
2. لا، نرجع للقائمة`,
          };
          responseMessage = retryMessage[language];
        }
        break;
      }

      default:
        responseMessage = getTemplate('goal_selection', language);
    }

    return sendResponse({
      message: responseMessage,
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
    });

  } catch (error) {
    console.error('Chat error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});

function sendResponse(response: ChatResponse): Response {
  console.log(`Response: "${response.message.substring(0, 100)}..."`);
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

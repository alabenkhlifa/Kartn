import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { classifyQuery } from './classifier.ts';
import { generateResponse, getOffTopicResponse } from './generator.ts';
import { retrieve } from './retrieval.ts';
import { getOrCreateConversation, updateConversation, getNextState } from './state.ts';
import { getTemplate, formatScoredCarResults, formatCalculationResult, getProcedureDetail, getEVTopicDetail } from './templates.ts';
import { parseGoal, parseCarOrigin, parseResidency, parseBudget, parseFcrFamille, parseFuelType, parseCarType, parseCondition, parsePrice, parseEngineCC, parseCalcFuelType, parseYesNo, parseProcedure, parseEVTopic, parsePopularCarsSelection, parseSalaryLevel, isGreeting, isReset } from './parser.ts';
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
    const { message, conversation_id, language: requestLanguage } = body;

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

    // Priority: 1. Request language (first message with language selection)
    //           2. High-confidence classifier detection
    //           3. Existing conversation language
    if (requestLanguage && ['french', 'arabic', 'derja'].includes(requestLanguage)) {
      language = requestLanguage as Language;
      if (conversation.language !== language) {
        await updateConversation(conversation.id, { language }, supabase);
        conversation.language = language;
      }
    } else if (conversation.language !== language && classification.confidence >= 0.7) {
      // Only update language if classifier has high confidence
      // Numbers like "1", "2" produce low confidence and should not override stored language
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
        // Check if user is trying to start a new search (goal-like message)
        const newGoalFromShowingCars = parseGoal(message);
        if (newGoalFromShowingCars || isGreeting(message) || isReset(message)) {
          // Reset conversation and handle as new goal selection
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
          }, supabase);

          // If it's a specific goal, go directly to next state
          if (newGoalFromShowingCars) {
            const nextStateForGoal = getNextState('goal_selection', { goal: newGoalFromShowingCars });
            await updateConversation(conversation.id, { state: nextStateForGoal, goal: newGoalFromShowingCars }, supabase);
            return sendResponse({
              message: getTemplate(nextStateForGoal, language),
              intent: 'general_info',
              language,
              conversation_id: conversation.id,
            });
          }

          // For greetings/resets, show goal selection
          return sendResponse({
            message: getTemplate('goal_selection', language),
            intent: 'general_info',
            language,
            conversation_id: conversation.id,
          });
        }

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
        // Check if user is trying to start a new search (goal-like message)
        const newGoalFromCalc = parseGoal(message);
        if (newGoalFromCalc || isGreeting(message) || isReset(message)) {
          // Reset conversation and handle as new goal selection
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
          }, supabase);

          // If it's a specific goal, go directly to next state
          if (newGoalFromCalc) {
            const nextStateForGoal = getNextState('goal_selection', { goal: newGoalFromCalc });
            await updateConversation(conversation.id, { state: nextStateForGoal, goal: newGoalFromCalc }, supabase);
            return sendResponse({
              message: getTemplate(nextStateForGoal, language),
              intent: 'general_info',
              language,
              conversation_id: conversation.id,
            });
          }

          // For greetings/resets, show goal selection
          return sendResponse({
            message: getTemplate('goal_selection', language),
            intent: 'general_info',
            language,
            conversation_id: conversation.id,
          });
        }

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
        // Check if user is trying to start a new search (goal-like message)
        const newGoalFromProcedure = parseGoal(message);
        if (newGoalFromProcedure || isGreeting(message) || isReset(message)) {
          // Reset conversation and handle as new goal selection
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
            selected_procedure: null,
          }, supabase);

          // If it's a specific goal, go directly to next state
          if (newGoalFromProcedure) {
            const nextStateForGoal = getNextState('goal_selection', { goal: newGoalFromProcedure });
            await updateConversation(conversation.id, { state: nextStateForGoal, goal: newGoalFromProcedure }, supabase);
            return sendResponse({
              message: getTemplate(nextStateForGoal, language),
              intent: 'general_info',
              language,
              conversation_id: conversation.id,
            });
          }

          // For greetings/resets, show goal selection
          return sendResponse({
            message: getTemplate('goal_selection', language),
            intent: 'general_info',
            language,
            conversation_id: conversation.id,
          });
        }

        // User has seen procedure details, now answering "ready to find car?"
        const readyFromProcedure = parseYesNo(message);
        if (readyFromProcedure === true) {
          newState = 'asking_car_origin';
          await updateConversation(conversation.id, {
            state: newState,
            goal: 'find_car',
            selected_procedure: null,
          }, supabase);
          responseMessage = getTemplate('asking_car_origin', language);
        } else if (readyFromProcedure === false) {
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

      // Compare cars flow
      case 'car_comparison_input': {
        // User has entered comparison query - use LLM to generate comparison
        const query = message.trim();
        if (query.length > 3) {
          newState = 'showing_comparison';
          await updateConversation(conversation.id, {
            state: newState,
            comparison_query: query
          }, supabase);

          // Use LLM to generate comparison
          const comparisonPrompt = `Compare ces voitures pour un acheteur tunisien: "${query}".
Génère un tableau markdown comparatif incluant:
- Prix estimé en Europe et en Tunisie
- Consommation de carburant
- Fiabilité
- Disponibilité des pièces en Tunisie
- Coût d'entretien
- Points forts et points faibles
Réponds en ${language === 'french' ? 'français' : language === 'arabic' ? 'arabe' : 'tunisien'}.`;

          const comparisonContext = await retrieve(
            query,
            'general_info',
            {},
            supabase,
            huggingfaceKey
          );

          const { message: comparisonResult } = await generateResponse(
            comparisonPrompt,
            { ...classification, intent: 'general_info' },
            comparisonContext,
            groqApiKey
          );

          // Add transition question
          const transitionQuestion: Record<Language, string> = {
            french: `\n\nVoulez-vous chercher une de ces voitures?
1. Oui
2. Non, retour au menu`,
            arabic: `\n\nتحب تلقى وحدة من هالكراهب؟
1. نعم
2. لا، رجوع للقائمة`,
            derja: `\n\nتحب تلقى وحدة من هالكراهب؟
1. إيه
2. لا، نرجع للقائمة`,
          };

          responseMessage = comparisonResult + transitionQuestion[language];
        } else {
          responseMessage = getTemplate('car_comparison_input', language);
        }
        break;
      }

      case 'showing_comparison': {
        // Check if user wants to start a new goal
        const newGoalFromComparison = parseGoal(message);
        if (newGoalFromComparison || isGreeting(message) || isReset(message)) {
          await updateConversation(conversation.id, {
            state: 'goal_selection',
            goal: null,
            comparison_query: null,
          }, supabase);

          if (newGoalFromComparison) {
            const nextStateForGoal = getNextState('goal_selection', { goal: newGoalFromComparison });
            await updateConversation(conversation.id, { state: nextStateForGoal, goal: newGoalFromComparison }, supabase);
            return sendResponse({
              message: getTemplate(nextStateForGoal, language),
              intent: 'general_info',
              language,
              conversation_id: conversation.id,
            });
          }

          return sendResponse({
            message: getTemplate('goal_selection', language),
            intent: 'general_info',
            language,
            conversation_id: conversation.id,
          });
        }

        const readyFromComparison = parseYesNo(message);
        if (readyFromComparison === true) {
          newState = 'asking_car_origin';
          await updateConversation(conversation.id, {
            state: newState,
            goal: 'find_car',
            comparison_query: null,
          }, supabase);
          responseMessage = getTemplate('asking_car_origin', language);
        } else if (readyFromComparison === false) {
          newState = 'goal_selection';
          await updateConversation(conversation.id, {
            state: newState,
            comparison_query: null,
          }, supabase);
          responseMessage = getTemplate('goal_selection', language);
        } else {
          const retryMessage: Record<Language, string> = {
            french: `Voulez-vous chercher une de ces voitures?
1. Oui
2. Non, retour au menu`,
            arabic: `تحب تلقى وحدة من هالكراهب؟
1. نعم
2. لا، رجوع للقائمة`,
            derja: `تحب تلقى وحدة من هالكراهب؟
1. إيه
2. لا، نرجع للقائمة`,
          };
          responseMessage = retryMessage[language];
        }
        break;
      }

      // EV info flow
      case 'ev_topic_selection': {
        const evTopic = parseEVTopic(message);
        if (evTopic) {
          newState = 'showing_ev_info';
          await updateConversation(conversation.id, {
            state: newState,
            selected_ev_topic: evTopic
          }, supabase);
          responseMessage = getEVTopicDetail(evTopic, language);
        } else {
          responseMessage = getTemplate('ev_topic_selection', language);
        }
        break;
      }

      case 'showing_ev_info': {
        // Check if user wants to start a new goal
        const newGoalFromEV = parseGoal(message);
        if (newGoalFromEV || isGreeting(message) || isReset(message)) {
          await updateConversation(conversation.id, {
            state: 'goal_selection',
            goal: null,
            selected_ev_topic: null,
          }, supabase);

          if (newGoalFromEV) {
            const nextStateForGoal = getNextState('goal_selection', { goal: newGoalFromEV });
            await updateConversation(conversation.id, { state: nextStateForGoal, goal: newGoalFromEV }, supabase);
            return sendResponse({
              message: getTemplate(nextStateForGoal, language),
              intent: 'general_info',
              language,
              conversation_id: conversation.id,
            });
          }

          return sendResponse({
            message: getTemplate('goal_selection', language),
            intent: 'general_info',
            language,
            conversation_id: conversation.id,
          });
        }

        const readyFromEV = parseYesNo(message);
        if (readyFromEV === true) {
          // User wants to find an EV - set fuel preference to electric
          newState = 'asking_car_origin';
          await updateConversation(conversation.id, {
            state: newState,
            goal: 'find_car',
            fuel_preference: 'electric',
            selected_ev_topic: null,
          }, supabase);
          responseMessage = getTemplate('asking_car_origin', language);
        } else if (readyFromEV === false) {
          newState = 'goal_selection';
          await updateConversation(conversation.id, {
            state: newState,
            selected_ev_topic: null,
          }, supabase);
          responseMessage = getTemplate('goal_selection', language);
        } else {
          const retryMessage: Record<Language, string> = {
            french: `Voulez-vous chercher une voiture électrique?
1. Oui
2. Non, retour au menu`,
            arabic: `تحب تلقى كرهبة كهربائية؟
1. نعم
2. لا، رجوع للقائمة`,
            derja: `تحب تلقى كرهبة كهربائية؟
1. إيه
2. لا، نرجع للقائمة`,
          };
          responseMessage = retryMessage[language];
        }
        break;
      }

      // Popular cars flow
      case 'popular_cars_selection': {
        const selection = parsePopularCarsSelection(message);
        if (selection === 'eligibility') {
          newState = 'asking_popular_eligibility';
          await updateConversation(conversation.id, { state: newState }, supabase);
          responseMessage = getTemplate('asking_popular_eligibility', language);
        } else if (selection === 'models') {
          newState = 'showing_popular_models';
          await updateConversation(conversation.id, { state: newState }, supabase);

          // Show popular car models info
          const popularModelsInfo: Record<Language, string> = {
            french: `**Modèles de voitures populaires disponibles en Tunisie**

Les véhicules populaires sont des voitures subventionnées pour les ménages à revenus modestes.

**Modèles actuellement disponibles:**
- Fiat Punto
- Renault Symbol
- Hyundai Grand i10
- Kia Picanto

**Prix indicatifs:**
- 20,000 - 35,000 TND (avec subvention)

**Où acheter:**
- Concessionnaires officiels agréés
- Inscription via le programme national

Voulez-vous chercher une voiture?
1. Oui
2. Non, retour au menu`,
            arabic: `**موديلات السيارات الشعبية المتاحة في تونس**

السيارات الشعبية هي سيارات مدعومة للعائلات ذات الدخل المحدود.

**الموديلات المتاحة حالياً:**
- Fiat Punto
- Renault Symbol
- Hyundai Grand i10
- Kia Picanto

**الأسعار التقريبية:**
- 20,000 - 35,000 دينار (مع الدعم)

**أين تشتري:**
- الوكلاء الرسميون المعتمدون
- التسجيل عبر البرنامج الوطني

تحب تلقى كرهبة؟
1. نعم
2. لا، رجوع للقائمة`,
            derja: `**موديلات الكراهب الشعبية الموجودة في تونس**

الكراهب الشعبية هي كراهب مدعومة للعايلات اللي دخلها محدود.

**الموديلات الموجودة:**
- Fiat Punto
- Renault Symbol
- Hyundai Grand i10
- Kia Picanto

**الأسعار:**
- 20,000 - 35,000 دينار (مع الدعم)

**وين تشري:**
- الوكلاء الرسميين
- التسجيل في البرنامج الوطني

تحب تلقى كرهبة؟
1. إيه
2. لا، نرجع للقائمة`,
          };
          responseMessage = popularModelsInfo[language];
        } else {
          responseMessage = getTemplate('popular_cars_selection', language);
        }
        break;
      }

      case 'asking_popular_eligibility': {
        const salaryLevel = parseSalaryLevel(message);
        if (salaryLevel === 'eligible') {
          const eligibleMessage: Record<Language, string> = {
            french: `✅ **Vous êtes potentiellement éligible!**

Prochaines étapes:
1. Préparez vos documents (carte d'identité, fiche de paie, attestation de non-possession)
2. Rendez-vous à un concessionnaire agréé
3. Soumettez votre dossier au programme national

Voulez-vous voir les modèles disponibles?
1. Oui
2. Non, retour au menu`,
            arabic: `✅ **أنت مؤهل على الأرجح!**

الخطوات القادمة:
1. جهز وثائقك (بطاقة هوية، كشف راتب، شهادة عدم امتلاك)
2. روح لوكيل معتمد
3. قدم ملفك للبرنامج الوطني

تحب تشوف الموديلات المتاحة؟
1. نعم
2. لا، رجوع للقائمة`,
            derja: `✅ **عندك الحق على الأرجح!**

شنو تعمل:
1. جهز الورق (كارت، فيش دي باي، شهادة ما عندكش كرهبة)
2. روح لوكيل رسمي
3. قدم الملف للبرنامج

تحب تشوف الموديلات الموجودة؟
1. إيه
2. لا، نرجع للقائمة`,
          };
          responseMessage = eligibleMessage[language];
          newState = 'showing_popular_models';
          await updateConversation(conversation.id, { state: newState }, supabase);
        } else if (salaryLevel === 'not_eligible') {
          const notEligibleMessage: Record<Language, string> = {
            french: `❌ **Malheureusement, vous n'êtes pas éligible aux voitures populaires.**

Le programme est réservé aux ménages avec un revenu mensuel inférieur à 3x SMIG (~1500 TND).

Alternatives:
- Chercher une voiture d'occasion économique
- Explorer les offres FCR si vous avez un proche TRE

Voulez-vous chercher une autre voiture?
1. Oui
2. Non, retour au menu`,
            arabic: `❌ **للأسف، أنت غير مؤهل للسيارات الشعبية.**

البرنامج مخصص للعائلات ذات دخل شهري أقل من 3x SMIG (~1500 دينار).

بدائل:
- ابحث عن سيارة مستعملة اقتصادية
- استكشف عروض FCR إذا عندك قريب TRE

تحب تلقى كرهبة أخرى؟
1. نعم
2. لا، رجوع للقائمة`,
            derja: `❌ **للأسف، ما عندكش الحق في الكراهب الشعبية.**

البرنامج للعايلات اللي دخلها أقل من 1500 دينار في الشهر.

بدائل:
- لوج على كرهبة مستعملة رخيصة
- شوف FCR إذا عندك حد من عايلتك TRE

تحب تلقى كرهبة أخرى؟
1. إيه
2. لا، نرجع للقائمة`,
          };
          responseMessage = notEligibleMessage[language];
          newState = 'showing_popular_models';
          await updateConversation(conversation.id, { state: newState }, supabase);
        } else {
          responseMessage = getTemplate('asking_popular_eligibility', language);
        }
        break;
      }

      case 'showing_popular_models': {
        // Check if user wants to start a new goal
        const newGoalFromPopular = parseGoal(message);
        if (newGoalFromPopular || isGreeting(message) || isReset(message)) {
          await updateConversation(conversation.id, {
            state: 'goal_selection',
            goal: null,
          }, supabase);

          if (newGoalFromPopular) {
            const nextStateForGoal = getNextState('goal_selection', { goal: newGoalFromPopular });
            await updateConversation(conversation.id, { state: nextStateForGoal, goal: newGoalFromPopular }, supabase);
            return sendResponse({
              message: getTemplate(nextStateForGoal, language),
              intent: 'general_info',
              language,
              conversation_id: conversation.id,
            });
          }

          return sendResponse({
            message: getTemplate('goal_selection', language),
            intent: 'general_info',
            language,
            conversation_id: conversation.id,
          });
        }

        const readyFromPopular = parseYesNo(message);
        if (readyFromPopular === true) {
          newState = 'asking_car_origin';
          await updateConversation(conversation.id, {
            state: newState,
            goal: 'find_car',
          }, supabase);
          responseMessage = getTemplate('asking_car_origin', language);
        } else if (readyFromPopular === false) {
          newState = 'goal_selection';
          await updateConversation(conversation.id, { state: newState }, supabase);
          responseMessage = getTemplate('goal_selection', language);
        } else {
          const retryMessage: Record<Language, string> = {
            french: `Voulez-vous chercher une voiture?
1. Oui
2. Non, retour au menu`,
            arabic: `تحب تلقى كرهبة؟
1. نعم
2. لا، رجوع للقائمة`,
            derja: `تحب تلقى كرهبة؟
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

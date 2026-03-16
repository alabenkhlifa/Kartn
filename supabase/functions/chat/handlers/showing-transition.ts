import { createShowingHandler } from './showing-handler.ts';

/**
 * showing_calculation: yes -> asking_car_origin (find_car), no -> goal_selection
 */
export const handleShowingCalculation = createShowingHandler({
  yesState: 'asking_car_origin',
  yesUpdates: {
    goal: 'find_car',
    // Reset calc fields for fresh car search
    calc_price_eur: null,
    calc_engine_cc: null,
    calc_fuel_type: null,
  },
  noState: 'goal_selection',
  noUpdates: {
    calc_price_eur: null,
    calc_engine_cc: null,
    calc_fuel_type: null,
  },
  retryMessages: {
    french: `Voulez-vous chercher une voiture maintenant?
1. Oui
2. Non, retour au menu`,
    arabic: `تحب تلقى كرهبة توا؟
1. نعم
2. لا، رجوع للقائمة`,
    derja: `تحب تلقى كرهبة توا؟
1. إيه
2. لا، نرجع للقائمة`,
  },
  resetFields: {
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
  },
});

/**
 * showing_procedure_detail: yes -> asking_car_origin (find_car), no -> goal_selection
 */
export const handleShowingProcedureDetail = createShowingHandler({
  yesState: 'asking_car_origin',
  yesUpdates: {
    goal: 'find_car',
    selected_procedure: null,
  },
  noState: 'goal_selection',
  noUpdates: {
    selected_procedure: null,
  },
  retryMessages: {
    french: `Voulez-vous chercher une voiture maintenant?
1. Oui
2. Non, retour au menu`,
    arabic: `تحب تلقى كرهبة توا؟
1. نعم
2. لا، رجوع للقائمة`,
    derja: `تحب تلقى كرهبة توا؟
1. إيه
2. لا، نرجع للقائمة`,
  },
  resetFields: {
    car_origin: null,
    residency: null,
    fcr_famille: false,
    fuel_preference: null,
    car_type_preference: null,
    condition_preference: null,
    budget_tnd: null,
    selected_procedure: null,
  },
});

/**
 * showing_comparison: yes -> asking_car_origin (find_car), no -> goal_selection
 */
export const handleShowingComparison = createShowingHandler({
  yesState: 'asking_car_origin',
  yesUpdates: {
    goal: 'find_car',
    comparison_query: null,
  },
  noState: 'goal_selection',
  noUpdates: {
    comparison_query: null,
  },
  retryMessages: {
    french: `Voulez-vous chercher une de ces voitures?
1. Oui
2. Non, retour au menu`,
    arabic: `تحب تلقى وحدة من هالكراهب؟
1. نعم
2. لا، رجوع للقائمة`,
    derja: `تحب تلقى وحدة من هالكراهب؟
1. إيه
2. لا، نرجع للقائمة`,
  },
  resetFields: {
    car_origin: null,
    residency: null,
    fcr_famille: false,
    fuel_preference: null,
    car_type_preference: null,
    condition_preference: null,
    budget_tnd: null,
    comparison_query: null,
  },
});

/**
 * showing_ev_info: yes -> asking_car_origin (find_car with electric), no -> goal_selection
 */
export const handleShowingEvInfo = createShowingHandler({
  yesState: 'asking_car_origin',
  yesUpdates: {
    goal: 'find_car',
    fuel_preference: 'electric',
    selected_ev_topic: null,
  },
  noState: 'goal_selection',
  noUpdates: {
    selected_ev_topic: null,
  },
  retryMessages: {
    french: `Voulez-vous chercher une voiture électrique?
1. Oui
2. Non, retour au menu`,
    arabic: `تحب تلقى كرهبة كهربائية؟
1. نعم
2. لا، رجوع للقائمة`,
    derja: `تحب تلقى كرهبة كهربائية؟
1. إيه
2. لا، نرجع للقائمة`,
  },
  resetFields: {
    car_origin: null,
    residency: null,
    fcr_famille: false,
    fuel_preference: null,
    car_type_preference: null,
    condition_preference: null,
    budget_tnd: null,
    selected_ev_topic: null,
  },
});

/**
 * showing_popular_models: yes -> asking_car_origin (find_car), no -> goal_selection
 */
export const handleShowingPopularModels = createShowingHandler({
  yesState: 'asking_car_origin',
  yesUpdates: {
    goal: 'find_car',
  },
  noState: 'goal_selection',
  noUpdates: {},
  retryMessages: {
    french: `Voulez-vous chercher une voiture?
1. Oui
2. Non, retour au menu`,
    arabic: `تحب تلقى كرهبة؟
1. نعم
2. لا، رجوع للقائمة`,
    derja: `تحب تلقى كرهبة؟
1. إيه
2. لا، نرجع للقائمة`,
  },
  resetFields: {
    car_origin: null,
    residency: null,
    fcr_famille: false,
    fuel_preference: null,
    car_type_preference: null,
    condition_preference: null,
    budget_tnd: null,
  },
});

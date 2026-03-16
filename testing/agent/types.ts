/**
 * Testing Agent Type Definitions
 */

export type Language = 'french' | 'arabic' | 'derja';

export interface FlowContext {
  conversationId?: string;
  language: Language;
  responses: FlowStepResult[];
  variables: Record<string, unknown>;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface FlowStep {
  /** Input message or function that returns input */
  input: string | ((ctx: FlowContext) => string);
  /** Expected state after this step */
  expectedState: string;
  /** Optional custom validator */
  validateResponse?: (response: ChatResponse, ctx: FlowContext) => ValidationResult;
  /** Optional description for logging */
  description?: string;
  /** Store response field in context variables */
  storeAs?: string;
}

export interface CarValidationSpec {
  /** Minimum number of cars expected */
  minCars?: number;
  /** Expected fuel type filter */
  fuelType?: string;
  /** Expected condition filter */
  condition?: 'new' | 'used' | 'any';
  /** Expected origin */
  origin?: 'tunisia' | 'abroad';
  /** Should have FCR eligibility info */
  hasFcrInfo?: boolean;
}

export interface FlowSpec {
  id: string;
  name: string;
  /** Languages to test this flow in */
  languages: Language[];
  /** Tags for filtering */
  tags: string[];
  /** Flow steps */
  steps: FlowStep[];
  /** Optional car validation at end */
  carValidation?: CarValidationSpec;
}

export interface ChatResponse {
  message: string;
  intent: string;
  language: Language;
  sources?: string[];
  cars?: CarResult[];
  calculation?: unknown;
  conversation_id?: string;
  state?: string;
  options?: string[];
}

export interface CarResult {
  id: string;
  brand: string;
  model: string;
  variant: string | null;
  year: number;
  price_eur: number | null;
  price_tnd: number | null;
  fuel_type: string;
  engine_cc: number | null;
  mileage_km: number | null;
  body_type: string | null;
  condition: string | null;
  country: string;
  url: string;
  fcr_tre_eligible: boolean;
  fcr_famille_eligible: boolean;
}

export interface FlowStepResult {
  step: FlowStep;
  stepIndex: number;
  input: string;
  response: ChatResponse;
  expectedState: string;
  actualState: string | undefined;
  statePassed: boolean;
  validationResult?: ValidationResult;
  passed: boolean;
  error?: string;
}

export interface FlowValidationResult {
  flowId: string;
  flowName: string;
  language: Language;
  passed: boolean;
  steps: FlowStepResult[];
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  error?: string;
  duration: number;
}

export interface AgentValidationResult {
  totalFlows: number;
  passedFlows: number;
  failedFlows: number;
  results: FlowValidationResult[];
  duration: number;
}

export type FailureType =
  | 'parser_keyword_missing'
  | 'state_transition_error'
  | 'template_missing'
  | 'language_detection_error'
  | 'car_validation_failed'
  | 'api_error'
  | 'unknown';

export interface FailureAnalysis {
  type: FailureType;
  targetFile: string;
  targetFunction?: string;
  suggestedFix: string;
  context: {
    input: string;
    expectedState: string;
    actualState?: string;
    language: Language;
    flowId: string;
    stepIndex: number;
  };
}

export interface FixResult {
  success: boolean;
  file: string;
  description: string;
  error?: string;
}

export interface AgentOptions {
  /** Only run flows with these IDs */
  flowIds?: string[];
  /** Only run flows with these tags */
  tags?: string[];
  /** Only run flows for these languages */
  languages?: Language[];
  /** Output format */
  outputFormat?: 'console' | 'json' | 'markdown';
  /** Maximum iterations for iterate command */
  maxIterations?: number;
  /** Base URL for API */
  baseUrl?: string;
  /** Verbose logging */
  verbose?: boolean;
}

export interface GeneratedTest {
  flowId: string;
  language: Language;
  testCode: string;
  filePath: string;
}

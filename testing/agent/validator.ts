/**
 * Flow Validator - Executes flows against the chat API
 */

import type {
  FlowSpec,
  FlowStep,
  FlowContext,
  FlowStepResult,
  FlowValidationResult,
  AgentValidationResult,
  AgentOptions,
  ChatResponse,
  Language,
  ValidationResult,
  CarValidationSpec,
} from './types.ts';

const DEFAULT_BASE_URL = 'http://127.0.0.1:54321/functions/v1';

export class FlowValidator {
  private baseUrl: string;
  private verbose: boolean;

  constructor(options: AgentOptions = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.verbose = options.verbose ?? false;
  }

  /**
   * Send a message to the chat API
   */
  private async sendMessage(
    message: string,
    conversationId?: string,
    language?: Language
  ): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        language,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Chat API error (${response.status}): ${error.error || 'Unknown'}`);
    }

    return await response.json() as ChatResponse;
  }

  /**
   * Validate a single step
   */
  private async validateStep(
    step: FlowStep,
    stepIndex: number,
    context: FlowContext
  ): Promise<FlowStepResult> {
    const input = typeof step.input === 'function' ? step.input(context) : step.input;

    if (this.verbose) {
      console.log(`  Step ${stepIndex + 1}: "${input}" → expecting "${step.expectedState}"`);
    }

    try {
      const response = await this.sendMessage(
        input,
        context.conversationId,
        context.language
      );

      // Update context
      context.conversationId = response.conversation_id;
      context.responses.push({} as FlowStepResult); // Placeholder, will be updated

      // Store variable if requested
      if (step.storeAs) {
        context.variables[step.storeAs] = response;
      }

      // Check state
      const statePassed = response.state === step.expectedState;

      // Run custom validation if provided
      let validationResult: ValidationResult | undefined;
      if (step.validateResponse) {
        validationResult = step.validateResponse(response, context);
      }

      const passed = statePassed && (validationResult?.passed ?? true);

      const result: FlowStepResult = {
        step,
        stepIndex,
        input,
        response,
        expectedState: step.expectedState,
        actualState: response.state,
        statePassed,
        validationResult,
        passed,
      };

      // Update placeholder in context
      context.responses[context.responses.length - 1] = result;

      if (this.verbose) {
        if (passed) {
          console.log(`    ✓ State: ${response.state}`);
        } else {
          console.log(`    ✗ Expected: ${step.expectedState}, Got: ${response.state}`);
          if (validationResult && !validationResult.passed) {
            console.log(`    ✗ Validation: ${validationResult.message}`);
          }
        }
      }

      return result;
    } catch (error) {
      return {
        step,
        stepIndex,
        input,
        response: {} as ChatResponse,
        expectedState: step.expectedState,
        actualState: undefined,
        statePassed: false,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Validate car results at the end of a flow
   */
  private validateCars(
    response: ChatResponse,
    spec: CarValidationSpec,
    language: Language
  ): ValidationResult {
    const cars = response.cars || [];

    // Check minimum cars
    if (spec.minCars !== undefined && cars.length < spec.minCars) {
      return {
        passed: false,
        message: `Expected at least ${spec.minCars} cars, got ${cars.length}`,
      };
    }

    // Check fuel type
    if (spec.fuelType) {
      const normalizedExpected = spec.fuelType.toLowerCase();
      for (const car of cars) {
        const fuel = car.fuel_type.toLowerCase();
        let matches = false;

        if (normalizedExpected === 'essence') {
          matches = fuel.includes('essence') || fuel.includes('petrol') || fuel.includes('benzin');
        } else if (normalizedExpected === 'diesel') {
          matches = fuel.includes('diesel');
        } else if (normalizedExpected === 'electric') {
          matches = fuel.includes('electric') || fuel.includes('elektro');
        } else if (normalizedExpected === 'hybrid') {
          matches = fuel.includes('hybrid') && !fuel.includes('rechargeable') && !fuel.includes('plug');
        } else if (normalizedExpected === 'hybrid_rechargeable') {
          matches = fuel.includes('plug') || fuel.includes('rechargeable') || fuel.includes('phev');
        }

        if (!matches) {
          return {
            passed: false,
            message: `Car ${car.brand} ${car.model} has fuel '${fuel}', expected '${spec.fuelType}'`,
          };
        }
      }
    }

    // Check origin
    if (spec.origin) {
      for (const car of cars) {
        const isTunisia = car.country === 'TN';
        const expectTunisia = spec.origin === 'tunisia';

        if (isTunisia !== expectTunisia) {
          return {
            passed: false,
            message: `Car ${car.brand} ${car.model} is from ${car.country}, expected origin '${spec.origin}'`,
          };
        }
      }
    }

    // Check FCR info for imports
    if (spec.hasFcrInfo) {
      for (const car of cars) {
        if (car.country !== 'TN') {
          if (car.fcr_tre_eligible === undefined && car.fcr_famille_eligible === undefined) {
            return {
              passed: false,
              message: `Import car ${car.brand} ${car.model} missing FCR eligibility info`,
            };
          }
        }
      }
    }

    return { passed: true, message: 'Car validation passed' };
  }

  /**
   * Validate a complete flow
   */
  async validateFlow(flow: FlowSpec, language: Language): Promise<FlowValidationResult> {
    const startTime = Date.now();

    if (this.verbose) {
      console.log(`\nValidating: ${flow.name} [${language}]`);
    }

    const context: FlowContext = {
      language,
      responses: [],
      variables: {},
    };

    const stepResults: FlowStepResult[] = [];
    let flowPassed = true;
    let flowError: string | undefined;

    // Execute each step
    for (let i = 0; i < flow.steps.length; i++) {
      const step = flow.steps[i];
      const result = await this.validateStep(step, i, context);
      stepResults.push(result);

      if (!result.passed) {
        flowPassed = false;
        flowError = result.error || `Step ${i + 1} failed: expected state '${step.expectedState}', got '${result.actualState}'`;
        // Stop on first failure
        break;
      }
    }

    // Validate cars if needed and flow passed so far
    if (flowPassed && flow.carValidation && stepResults.length > 0) {
      const lastResponse = stepResults[stepResults.length - 1].response;
      const carValidation = this.validateCars(lastResponse, flow.carValidation, language);

      if (!carValidation.passed) {
        flowPassed = false;
        flowError = `Car validation failed: ${carValidation.message}`;
      }
    }

    const duration = Date.now() - startTime;

    if (this.verbose) {
      if (flowPassed) {
        console.log(`  ✓ PASSED (${duration}ms)`);
      } else {
        console.log(`  ✗ FAILED: ${flowError} (${duration}ms)`);
      }
    }

    return {
      flowId: flow.id,
      flowName: flow.name,
      language,
      passed: flowPassed,
      steps: stepResults,
      totalSteps: flow.steps.length,
      passedSteps: stepResults.filter((s) => s.passed).length,
      failedSteps: stepResults.filter((s) => !s.passed).length,
      error: flowError,
      duration,
    };
  }

  /**
   * Validate multiple flows
   */
  async validateFlows(
    flows: FlowSpec[],
    options: AgentOptions = {}
  ): Promise<AgentValidationResult> {
    const startTime = Date.now();
    const results: FlowValidationResult[] = [];

    // Filter flows by options
    let filteredFlows = flows;

    if (options.flowIds?.length) {
      filteredFlows = filteredFlows.filter((f) => options.flowIds!.includes(f.id));
    }

    if (options.tags?.length) {
      filteredFlows = filteredFlows.filter((f) =>
        options.tags!.some((tag) => f.tags.includes(tag))
      );
    }

    // Run each flow in each language
    for (const flow of filteredFlows) {
      const languages = options.languages?.length
        ? flow.languages.filter((l) => options.languages!.includes(l))
        : flow.languages;

      for (const language of languages) {
        const result = await this.validateFlow(flow, language);
        results.push(result);
      }
    }

    const duration = Date.now() - startTime;

    return {
      totalFlows: results.length,
      passedFlows: results.filter((r) => r.passed).length,
      failedFlows: results.filter((r) => !r.passed).length,
      results,
      duration,
    };
  }
}

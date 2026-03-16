/**
 * Auto-Fix Engine - Analyzes failures and applies fixes to source files
 */

import type {
  FlowValidationResult,
  FailureAnalysis,
  FailureType,
  FixResult,
  Language,
} from './types.ts';

const CHAT_FUNCTION_PATH = '/Users/alabenkhlifa/Projects/Kartn/supabase/functions/chat';

/**
 * Analyze a flow validation failure to determine the fix type
 */
export function analyzeFailure(result: FlowValidationResult): FailureAnalysis | null {
  if (result.passed) return null;

  const failedStep = result.steps.find((s) => !s.passed);
  if (!failedStep) return null;

  const { input, expectedState, actualState, error, validationResult } = failedStep;
  const language = result.language;

  // Determine failure type
  let type: FailureType = 'unknown';
  let targetFile = '';
  let targetFunction: string | undefined;
  let suggestedFix = '';

  // State mismatch - likely parser or state machine issue
  if (actualState !== expectedState) {
    // Check if it's a parser issue (state didn't change from goal_selection or stayed same)
    if (actualState === 'goal_selection' && expectedState !== 'goal_selection') {
      // Parser likely didn't recognize the input
      type = 'parser_keyword_missing';
      targetFile = `${CHAT_FUNCTION_PATH}/parser.ts`;
      targetFunction = inferParserFunction(expectedState);
      suggestedFix = `Add keyword "${input}" to ${targetFunction}() for ${language} language`;
    } else if (actualState && actualState !== expectedState) {
      // State transitioned but to wrong state
      type = 'state_transition_error';
      targetFile = `${CHAT_FUNCTION_PATH}/state.ts`;
      targetFunction = 'getNextState';
      suggestedFix = `Fix state transition from current state to ${expectedState} when processing "${input}"`;
    } else {
      // No state returned - likely API error or missing handler
      type = 'api_error';
      targetFile = `${CHAT_FUNCTION_PATH}/index.ts`;
      suggestedFix = `Check handler for state that should transition to ${expectedState}`;
    }
  }

  // Validation failure (state was correct but content validation failed)
  if (validationResult && !validationResult.passed) {
    if (validationResult.message.includes('Missing') && validationResult.message.includes('info')) {
      type = 'template_missing';
      targetFile = `${CHAT_FUNCTION_PATH}/templates.ts`;
      suggestedFix = `Add or fix template content for ${expectedState} in ${language}`;
    }
  }

  // Check for language detection issues
  if (error?.includes('language') || failedStep.response?.language !== language) {
    type = 'language_detection_error';
    targetFile = `${CHAT_FUNCTION_PATH}/classifier.ts`;
    suggestedFix = `Improve ${language} language detection for input "${input}"`;
  }

  // Car validation failure
  if (validationResult?.message.includes('car') || validationResult?.message.includes('Car')) {
    type = 'car_validation_failed';
    targetFile = `${CHAT_FUNCTION_PATH}/retrieval.ts`;
    suggestedFix = validationResult.message;
  }

  return {
    type,
    targetFile,
    targetFunction,
    suggestedFix,
    context: {
      input,
      expectedState,
      actualState,
      language,
      flowId: result.flowId,
      stepIndex: failedStep.stepIndex,
    },
  };
}

/**
 * Infer which parser function to modify based on expected state
 */
function inferParserFunction(expectedState: string): string {
  const stateToParser: Record<string, string> = {
    asking_car_origin: 'parseGoal',
    asking_residency: 'parseCarOrigin',
    asking_fcr_famille: 'parseResidency',
    asking_fuel_type: 'parseFcrFamille',
    asking_car_type: 'parseFuelType',
    asking_condition: 'parseCarType',
    asking_budget: 'parseCondition',
    showing_cars: 'parseBudget',
    procedure_info: 'parseGoal',
    showing_procedure_detail: 'parseProcedure',
    ev_topic_selection: 'parseGoal',
    showing_ev_info: 'parseEVTopic',
    popular_cars_selection: 'parseGoal',
    asking_popular_eligibility: 'parsePopularCarsSelection',
    showing_popular_models: 'parsePopularCarsSelection',
  };

  return stateToParser[expectedState] || 'parseGoal';
}

/**
 * Apply a fix to the source file
 */
export async function applyFix(analysis: FailureAnalysis): Promise<FixResult> {
  try {
    // Read the target file
    const content = await Deno.readTextFile(analysis.targetFile);

    let newContent = content;
    let description = '';

    switch (analysis.type) {
      case 'parser_keyword_missing':
        const fixResult = fixParserKeyword(content, analysis);
        if (fixResult) {
          newContent = fixResult.content;
          description = fixResult.description;
        } else {
          return {
            success: false,
            file: analysis.targetFile,
            description: 'Could not automatically fix parser keyword',
            error: 'Manual fix required',
          };
        }
        break;

      case 'state_transition_error':
        // State transition fixes are more complex and usually require manual intervention
        return {
          success: false,
          file: analysis.targetFile,
          description: analysis.suggestedFix,
          error: 'State transition fixes require manual review',
        };

      case 'template_missing':
        // Template fixes usually need content review
        return {
          success: false,
          file: analysis.targetFile,
          description: analysis.suggestedFix,
          error: 'Template fixes require manual content review',
        };

      default:
        return {
          success: false,
          file: analysis.targetFile,
          description: analysis.suggestedFix,
          error: `Fix type '${analysis.type}' not automatically fixable`,
        };
    }

    // Write the fixed content
    if (newContent !== content) {
      await Deno.writeTextFile(analysis.targetFile, newContent);
      return {
        success: true,
        file: analysis.targetFile,
        description,
      };
    }

    return {
      success: false,
      file: analysis.targetFile,
      description: 'No changes made',
      error: 'Could not determine fix',
    };
  } catch (error) {
    return {
      success: false,
      file: analysis.targetFile,
      description: analysis.suggestedFix,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Fix a missing parser keyword
 */
function fixParserKeyword(
  content: string,
  analysis: FailureAnalysis
): { content: string; description: string } | null {
  const { targetFunction, context } = analysis;
  if (!targetFunction) return null;

  const { input, language } = context;
  const inputLower = input.toLowerCase().trim();

  // Find the function in the file
  const functionRegex = new RegExp(`export function ${targetFunction}\\([^)]*\\)[^{]*{`, 'g');
  const match = functionRegex.exec(content);

  if (!match) return null;

  // Determine what keyword array to add to based on expected behavior
  // This is a simplified heuristic - real implementation would need more context

  // For Arabic/Derja inputs, find keyword arrays that already have Arabic
  const arabicPattern = /[\u0600-\u06FF]/;
  const isArabicInput = arabicPattern.test(input);

  if (isArabicInput) {
    // Find existing Arabic keyword arrays in the function
    const functionStart = match.index;
    const functionEnd = findFunctionEnd(content, functionStart);
    const functionBody = content.substring(functionStart, functionEnd);

    // Look for arrays that contain Arabic text
    const arrayPattern = /\[([\s\S]*?)\]/g;
    let arrayMatch;
    while ((arrayMatch = arrayPattern.exec(functionBody)) !== null) {
      const arrayContent = arrayMatch[1];
      // Check if this array has Arabic and doesn't already contain our input
      if (arabicPattern.test(arrayContent) && !arrayContent.includes(inputLower)) {
        // Find where to insert
        const lastQuotePos = arrayContent.lastIndexOf("'");
        if (lastQuotePos !== -1) {
          const insertPos = functionStart + arrayMatch.index + 1 + lastQuotePos + 1;
          const newContent =
            content.substring(0, insertPos) +
            `, '${inputLower}'` +
            content.substring(insertPos);

          return {
            content: newContent,
            description: `Added '${inputLower}' to keyword array in ${targetFunction}()`,
          };
        }
      }
    }
  }

  // For French/Latin inputs
  // Similar logic but for non-Arabic arrays
  // This is a placeholder - real implementation would be more sophisticated

  return null;
}

/**
 * Find the end of a function (matching closing brace)
 */
function findFunctionEnd(content: string, startIndex: number): number {
  let braceCount = 0;
  let inString = false;
  let stringChar = '';

  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];
    const prevChar = content[i - 1];

    // Handle string detection
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) return i + 1;
      }
    }
  }

  return content.length;
}

/**
 * Analyze all failures and return fix suggestions
 */
export function analyzeAllFailures(results: FlowValidationResult[]): FailureAnalysis[] {
  const analyses: FailureAnalysis[] = [];

  for (const result of results) {
    if (!result.passed) {
      const analysis = analyzeFailure(result);
      if (analysis) {
        analyses.push(analysis);
      }
    }
  }

  // Deduplicate by target file and suggested fix
  const seen = new Set<string>();
  return analyses.filter((a) => {
    const key = `${a.targetFile}:${a.suggestedFix}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Apply all fixable fixes
 */
export async function applyAllFixes(analyses: FailureAnalysis[]): Promise<FixResult[]> {
  const results: FixResult[] = [];

  for (const analysis of analyses) {
    const result = await applyFix(analysis);
    results.push(result);
  }

  return results;
}

/**
 * Report fix results
 */
export function reportFixes(fixes: FixResult[]): void {
  console.log('\n📝 Fix Results:');

  const successful = fixes.filter((f) => f.success);
  const failed = fixes.filter((f) => !f.success);

  if (successful.length > 0) {
    console.log('\n✅ Applied fixes:');
    for (const fix of successful) {
      console.log(`  - ${fix.file}: ${fix.description}`);
    }
  }

  if (failed.length > 0) {
    console.log('\n⚠️  Manual fixes needed:');
    for (const fix of failed) {
      console.log(`  - ${fix.file}`);
      console.log(`    Suggested: ${fix.description}`);
      if (fix.error) {
        console.log(`    Reason: ${fix.error}`);
      }
    }
  }
}

/**
 * Test Generator - Creates Deno test files from passing flows
 */

import type {
  FlowSpec,
  FlowValidationResult,
  GeneratedTest,
  Language,
} from './types.ts';

const TEST_OUTPUT_DIR = '/Users/alabenkhlifa/Projects/Kartn/testing/integration/chat/generated';

/**
 * Generate test code for a single flow
 */
export function generateTestCode(flow: FlowSpec, language: Language): string {
  const lines: string[] = [];
  const testName = `${flow.name} [${language}]`;
  const descName = flow.id.replace(/-/g, '_');

  lines.push(`/**`);
  lines.push(` * Auto-generated test for: ${flow.name}`);
  lines.push(` * Language: ${language}`);
  lines.push(` * Flow ID: ${flow.id}`);
  lines.push(` * Generated: ${new Date().toISOString()}`);
  lines.push(` */`);
  lines.push(``);
  lines.push(`import { describe, it } from '../../deps.ts';`);
  lines.push(`import { chatApi } from '../../test-utils/api-client.ts';`);
  lines.push(`import { assertChatState, assertChatLanguage } from '../../test-utils/assertions.ts';`);
  lines.push(``);
  lines.push(`describe('${testName}', () => {`);

  // Generate test for each step
  for (let i = 0; i < flow.steps.length; i++) {
    const step = flow.steps[i];
    const input = typeof step.input === 'function'
      ? getStaticInput(step, language, i)
      : step.input;

    const stepDesc = step.description || `Step ${i + 1}`;

    lines.push(`  it('${stepDesc}', async () => {`);
    lines.push(`    // This test requires sequential execution with conversation state`);
    lines.push(`    // See the full flow test below`);
    lines.push(`  });`);
    lines.push(``);
  }

  // Generate full flow test
  lines.push(`  it('completes full flow', async () => {`);
  lines.push(`    let conversationId: string | undefined;`);
  lines.push(``);

  for (let i = 0; i < flow.steps.length; i++) {
    const step = flow.steps[i];
    const input = typeof step.input === 'function'
      ? getStaticInput(step, language, i)
      : step.input;

    lines.push(`    // Step ${i + 1}: ${step.description || ''}`);
    lines.push(`    const response${i + 1} = await chatApi.send({`);
    lines.push(`      message: '${escapeString(input)}',`);
    lines.push(`      conversation_id: conversationId,`);
    lines.push(`      language: '${language}',`);
    lines.push(`    });`);
    lines.push(`    conversationId = response${i + 1}.conversation_id;`);
    lines.push(`    assertChatState(response${i + 1}, '${step.expectedState}');`);
    lines.push(``);
  }

  lines.push(`  });`);
  lines.push(`});`);

  return lines.join('\n');
}

/**
 * Get static input for dynamic input functions
 */
function getStaticInput(step: { input: string | ((ctx: { language: Language }) => string) }, language: Language, stepIndex: number): string {
  if (typeof step.input === 'string') {
    return step.input;
  }

  // Call the function with a mock context
  try {
    return step.input({ language });
  } catch {
    // Fallback to numbered input
    return String(stepIndex + 1);
  }
}

/**
 * Escape string for JavaScript
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n');
}

/**
 * Generate test file for a flow
 */
export function generateTestFile(
  flow: FlowSpec,
  language: Language
): GeneratedTest {
  const testCode = generateTestCode(flow, language);
  const fileName = `${flow.id}-${language}.test.ts`;
  const filePath = `${TEST_OUTPUT_DIR}/${fileName}`;

  return {
    flowId: flow.id,
    language,
    testCode,
    filePath,
  };
}

/**
 * Generate test files for all passing flows
 */
export function generateTestsForPassingFlows(
  flows: FlowSpec[],
  results: FlowValidationResult[]
): GeneratedTest[] {
  const tests: GeneratedTest[] = [];

  for (const result of results) {
    if (result.passed) {
      const flow = flows.find((f) => f.id === result.flowId);
      if (flow) {
        tests.push(generateTestFile(flow, result.language));
      }
    }
  }

  return tests;
}

/**
 * Write generated tests to disk
 */
export async function writeGeneratedTests(tests: GeneratedTest[]): Promise<void> {
  // Ensure output directory exists
  try {
    await Deno.mkdir(TEST_OUTPUT_DIR, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      throw err;
    }
  }

  // Write each test file
  for (const test of tests) {
    await Deno.writeTextFile(test.filePath, test.testCode);
    console.log(`  Generated: ${test.filePath}`);
  }
}

/**
 * Generate index file that imports all generated tests
 */
export async function generateIndexFile(tests: GeneratedTest[]): Promise<void> {
  const lines: string[] = [];

  lines.push('/**');
  lines.push(' * Auto-generated test index');
  lines.push(` * Generated: ${new Date().toISOString()}`);
  lines.push(' */');
  lines.push('');

  // Group by flow
  const byFlow = new Map<string, GeneratedTest[]>();
  for (const test of tests) {
    if (!byFlow.has(test.flowId)) {
      byFlow.set(test.flowId, []);
    }
    byFlow.get(test.flowId)!.push(test);
  }

  // Import each test file
  for (const [flowId, flowTests] of byFlow) {
    lines.push(`// ${flowId}`);
    for (const test of flowTests) {
      const fileName = test.filePath.split('/').pop()!;
      lines.push(`import './${fileName}';`);
    }
    lines.push('');
  }

  const indexPath = `${TEST_OUTPUT_DIR}/index.ts`;
  await Deno.writeTextFile(indexPath, lines.join('\n'));
  console.log(`  Generated index: ${indexPath}`);
}

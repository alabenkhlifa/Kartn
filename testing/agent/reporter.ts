/**
 * Reporter - Output formatting for validation results
 */

import type {
  AgentValidationResult,
  FlowValidationResult,
  FlowStepResult,
  AgentOptions,
} from './types.ts';

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Format duration in human-readable form
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Console Reporter
 */
export function reportConsole(result: AgentValidationResult, verbose = false): void {
  console.log('\n' + colors.bold + '═══════════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.bold + '                    FLOW VALIDATION REPORT' + colors.reset);
  console.log(colors.bold + '═══════════════════════════════════════════════════════════════' + colors.reset);

  // Summary
  const passRate = result.totalFlows > 0
    ? ((result.passedFlows / result.totalFlows) * 100).toFixed(1)
    : '0.0';

  console.log('\n' + colors.bold + 'Summary:' + colors.reset);
  console.log(`  Total:  ${result.totalFlows} flows`);
  console.log(`  ${colors.green}Passed: ${result.passedFlows}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${result.failedFlows}${colors.reset}`);
  console.log(`  Rate:   ${passRate}%`);
  console.log(`  Time:   ${formatDuration(result.duration)}`);

  // Results by flow
  console.log('\n' + colors.bold + 'Results:' + colors.reset);

  for (const flowResult of result.results) {
    const icon = flowResult.passed ? colors.green + '✓' : colors.red + '✗';
    const status = flowResult.passed ? 'PASS' : 'FAIL';
    const lang = flowResult.language.toUpperCase().padEnd(6);

    console.log(
      `  ${icon} ${colors.reset}[${lang}] ${flowResult.flowName.padEnd(35)} ${status} (${formatDuration(flowResult.duration)})`
    );

    if (!flowResult.passed && flowResult.error) {
      console.log(`    ${colors.dim}└─ ${flowResult.error}${colors.reset}`);
    }

    if (verbose && !flowResult.passed) {
      // Show step details for failed flows
      for (const step of flowResult.steps) {
        if (!step.passed) {
          console.log(`    ${colors.yellow}Step ${step.stepIndex + 1}:${colors.reset} "${step.input}"`);
          console.log(`      Expected: ${step.expectedState}`);
          console.log(`      Actual:   ${step.actualState || 'undefined'}`);
          if (step.validationResult && !step.validationResult.passed) {
            console.log(`      Validation: ${step.validationResult.message}`);
          }
          break;
        }
      }
    }
  }

  // Failed flows summary
  const failedFlows = result.results.filter((r) => !r.passed);
  if (failedFlows.length > 0) {
    console.log('\n' + colors.bold + colors.red + 'Failed Flows:' + colors.reset);
    for (const flow of failedFlows) {
      console.log(`  - ${flow.flowId} [${flow.language}]: ${flow.error}`);
    }
  }

  console.log('\n' + colors.bold + '═══════════════════════════════════════════════════════════════' + colors.reset);

  if (result.failedFlows === 0) {
    console.log(colors.green + colors.bold + '  ALL FLOWS PASSED!' + colors.reset);
  } else {
    console.log(colors.red + colors.bold + `  ${result.failedFlows} FLOW(S) FAILED` + colors.reset);
  }

  console.log(colors.bold + '═══════════════════════════════════════════════════════════════' + colors.reset + '\n');
}

/**
 * JSON Reporter
 */
export function reportJSON(result: AgentValidationResult): string {
  return JSON.stringify({
    summary: {
      total: result.totalFlows,
      passed: result.passedFlows,
      failed: result.failedFlows,
      passRate: result.totalFlows > 0
        ? ((result.passedFlows / result.totalFlows) * 100).toFixed(1) + '%'
        : '0.0%',
      duration: formatDuration(result.duration),
    },
    flows: result.results.map((r) => ({
      id: r.flowId,
      name: r.flowName,
      language: r.language,
      passed: r.passed,
      steps: {
        total: r.totalSteps,
        passed: r.passedSteps,
        failed: r.failedSteps,
      },
      error: r.error,
      duration: formatDuration(r.duration),
      stepDetails: r.steps.map((s) => ({
        index: s.stepIndex,
        input: s.input,
        expectedState: s.expectedState,
        actualState: s.actualState,
        passed: s.passed,
        error: s.error,
        validation: s.validationResult,
      })),
    })),
  }, null, 2);
}

/**
 * Markdown Reporter
 */
export function reportMarkdown(result: AgentValidationResult): string {
  const lines: string[] = [];

  lines.push('# Flow Validation Report');
  lines.push('');

  // Summary
  const passRate = result.totalFlows > 0
    ? ((result.passedFlows / result.totalFlows) * 100).toFixed(1)
    : '0.0';

  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Total Flows | ${result.totalFlows} |`);
  lines.push(`| Passed | ${result.passedFlows} |`);
  lines.push(`| Failed | ${result.failedFlows} |`);
  lines.push(`| Pass Rate | ${passRate}% |`);
  lines.push(`| Duration | ${formatDuration(result.duration)} |`);
  lines.push('');

  // Results table
  lines.push('## Results');
  lines.push('');
  lines.push('| Status | Language | Flow | Duration |');
  lines.push('|--------|----------|------|----------|');

  for (const flowResult of result.results) {
    const status = flowResult.passed ? '✅' : '❌';
    lines.push(
      `| ${status} | ${flowResult.language} | ${flowResult.flowName} | ${formatDuration(flowResult.duration)} |`
    );
  }

  lines.push('');

  // Failed flows details
  const failedFlows = result.results.filter((r) => !r.passed);
  if (failedFlows.length > 0) {
    lines.push('## Failed Flows');
    lines.push('');

    for (const flow of failedFlows) {
      lines.push(`### ${flow.flowName} [${flow.language}]`);
      lines.push('');
      lines.push(`**Error:** ${flow.error}`);
      lines.push('');

      // Find failed step
      const failedStep = flow.steps.find((s) => !s.passed);
      if (failedStep) {
        lines.push('**Failed Step:**');
        lines.push('');
        lines.push(`- **Input:** \`${failedStep.input}\``);
        lines.push(`- **Expected State:** \`${failedStep.expectedState}\``);
        lines.push(`- **Actual State:** \`${failedStep.actualState || 'undefined'}\``);
        if (failedStep.validationResult && !failedStep.validationResult.passed) {
          lines.push(`- **Validation:** ${failedStep.validationResult.message}`);
        }
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

/**
 * Report results based on format option
 */
export function report(result: AgentValidationResult, options: AgentOptions = {}): void {
  const format = options.outputFormat || 'console';

  switch (format) {
    case 'json':
      console.log(reportJSON(result));
      break;
    case 'markdown':
      console.log(reportMarkdown(result));
      break;
    default:
      reportConsole(result, options.verbose);
  }
}

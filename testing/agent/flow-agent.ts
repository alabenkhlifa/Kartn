/**
 * Flow Agent - Main orchestrator for conversation flow testing
 */

import type { AgentOptions, AgentValidationResult, FlowSpec, FixResult } from './types.ts';
import { FlowValidator } from './validator.ts';
import { ALL_FLOWS } from './specs/index.ts';
import { report } from './reporter.ts';
import { analyzeAllFailures, applyAllFixes, reportFixes } from './fixer.ts';
import {
  generateTestsForPassingFlows,
  writeGeneratedTests,
  generateIndexFile,
} from './test-generator.ts';

export class FlowAgent {
  private validator: FlowValidator;
  private options: AgentOptions;

  constructor(options: AgentOptions = {}) {
    this.options = options;
    this.validator = new FlowValidator(options);
  }

  /**
   * Validate all flows
   */
  async validate(): Promise<AgentValidationResult> {
    console.log('🔍 Starting flow validation...\n');

    const result = await this.validator.validateFlows(ALL_FLOWS, this.options);

    report(result, this.options);

    return result;
  }

  /**
   * Run validation and attempt to auto-fix failures
   */
  async iterate(maxIterations = 5): Promise<AgentValidationResult> {
    console.log(`🔄 Starting iterate mode (max ${maxIterations} iterations)...\n`);

    let iteration = 0;
    let result: AgentValidationResult;
    let previousFailedCount = -1;

    while (iteration < maxIterations) {
      iteration++;
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📋 Iteration ${iteration}/${maxIterations}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // Run validation
      result = await this.validator.validateFlows(ALL_FLOWS, this.options);

      // Check if all passed
      if (result.failedFlows === 0) {
        console.log('\n✅ All flows passed!');
        report(result, this.options);
        return result;
      }

      // Check if we're making progress
      if (result.failedFlows === previousFailedCount) {
        console.log('\n⚠️  No progress made - stopping iteration');
        report(result, this.options);
        break;
      }

      previousFailedCount = result.failedFlows;

      // Analyze failures
      console.log(`\n🔬 Analyzing ${result.failedFlows} failures...`);
      const failedResults = result.results.filter((r) => !r.passed);
      const analyses = analyzeAllFailures(failedResults);

      if (analyses.length === 0) {
        console.log('⚠️  No fixable issues identified');
        report(result, this.options);
        break;
      }

      // Show what we found
      console.log(`\n📝 Found ${analyses.length} potential fixes:`);
      for (const analysis of analyses) {
        console.log(`  - [${analysis.type}] ${analysis.suggestedFix}`);
      }

      // Apply fixes
      console.log('\n🔧 Applying fixes...');
      const fixes = await applyAllFixes(analyses);
      reportFixes(fixes);

      // Check if any fixes were applied
      const appliedFixes = fixes.filter((f) => f.success);
      if (appliedFixes.length === 0) {
        console.log('\n⚠️  No automatic fixes could be applied - stopping iteration');
        report(result, this.options);
        break;
      }

      console.log(`\n✅ Applied ${appliedFixes.length} fix(es), revalidating...`);
    }

    // Final report
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Final Results');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    report(result!, this.options);

    return result!;
  }

  /**
   * Generate test files for passing flows
   */
  async generate(): Promise<void> {
    console.log('🔍 Validating flows before generating tests...\n');

    const result = await this.validator.validateFlows(ALL_FLOWS, this.options);
    report(result, this.options);

    const passingCount = result.results.filter((r) => r.passed).length;

    if (passingCount === 0) {
      console.log('\n⚠️  No passing flows - no tests generated');
      return;
    }

    console.log(`\n📝 Generating tests for ${passingCount} passing flow(s)...\n`);

    const tests = generateTestsForPassingFlows(ALL_FLOWS, result.results);
    await writeGeneratedTests(tests);
    await generateIndexFile(tests);

    console.log(`\n✅ Generated ${tests.length} test file(s)`);
  }

  /**
   * List all available flows
   */
  listFlows(): void {
    console.log('📋 Available Flows:\n');

    // Group by tags
    const byTag = new Map<string, FlowSpec[]>();
    for (const flow of ALL_FLOWS) {
      for (const tag of flow.tags) {
        if (!byTag.has(tag)) {
          byTag.set(tag, []);
        }
        byTag.get(tag)!.push(flow);
      }
    }

    // Print flows by tag
    for (const [tag, flows] of Array.from(byTag.entries()).sort()) {
      console.log(`\n[${tag}]`);
      for (const flow of flows) {
        const langs = flow.languages.join(', ');
        console.log(`  ${flow.id.padEnd(35)} (${langs})`);
      }
    }

    console.log(`\nTotal: ${ALL_FLOWS.length} flows`);
  }
}

// Export for CLI
export { ALL_FLOWS };

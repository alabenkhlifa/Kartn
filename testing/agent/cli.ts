#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write

/**
 * Flow Testing Agent CLI
 *
 * Usage:
 *   deno task agent:validate [options]
 *   deno task agent:generate [options]
 *   deno task agent:iterate [options]
 *   deno task agent:list
 *
 * Options:
 *   --flow=<id>        Run specific flow by ID
 *   --tag=<tag>        Run flows with specific tag
 *   --language=<lang>  Run flows for specific language (french|arabic|derja)
 *   --output=<format>  Output format (console|json|markdown)
 *   --max-iterations=N Maximum iterations for iterate command (default: 5)
 *   --verbose          Show detailed output
 *   --help             Show this help
 */

import { FlowAgent } from './flow-agent.ts';
import type { AgentOptions, Language } from './types.ts';
import { getAllTags } from './specs/index.ts';

function printHelp(): void {
  console.log(`
Flow Testing Agent CLI

Commands:
  validate   Run flow validation
  generate   Generate test files for passing flows
  iterate    Run validate → fix → revalidate loop
  list       List all available flows and tags

Options:
  --flow=<id>          Run specific flow by ID (can be used multiple times)
  --tag=<tag>          Run flows with specific tag (can be used multiple times)
  --language=<lang>    Run flows for specific language (french|arabic|derja)
  --output=<format>    Output format: console (default), json, markdown
  --max-iterations=N   Maximum iterations for iterate command (default: 5)
  --verbose, -v        Show detailed output
  --help, -h           Show this help

Examples:
  deno task agent:validate
  deno task agent:validate --flow=car-search-tunisia
  deno task agent:validate --tag=core --language=french
  deno task agent:iterate --max-iterations=3
  deno task agent:generate --tag=core

Available tags: ${getAllTags().join(', ')}
`);
}

function parseArgs(args: string[]): { command: string; options: AgentOptions } {
  const command = args[0] || 'validate';
  const options: AgentOptions = {};

  const flowIds: string[] = [];
  const tags: string[] = [];
  const languages: Language[] = [];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      printHelp();
      Deno.exit(0);
    }

    if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
      continue;
    }

    if (arg.startsWith('--flow=')) {
      flowIds.push(arg.substring(7));
      continue;
    }

    if (arg.startsWith('--tag=')) {
      tags.push(arg.substring(6));
      continue;
    }

    if (arg.startsWith('--language=')) {
      const lang = arg.substring(11) as Language;
      if (!['french', 'arabic', 'derja'].includes(lang)) {
        console.error(`Invalid language: ${lang}. Must be french, arabic, or derja.`);
        Deno.exit(1);
      }
      languages.push(lang);
      continue;
    }

    if (arg.startsWith('--output=')) {
      const format = arg.substring(9);
      if (!['console', 'json', 'markdown'].includes(format)) {
        console.error(`Invalid output format: ${format}. Must be console, json, or markdown.`);
        Deno.exit(1);
      }
      options.outputFormat = format as 'console' | 'json' | 'markdown';
      continue;
    }

    if (arg.startsWith('--max-iterations=')) {
      options.maxIterations = parseInt(arg.substring(17), 10);
      if (isNaN(options.maxIterations) || options.maxIterations < 1) {
        console.error('Invalid max-iterations value. Must be a positive integer.');
        Deno.exit(1);
      }
      continue;
    }

    // Unknown argument
    console.error(`Unknown argument: ${arg}`);
    printHelp();
    Deno.exit(1);
  }

  if (flowIds.length > 0) options.flowIds = flowIds;
  if (tags.length > 0) options.tags = tags;
  if (languages.length > 0) options.languages = languages;

  return { command, options };
}

async function main(): Promise<void> {
  const { command, options } = parseArgs(Deno.args);

  const agent = new FlowAgent(options);

  try {
    switch (command) {
      case 'validate':
        const validateResult = await agent.validate();
        Deno.exit(validateResult.failedFlows > 0 ? 1 : 0);
        break;

      case 'generate':
        await agent.generate();
        break;

      case 'iterate':
        const iterateResult = await agent.iterate(options.maxIterations || 5);
        Deno.exit(iterateResult.failedFlows > 0 ? 1 : 0);
        break;

      case 'list':
        agent.listFlows();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        Deno.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));

    if (error instanceof Error && error.message.includes('Connection refused')) {
      console.error('\n⚠️  Make sure the Supabase functions are running:');
      console.error('   npx supabase functions serve chat --env-file supabase/.env.local');
    }

    Deno.exit(1);
  }
}

main();

#!/usr/bin/env node
'use strict';

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const { run } = require('../src/index');

const program = new Command();

console.log(chalk.cyan.bold('\n  create-verifiable-agent'));
console.log(chalk.gray('  Claude Sonnet 4.6 + Computer Use  →  verifiable multi-agent recipe\n'));

program
  .name('create-verifiable-agent')
  .description('Turn any GitHub repo or local codebase into a verifiable multi-agent YAML recipe')
  .argument('[source]', 'GitHub URL or local path to analyze (omit to use Mythos demo)')
  .option('-o, --output <dir>', 'output directory', './agent-output')
  .option('--sandbox', 'run in safe sandbox mode (no real API calls, no mutations)', false)
  .option('--plan', 'show plan before executing (default for Pro)', true)
  .option('--accept-edits', 'auto-accept all edits without prompting', false)
  .option('--demo <name>', 'run a built-in demo: mythos (default)', 'mythos')
  .option('--no-notebook', 'skip generating the interactive Markdown notebook')
  .option('--no-collab-card', 'skip generating the human-AI collaboration card')
  .option('--model <model>', 'Claude model to use', 'claude-sonnet-4-6')
  .option('--max-files <n>', 'max files to analyze', '50')
  .option('--api-key <key>', 'Anthropic API key (or set ANTHROPIC_API_KEY env var)')
  .version('1.0.0');

program.parse(process.argv);

const opts = program.opts();
const source = program.args[0] || '__demo__';

run({
  source,
  outputDir: path.resolve(opts.output),
  sandbox: opts.sandbox,
  planMode: opts.plan,
  acceptEdits: opts.acceptEdits,
  demo: source === '__demo__' ? opts.demo : null,
  notebook: opts.notebook !== false,
  collabCard: opts.collabCard !== false,
  model: opts.model,
  maxFiles: parseInt(opts.maxFiles, 10),
  apiKey: opts.apiKey || process.env.ANTHROPIC_API_KEY,
}).catch(err => {
  console.error(chalk.red('\nFatal error:'), err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});

'use strict';

const chalk = require('chalk');
const inquirer = require('inquirer');

async function planMode(context, opts) {
  console.log(chalk.cyan.bold('\n  ── PLAN MODE ─────────────────────────────────────────'));
  console.log(chalk.white('\n  Repository:   ') + chalk.yellow(context.repoName));
  console.log(chalk.white('  Files found:  ') + chalk.yellow(context.files?.length || 0));
  console.log(chalk.white('  Stack:        ') + chalk.yellow(
    [...(context.stack?.languages || []), ...(context.stack?.frameworks || [])].join(', ') || 'unknown'
  ));
  console.log(chalk.white('  Model:        ') + chalk.yellow(opts.model));
  console.log(chalk.white('  Output dir:   ') + chalk.yellow(opts.outputDir));
  console.log(chalk.white('  Sandbox:      ') + (opts.sandbox ? chalk.green('ON') : chalk.red('OFF')));

  console.log(chalk.cyan('\n  ── OUTPUTS THAT WILL BE GENERATED ────────────────────'));
  const outputs = ['recipe.yaml', 'verification-report.yaml'];
  if (opts.notebook) outputs.push('notebook.md');
  if (opts.collabCard) outputs.push('collab-card.md');
  outputs.forEach(f => console.log(chalk.gray(`    • ${f}`)));

  console.log(chalk.cyan('\n  ── AGENT WORKFLOW ────────────────────────────────────'));
  const steps = [
    '  1. analyzer    → scans codebase, detects stack',
    '  2. planner     → decomposes goal into tasks',
    '  3. executor    → implements changes (sandbox)',
    '  4. cu_agent    → validates UI (Computer Use)',
    '  5. verifier    → self-consistency + provenance',
  ];
  steps.forEach(s => console.log(chalk.gray(s)));
  console.log('');

  if (!opts.sandbox) {
    console.log(chalk.yellow('  ⚠  Live mode: real API calls will be made.'));
    console.log(chalk.gray('     Estimated token cost: ~8,000–15,000 tokens\n'));
  }

  const { confirmed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirmed',
    message: 'Proceed with this plan?',
    default: true,
  }]);

  return confirmed;
}

module.exports = { planMode };

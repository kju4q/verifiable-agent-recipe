'use strict';

const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const { analyzeSource } = require('./analyzer');
const { generateRecipe } = require('./generator');
const { runVerification } = require('./verifier');
const { generateNotebook } = require('./notebook');
const { generateCollabCard } = require('./collab-card');
const { loadDemo } = require('./demo-loader');
const { planMode } = require('./plan');

async function run(opts) {
  const {
    source,
    outputDir,
    sandbox,
    planMode: usePlanMode,
    acceptEdits,
    demo,
    notebook,
    collabCard,
    model,
    maxFiles,
    apiKey,
  } = opts;

  // ── Safety check ────────────────────────────────────────────────────────────
  if (sandbox) {
    console.log(chalk.yellow.bold('  [SANDBOX MODE] No real API calls or mutations will occur.\n'));
  }

  if (!apiKey && !sandbox) {
    console.error(chalk.red('  Error: ANTHROPIC_API_KEY not set. Use --api-key or export ANTHROPIC_API_KEY=...'));
    console.error(chalk.gray('  Tip: run with --sandbox to test without an API key.\n'));
    process.exit(1);
  }

  // ── Ensure output dir ────────────────────────────────────────────────────────
  fs.mkdirSync(outputDir, { recursive: true });

  // ── Step 1: Ingest source ────────────────────────────────────────────────────
  let context;

  if (demo || source === '__demo__') {
    const spinner = ora('Loading Mythos demo context...').start();
    context = await loadDemo(demo || 'mythos');
    spinner.succeed('Mythos cyber-risk simulation loaded');
  } else {
    const spinner = ora(`Analyzing ${source}...`).start();
    context = await analyzeSource(source, { maxFiles, sandbox });
    spinner.succeed(`Analyzed ${context.files.length} files from ${context.repoName}`);
  }

  // ── Step 2: Plan mode (show before executing) ────────────────────────────────
  if (usePlanMode && !acceptEdits) {
    const approved = await planMode(context, opts);
    if (!approved) {
      console.log(chalk.yellow('\n  Aborted. Re-run with --accept-edits to skip confirmation.\n'));
      process.exit(0);
    }
  }

  // ── Step 3: Generate outputs ─────────────────────────────────────────────────
  console.log(chalk.cyan('\n  Generating outputs...\n'));

  const spinner2 = ora('Building multi-agent YAML recipe...').start();
  const recipe = await generateRecipe(context, { model, apiKey, sandbox });
  const recipeFile = path.join(outputDir, 'recipe.yaml');
  fs.writeFileSync(recipeFile, recipe);
  spinner2.succeed(`Recipe → ${path.relative(process.cwd(), recipeFile)}`);

  const spinner3 = ora('Running verification loops...').start();
  const verification = await runVerification(context, recipe, { model, apiKey, sandbox });
  const verifyFile = path.join(outputDir, 'verification-report.yaml');
  fs.writeFileSync(verifyFile, verification.report);
  const statusIcon = verification.passed ? chalk.green('✔') : chalk.red('✖');
  spinner3.succeed(`Verification ${statusIcon} → ${path.relative(process.cwd(), verifyFile)}`);

  if (notebook) {
    const spinner4 = ora('Building interactive Markdown notebook...').start();
    const nb = await generateNotebook(context, recipe, verification);
    const nbFile = path.join(outputDir, 'notebook.md');
    fs.writeFileSync(nbFile, nb);
    spinner4.succeed(`Notebook → ${path.relative(process.cwd(), nbFile)}`);
  }

  if (collabCard) {
    const spinner5 = ora('Creating human-AI collaboration card...').start();
    const card = await generateCollabCard(context, recipe, verification);
    const cardFile = path.join(outputDir, 'collab-card.md');
    fs.writeFileSync(cardFile, card);
    spinner5.succeed(`Collab card → ${path.relative(process.cwd(), cardFile)}`);
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
  console.log(chalk.green.bold('\n  All outputs written to: ') + chalk.white(outputDir));
  console.log(chalk.gray('\n  Files generated:'));
  for (const f of fs.readdirSync(outputDir)) {
    console.log(chalk.gray(`    • ${f}`));
  }
  console.log('');
}

module.exports = { run };

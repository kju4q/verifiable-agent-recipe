'use strict';

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Minimal test runner — no external deps
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function runAll() {
  console.log(chalk.cyan.bold('\n  Running tests...\n'));
  for (const t of tests) {
    try {
      await t.fn();
      console.log(chalk.green(`  ✔ ${t.name}`));
      passed++;
    } catch (e) {
      console.log(chalk.red(`  ✖ ${t.name}`));
      console.log(chalk.gray(`    ${e.message}`));
      failed++;
    }
  }
  console.log(chalk.cyan(`\n  Results: ${passed} passed, ${failed} failed\n`));
  if (failed > 0) process.exit(1);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('demo/mythos.js exports valid context', () => {
  const demo = require('../demo/mythos');
  assert(demo.repoName, 'repoName required');
  assert(Array.isArray(demo.files), 'files must be array');
  assert(demo.stack, 'stack required');
  assert(demo.summary, 'summary required');
  assert(demo.findings?.critical?.length > 0, 'must have critical findings');
});

test('generator produces valid YAML in sandbox mode', async () => {
  const { generateRecipe } = require('../src/generator');
  const demo = require('../demo/mythos');
  const yaml = require('js-yaml');
  const result = await generateRecipe(demo, { sandbox: true });
  assert(typeof result === 'string', 'must return string');
  const parsed = yaml.load(result);
  assert(parsed.metadata, 'must have metadata');
  assert(Array.isArray(parsed.agents), 'must have agents array');
  assert(parsed.safety?.sandbox_mode === true, 'sandbox_mode must be true');
});

test('verifier runs all checks and returns report', async () => {
  const { generateRecipe } = require('../src/generator');
  const { runVerification } = require('../src/verifier');
  const demo = require('../demo/mythos');
  const recipe = await generateRecipe(demo, { sandbox: true });
  const result = await runVerification(demo, recipe, { sandbox: true });
  assert(typeof result.passed === 'boolean', 'must have passed field');
  assert(Array.isArray(result.results), 'must have results array');
  assert(typeof result.report === 'string', 'must have YAML report string');
  assert(result.results.length >= 3, 'must run at least 3 checks');
});

test('notebook generator produces markdown with all sections', async () => {
  const { generateRecipe } = require('../src/generator');
  const { runVerification } = require('../src/verifier');
  const { generateNotebook } = require('../src/notebook');
  const demo = require('../demo/mythos');
  const recipe = await generateRecipe(demo, { sandbox: true });
  const verification = await runVerification(demo, recipe, { sandbox: true });
  const nb = await generateNotebook(demo, recipe, verification);
  assert(nb.includes('## 1. Repository Analysis'), 'missing section 1');
  assert(nb.includes('## 2. Multi-Agent Recipe Overview'), 'missing section 2');
  assert(nb.includes('## 5. Verification Report'), 'missing section 5');
  assert(nb.includes('## 7. Run It Yourself'), 'missing section 7');
});

test('collab card generator produces markdown with trust boundaries', async () => {
  const { generateRecipe } = require('../src/generator');
  const { runVerification } = require('../src/verifier');
  const { generateCollabCard } = require('../src/collab-card');
  const demo = require('../demo/mythos');
  const recipe = await generateRecipe(demo, { sandbox: true });
  const verification = await runVerification(demo, recipe, { sandbox: true });
  const card = await generateCollabCard(demo, recipe, verification);
  assert(card.includes('Trust boundaries'), 'missing trust boundaries');
  assert(card.includes('Human-AI Collaboration Card'), 'missing title');
  assert(card.includes('sandbox'), 'must mention sandbox');
});

test('demo-loader loads mythos correctly', async () => {
  const { loadDemo } = require('../src/demo-loader');
  const demo = await loadDemo('mythos');
  assert(demo.repoName === 'mythos-capybara-sim', 'wrong repoName');
  assert(demo.isDemo === true, 'must be marked as demo');
});

test('bin/create-verifiable-agent.js is executable', () => {
  const binPath = path.join(__dirname, '..', 'bin', 'create-verifiable-agent.js');
  assert(fs.existsSync(binPath), 'bin file must exist');
  const stat = fs.statSync(binPath);
  // Check execute bit (owner)
  assert((stat.mode & 0o100) !== 0, 'bin must be executable');
});

runAll();

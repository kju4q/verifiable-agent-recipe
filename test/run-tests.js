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

test('html-extractor: parses title and meta from HTML', () => {
  const { extractFromHtml } = require('../src/html-extractor');
  const html = `<html><head>
    <title>Test Leak Doc — AI Model</title>
    <meta name="description" content="A step change in AI">
  </head><body>
    <p>Anthropic confirmed it is a "step change" in capability.</p>
    <blockquote>Currently far ahead of any other AI model in cyber capabilities.</blockquote>
    <p>This presages an upcoming wave of models that can exploit vulnerabilities faster.</p>
  </body></html>`;
  const result = extractFromHtml(html, 'test.html');
  assert(result.title === 'Test Leak Doc — AI Model', `bad title: ${result.title}`);
  assert(result.metaDescription.includes('step change'), 'meta description missing signal');
  assert(result.blockquotes.length > 0, 'must extract blockquotes');
  assert(result.blockquotes[0].toLowerCase().includes('cyber'), 'blockquote content wrong');
  assert(result.signalMatches.includes('step change'), 'must match step change signal');
  assert(result.signalMatches.includes('far ahead'), 'must match far ahead signal');
});

test('html-extractor: extracts cyber-risk warnings', () => {
  const { extractFromHtml } = require('../src/html-extractor');
  const html = `<html><body>
    <p>This model is currently far ahead of any other AI model in cyber capabilities.</p>
    <p>It can exploit vulnerabilities faster than defenders can patch them.</p>
    <p>It presages an upcoming wave that will outpace defender efforts.</p>
  </body></html>`;
  const result = extractFromHtml(html, 'risk.html');
  assert(result.cyberRiskWarnings.length >= 1, `expected ≥1 risk warning, got ${result.cyberRiskWarnings.length}`);
});

test('html-extractor: extracts JSON-LD FAQ entries', () => {
  const { extractFromHtml } = require('../src/html-extractor');
  const faqJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{
      '@type': 'Question',
      name: 'What is Capybara?',
      acceptedAnswer: { '@type': 'Answer', text: 'A step change in AI capability.' },
    }],
  });
  const html = `<html><head><script type="application/ld+json">${faqJson}</script></head><body></body></html>`;
  const result = extractFromHtml(html, 'faq.html');
  assert(result.faqEntries.length === 1, 'must parse FAQ');
  assert(result.faqEntries[0].question === 'What is Capybara?', 'wrong question');
  assert(result.faqEntries[0].answer.includes('step change'), 'wrong answer');
});

test('demo/mythos.js exports valid context', () => {
  const demo = require('../demo/mythos');
  assert(demo.repoName, 'repoName required');
  assert(Array.isArray(demo.files), 'files must be array');
  assert(demo.stack, 'stack required');
  assert(demo.summary, 'summary required');
  assert(demo.findings?.critical?.length > 0, 'must have critical findings');
  assert(demo.highlightQuotes, 'must have highlightQuotes');
  assert(demo.highlightQuotes.stepChange, 'must have stepChange quote');
  assert(demo.highlightQuotes.cyberLead, 'must have cyberLead quote');
  assert(demo.notableQuotes?.length > 0, 'must have notableQuotes array');
  assert(demo.cyberRiskWarnings?.length > 0, 'must have cyberRiskWarnings');
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

test('verifier runs all checks including leak-claim analysis', async () => {
  const { generateRecipe } = require('../src/generator');
  const { runVerification } = require('../src/verifier');
  const demo = require('../demo/mythos');
  const recipe = await generateRecipe(demo, { sandbox: true });
  const result = await runVerification(demo, recipe, { sandbox: true });
  assert(typeof result.passed === 'boolean', 'must have passed field');
  assert(Array.isArray(result.results), 'must have results array');
  assert(typeof result.report === 'string', 'must have YAML report string');
  assert(result.results.length >= 4, 'must run at least 4 checks (incl. leak-claim)');
  const leakCheck = result.results.find(r => r.name === 'leak_claim_risk_analysis');
  assert(leakCheck, 'must include leak_claim_risk_analysis check');
  assert(Array.isArray(leakCheck.claims_checked), 'must list claims checked');
  assert(leakCheck.claims_checked.length >= 5, 'must check all 5 key Capybara claims');
  // Verify the report YAML includes Mythos risk context
  assert(result.report.includes('mythos_capybara_risk_context'), 'report must include mythos risk context');
});

test('notebook generator produces markdown with all sections', async () => {
  const { generateRecipe } = require('../src/generator');
  const { runVerification } = require('../src/verifier');
  const { generateNotebook } = require('../src/notebook');
  const demo = require('../demo/mythos');
  const recipe = await generateRecipe(demo, { sandbox: true });
  const verification = await runVerification(demo, recipe, { sandbox: true });
  const nb = await generateNotebook(demo, recipe, verification);
  // Core sections always present
  assert(nb.includes('## 1. Repository Analysis'), 'missing section 1');
  // Leak demo sections (numbers shift when isDemo=true)
  assert(nb.includes('## 2. Leak Document Analysis'), 'missing leak section 2');
  assert(nb.includes('## 3. Key Quotes from the Leak'), 'missing quotes section 3');
  assert(nb.includes('## 4. Capability Claims'), 'missing capability section 4');
  assert(nb.includes('## 5. Cyber-Risk Warnings'), 'missing cyber-risk section 5');
  // Recipe / workflow (renumbered)
  assert(nb.includes('Multi-Agent Recipe Overview'), 'missing recipe section');
  assert(nb.includes('Verification Report'), 'missing verification section');
  assert(nb.includes('Run It Yourself'), 'missing run-it-yourself section');
  // Key quotes must appear
  assert(nb.includes('step change'), 'missing step change quote');
  assert(nb.includes('far ahead'), 'missing far-ahead quote');
  assert(nb.includes('dramatically higher'), 'missing dramatically-higher quote');
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

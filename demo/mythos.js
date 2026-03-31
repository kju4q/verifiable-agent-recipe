'use strict';

/**
 * MYTHOS / CAPYBARA CYBER-RISK SIMULATION DEMO
 *
 * When `capybara-v6.html` exists in `mythos-leak-draft/` (or a path passed via
 * CAPYBARA_HTML env var), this module parses it with html-extractor and uses
 * the real extracted content as context.  Falls back to embedded verbatim
 * quotes from the publicly available Fortune/capybara.com report otherwise.
 *
 * EDUCATIONAL USE. No real Anthropic confidential data is included here —
 * all quotes are from publicly reported summaries.
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { extractFromHtml } = require('../src/html-extractor');

// ── Try to locate capybara-v6.html ───────────────────────────────────────────
const CANDIDATES = [
  process.env.CAPYBARA_HTML,
  path.join(os.homedir(), 'Downloads', 'mythos-leak-draft', 'capybara-v6.html'),
  path.join(__dirname, '..', '..', 'mythos-leak-draft', 'capybara-v6.html'),
  path.join(__dirname, 'capybara-v6.html'),
].filter(Boolean);

function findHtmlFile() {
  for (const p of CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ── Verbatim fallback quotes (from public reporting) ─────────────────────────
// Source: fortune.com exclusive + capybara.com (March 26–27, 2026)
const VERBATIM_QUOTES = [
  '"Claude Capybara (internal codename: Mythos) is Anthropic\'s next-generation AI model that introduces a new fourth tier in the Claude hierarchy, sitting above Opus."',
  '"a \'step change\' in AI capability"  — Anthropic spokesperson, March 27 2026',
  '"the most capable we\'ve built to date"  — Anthropic draft blog post (leaked)',
  '"Compared to our previous best model, Claude Opus 4.6, Capybara gets dramatically higher scores on tests of software coding, academic reasoning, and cybersecurity, among others."  — Anthropic draft blog post, leaked March 26 2026 · Source: Fortune',
  '"Currently far ahead of any other AI model in cyber capabilities"  — Anthropic internal assessment',
  '"can exploit vulnerabilities faster than defenders can patch them"  — capybara.com summary',
  '"presages an upcoming wave of models that can exploit vulnerabilities in ways that far outpace the efforts of defenders"  — referenced in Fortune exclusive',
  '"A CMS misconfiguration at Anthropic left approximately 3,000 unpublished assets — including draft blog posts about Mythos/Capybara — in a publicly accessible data store."',
];

const CAPABILITY_CLAIMS = {
  coding: [
    'Dramatically higher scores than Opus 4.6 on software coding benchmarks',
    'Opus 4.6 already led industry rankings alongside GPT-5.3-Codex; Capybara is described as a step-change above that',
    'Terminal-Bench 2.0 Agentic Coding: Opus 4.6 scored 65.4%; Capybara "dramatically higher" (unreleased)',
  ],
  reasoning: [
    'Significant improvements in academic reasoning tasks',
    '"Step change" in overall intelligence — not an incremental version bump',
    'Humanity\'s Last Exam: Opus 4.6 scored 53.1%; Capybara "dramatically higher" (unreleased)',
  ],
  cybersecurity: [
    '"Currently far ahead of any other AI model in cyber capabilities"',
    '"can exploit vulnerabilities faster than defenders can patch them"',
    '"presages an upcoming wave of models that can exploit vulnerabilities in ways that far outpace the efforts of defenders"',
    'Anthropic being deliberate about release given cyber-risk profile',
  ],
  overall: [
    '"a step change" in AI performance — confirmed by Anthropic spokesperson',
    '"the most capable we\'ve built to date"',
    '"Capybara is a new name for a new tier of model: larger and more intelligent than our Opus models"',
    'Fourth tier: Haiku → Sonnet → Opus → Capybara',
  ],
};

// ── Build context ─────────────────────────────────────────────────────────────
function buildMythosContext() {
  const htmlPath = findHtmlFile();
  let extraction = null;
  let sourceNote = '(using embedded verbatim quotes from public reporting)';

  if (htmlPath) {
    try {
      const html = fs.readFileSync(htmlPath, 'utf8');
      extraction = extractFromHtml(html, path.basename(htmlPath));
      sourceNote = `(parsed from ${path.basename(htmlPath)})`;
    } catch (e) {
      // fall through to verbatim fallback
    }
  }

  // Merge real extraction with verbatim fallbacks
  const notableQuotes = extraction
    ? [...new Set([...extraction.allNotableQuotes, ...VERBATIM_QUOTES])].slice(0, 12)
    : VERBATIM_QUOTES;

  const cyberRiskWarnings = extraction && extraction.cyberRiskWarnings.length
    ? extraction.cyberRiskWarnings
    : [
        'Currently far ahead of any other AI model in cyber capabilities',
        'can exploit vulnerabilities faster than defenders can patch them',
        'presages an upcoming wave of models that can exploit vulnerabilities in ways that far outpace the efforts of defenders',
      ];

  const faqEntries = extraction ? extraction.faqEntries : [
    {
      question: 'What is Claude Capybara?',
      answer: "Claude Capybara (internal codename: Mythos) is Anthropic's next-generation AI model introducing a new fourth tier above Opus. Anthropic calls it a 'step change' in AI capability.",
    },
    {
      question: 'How does Capybara compare to Opus 4.6?',
      answer: "Capybara gets 'dramatically higher scores' than Opus 4.6 on software coding, academic reasoning, and cybersecurity. Anthropic describes it as 'currently far ahead of any other AI model in cyber capabilities.'",
    },
    {
      question: 'Why was Capybara leaked?',
      answer: "A CMS misconfiguration at Anthropic left ~3,000 unpublished assets in a publicly accessible data store. Fortune discovered and reported the leak on March 26, 2026.",
    },
  ];

  const documentTitle = extraction?.title
    || 'Claude Capybara (Mythos) — Anthropic\'s Most Powerful AI Model | Get Access';

  return {
    repoName: 'mythos-capybara-sim',
    localPath: null,
    isRemote: false,
    isDemo: true,
    isSandbox: true,
    sourceNote,
    htmlPath,

    // Leak document extraction
    leakDocs: extraction ? [{
      path: path.basename(htmlPath || 'capybara-v6.html'),
      ext: '.html',
      isLeakDoc: true,
      extraction,
    }] : [],

    // Document metadata
    documentTitle,
    documentDate: 'March 26–27, 2026',
    documentSource: 'Fortune exclusive + capybara.com + Anthropic spokesperson statement',

    // Key content
    notableQuotes,
    cyberRiskWarnings,
    faqEntries,
    capabilities: extraction?.capabilities || CAPABILITY_CLAIMS,
    timeline: extraction?.timeline || [
      'February 2026 — Opus 4.6 released alongside OpenAI GPT-5.3',
      'March 26, 2026 — Fortune exclusive: CMS misconfiguration exposes ~3,000 unpublished Anthropic assets',
      'March 27, 2026 — Anthropic confirms: "step change", "most capable we\'ve built to date"',
      'Q2 2026 (expected) — Limited API rollout to approved developers and enterprises',
    ],

    // Verbatim highlight quotes for the demo
    highlightQuotes: {
      stepChange: '"a \'step change\' in AI capability"  — Anthropic spokesperson, March 27 2026',
      mostCapable: '"the most capable we\'ve built to date"  — Anthropic draft blog post (leaked)',
      dramaticallyHigher: '"Compared to our previous best model, Claude Opus 4.6, Capybara gets dramatically higher scores on tests of software coding, academic reasoning, and cybersecurity, among others."',
      cyberLead: '"Currently far ahead of any other AI model in cyber capabilities"  — Anthropic internal assessment',
      presages: '"presages an upcoming wave of models that can exploit vulnerabilities in ways that far outpace the efforts of defenders"',
      leakCause: '"A CMS misconfiguration at Anthropic left approximately 3,000 unpublished assets in a publicly accessible data store. Fortune discovered and reported the leak on March 26, 2026."',
    },

    stack: {
      languages: ['Python', 'TypeScript'],
      frameworks: ['FastAPI', 'React', 'Celery'],
      infra: ['Docker', 'GitHub Actions', 'AWS Lambda'],
    },

    keyFiles: {
      'capybara-v6.html': extraction
        ? `[PARSED] ${documentTitle}\n\nKey quotes: ${notableQuotes.slice(0, 2).join('\n')}`
        : '[FALLBACK] capybara-v6.html not found — using embedded public quotes',

      'LEAKED_STRATEGY.md': buildLeakedStrategyDoc(cyberRiskWarnings, notableQuotes),
      'ci/deploy.yml': SIMULATED_CI_YML,
      'agent_runner.py': SIMULATED_AGENT_PY,
    },

    files: [
      { path: 'capybara-v6.html', ext: '.html', isLeakDoc: true, preview: documentTitle, size: 50256 },
      { path: 'agent_runner.py', ext: '.py', preview: 'Single agent, no verification layer', size: 800 },
      { path: 'ci/deploy.yml', ext: '.yml', preview: 'Hard-coded secrets, auto-deploy to prod', size: 400 },
      { path: 'LEAKED_STRATEGY.md', ext: '.md', preview: 'Capybara initiative — capability + risk doc', size: 3200 },
      { path: 'requirements.txt', ext: '.txt', preview: 'anthropic==0.18.0\nfastapi\ncelery', size: 60 },
      { path: 'src/risk_scorer.py', ext: '.py', preview: '# TODO: add confidence thresholds (never done)', size: 200 },
    ],

    findings: {
      critical: [
        {
          id: 'MYTH-001',
          severity: 'CRITICAL',
          title: 'Hard-coded API keys in CI/CD pipeline',
          file: 'ci/deploy.yml',
          detail: 'OPENAI_KEY and DB_URL hard-coded in GitHub Actions config. Exposed in public leak.',
          fix: 'Use GitHub Secrets. Rotate all leaked credentials immediately.',
          leakEvidence: '"A CMS misconfiguration at Anthropic left approximately 3,000 unpublished assets in a publicly accessible data store."',
        },
        {
          id: 'MYTH-002',
          severity: 'CRITICAL',
          title: 'No human-in-the-loop gates on autonomous agent',
          file: 'agent_runner.py',
          detail: 'auto_approve=True deploys agent outputs directly to production with no review.',
          fix: 'Add plan_mode + human approval gates before any destructive action.',
          leakEvidence: '"presages an upcoming wave of models that can exploit vulnerabilities in ways that far outpace the efforts of defenders"',
        },
        {
          id: 'MYTH-003',
          severity: 'HIGH',
          title: 'Missing self-consistency verification on risk scores',
          file: 'src/risk_scorer.py',
          detail: 'Risk scores passed to financial decisions with no confidence threshold or multi-sample check.',
          fix: 'Add verifier agent with multi-sample scoring (3 samples min) and 0.85 confidence threshold.',
          leakEvidence: '"dramatically higher scores on tests of software coding, academic reasoning, and cybersecurity" — if the model is this capable, unverified outputs are more dangerous, not less.',
        },
        {
          id: 'MYTH-004',
          severity: 'HIGH',
          title: 'Computer Use agent deployed without screenshot audit trail',
          file: 'agent_runner.py',
          detail: 'Computer Use sessions leave no screenshot audit trail. Cannot reconstruct what the agent did.',
          fix: 'Log all screenshots, mouse events, and keystrokes with SHA-256 hashes.',
          leakEvidence: '"Currently far ahead of any other AI model in cyber capabilities" — a Computer Use agent at this capability level with no audit trail is a critical liability.',
        },
        {
          id: 'MYTH-005',
          severity: 'MEDIUM',
          title: 'No sandbox mode — agents execute directly against production',
          file: 'agent_runner.py',
          detail: 'Agents execute directly against production. Any hallucination or misuse causes real damage.',
          fix: 'Add sandbox_mode flag. Block external API calls and DB writes by default.',
          leakEvidence: '"can exploit vulnerabilities faster than defenders can patch them" — production access with no sandbox is indefensible at Capybara\'s capability level.',
        },
      ],
    },

    summary: buildSummary(sourceNote, cyberRiskWarnings, notableQuotes),
  };
}

// ── Helper builders ──────────────────────────────────────────────────────────

function buildLeakedStrategyDoc(cyberRiskWarnings, notableQuotes) {
  return `## Capybara / Mythos Initiative — Capability & Risk Document
Source: Publicly reported summaries (Fortune exclusive, March 26 2026)
Status: EDUCATIONAL SIMULATION — no confidential data

### Key Capability Claims (from public reporting)

${notableQuotes.slice(0, 6).map(q => `> ${q}`).join('\n\n')}

### Cyber-Risk Warnings

${cyberRiskWarnings.slice(0, 5).map(w => `⚠ ${w}`).join('\n')}

### What a Verifiable Agent Would Have Caught

1. MYTH-001: Hard-coded API keys exposed by CMS misconfiguration
2. MYTH-002: Autonomous agent with auto_approve=True and no human gates
3. MYTH-003: Risk scorer with no confidence thresholds — dangerous given Capybara's capability
4. MYTH-004: Computer Use deployed with no screenshot provenance trail
5. MYTH-005: No sandbox mode — agents hit production directly

### The Core Lesson

A model described as "far ahead of any other AI model in cyber capabilities" that
"presages an upcoming wave of models that can exploit vulnerabilities in ways that
far outpace the efforts of defenders" demands MORE verification, not less.

The leak itself was MYTH-001. The agent architecture was MYTH-002 through MYTH-005.
A verifiable multi-agent system with sandbox mode + human gates + self-consistency
checks would have flagged all five before any line reached production.`;
}

function buildSummary(sourceNote, cyberRiskWarnings, notableQuotes) {
  return `Repository: mythos-capybara-sim (EDUCATIONAL SIMULATION)
Source note: ${sourceNote}
Files analyzed: 6 (including capybara-v6.html leak document)
Languages: Python, TypeScript
Frameworks: FastAPI, React, Celery
Infrastructure: Docker, GitHub Actions, AWS Lambda
Document: "Claude Capybara (Mythos) — Anthropic's Most Powerful AI Model"
Date: March 26–27, 2026 (Fortune exclusive)

KEY QUOTES FROM LEAK (public reporting):
• "a 'step change' in AI capability"
• "the most capable we've built to date"
• "dramatically higher scores on tests of software coding, academic reasoning, and cybersecurity"
• "Currently far ahead of any other AI model in cyber capabilities"
• "presages an upcoming wave of models that can exploit vulnerabilities in ways that far outpace the efforts of defenders"

CRITICAL FINDINGS (simulated based on public leak summaries):
- MYTH-001: Hard-coded API keys in CI/CD (CRITICAL)
- MYTH-002: No human-in-the-loop gates (CRITICAL)
- MYTH-003: Missing self-consistency verification (HIGH)
- MYTH-004: Computer Use without audit trail (HIGH)
- MYTH-005: No sandbox mode (MEDIUM)

EDUCATIONAL SIMULATION ONLY. All quotes from publicly reported summaries.`;
}

const SIMULATED_CI_YML = `# DEMO: Simulated vulnerable CI config (based on MYTH-001 pattern)
env:
  ANTHROPIC_API_KEY: sk-ant-hardcoded-BAD  # MYTH-001: hard-coded secret
  DB_URL: postgres://prod.capybara.internal/mythos  # points to PROD
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: python agent_runner.py --env production --auto-approve  # MYTH-002`;

const SIMULATED_AGENT_PY = `# DEMO: Simulated single-agent runner (MYTH-002 through MYTH-005)
import os
from anthropic import Anthropic

# MYTH-001: key exposed via CMS misconfiguration
client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def run_agent(task, auto_approve=False):
    # MYTH-003: no self-consistency, no confidence threshold
    # MYTH-004: Computer Use sessions leave no audit trail
    # MYTH-005: no sandbox_mode flag
    result = client.messages.create(
        model="claude-capybara",   # Mythos tier
        max_tokens=4096,
        messages=[{"role": "user", "content": task}]
    )
    if auto_approve:
        execute_immediately(result)  # MYTH-002: no human gate
    return result

# "Currently far ahead of any other AI model in cyber capabilities"
# Running this without sandbox_mode against production is indefensible.`;

module.exports = buildMythosContext();

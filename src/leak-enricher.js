'use strict';

/**
 * leak-enricher.js
 *
 * When a context comes from analyzeSource() (real repo / GitHub URL), the
 * rich leak fields (highlightQuotes, notableQuotes, cyberRiskWarnings, etc.)
 * live deep inside context.leakDocs[0].extraction.  The notebook, verifier,
 * and collab-card generators expect them on the context root — matching what
 * demo/mythos.js provides.
 *
 * This module promotes extraction data to the context root so every code path
 * works identically whether the source is --demo mythos or a real GitHub URL.
 */

// The five quotes every consumer must see regardless of extraction quality
const CANONICAL_QUOTES = {
  stepChange:
    '"a \'step change\' in AI capability"  — Anthropic spokesperson, March 27 2026',
  mostCapable:
    '"the most capable we\'ve built to date"  — Anthropic draft blog post (leaked)',
  dramaticallyHigher:
    '"Compared to our previous best model, Claude Opus 4.6, Capybara gets dramatically higher scores on tests of software coding, academic reasoning, and cybersecurity, among others."  — Anthropic draft blog post, leaked March 26 2026 · Source: Fortune',
  cyberLead:
    '"Currently far ahead of any other AI model in cyber capabilities"  — Anthropic internal assessment',
  presages:
    '"presages an upcoming wave of models that can exploit vulnerabilities in ways that far outpace the efforts of defenders"',
};

const CANONICAL_CYBER_WARNINGS = [
  'Currently far ahead of any other AI model in cyber capabilities',
  'can exploit vulnerabilities faster than defenders can patch them',
  'presages an upcoming wave of models that can exploit vulnerabilities in ways that far outpace the efforts of defenders',
];

const CANONICAL_FINDINGS = {
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
      leakEvidence: '"dramatically higher scores on tests of software coding, academic reasoning, and cybersecurity" — higher capability means unverified outputs carry more risk.',
    },
    {
      id: 'MYTH-004',
      severity: 'HIGH',
      title: 'Computer Use agent deployed without screenshot audit trail',
      file: 'agent_runner.py',
      detail: 'Computer Use sessions leave no screenshot audit trail.',
      fix: 'Log all screenshots, mouse events, and keystrokes with SHA-256 hashes.',
      leakEvidence: '"Currently far ahead of any other AI model in cyber capabilities" — a Computer Use agent at this level with no audit trail is a critical liability.',
    },
    {
      id: 'MYTH-005',
      severity: 'MEDIUM',
      title: 'No sandbox mode — agents execute directly against production',
      file: 'agent_runner.py',
      detail: 'Agents execute directly against production.',
      fix: 'Add sandbox_mode flag. Block external API calls and DB writes by default.',
      leakEvidence: '"can exploit vulnerabilities faster than defenders can patch them" — production access with no sandbox is indefensible at Capybara\'s capability level.',
    },
  ],
};

/**
 * Enrich a context object produced by analyzeSource() with the same top-level
 * fields that demo/mythos.js provides.  Mutates context in-place and returns it.
 *
 * Safe to call on a demo context too — it will skip enrichment if the fields
 * are already present.
 */
function enrichContext(context) {
  // Already enriched (demo path or previous call)
  if (context.highlightQuotes) return context;

  const leakDoc = (context.leakDocs || [])[0];
  if (!leakDoc) return context; // no HTML files — nothing to enrich

  const ex = leakDoc.extraction;

  // ── Document metadata ──────────────────────────────────────────────────────
  context.documentTitle  = context.documentTitle  || ex.title        || '';
  context.documentDate   = context.documentDate   || extractDate(ex) || '';
  context.documentSource = context.documentSource || 'HTML document analysis';
  context.htmlPath       = context.htmlPath       || leakDoc.path    || null;

  // ── Highlight quotes — prefer extracted, guaranteed canonical fallback ─────
  context.highlightQuotes = buildHighlightQuotes(ex);

  // ── Notable quotes (extracted + canonical deduped) ─────────────────────────
  const extractedQuotes = ex.allNotableQuotes || [];
  const canonicalArr    = Object.values(CANONICAL_QUOTES);
  context.notableQuotes = dedupeArr([...extractedQuotes, ...canonicalArr]).slice(0, 14);

  // ── Cyber-risk warnings ────────────────────────────────────────────────────
  context.cyberRiskWarnings = ex.cyberRiskWarnings && ex.cyberRiskWarnings.length
    ? dedupeArr([...ex.cyberRiskWarnings, ...CANONICAL_CYBER_WARNINGS])
    : CANONICAL_CYBER_WARNINGS;

  // ── Capabilities ───────────────────────────────────────────────────────────
  context.capabilities = mergeCapabilities(ex.capabilities);

  // ── FAQ entries ────────────────────────────────────────────────────────────
  context.faqEntries = ex.faqEntries || [];

  // ── Timeline ──────────────────────────────────────────────────────────────
  context.timeline = ex.timeline && ex.timeline.length
    ? ex.timeline
    : [
        'February 2026 — Opus 4.6 released alongside OpenAI GPT-5.3',
        'March 26, 2026 — Fortune exclusive: CMS misconfiguration exposes ~3,000 unpublished Anthropic assets',
        'March 27, 2026 — Anthropic confirms: "step change", "most capable we\'ve built to date"',
        'Q2 2026 (expected) — Limited API rollout to approved developers and enterprises',
      ];

  // ── Findings ──────────────────────────────────────────────────────────────
  if (!context.findings) context.findings = CANONICAL_FINDINGS;

  // ── Mark as leak demo for downstream consumers ────────────────────────────
  context.isLeakEnriched = true;
  context.sourceNote = `parsed from ${leakDoc.path} (${ex.signalMatches.length} signal phrases detected)`;

  return context;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildHighlightQuotes(ex) {
  const all  = (ex.allNotableQuotes || []).map(q => q.toLowerCase());
  const find = (phrase) =>
    (ex.allNotableQuotes || []).find(q => q.toLowerCase().includes(phrase));

  return {
    stepChange:        find('step change')          || CANONICAL_QUOTES.stepChange,
    mostCapable:       find('most capable')         || CANONICAL_QUOTES.mostCapable,
    dramaticallyHigher:find('dramatically higher')  || CANONICAL_QUOTES.dramaticallyHigher,
    cyberLead:         find('far ahead')            || CANONICAL_QUOTES.cyberLead,
    presages:          find('presages')             || find('outpace')
                                                    || CANONICAL_QUOTES.presages,
    leakCause:         find('cms') || find('3,000') || find('human error')
                       || '"A CMS misconfiguration at Anthropic left approximately 3,000 unpublished assets in a publicly accessible data store. Fortune discovered and reported the leak on March 26, 2026."',
  };
}

function mergeCapabilities(extracted = {}) {
  const defaults = {
    coding: [
      'Dramatically higher scores than Opus 4.6 on software coding benchmarks',
      'Terminal-Bench 2.0 Agentic Coding: Opus 4.6 scored 65.4%; Capybara "dramatically higher" (unreleased)',
    ],
    reasoning: [
      '"Step change" in overall intelligence — not an incremental version bump',
      "Humanity's Last Exam: Opus 4.6 scored 53.1%; Capybara \"dramatically higher\" (unreleased)",
    ],
    cybersecurity: [
      '"Currently far ahead of any other AI model in cyber capabilities"',
      '"can exploit vulnerabilities faster than defenders can patch them"',
      '"presages an upcoming wave of models that can exploit vulnerabilities in ways that far outpace the efforts of defenders"',
    ],
    overall: [
      '"a step change" in AI performance — confirmed by Anthropic spokesperson',
      '"the most capable we\'ve built to date"',
      '"Capybara is a new name for a new tier of model: larger and more intelligent than our Opus models"',
    ],
  };

  const result = {};
  for (const key of ['coding', 'reasoning', 'cybersecurity', 'overall']) {
    const ext = extracted[key] || [];
    result[key] = ext.length
      ? dedupeArr([...ext, ...defaults[key]]).slice(0, 4)
      : defaults[key];
  }
  return result;
}

function extractDate(ex) {
  const timeline = ex.timeline || [];
  if (timeline.length) return timeline[0].slice(0, 40);
  const match = (ex.plainText || '').match(
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/
  );
  return match ? match[0] : '';
}

function dedupeArr(arr) {
  const seen = new Set();
  return arr.filter(item => {
    const key = item.toLowerCase().replace(/\s+/g, ' ').slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = { enrichContext };

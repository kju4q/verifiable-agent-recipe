'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// MYTHOS / CAPYBARA CYBER-RISK SIMULATION DEMO
//
// Based on publicly available summaries of the Mythos internal strategy leak
// (circulated March 2025). This demo simulates what a verifiable AI agent
// would have caught had it been running over Mythos's codebase.
//
// FICTIONAL / EDUCATIONAL USE ONLY. Safe sandbox mode active by default.
// ─────────────────────────────────────────────────────────────────────────────

const mythosContext = {
  repoName: 'mythos-capybara-sim',
  localPath: null,
  isRemote: false,
  isDemo: true,
  isSandbox: true,

  stack: {
    languages: ['Python', 'TypeScript'],
    frameworks: ['FastAPI', 'React', 'Celery'],
    infra: ['Docker', 'GitHub Actions', 'AWS Lambda'],
  },

  keyFiles: {
    'README.md': `# Mythos Platform (DEMO SIMULATION)
Internal AI risk orchestration platform. Codename: Capybara.
WARNING: This is a fictional simulation for educational purposes.`,

    'LEAKED_STRATEGY.md': `## Capybara Initiative — Internal Memo (PUBLIC LEAK SUMMARY)
Key risks identified by public researchers after the March 2025 leak:
1. Autonomous agent loops with no human-in-the-loop gates
2. Hard-coded API keys in CI/CD configs (found in GitHub Actions)
3. No self-consistency checks on LLM outputs used for financial decisions
4. Computer Use agent deployed without screenshot audit trail
5. Single-agent architecture with no verifier layer
6. No sandbox mode — agents ran directly against production systems`,

    'ci/deploy.yml': `# DEMO: Simulated vulnerable CI config
env:
  OPENAI_KEY: sk-hardcoded-BAD  # Security risk: hardcoded key
  DB_URL: postgres://prod.mythos.internal/capybara  # Points to PROD
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: python agent_runner.py --env production --auto-approve`,

    'agent_runner.py': `# DEMO: Simulated single-agent runner (no verification)
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ["OPENAI_KEY"])  # Wrong key name too

def run_agent(task, auto_approve=False):
    # No sandbox, no verification, no human gates
    result = client.messages.create(
        model="claude-opus-4-6",
        messages=[{"role": "user", "content": task}]
    )
    if auto_approve:
        execute_immediately(result)  # Dangerous!
    return result`,
  },

  files: [
    { path: 'agent_runner.py', ext: '.py', preview: 'Single agent, no verification layer', size: 800 },
    { path: 'ci/deploy.yml', ext: '.yml', preview: 'Hard-coded secrets, auto-deploy to prod', size: 400 },
    { path: 'LEAKED_STRATEGY.md', ext: '.md', preview: 'Capybara initiative internal memo', size: 1200 },
    { path: 'requirements.txt', ext: '.txt', preview: 'anthropic==0.18.0\nfastapi\ncelery', size: 60 },
    { path: 'src/risk_scorer.py', ext: '.py', preview: '# TODO: add confidence thresholds (never done)', size: 200 },
    { path: 'src/collab_mode.py', ext: '.py', preview: '# Collaboration card: not implemented', size: 50 },
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
      },
      {
        id: 'MYTH-002',
        severity: 'CRITICAL',
        title: 'No human-in-the-loop gates on autonomous agent',
        file: 'agent_runner.py',
        detail: 'auto_approve=True deploys agent outputs directly to production with no review.',
        fix: 'Add plan_mode + human approval gates before any destructive action.',
      },
      {
        id: 'MYTH-003',
        severity: 'HIGH',
        title: 'Missing self-consistency verification',
        file: 'src/risk_scorer.py',
        detail: 'Risk scores passed to financial decisions with no confidence threshold or multi-sample check.',
        fix: 'Add verifier agent with multi-sample scoring and minimum confidence threshold of 0.85.',
      },
      {
        id: 'MYTH-004',
        severity: 'HIGH',
        title: 'Computer Use agent deployed without provenance trail',
        file: 'agent_runner.py',
        detail: 'Computer Use sessions leave no screenshot audit trail. Cannot reconstruct what the agent did.',
        fix: 'Log all screenshots, mouse events, and keystrokes with SHA-256 hashes.',
      },
      {
        id: 'MYTH-005',
        severity: 'MEDIUM',
        title: 'No sandbox mode',
        file: 'agent_runner.py',
        detail: 'Agents execute directly against production. Any hallucination causes real damage.',
        fix: 'Add sandbox_mode flag. Block external API calls and DB writes by default.',
      },
    ],
  },

  summary: `Repository: mythos-capybara-sim (EDUCATIONAL SIMULATION)
Files analyzed: 6 (simulated based on public leak summaries)
Languages: Python, TypeScript
Frameworks: FastAPI, React, Celery
Infrastructure: Docker, GitHub Actions, AWS Lambda

CRITICAL FINDINGS (simulated):
- Hard-coded API keys in CI/CD (MYTH-001)
- No human-in-the-loop gates (MYTH-002)
- Missing self-consistency verification (MYTH-003)
- Computer Use without audit trail (MYTH-004)
- No sandbox mode (MYTH-005)

This simulation demonstrates what a verifiable agent system would catch.
All findings are based on publicly available summaries. FICTIONAL / EDUCATIONAL ONLY.`,
};

module.exports = mythosContext;

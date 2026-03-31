'use strict';

const yaml = require('js-yaml');

async function generateCollabCard(context, recipeYaml, verification) {
  const recipe = yaml.load(recipeYaml);
  const agents = recipe.agents || [];
  const now = new Date().toISOString();
  const verifierAgent = agents.find(a => a.id === 'verifier');

  return `# Human-AI Collaboration Card

> **Project:** ${context.repoName}
> **Generated:** ${now}
> **Verification status:** ${verification.passed ? '✅ PASSED' : '❌ NEEDS REVIEW'}

---

## What the AI does

${agents.map(a => `- **${a.role}** (\`${a.id}\`): ${(a.responsibilities || []).slice(0, 2).join('; ')}`).join('\n')}

---

## What the human does

| Gate | Human Action Required | Why |
|------|-----------------------|-----|
| Before planning | Review codebase summary | Catch mis-detections early |
| Before execution | Approve task plan | Prevent unintended changes |
| After verification | Sign off on report | Legal/compliance ownership |
| On failure | Investigate and override | AI may not understand context |

---

## Trust boundaries

| Capability | AI autonomy | Human required |
|-----------|-------------|----------------|
| Read files | ✅ Full | |
| Write/edit files | ⚠️ Sandbox only | ✋ Approval needed |
| Run shell commands | ⚠️ Sandbox only | ✋ Approval needed |
| Computer Use (UI) | ⚠️ Sandboxed browser | ✋ Review screenshots |
| External API calls | ❌ Blocked in sandbox | Must enable explicitly |
| Git push | ❌ Never automatic | ✋ Human initiates |

---

## Verification summary

${verification.results.map(r => {
  const icon = r.passed ? '✅' : '❌';
  return `- ${icon} **${r.name}**: ${r.details?.slice(0, 100) || ''}`;
}).join('\n')}

---

## Model card

| Field | Value |
|-------|-------|
| Model | \`claude-sonnet-4-6\` |
| Computer Use | Enabled (sandboxed) |
| Plan mode | ON (Pro default) |
| Sandbox | ${recipe.safety?.sandbox_mode ? 'ON ✅' : 'OFF ⚠️'} |
| Guardrails | ${(recipe.safety?.guardrails || []).length} active |

---

## Known limitations

- AI may misidentify tech stack for highly custom setups
- Self-consistency scoring requires ≥2 API samples (costs tokens)
- Computer Use screenshots may lag behind fast UIs
- Provenance hashes do not survive file renames

---

## How to escalate

If the AI produces unexpected output:
1. Check \`verification-report.yaml\` for specific failures
2. Re-run with \`--sandbox\` and inspect the recipe before live execution
3. Open an issue at https://github.com/kju4q/verifiable-agent-recipe/issues

---

*This card is auto-generated. Human reviewer must sign before production use.*

**Reviewed by:** _____________________________ **Date:** _____________
`;
}

module.exports = { generateCollabCard };

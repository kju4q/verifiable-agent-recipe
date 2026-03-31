# create-verifiable-agent

> Turn any GitHub repo (or local codebase) into a **verifiable multi-agent recipe** in one command — powered by **Claude Sonnet 4.6 + Computer Use API**.

```bash
npx create-verifiable-agent https://github.com/your/repo
```

---

## What it does

| Output | Description |
|--------|-------------|
| `recipe.yaml` | Multi-agent YAML recipe with 5 specialized agents |
| `verification-report.yaml` | Self-consistency scores + provenance chain |
| `notebook.md` | Interactive Markdown notebook with full workflow trace |
| `collab-card.md` | Human-AI collaboration card with trust boundaries |

---

## The Mythos Demo

In March 2025, the Mythos/Capybara internal AI strategy leaked publicly. The core failure: agents running straight to production with no verifier, no sandbox, no human gates.

Run the simulation (no API key needed):

```bash
npx create-verifiable-agent --demo mythos --sandbox
```

It will catch all 5 simulated vulnerabilities:

| ID | Severity | Finding |
|----|----------|---------|
| MYTH-001 | 🔴 CRITICAL | Hard-coded API keys in CI/CD |
| MYTH-002 | 🔴 CRITICAL | No human-in-the-loop gates |
| MYTH-003 | 🟠 HIGH | Missing self-consistency verification |
| MYTH-004 | 🟠 HIGH | Computer Use without audit trail |
| MYTH-005 | 🟡 MEDIUM | No sandbox mode |

> **Note:** This is a fictional/educational simulation based on publicly available summaries. No real Mythos code or confidential data is included.

---

## Quick start

### Prerequisites

```bash
node >= 18
npm >= 9
export ANTHROPIC_API_KEY=sk-ant-...
```

### Run on a GitHub repo

```bash
npx create-verifiable-agent https://github.com/anthropics/anthropic-sdk-python
```

### Run on a local path

```bash
npx create-verifiable-agent ./my-project
```

### Safe sandbox mode (no real API calls)

```bash
npx create-verifiable-agent https://github.com/your/repo --sandbox
```

### Pro plan — plan mode (default, shows plan before executing)

```bash
npx create-verifiable-agent https://github.com/your/repo
# Shows plan, asks for confirmation before making any API calls
```

### Auto-accept (skip confirmation prompt)

```bash
npx create-verifiable-agent https://github.com/your/repo --accept-edits
```

---

## CLI options

```
npx create-verifiable-agent [source] [options]

Arguments:
  source                  GitHub URL or local path (omit for Mythos demo)

Options:
  -o, --output <dir>      Output directory (default: ./agent-output)
  --sandbox               Safe mode: no real API calls or mutations
  --plan                  Show plan before executing (default: true)
  --accept-edits          Auto-accept all edits (skip confirmation)
  --demo <name>           Built-in demo: mythos (default)
  --no-notebook           Skip the Markdown notebook
  --no-collab-card        Skip the collaboration card
  --model <model>         Claude model (default: claude-sonnet-4-6)
  --max-files <n>         Max files to analyze (default: 50)
  --api-key <key>         Anthropic API key
  -V, --version           Show version
  -h, --help              Show help
```

---

## How it works

```
Source repo
    │
    ▼
┌─────────────┐
│  analyzer   │  Scans files, detects stack, extracts architecture
└──────┬──────┘
       │
    ▼
┌─────────────┐
│   planner   │  Decomposes goal, assigns tasks to agents
└──────┬──────┘
       │ requires human approval ✋
    ▼
┌─────────────┐
│  executor   │  Implements changes (sandbox only by default)
└──────┬──────┘
       │
    ▼
┌──────────────────┐
│ computer_use     │  Browser/UI validation with screenshot audit trail
│ agent            │  (Claude Computer Use API)
└──────────────────┘
       │
    ▼
┌─────────────┐
│  verifier   │  Self-consistency (3 samples) + provenance chain
└──────┬──────┘
       │
    ▼
  Outputs ──► recipe.yaml + verification-report.yaml + notebook.md + collab-card.md
```

---

## Verification loops

### Self-consistency
Every critical output is generated **3 times** and compared. If results diverge by more than 20%, the finding is escalated to human review.

### Provenance tracking
Every agent output is **SHA-256 hashed** and linked to its inputs, forming a tamper-evident chain you can audit later.

### Human review gates
By default, humans must approve:
- The task plan (before executor runs)
- Any file writes or shell commands
- The final verification report

---

## Safety & sandbox mode

`sandbox_mode: true` is the default. It:
- Blocks all external API calls
- Blocks all file mutations
- Blocks all shell command execution
- Enables full Computer Use screenshot audit trail
- Requires human approval for every agent action

To run in live mode, explicitly pass `--no-sandbox` after reviewing the plan.

---

## Architecture

```
create-verifiable-agent/
├── bin/
│   └── create-verifiable-agent.js   # CLI entry point
├── src/
│   ├── index.js                     # Main orchestrator
│   ├── analyzer.js                  # Codebase analysis
│   ├── generator.js                 # YAML recipe generation (Claude API)
│   ├── verifier.js                  # Self-consistency + provenance
│   ├── notebook.js                  # Interactive Markdown notebook
│   ├── collab-card.js               # Human-AI collaboration card
│   ├── plan.js                      # Plan mode UI
│   └── demo-loader.js               # Demo context loader
├── demo/
│   ├── mythos.js                    # Mythos cyber-risk simulation
│   └── mythos-recipe.yaml           # Pre-built Mythos recipe
├── test/
│   └── run-tests.js                 # Test suite
├── demo-script.md                   # 60-second video demo script
└── README.md
```

---

## Run tests

```bash
npm test
```

---

## Contributing

Issues and PRs welcome at [kju4q/verifiable-agent-recipe](https://github.com/kju4q/verifiable-agent-recipe).

---

## License

MIT

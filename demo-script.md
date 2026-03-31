# 60-Second Video Demo Script
## "repo-to-verifiable-agent: The Mythos Leak Hook"

---

### [0:00–0:05] Hook

> **Narrator (or screen caption):**
> "In March 2025, Mythos leaked their internal AI strategy. No verifier. No sandbox. Agents running straight to prod.
> Here's what would have stopped it."

*Show: Terminal, clean prompt. Nothing running yet.*

---

### [0:05–0:15] One command

> **Narrator:** "One command. That's it."

```bash
npx create-verifiable-agent --demo mythos --sandbox
```

*Show: Command being typed. Press enter.*

*Show: CLI banner, plan mode summary appearing.*

---

### [0:15–0:25] Plan mode kicks in

*Show: Plan mode output:*
```
── PLAN MODE ──────────────────────────────────────
  Repository:   mythos-capybara-sim
  Files found:  6 (simulated)
  Stack:        Python, TypeScript / FastAPI, React
  Sandbox:      ON ✅

  OUTPUTS:
    • recipe.yaml
    • verification-report.yaml
    • notebook.md
    • collab-card.md

  AGENT WORKFLOW:
    1. secret_scanner    → finds MYTH-001 (hard-coded keys)
    2. architecture_auditor → finds MYTH-002, MYTH-003, MYTH-005
    3. computer_use_auditor → finds MYTH-004
    4. verifier          → self-consistency + provenance
    5. remediation_planner → fix plan

? Proceed with this plan? (Y/n)
```

> **Narrator:** "Plan mode shows exactly what will happen. You approve."

*Press Y.*

---

### [0:25–0:40] Outputs generate

*Show: Spinners completing one by one:*
```
✔ Mythos demo loaded
✔ Recipe → agent-output/recipe.yaml
✔ Verification ✔ → agent-output/verification-report.yaml
✔ Notebook → agent-output/notebook.md
✔ Collab card → agent-output/collab-card.md
```

*Quick cut: Open `verification-report.yaml` in editor.*

*Highlight:*
```yaml
overall_status: PASSED
checks_passed: 4
findings_simulated:
  - id: MYTH-001
    severity: CRITICAL
    title: Hard-coded API keys in CI/CD pipeline
  - id: MYTH-002
    severity: CRITICAL
    title: No human-in-the-loop gates
  - id: MYTH-003
    severity: HIGH
    title: Missing self-consistency verification
```

> **Narrator:** "Every vulnerability Mythos shipped — caught before it reached prod."

---

### [0:40–0:52] Show the recipe + notebook

*Quick cut: Open `recipe.yaml`.*

*Highlight the agents block, show `sandbox_mode: true`, `self_consistency.samples: 3`.*

*Quick cut: Open `notebook.md` rendered in a Markdown viewer.*

*Show the Trust boundaries table from `collab-card.md`.*

> **Narrator:** "Multi-agent YAML recipe. Verification loops. Human collaboration card. Interactive notebook. All in 45 seconds."

---

### [0:52–1:00] CTA

*Show: GitHub repo URL.*

```bash
# Run on YOUR repo
npx create-verifiable-agent https://github.com/your/repo

# Or try the live demo
npx create-verifiable-agent --demo mythos --sandbox
```

> **Narrator:** "Star the repo. Ship verifiable agents. Don't be Mythos."

*Show: GitHub star button animation.*

---

### Production notes

- Record at 1920×1080, terminal font size 18+
- Use a dark terminal theme (e.g. One Dark Pro)
- Add captions for accessibility
- Background music: low-key synthwave (no lyrics)
- Total target: 58–62 seconds

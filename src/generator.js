'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const RECIPE_SYSTEM_PROMPT = `You are an expert AI systems architect. Given a codebase analysis, produce a multi-agent YAML recipe.

The recipe must contain:
1. metadata: name, version, description, source_repo, generated_at
2. agents: list of specialized agents (analyzer, planner, executor, verifier, reporter)
   Each agent has: id, role, model, tools, responsibilities, inputs, outputs
3. workflow: ordered steps with agent assignments and data flow
4. verification: self_consistency checks and provenance tracking
5. safety: sandbox_mode flag and guardrails
6. computer_use: whether any agent uses the Computer Use API

Output ONLY valid YAML. No markdown fences.`;

async function generateRecipe(context, { model, apiKey, sandbox } = {}) {
  if (sandbox || !apiKey) {
    return buildStaticRecipe(context);
  }

  const client = new Anthropic({ apiKey });

  const userMessage = `Analyze this codebase and produce the multi-agent YAML recipe:

${context.summary}

Key files:
${Object.entries(context.keyFiles).map(([k, v]) => `=== ${k} ===\n${v}`).join('\n\n')}

Top files by path:
${context.files.slice(0, 20).map(f => `- ${f.path} (${f.ext})`).join('\n')}

Requirements:
- Create 5 specialized agents tailored to this codebase
- Include Computer Use agent for UI/browser tasks if relevant
- Add self-consistency verification loops
- Add provenance tracking for each agent output
- Safety: default sandbox_mode: true
- Use model: ${model}`;

  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    system: RECIPE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const rawText = message.content[0].text.trim();

  // Validate YAML
  try {
    yaml.load(rawText);
  } catch (e) {
    console.warn('\n  Warning: Generated YAML had syntax issues, using fallback recipe.');
    return buildStaticRecipe(context);
  }

  return rawText;
}

function buildStaticRecipe(context) {
  const recipe = {
    metadata: {
      name: `${context.repoName}-verifiable-agent`,
      version: '1.0.0',
      description: `Multi-agent recipe for ${context.repoName}`,
      source_repo: context.repoName,
      generated_at: new Date().toISOString(),
      model: 'claude-sonnet-4-6',
      computer_use_enabled: true,
    },
    safety: {
      sandbox_mode: true,
      guardrails: [
        'no_destructive_writes',
        'no_external_api_calls_in_sandbox',
        'human_approval_required_for_mutations',
        'rate_limit_api_calls',
      ],
      plan_mode: true,
      accept_edits: false,
    },
    agents: [
      {
        id: 'analyzer',
        role: 'Codebase Analyzer',
        model: 'claude-sonnet-4-6',
        tools: ['read_file', 'list_files', 'grep', 'glob'],
        responsibilities: [
          'Scan repository structure and detect tech stack',
          'Identify entry points, key modules, and dependencies',
          'Extract architecture patterns and data flows',
        ],
        inputs: ['source_repo_path'],
        outputs: ['codebase_summary', 'file_index', 'stack_report'],
      },
      {
        id: 'planner',
        role: 'Task Planner',
        model: 'claude-sonnet-4-6',
        tools: ['read_file', 'write_file'],
        responsibilities: [
          'Decompose high-level goal into verifiable sub-tasks',
          'Assign sub-tasks to appropriate specialist agents',
          'Define success criteria for each task',
        ],
        inputs: ['codebase_summary', 'user_goal'],
        outputs: ['task_plan', 'agent_assignments'],
      },
      {
        id: 'executor',
        role: 'Code Executor',
        model: 'claude-sonnet-4-6',
        tools: ['bash', 'write_file', 'edit_file'],
        responsibilities: [
          'Implement planned changes with minimal blast radius',
          'Run tests after each change',
          'Rollback on failure',
        ],
        inputs: ['task_plan', 'codebase_summary'],
        outputs: ['code_changes', 'test_results'],
        safety: { require_sandbox: true, require_approval: true },
      },
      {
        id: 'computer_use_agent',
        role: 'Computer Use Agent',
        model: 'claude-sonnet-4-6',
        computer_use: true,
        tools: ['screenshot', 'mouse_move', 'left_click', 'type', 'key'],
        responsibilities: [
          'Perform UI interactions for browser-based tasks',
          'Capture screenshots as provenance evidence',
          'Validate visual outputs',
        ],
        inputs: ['ui_task_spec'],
        outputs: ['screenshots', 'interaction_log', 'visual_validation'],
        safety: { require_sandbox: true, no_real_purchases: true },
      },
      {
        id: 'verifier',
        role: 'Output Verifier',
        model: 'claude-sonnet-4-6',
        tools: ['read_file', 'bash'],
        responsibilities: [
          'Run self-consistency checks across agent outputs',
          'Validate provenance chain',
          'Flag hallucinations or contradictions',
          'Score confidence for each claim',
        ],
        inputs: ['code_changes', 'task_plan', 'test_results'],
        outputs: ['verification_report', 'confidence_scores', 'provenance_chain'],
      },
    ],
    workflow: [
      { step: 1, agent: 'analyzer', action: 'scan_and_summarize', outputs_to: ['planner', 'verifier'] },
      { step: 2, agent: 'planner', action: 'create_task_plan', outputs_to: ['executor'] },
      { step: 3, agent: 'executor', action: 'implement_changes', outputs_to: ['verifier'], requires_approval: true },
      { step: 4, agent: 'computer_use_agent', action: 'validate_ui', outputs_to: ['verifier'], optional: true },
      { step: 5, agent: 'verifier', action: 'verify_all_outputs', outputs_to: null },
    ],
    verification: {
      self_consistency: {
        enabled: true,
        method: 'multi_sample',
        samples: 3,
        threshold: 0.8,
        description: 'Run each critical task 3 times, flag if results diverge > 20%',
      },
      provenance: {
        enabled: true,
        track_inputs: true,
        track_model_version: true,
        track_timestamps: true,
        hash_outputs: true,
        description: 'Every agent output is hashed and linked to its inputs',
      },
      human_review_gates: ['after_planner', 'before_executor', 'after_verifier'],
    },
    stack: context.stack,
  };

  return yaml.dump(recipe, { lineWidth: 120 });
}

module.exports = { generateRecipe };

'use strict';

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const simpleGit = require('simple-git');
const os = require('os');

// File extensions we care about
const CODE_EXTS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs',
  '.java', '.rb', '.php', '.cs', '.cpp', '.c', '.h',
  '.yaml', '.yml', '.json', '.toml', '.md', '.mdx',
  '.sh', '.bash', '.zsh', '.dockerfile', 'Dockerfile',
]);

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next',
  '__pycache__', '.venv', 'venv', 'vendor', 'target',
  '.cache', 'coverage', '.nyc_output',
]);

async function analyzeSource(source, { maxFiles = 50, sandbox = false } = {}) {
  let localPath;
  let repoName;
  let isRemote = false;

  // Determine if it's a GitHub URL or local path
  if (source.startsWith('https://github.com') || source.startsWith('git@github.com')) {
    if (sandbox) {
      // In sandbox mode, fake the clone
      return buildSandboxContext(source);
    }
    isRemote = true;
    localPath = path.join(os.tmpdir(), `cva-${Date.now()}`);
    repoName = source.split('/').pop().replace('.git', '');
    console.log('');
    const git = simpleGit();
    await git.clone(source, localPath, ['--depth', '1']);
  } else {
    localPath = path.resolve(source);
    repoName = path.basename(localPath);
  }

  if (!fs.existsSync(localPath)) {
    throw new Error(`Path not found: ${localPath}`);
  }

  // Collect files
  const allFiles = await collectFiles(localPath, maxFiles);

  // Build file summaries
  const fileSummaries = allFiles.map(f => {
    const rel = path.relative(localPath, f);
    const content = safeRead(f, 4000); // first 4k chars
    const ext = path.extname(f) || path.basename(f);
    return { path: rel, ext, preview: content, size: fs.statSync(f).size };
  });

  // Detect stack
  const stack = detectStack(fileSummaries);

  // Read key files (README, package.json, etc.)
  const keyFiles = readKeyFiles(localPath);

  return {
    repoName,
    localPath,
    isRemote,
    files: fileSummaries,
    stack,
    keyFiles,
    summary: buildSummary(repoName, fileSummaries, stack, keyFiles),
  };
}

async function collectFiles(dir, maxFiles) {
  const results = [];
  const queue = [dir];

  while (queue.length && results.length < maxFiles) {
    const current = queue.shift();
    let entries;
    try { entries = fs.readdirSync(current, { withFileTypes: true }); }
    catch { continue; }

    for (const entry of entries) {
      if (results.length >= maxFiles) break;
      if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;
      if (IGNORE_DIRS.has(entry.name)) continue;

      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(full);
      } else {
        const ext = path.extname(entry.name);
        if (CODE_EXTS.has(ext) || CODE_EXTS.has(entry.name)) {
          results.push(full);
        }
      }
    }
  }
  return results;
}

function safeRead(filePath, maxChars = 4000) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.slice(0, maxChars);
  } catch {
    return '';
  }
}

function detectStack(files) {
  const stack = { languages: [], frameworks: [], infra: [] };
  const names = files.map(f => f.path.toLowerCase());
  const has = (s) => names.some(n => n.includes(s));

  if (has('package.json')) stack.languages.push('JavaScript/TypeScript');
  if (has('requirements.txt') || has('.py')) stack.languages.push('Python');
  if (has('go.mod')) stack.languages.push('Go');
  if (has('cargo.toml')) stack.languages.push('Rust');
  if (has('pom.xml') || has('build.gradle')) stack.languages.push('Java');

  if (has('next.config')) stack.frameworks.push('Next.js');
  if (has('vite.config')) stack.frameworks.push('Vite');
  if (has('fastapi') || has('uvicorn')) stack.frameworks.push('FastAPI');
  if (has('django')) stack.frameworks.push('Django');
  if (has('express')) stack.frameworks.push('Express');

  if (has('dockerfile') || has('docker-compose')) stack.infra.push('Docker');
  if (has('terraform')) stack.infra.push('Terraform');
  if (has('.github/workflows')) stack.infra.push('GitHub Actions');

  return stack;
}

function readKeyFiles(dir) {
  const targets = ['README.md', 'package.json', 'pyproject.toml', 'go.mod', 'Cargo.toml', '.env.example'];
  const result = {};
  for (const t of targets) {
    const fp = path.join(dir, t);
    if (fs.existsSync(fp)) result[t] = safeRead(fp, 2000);
  }
  return result;
}

function buildSummary(name, files, stack, keyFiles) {
  return [
    `Repository: ${name}`,
    `Files analyzed: ${files.length}`,
    `Languages: ${stack.languages.join(', ') || 'unknown'}`,
    `Frameworks: ${stack.frameworks.join(', ') || 'none detected'}`,
    `Infrastructure: ${stack.infra.join(', ') || 'none detected'}`,
    keyFiles['README.md'] ? `README excerpt: ${keyFiles['README.md'].slice(0, 300)}` : '',
  ].filter(Boolean).join('\n');
}

function buildSandboxContext(source) {
  return {
    repoName: source.split('/').pop().replace('.git', '') || 'sandbox-repo',
    localPath: null,
    isRemote: true,
    isSandbox: true,
    files: [
      { path: 'src/index.js', ext: '.js', preview: '// sandbox placeholder', size: 100 },
      { path: 'README.md', ext: '.md', preview: '# Sandbox Repo', size: 50 },
    ],
    stack: { languages: ['JavaScript'], frameworks: ['Express'], infra: [] },
    keyFiles: { 'README.md': '# Sandbox Repo\nGenerated in sandbox mode.' },
    summary: `[SANDBOX] Repository: ${source}\nFiles analyzed: 2 (fake)\nLanguages: JavaScript`,
  };
}

module.exports = { analyzeSource };

#!/usr/bin/env node
// PreToolUse hook: keeps production secrets out of Claude's context and out of any file.
//
// 1. Blocks reading secret files (.env, .env.*, .dev.vars; .env.example is allowed)
//    via Read/Grep/Glob or shell commands. `--env-file=<path>` stays allowed, because
//    it hands the file to a program without printing it.
// 2. Blocks any tool call whose input contains a value from those files
//    (Write/Edit content, shell commands, MCP payloads, messages to agents...).
//
// The hook reads the secret files itself; values never leave this process.
// Exit code 2 = block, and stderr goes back to Claude (variable names only, never values).
// PROTECT_ENV_ROOT overrides the project root (used by tests).

import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = process.env.PROTECT_ENV_ROOT || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".wrangler", ".turbo", "coverage"]);
const MIN_SECRET_LEN = 6;
// Values that are too generic to be secrets (and would block everything).
const TRIVIAL = /^(true|false|yes|no|on|off|null|none|development|production|test|localhost|127\.0\.0\.1|0\.0\.0\.0|\d+)$/i;

function isSecretFileName(name) {
  if (name === ".dev.vars") return true;
  if (name === ".env") return true;
  return name.startsWith(".env.") && name !== ".env.example" && !name.endsWith(".example");
}

function findSecretFiles(dir, depth = 0, out = []) {
  if (depth > 4) return out;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) findSecretFiles(join(dir, e.name), depth + 1, out);
    } else if (isSecretFileName(e.name)) {
      out.push(join(dir, e.name));
    }
  }
  return out;
}

function parseEnv(text) {
  const pairs = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][\w.-]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, "");
    pairs.push([m[1], value]);
  }
  return pairs;
}

// Secret fragments for one value: the value itself, plus password/user/host of URLs.
function fragments(value) {
  const out = [value];
  try {
    const u = new URL(value);
    if (u.password) out.push(decodeURIComponent(u.password), u.password);
    if (u.username) out.push(decodeURIComponent(u.username), u.username);
    if (u.hostname && u.hostname.includes(".")) out.push(u.hostname);
  } catch {
    /* not a URL */
  }
  return out;
}

// Values that are public on purpose: anything already committed in a *.env.example file.
function loadPublicValues(root) {
  const out = new Set();
  for (const file of findExampleFiles(root)) {
    try {
      for (const [, value] of parseEnv(readFileSync(file, "utf8"))) for (const f of fragments(value)) out.add(f);
    } catch {
      /* unreadable example file */
    }
  }
  return out;
}

function findExampleFiles(dir, depth = 0, out = []) {
  if (depth > 4) return out;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) findExampleFiles(join(dir, e.name), depth + 1, out);
    } else if (/^\.(env|dev\.vars)(\.[\w-]+)*\.example$/.test(e.name)) {
      out.push(join(dir, e.name));
    }
  }
  return out;
}

function loadSecrets(files, publicValues) {
  const secrets = []; // [name, fragment]
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const [name, value] of parseEnv(text)) {
      // VITE_* values are baked into the public site bundle, so they are not secrets.
      if (name.startsWith("VITE_")) continue;
      for (const f of fragments(value)) {
        if (f.length >= MIN_SECRET_LEN && !TRIVIAL.test(f) && !publicValues.has(f)) secrets.push([name, f]);
      }
    }
  }
  return secrets;
}

// A path or shell word that names a secret file.
const SECRET_PATH_RE = /(^|[\s/\\'"`=:<>|;&(,])(\.env(\.[\w.-]+)?|\.dev\.vars)(?=$|[\s'"`|;&)<>,*])/g;

function referencesSecretFile(text) {
  if (!text) return false;
  // `--env-file <path>` / `--env-file=<path>` passes the file to a program without printing it.
  const stripped = String(text).replace(/--env-file(?:=|\s+)\S+/g, " ");
  for (const m of stripped.matchAll(SECRET_PATH_RE)) {
    const name = m[2];
    if (name === ".env.example" || name.endsWith(".example")) continue;
    return true;
  }
  return false;
}

function block(reason) {
  process.stderr.write(`BLOCKED by .claude/hooks/protect-env.mjs: ${reason}\n`);
  process.exit(2);
}

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const tool = input.tool_name || "";
const ti = input.tool_input || {};

// 1. Reading secret files.
const pathFields = [ti.file_path, ti.path, ti.notebook_path, ti.pattern, ti.glob].filter(Boolean);
if (["Read", "Grep", "Glob", "NotebookEdit", "Write", "Edit"].includes(tool)) {
  for (const p of pathFields) {
    if (isSecretFileName(basename(String(p))) || referencesSecretFile(String(p))) {
      block(`${tool} on a secret env file (${basename(String(p))}) is not allowed. Its values are production secrets.`);
    }
  }
}
if (tool === "Bash" || tool === "PowerShell") {
  if (referencesSecretFile(ti.command)) {
    block(
      "shell commands must not touch .env / .env.* / .dev.vars (reading, copying, grepping or printing them). " +
        "Pass the file to a program with --env-file instead.",
    );
  }
}

// 2. Secret values anywhere in the tool input.
const secrets = loadSecrets(findSecretFiles(ROOT), loadPublicValues(ROOT));
if (secrets.length) {
  const haystack = JSON.stringify(ti);
  const raw = Object.values(ti).filter((v) => typeof v === "string").join("\n");
  const hits = new Set();
  for (const [name, f] of secrets) {
    if (raw.includes(f) || haystack.includes(f) || haystack.includes(JSON.stringify(f).slice(1, -1))) hits.add(name);
  }
  if (hits.size) {
    block(
      `this ${tool} call contains the value of ${[...hits].join(", ")} from a secret env file. ` +
        "Never write production values anywhere: use a placeholder (e.g. <YOUR_VALUE>) or reference the variable name.",
    );
  }
}

process.exit(0);

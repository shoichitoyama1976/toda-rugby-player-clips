#!/usr/bin/env node
/**
 * Thin wrapper that runs the given command with the current environment.
 * Used by package.json scripts so that app-level env handling stays in one place.
 *
 * Usage: node scripts/with-app-env.mjs <command> [args...]
 */
import { spawn } from "node:child_process";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node scripts/with-app-env.mjs <command> [args...]");
  process.exit(1);
}

const [command, ...commandArgs] = args;

const child = spawn(command, commandArgs, {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on("error", (err) => {
  console.error("[with-app-env] failed to start:", err.message);
  process.exit(1);
});

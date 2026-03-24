#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_path7 = __toESM(require("path"));
var import_fs_extra5 = __toESM(require("fs-extra"));
var import_ora = __toESM(require("ora"));

// src/logger.ts
var import_chalk = __toESM(require("chalk"));
function step(current, total, message) {
  console.log(import_chalk.default.cyan(`  [${current}/${total}] `) + message);
}
function success(message) {
  console.log(import_chalk.default.green("        \u2713 ") + message);
}
function error(message) {
  console.log(import_chalk.default.red("        \u2717 ") + message);
}
function banner() {
  console.log();
  console.log(import_chalk.default.bold("  \u{1F680} Claude Pipeline \uC124\uCE58 \uC911..."));
  console.log();
}
function done(url) {
  console.log();
  console.log(import_chalk.default.green.bold(`  \u2705 \uC644\uB8CC! \uB300\uC2DC\uBCF4\uB4DC: ${url}`));
  console.log(import_chalk.default.gray("     \uC885\uB8CC: Ctrl+C"));
  console.log();
}

// src/copy-template.ts
var import_path2 = __toESM(require("path"));
var import_fs_extra = __toESM(require("fs-extra"));

// src/paths.ts
var import_path = __toESM(require("path"));
function getTemplateDir() {
  return import_path.default.join(__dirname, "..", "template");
}

// src/copy-template.ts
async function copyDirSkipExisting(src, dest) {
  const copied = [];
  const skipped = [];
  await import_fs_extra.default.ensureDir(dest);
  const entries = await import_fs_extra.default.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = import_path2.default.join(src, entry.name);
    const destPath = import_path2.default.join(dest, entry.name);
    if (await import_fs_extra.default.pathExists(destPath)) {
      skipped.push(entry.name);
      continue;
    }
    await import_fs_extra.default.copy(srcPath, destPath);
    copied.push(entry.name);
  }
  return { copied, skipped };
}
async function copyTemplateFiles(targetDir) {
  const templateDir = getTemplateDir();
  const agents = await copyDirSkipExisting(
    import_path2.default.join(templateDir, ".claude", "agents"),
    import_path2.default.join(targetDir, ".claude", "agents")
  );
  const skills = await copyDirSkipExisting(
    import_path2.default.join(templateDir, ".claude", "skills"),
    import_path2.default.join(targetDir, ".claude", "skills")
  );
  const references = await copyDirSkipExisting(
    import_path2.default.join(templateDir, "references"),
    import_path2.default.join(targetDir, "references")
  );
  const dashboardSrc = import_path2.default.join(templateDir, ".claude-pipeline", "dashboard");
  const dashboardDest = import_path2.default.join(targetDir, ".claude-pipeline", "dashboard");
  await import_fs_extra.default.copy(dashboardSrc, dashboardDest, { overwrite: true });
  const runnerSrc = import_path2.default.join(templateDir, ".claude-pipeline", "runner");
  const runnerDest = import_path2.default.join(targetDir, ".claude-pipeline", "runner");
  await import_fs_extra.default.copy(runnerSrc, runnerDest, { overwrite: true });
  await import_fs_extra.default.ensureDir(import_path2.default.join(targetDir, "pipelines"));
  return { agents, skills, references, dashboard: true, runner: true };
}

// src/merge-claude-md.ts
var import_path3 = __toESM(require("path"));
var import_fs_extra2 = __toESM(require("fs-extra"));
var MARKER_START = "<!-- claude-pipeline-start -->";
var MARKER_END = "<!-- claude-pipeline-end -->";
async function mergeCLAUDEmd(targetDir) {
  const targetPath = import_path3.default.join(targetDir, "CLAUDE.md");
  const templatePath = import_path3.default.join(getTemplateDir(), "CLAUDE.md");
  const templateContent = await import_fs_extra2.default.readFile(templatePath, "utf-8");
  if (!await import_fs_extra2.default.pathExists(targetPath)) {
    const wrapped = `${MARKER_START}
${templateContent}
${MARKER_END}
`;
    await import_fs_extra2.default.writeFile(targetPath, wrapped, "utf-8");
    return "created";
  }
  const existing = await import_fs_extra2.default.readFile(targetPath, "utf-8");
  if (existing.includes(MARKER_START)) {
    return "skipped";
  }
  const section = `

---

${MARKER_START}
${templateContent}
${MARKER_END}
`;
  await import_fs_extra2.default.appendFile(targetPath, section, "utf-8");
  return "merged";
}

// src/merge-settings.ts
var import_path4 = __toESM(require("path"));
var import_fs_extra3 = __toESM(require("fs-extra"));
function mergeArrays(existing, incoming) {
  const existingStrs = new Set(existing.map(String));
  return [
    ...existing,
    ...incoming.filter((item) => !existingStrs.has(String(item)))
  ];
}
function deepMerge(existing, incoming) {
  const result = { ...existing };
  for (const key of Object.keys(incoming)) {
    if (!(key in result)) {
      result[key] = incoming[key];
    } else if (Array.isArray(result[key]) && Array.isArray(incoming[key])) {
      result[key] = mergeArrays(result[key], incoming[key]);
    } else if (typeof result[key] === "object" && result[key] !== null && typeof incoming[key] === "object" && incoming[key] !== null && !Array.isArray(result[key])) {
      result[key] = deepMerge(
        result[key],
        incoming[key]
      );
    }
  }
  return result;
}
async function mergeSettings(targetDir) {
  const targetPath = import_path4.default.join(targetDir, ".claude", "settings.json");
  const templatePath = import_path4.default.join(getTemplateDir(), ".claude", "settings.json");
  const templateContent = await import_fs_extra3.default.readJSON(templatePath);
  if (!await import_fs_extra3.default.pathExists(targetPath)) {
    await import_fs_extra3.default.ensureDir(import_path4.default.dirname(targetPath));
    await import_fs_extra3.default.writeJSON(targetPath, templateContent, { spaces: 2 });
    return "created";
  }
  const existingContent = await import_fs_extra3.default.readJSON(targetPath);
  const merged = deepMerge(existingContent, templateContent);
  await import_fs_extra3.default.writeJSON(targetPath, merged, { spaces: 2 });
  return "merged";
}

// src/update-gitignore.ts
var import_path5 = __toESM(require("path"));
var import_fs_extra4 = __toESM(require("fs-extra"));
var ENTRIES = [
  ".claude-pipeline/dashboard/node_modules/",
  ".claude-pipeline/dashboard/.next/",
  "pipelines/"
];
async function updateGitignore(targetDir) {
  const gitignorePath = import_path5.default.join(targetDir, ".gitignore");
  const added = [];
  const skipped = [];
  let content = "";
  if (await import_fs_extra4.default.pathExists(gitignorePath)) {
    content = await import_fs_extra4.default.readFile(gitignorePath, "utf-8");
  }
  const lines = content.split("\n").map((l) => l.trim());
  for (const entry of ENTRIES) {
    if (lines.includes(entry)) {
      skipped.push(entry);
    } else {
      added.push(entry);
    }
  }
  if (added.length > 0) {
    const section = "\n# Claude Pipeline\n" + added.join("\n") + "\n";
    await import_fs_extra4.default.appendFile(gitignorePath, section, "utf-8");
  }
  return { added, skipped };
}

// src/install.ts
var import_child_process = require("child_process");
async function npmInstall(cwd) {
  try {
    (0, import_child_process.execSync)("npm install", {
      cwd,
      stdio: "pipe",
      timeout: 12e4
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `npm install \uC2E4\uD328: ${message}
\uC218\uB3D9\uC73C\uB85C \uC2E4\uD589\uD574\uC8FC\uC138\uC694: cd ${cwd} && npm install`
    );
  }
}

// src/start-dashboard.ts
var import_path6 = __toESM(require("path"));
var import_child_process2 = require("child_process");
var import_detect_port = __toESM(require("detect-port"));
var import_open = __toESM(require("open"));
async function startDashboard(targetDir) {
  const dashboardDir = import_path6.default.join(targetDir, ".claude-pipeline", "dashboard");
  const port = await (0, import_detect_port.default)(3e3);
  const child = (0, import_child_process2.spawn)("npm", ["run", "dev"], {
    cwd: dashboardDir,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
      PIPELINES_DIR: import_path6.default.join(targetDir, "pipelines")
    },
    shell: true
  });
  child.on("error", (err) => {
    error(`\uB300\uC2DC\uBCF4\uB4DC \uC2E4\uD589 \uC2E4\uD328: ${err.message}`);
    process.exit(1);
  });
  const cleanup = (signal) => {
    child.kill(signal);
    process.exit(0);
  };
  process.on("SIGINT", () => cleanup("SIGINT"));
  process.on("SIGTERM", () => cleanup("SIGTERM"));
  const url = `http://localhost:${port}`;
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await fetch(url);
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  await (0, import_open.default)(url);
  done(url);
  await new Promise((resolve) => {
    child.on("close", () => resolve());
  });
}

// src/index.ts
var TOTAL_STEPS = 6;
function showHelp() {
  console.log(`
  Usage: npx create-claude-pipeline

  Claude Code \uD30C\uC774\uD504\uB77C\uC778 \uC2DC\uC2A4\uD15C\uC744 \uD604\uC7AC \uB514\uB809\uD1A0\uB9AC\uC5D0 \uC124\uCE58\uD558\uACE0 \uB300\uC2DC\uBCF4\uB4DC\uB97C \uC2E4\uD589\uD569\uB2C8\uB2E4.

  \uCD5C\uCD08 \uC2E4\uD589: \uC804\uCCB4 \uC2DC\uC2A4\uD15C \uC124\uCE58 + \uB300\uC2DC\uBCF4\uB4DC \uC2E4\uD589
  \uC7AC\uC2E4\uD589:   \uB300\uC2DC\uBCF4\uB4DC\uB9CC \uC2E4\uD589

  Options:
    --help      \uC774 \uB3C4\uC6C0\uB9D0 \uD45C\uC2DC
    --version   \uBC84\uC804 \uD45C\uC2DC
`);
}
async function showVersion() {
  const pkg = await import_fs_extra5.default.readJSON(import_path7.default.join(__dirname, "..", "package.json"));
  console.log(pkg.version);
}
async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    showHelp();
    return;
  }
  if (args.includes("--version")) {
    await showVersion();
    return;
  }
  const major = parseInt(process.version.slice(1), 10);
  if (major < 18) {
    error(`Node.js 18 \uC774\uC0C1\uC774 \uD544\uC694\uD569\uB2C8\uB2E4 (\uD604\uC7AC: ${process.version})`);
    process.exit(1);
  }
  const cwd = process.cwd();
  const dashboardPkg = import_path7.default.join(cwd, ".claude-pipeline", "dashboard", "package.json");
  if (await import_fs_extra5.default.pathExists(dashboardPkg)) {
    console.log();
    success("\uC774\uBBF8 \uC124\uCE58\uB428 \u2014 \uB300\uC2DC\uBCF4\uB4DC\uB9CC \uC2E4\uD589\uD569\uB2C8\uB2E4");
    await startDashboard(cwd);
    return;
  }
  banner();
  step(1, TOTAL_STEPS, "\uD30C\uC77C \uBCF5\uC0AC \uC911...");
  const copyResult = await copyTemplateFiles(cwd);
  success(`.claude/agents/ (${copyResult.agents.copied.length}\uAC1C \uBCF5\uC0AC, ${copyResult.agents.skipped.length}\uAC1C \uAC74\uB108\uB700)`);
  success(`.claude/skills/ (${copyResult.skills.copied.length}\uAC1C \uBCF5\uC0AC, ${copyResult.skills.skipped.length}\uAC1C \uAC74\uB108\uB700)`);
  success(`references/ (${copyResult.references.copied.length}\uAC1C \uBCF5\uC0AC, ${copyResult.references.skipped.length}\uAC1C \uAC74\uB108\uB700)`);
  step(2, TOTAL_STEPS, "CLAUDE.md \uBCD1\uD569 \uC911...");
  const mdResult = await mergeCLAUDEmd(cwd);
  if (mdResult === "created") {
    success("CLAUDE.md \uC0DD\uC131");
  } else if (mdResult === "merged") {
    success("\uAE30\uC874 CLAUDE.md\uC5D0 \uD30C\uC774\uD504\uB77C\uC778 \uC139\uC158 \uCD94\uAC00");
  } else {
    success("CLAUDE.md \uC774\uBBF8 \uD30C\uC774\uD504\uB77C\uC778 \uC139\uC158 \uD3EC\uD568 \u2014 \uAC74\uB108\uB700");
  }
  step(3, TOTAL_STEPS, ".claude/settings.json \uBCD1\uD569 \uC911...");
  const settingsResult = await mergeSettings(cwd);
  if (settingsResult === "created") {
    success("settings.json \uC0DD\uC131");
  } else {
    success("\uAE30\uC874 settings.json\uC5D0 \uD30C\uC774\uD504\uB77C\uC778 \uC124\uC815 \uBCD1\uD569");
  }
  step(4, TOTAL_STEPS, ".gitignore \uC5C5\uB370\uC774\uD2B8 \uC911...");
  const gitignoreResult = await updateGitignore(cwd);
  if (gitignoreResult.added.length > 0) {
    success(`.gitignore\uC5D0 ${gitignoreResult.added.length}\uAC1C \uD56D\uBAA9 \uCD94\uAC00`);
  } else {
    success(".gitignore \uC774\uBBF8 \uCD5C\uC2E0 \u2014 \uAC74\uB108\uB700");
  }
  step(5, TOTAL_STEPS, "Runner & \uB300\uC2DC\uBCF4\uB4DC \uC124\uCE58 \uC911...");
  const spinner = (0, import_ora.default)("  npm install \uC2E4\uD589 \uC911...").start();
  try {
    const runnerDir = import_path7.default.join(cwd, ".claude-pipeline", "runner");
    await npmInstall(runnerDir);
    spinner.text = "  Runner \uBE4C\uB4DC \uC911...";
    const { execSync: execSync2 } = await import("child_process");
    execSync2("npm run build", { cwd: runnerDir, stdio: "pipe", timeout: 6e4 });
    spinner.text = "  \uB300\uC2DC\uBCF4\uB4DC npm install \uC2E4\uD589 \uC911...";
    await npmInstall(import_path7.default.join(cwd, ".claude-pipeline", "dashboard"));
    spinner.succeed("  npm install + \uBE4C\uB4DC \uC644\uB8CC");
  } catch (err) {
    spinner.fail("  \uC124\uCE58/\uBE4C\uB4DC \uC2E4\uD328");
    error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
  step(6, TOTAL_STEPS, "\uB300\uC2DC\uBCF4\uB4DC \uC2E4\uD589 \uC911...");
  await startDashboard(cwd);
}
main().catch((err) => {
  error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

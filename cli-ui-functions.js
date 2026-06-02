import chalk from "chalk";

export const colors = {
  bg: "#A78BFA",
  accent: "#C4B5FD",
  text: "#FFFFFF",
  muted: "#D1D5DB",
  error: "#FCA5A5",
  line: "#8B5CF6",
};



export const theme = {
  text: chalk.hex(colors.text),
  muted: chalk.hex(colors.muted),
  accent: chalk.hex(colors.accent),
  success: chalk.hex(colors.text),
  error: chalk.hex(colors.error),
};

export function banner() {
  console.clear();

  console.log(
    chalk.hex(colors.bg).bold(`
╭──────────────────────────────────────────────╮
│               Browser Agent                  │
╰──────────────────────────────────────────────╯
`)
  );

  console.log(theme.muted("Autonomous Browser Automation"));
  console.log(theme.muted("Type 'exit' to quit\n"));
}

export function section(title) {
  console.log(
    "\n" +
      chalk.hex(colors.line)("─────────────── ") +
      theme.accent(title) +
      chalk.hex(colors.line)(" ───────────────")
  );
}

export function success(message) {
  console.log(theme.success(`✓ ${message}`));
}

export function info(message) {
  console.log(theme.accent(`→ ${message}`));
}

export function error(message) {
  console.log(theme.error(`✗ ${message}`));
}
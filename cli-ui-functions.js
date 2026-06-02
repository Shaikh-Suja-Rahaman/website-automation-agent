import chalk from "chalk"


export const theme = {


  text: chalk.hex("#E6EDF3"),
  muted: chalk.hex("#8B949E"),
  accent: chalk.hex("#58A6FF"),
  success: chalk.hex("#3FB950"),
  error: chalk.hex("#F85149"),
};

export function banner() {
  console.clear();

  console.log(theme.accent.bold(`
╭──────────────────────────────────────────────╮
│               Browser Agent                  │
╰──────────────────────────────────────────────╯
`));

  console.log(theme.muted("Autonomous Browser Automation"));
  console.log(theme.muted("Type 'exit' to quit\n"));
}

export function section(title) {
  console.log(
    "\n" +
      theme.muted("─".repeat(15)) +
      " " +
      theme.accent.bold(title) +
      " " +
      theme.muted("─".repeat(15))
  );
}

export function success(msg) {
  console.log(theme.success(`✓ ${msg}`));
}

export function info(msg) {
  console.log(theme.muted(`→ ${msg}`));
}

export function error(msg) {
  console.log(theme.error(`✗ ${msg}`));
}
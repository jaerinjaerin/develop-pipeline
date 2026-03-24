import chalk from "chalk";

export function step(current: number, total: number, message: string): void {
  console.log(chalk.cyan(`  [${current}/${total}] `) + message);
}

export function success(message: string): void {
  console.log(chalk.green("        ✓ ") + message);
}

export function error(message: string): void {
  console.log(chalk.red("        ✗ ") + message);
}

export function info(message: string): void {
  console.log(chalk.gray("        ") + message);
}

export function banner(): void {
  console.log();
  console.log(chalk.bold("  🚀 Claude Pipeline 설치 중..."));
  console.log();
}

export function done(url: string): void {
  console.log();
  console.log(chalk.green.bold(`  ✅ 완료! 대시보드: ${url}`));
  console.log(chalk.gray("     종료: Ctrl+C"));
  console.log();
}

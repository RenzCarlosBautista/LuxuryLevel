import chalk from "chalk";

const format = (label: string, message: string) => `${label} ${message}`;

export const logger = {
  info: (message: string) => console.log(format(chalk.cyan("[INFO]"), message)),
  warn: (message: string) => console.warn(format(chalk.yellow("[WARN]"), message)),
  error: (message: string) => console.error(format(chalk.red("[ERROR]"), message)),
  scraped: (message: string) => console.log(format(chalk.green("[SCRAPED]"), message)),
  report: (message: string) => console.log(format(chalk.magenta("[REPORT]"), message)),
  debug: (message: string) => console.log(format(chalk.gray("[DEBUG]"), message)),
};

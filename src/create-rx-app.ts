import commander from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { isValidProjectName, getVersion, yarnExists } from './utils';
import { Generator } from './generator';
import { Options } from './types';

const { exit } = process;
const createRXApp = (projectName: string | undefined, options: Options) => {
  if (!projectName) {
    console.log(chalk.red('Project name cannot be empty.'));
    return exit();
  }

  if (!isValidProjectName(projectName)) {
    console.log(chalk.red(`Project name - ${ chalk.red.bold(projectName) } is not valid.`));
    return exit();
  }

  if (fs.existsSync(projectName)) {
    console.log(chalk.red(`Directory ${ chalk.red.bold(projectName) } is already exists.`));
    return exit();
  }

  const projectPath = path.join(process.cwd(), projectName);
  new Generator({ projectName, projectPath, ...options }).run();
};

const program = new commander.Command('create-rx-app')
  .arguments('<project-directory>')
  .usage(`${ chalk.green.bold('<project-directory>') } [options]`)
  .option('--javascript', 'generate project in JavaScript')
  .option('--skip-install', `don't automatically install dependencies`)
  .option('--skip-jest', `don't automatically add Jest configuration`)
  .option('--skip-yarn', `don't use Yarn for managing dependencies`)
  .version(chalk.white.bold(getVersion()), '-v, --version')
  .allowUnknownOption()
  .parse(process.argv);

if (!program.args.length) {
  program.help();
}

createRXApp(program.args.shift(), {
  javascript: !!program.javascript,
  skipInstall: !!program.skipInstall,
  skipJest: !!program.skipJest,
  yarn: !program.skipYarn && yarnExists(),
});

import commander from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { Dictionary } from './types';
import { Generator } from './generator';

const { exit } = process;
const isValidProjectName = (projectName: string): boolean => /^[$A-Z_][0-9A-Z_$]*$/i.test(projectName) && projectName !== 'React';
const yarnExists = (): boolean => spawnSync('yarn', ['-v']).status === 0;

const createRXApp = (projectName: string | undefined, options: Dictionary) => {
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

  if (options.yarn && !yarnExists()) {
    const yarnRedBold = chalk.red.bold('YARN');
    console.log(chalk.red(`${ yarnRedBold } does not exist.`));
    console.log(chalk.red(`Please install ${ yarnRedBold } https://yarnpkg.com/docs/install or use ${ chalk.red.bold('NPM') }`));
    return exit();
  }

  new Generator({
    templatePath: path.resolve(__dirname, '..', 'template'),
    projectName,
    projectPath: path.join(process.cwd(), projectName),
    sourceType: options.javascript ? 'javascript' : 'typescript',
    yarn: !!options.yarn,
  }).run();
};

const program = new commander.Command('create-rx-app')
  .arguments('<project-directory>')
  .usage(`${ chalk.green.bold('<project-directory>') } [options]`)
  .option('-J, --javascript', 'generate project in JavaScript')
  .option('-Y, --yarn', 'use yarn as package manager')
  .allowUnknownOption()
  .parse(process.argv);

if (!program.args.length) {
  program.help();
}

createRXApp(program.args.shift(), {
  javascript: program.javascript,
  yarn: program.yarn,
});

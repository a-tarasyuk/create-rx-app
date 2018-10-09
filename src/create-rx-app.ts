import commander from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { Generator } from './generator';

const { exit } = process;
const isValidProjectName = (projectName: string) => /^[$A-Z_][0-9A-Z_$]*$/i.test(projectName);
const createRXApp = (projectName: string | undefined, javascript: boolean) => {
  if (!projectName) {
    console.log(chalk.red('Project name cannot be empty.'));
    return exit();
  }

  if (!isValidProjectName(projectName)) {
    console.log(chalk.red(`Project name - ${ chalk.red.bold(projectName) } is not valid.`));
    exit();
  }

  if (fs.existsSync(projectName)) {
    console.log(chalk.red(`'Directory ${ chalk.red.bold(projectName) } is already exists.`));
    exit();
  }

  new Generator({
    projectName,
    projectPath: path.join(process.cwd(), projectName),
    sourceType: javascript ? 'javascript' : 'typescript',
    templatePath: path.resolve(__dirname, '..', 'template'),
  }).run();
};

const program = new commander.Command('create-rx-app')
  .arguments('<project-directory>')
  .usage(`${ chalk.green.bold('<project-directory>') } [options]`)
  .option('-J, --javascript', 'generate project in JavaScript')
  .allowUnknownOption()
  .parse(process.argv);

if (!program.args.length) {
  program.help();
}

createRXApp(program.args.shift(), program.javascript);

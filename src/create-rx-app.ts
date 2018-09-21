import minimist, { ParsedArgs } from 'minimist';
import leftPad from 'left-pad';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { Generator } from './generator';

class ReactXPCLI {
  private projectName: string | undefined;
  private argv: ParsedArgs;

  constructor(argv: ParsedArgs) {
    this.projectName = argv._.shift();
    this.argv = argv;
  }

  public run() {
    if (this.isHelpOption()) {
      return this.help();
    }

    if (!this.projectName) {
      console.log(chalk.red('Project name cannot be empty.'));
      return process.exit();
    }

    if (!this.isValidProjectName(this.projectName)) {
      console.log(chalk.red('Project name - %s is not valid.'), this.projectName);
      return process.exit();
    }

    if (fs.existsSync(this.projectName)) {
      console.log(chalk.red('Directory %s is already exists.'), this.projectName);
      return process.exit();
    }

    const CLI_PATH = process.cwd();
    const PROJECT_PATH = path.join(CLI_PATH, this.projectName);
    const TEMPLATE_PATH = path.resolve(__dirname, '..', 'template');

    new Generator({
      destPath: PROJECT_PATH,
      projectName: this.projectName,
      sourceType: 'typescript', // @TODO add CLI option
      templatePath: TEMPLATE_PATH,
    }).run();
  }

  private help() {
    console.log([
      chalk.blue('====================================================='),
      `${ chalk.blue('=') } ${ leftPad(chalk.green('ReactXP-CLI'), 40) } ${ leftPad(chalk.blue('='), 30) }`,
      chalk.blue('====================================================='),
    ].join('\n'));

    console.log([
      '',
      ' Usage: reactxp-cli <ProjectName> [options]',
      '',
      ' Options:',
      '  -h, --help     outputs usage information',
      '',
    ].join('\n'));

    process.exit(0);
  }

  private isValidProjectName = (projectName: string) => /^[$A-Z_][0-9A-Z_$]*$/i.test(projectName);
  private isHelpOption = () => this.argv.h || this.argv.help;
}

new ReactXPCLI(minimist(process.argv.slice(2))).run();

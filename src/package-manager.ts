import chalk from 'chalk';
import { execSync } from 'child_process';
import { Dictionary } from './types';

const { exit } = process;

export class PackageManager {
  private yarn: boolean;

  public constructor(yarn: boolean) {
    this.yarn = yarn;
  }

  public install(deps: Dictionary, description: string, saveDev = false) {
    const command = this.buildCommand(deps, saveDev);

    console.log(this.buildDescription(description));
    console.log(chalk.grey.bold('%s'), command);

    try {
      execSync(command, { stdio: 'inherit' });
    } catch {
      console.log(
        chalk.red.bold(
          'Dependencies were not installed, please try to create a project again.',
        ),
      );
      exit(1);
    }
  }

  private buildDescription(description: string | undefined) {
    return [
      chalk.blue.bold(['[', this.yarn ? 'yarn' : 'npm', ']'].join('')),
      chalk.white.bold(
        [this.yarn ? 'adding' : 'installing', `${description || ''}...`].join(
          ' ',
        ),
      ),
    ].join(' ');
  }

  private buildCommand(deps: Dictionary, saveDev: boolean): string {
    const packages = this.normalizeDependencies(deps);

    if (this.yarn) {
      return ['yarn', 'add', packages, '--exact', saveDev ? '--dev' : ''].join(
        ' ',
      );
    }

    return [
      'npm',
      'i',
      packages,
      '--save-exact',
      '--loglevel=error',
      saveDev ? '--save-dev' : '',
    ].join(' ');
  }

  private normalizeDependencies(deps: Dictionary): string {
    return Object.keys(deps)
      .map((key: string) => `${key}@${deps[key]}`)
      .join(' ');
  }
}

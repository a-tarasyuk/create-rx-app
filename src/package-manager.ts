import chalk from 'chalk';
import { execSync } from 'child_process';
import { Dictionary } from './types';

export class PackageManager {
  private yarn: boolean;

  constructor(yarn: boolean) {
    this.yarn = yarn;
  }

  public install(deps: Dictionary, description: string, saveDev: boolean = false) {
    const command = this.buildCommand(deps, saveDev);

    console.log(this.buildDescription(description));
    console.log(chalk.grey.bold('%s'), command);
    execSync(command, { stdio: 'inherit' });
  }

  private buildDescription(description: string | undefined) {
    return [
      chalk.blue.bold(['[', this.yarn ? 'yarn' : 'npm', ']'].join('')),
      chalk.white.bold([this.yarn ? 'adding' : 'installing', `${ description || ''}...`].join(' ')),
    ].join(' ');
  }

  private buildCommand(deps: Dictionary, saveDev: boolean): string {
    const packages = this.normalizeDependencies(deps);
    const command = this.yarn
      ? ['yarn', 'add', packages, '--exact', '--ignore-scripts', saveDev ? '--dev' : '']
      : ['npm', 'i', packages, '--save-exact', '--ignore-scripts', '--loglevel=error', saveDev ? '--save-dev' : ''];

    return command.join(' ');
  }

  private normalizeDependencies(deps: Dictionary): string {
    return Object.keys(deps).map((key: string) => `${ key }@${ deps[key] }`).join(' ');
  }
}

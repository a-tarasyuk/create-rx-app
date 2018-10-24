import template from 'mustache';
import username from 'username';
import chalk from 'chalk';
import uuid from 'uuid';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { omit, merge } from 'lodash';
import { spawnSync } from 'child_process';
import { PackageManager } from './package-manager';
import { Dictionary, SourceType } from './types';

export interface GeneratorOptions {
  templatePath: string;
  projectName: string;
  projectPath: string;
  skipInstall: boolean;
  sourceType: SourceType;
  yarn: boolean;
}

const WINDOWS_FOLDER = 'windows';
const COMMON_FOLDER = 'common';
const IOS_FOLDER = 'ios';
const NPM_INSTALL = 'npm i';
const NPM_RUN = 'npm run';
const YARN = 'yarn';

const { chdir } = process;

export class Generator {
  private projectPatterns: Dictionary = {};
  private packageJson: Dictionary = {};
  private runCommand: string;
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    const { projectName, yarn } = options;

    this.projectPatterns = {
      ProjectName: projectName,
      displayName: projectName,
      projectname: projectName.toLowerCase(),
    };

    this.runCommand = yarn ? YARN : NPM_RUN;
    this.options = options;
  }

  public run(): void {
    const { projectPath } = this.options;

    console.log(chalk.white.bold('Setting up new ReactXP app in %s'), projectPath);
    fs.mkdirSync(projectPath);
    this.setPackageJson();

    this.generateApp();
    this.generateWindowsApp();
    this.generatePackageJson();
    this.installDependencies();
    this.printInstructions();
  }

  private generateApp(): void {
    const { templatePath, sourceType } = this.options;
    const ignorePaths = ['_package.json', path.join(templatePath, COMMON_FOLDER, WINDOWS_FOLDER)];
    const paths = [COMMON_FOLDER, sourceType].map(folderName => path.join(templatePath, folderName));

    const pathPatterns = {
      ...this.projectPatterns,
      '_babel.config.js': 'babel.config.js',
      '_eslintrc': '.eslintrc',
      '_gitignore': '.gitignore',
      '_tsconfig.json': 'tsconfig.json',
      '_tslint.json': 'tslint.json',
    };

    paths.forEach(srcPath => (
      this.walk(srcPath, ignorePaths).forEach((absolutePath: string) => (
        this.copy(absolutePath, this.buildDestPath(absolutePath, srcPath, pathPatterns), this.projectPatterns)
      ))
    ));
  }

  private generateWindowsApp(): void {
    const { templatePath } = this.options;
    const currentUser = username.sync();
    const certificateThumbprint = this.buildSelfSignedCertificate(currentUser);
    const commonTemplatePath = path.join(templatePath, COMMON_FOLDER);
    const windowsTemplatePath = path.join(commonTemplatePath, WINDOWS_FOLDER);

    const contnetPatterns = {
      ...this.projectPatterns,
      ...certificateThumbprint && { certificateThumbprint },
      currentUser,
      packageGuid: uuid.v4(),
      projectGuid: uuid.v4(),
    };
    const pathPatterns = { ...this.projectPatterns, _gitignore: '.gitignore' };
    const ignoreFiles = certificateThumbprint ? ['ProjectName_TemporaryKey.pfx'] : [];

    this.walk(windowsTemplatePath, ignoreFiles).forEach((absolutePath: string) => (
      this.copy(absolutePath, this.buildDestPath(absolutePath, commonTemplatePath, pathPatterns), contnetPatterns)
    ));
  }

  private buildSelfSignedCertificate(currentUser: string): string {
    const { projectPath, projectName } = this.options;

    if (os.platform() !== 'win32') {
      return '';
    }

    console.log('%s %s', chalk.blue.bold('[windows]'), chalk.white.bold('Generating self-signed certificate...'));

    const certificateDestPath = path.join(projectPath, WINDOWS_FOLDER, projectName);
    const certificateFileDestPath = path.join(certificateDestPath, projectName);
    const certificateArgs = [
      [
        '$cert = New-SelfSignedCertificate -KeyUsage DigitalSignature -KeyExportPolicy Exportable -Subject',
        `"CN=${ currentUser }" -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}Subject Type:End Entity")`,
        `-CertStoreLocation "Cert:\\CurrentUser\\My"`,
      ].join(' '),
      '$pwd = ConvertTo-SecureString -String password -Force -AsPlainText',
      `New-Item -ErrorAction Ignore -ItemType directory -Path ${ certificateDestPath }`,
      [
        `Export-PfxCertificate -Cert "cert:\\CurrentUser\\My\\$($cert.Thumbprint)"`,
        `-FilePath ${ certificateFileDestPath }_TemporaryKey.pfx -Password $pwd`,
      ].join(' '),
      '$cert.Thumbprint',
    ].join(';');

    if (!fs.existsSync(certificateDestPath)) {
      fs.mkdirpSync(certificateDestPath);
    }

    const { status, stdout } = spawnSync('powershell', ['-command', certificateArgs]);
    if (status === 0) {
      console.log('%s %s', chalk.blue.bold('[windows]'), chalk.green.bold('Self-signed certificate generated successfully.'));

      const output = stdout.toString().trim().split('\n');
      return output[output.length - 1];
    }

    console.log('%s %s', chalk.blue.bold('[windows]'), chalk.red.bold('Failed to generate Self-signed certificate.'));
    console.log('%s %s', chalk.blue.bold('[windows]'), chalk.yellow.bold('Using Default Certificate. Use Visual Studio to renew it.'));
    return '';
  }

  private generatePackageJson(): void {
    const { projectPath, projectName, skipInstall, yarn } = this.options;
    const paramsPrefix = yarn ? ' ' : ' -- ';
    const packageJson = JSON.stringify({
      name: projectName.toLowerCase(), ...omit(this.packageJson, skipInstall ? [] : ['devDependencies', 'dependencies']),
    }, null, 2);

    fs.writeFileSync(
      path.resolve(projectPath, 'package.json'),
      template.render(packageJson, { runCommand: this.runCommand, paramsPrefix }),
    );
  }

  private printInstructions(): void {
    const { projectName, projectPath, skipInstall, yarn } = this.options;
    const xcodeProjectPath = `${ path.resolve(projectPath, IOS_FOLDER, projectName) }.xcodeproj`;
    const windowsProjectPath = `${ path.resolve(projectPath, WINDOWS_FOLDER, projectName) }.sln`;

    console.log(chalk.green.bold('%s was successfully created. \n'), projectName);

    if (skipInstall) {
      console.log(chalk.green.bold('To install dependencies:'));
      console.log('  cd %s', projectPath);
      console.log(chalk.white.bold('  %s \n'), yarn ? YARN : NPM_INSTALL);
    }

    console.log(chalk.green.bold('To run your app on Web:'));
    console.log('  cd %s', projectPath);
    console.log(chalk.white.bold('  %s start:web \n'), this.runCommand);

    console.log(chalk.green.bold('To build Web production version of your app:'));
    console.log('  cd %s', projectPath);
    console.log(chalk.white.bold('  %s build:web \n'), this.runCommand);

    console.log(chalk.green.bold('To run your app on iOS:'));
    console.log('  cd %s', projectPath);
    console.log(chalk.white.bold('  %s start:ios'), this.runCommand);
    console.log('  - or -');
    console.log('  open %s project in Xcode', path.relative(projectPath, xcodeProjectPath));
    console.log('  press the Run button \n');

    console.log(chalk.green.bold('To run your app on Android:'));
    console.log('  cd %s', projectPath);
    console.log('  Have an Android emulator running (quickest way to get started), or a device connected.');
    console.log(chalk.white.bold('  %s start:android'), this.runCommand);
    console.log('  - or -');
    console.log(chalk.white.bold('  open android/ project in Android Studio'));
    console.log('  press the Run button \n');

    console.log(chalk.green.bold('To run your app on Windows:'));
    console.log('  cd %s', projectPath);
    console.log(chalk.white.bold('  %s start:windows'), this.runCommand);
    console.log('  - or -');
    console.log(chalk.white.bold('  open %s project in Visual Studio'), windowsProjectPath);
    console.log('  press the Run button \n');
  }

  private installDependencies(): void {
    if (this.options.skipInstall) {
      return;
    }

    const { devDependencies, dependencies } = this.packageJson;
    const { projectPath, yarn } = this.options;
    const packageManager = new PackageManager(yarn);

    chdir(projectPath);
    packageManager.install(devDependencies, 'dev dependencies', true);
    packageManager.install(dependencies, 'dependencies');
  }

  private setPackageJson(): void {
    const { templatePath, sourceType } = this.options;

    this.packageJson = merge(
      JSON.parse(fs.readFileSync(path.join(templatePath, COMMON_FOLDER, '_package.json')) as any),
      JSON.parse(fs.readFileSync(path.join(templatePath, sourceType, '_package.json')) as any),
    );
  }

  private buildDestPath(absolutePath: string, relativeTo: string, patterns: Dictionary): string {
    let destPath = path.resolve(this.options.projectPath, path.relative(relativeTo, absolutePath));

    Object
      .keys(patterns)
      .forEach(regexp => destPath = destPath.replace(new RegExp(`\\b${ regexp }`, 'g'), patterns[regexp]));

    return destPath;
  }

  private copy(srcPath: string, destPath: string, patterns: Dictionary): void {
    if (fs.lstatSync(srcPath).isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath);
      }

      return;
    } else {
      const permissions = fs.statSync(srcPath).mode;

      if (this.isBinary(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      } else {
        const content = template.render(fs.readFileSync(srcPath, 'utf8'), patterns);
        fs.writeFileSync(destPath, content, { encoding: 'utf8', mode: permissions });
      }
    }
  }

  private isBinary(srcPath: string): boolean {
    return ['.png', '.jpg', '.jar', '.ico', '.pfx'].indexOf(path.extname(srcPath)) >= 0;
  }

  private walk(srcPath: string, ignorePaths: string[] = []): string[] {
    const isIgnored = (file: string) => ignorePaths.some(p => file.indexOf(p) >= 0);

    if (!fs.lstatSync(srcPath).isDirectory()) {
      return isIgnored(srcPath) ? [] : [srcPath];
    }

    return []
      .concat
      .apply([srcPath], fs.readdirSync(srcPath).map(child => this.walk(path.join(srcPath, child))))
      .filter((absolutePath: string) => !isIgnored(absolutePath));
  }
}

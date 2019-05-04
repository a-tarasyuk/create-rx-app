import template from 'mustache';
import username from 'username';
import chalk from 'chalk';
import uuid from 'uuid';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { flatten, omit, merge } from 'lodash';
import { spawnSync } from 'child_process';

import { PackageManager } from './package-manager';
import { sortKeys } from './utils';
import { Dictionary, Options } from './types';

type TemplateFolderName = 'javascript' | 'typescript';

interface GeneratorOptions extends Options {
  projectName: string;
  projectPath: string;
}

const TYPESCRIPT_FOLDER = 'typescript';
const JAVASCRIPT_FOLDER = 'javascript';
const WINDOWS_FOLDER = 'windows';
const COMMON_FOLDER = 'common';
const IOS_FOLDER = 'ios';
const TEMP_PACKAGE_JSON = '_package.json';

const NPM_INSTALL = 'npm i';
const NPM_RUN = 'npm run';
const YARN = 'yarn';

const TEMPLATE_PATH = path.resolve(__dirname, '..', 'template');
const COMMON_TEMPLATE_PATH = path.join(TEMPLATE_PATH, COMMON_FOLDER);
const WINDOWS_TEMPLATE_PATH = path.join(COMMON_TEMPLATE_PATH, WINDOWS_FOLDER);
const WINDOWS_TEMPORARY_KEY_PATH = path.join(WINDOWS_TEMPLATE_PATH, 'ProjectName', 'ProjectName_TemporaryKey.pfx');
const JEST_TEMPLATE_PATH = path.join(COMMON_TEMPLATE_PATH, 'jest');

const { chdir } = process;

export class Generator {
  private templateFolderName: TemplateFolderName;
  private packageJson: Dictionary = {};
  private runCommand: string;
  private options: GeneratorOptions;
  private params: Dictionary = {};

  public constructor(options: GeneratorOptions) {
    const { projectName, javascript, yarn } = options;

    this.params = {
      ProjectName: projectName,
      displayName: projectName,
      projectname: projectName.toLowerCase(),
    };

    this.templateFolderName = javascript ? JAVASCRIPT_FOLDER : TYPESCRIPT_FOLDER;
    this.runCommand = yarn ? YARN : NPM_RUN;
    this.options = options;
  }

  public run(): void {
    const { projectPath, skipInstall } = this.options;

    console.log(chalk.white.bold('Setting up new ReactXP app in %s'), projectPath);
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath);
    }

    this.setPackageJson();
    this.generatePackageJson();

    if (!skipInstall) {
      this.installDependencies();
    }

    this.generateApp();
    this.generateWindowsApp();
    this.printInstructions();
  }

  private generateApp(): void {
    const { skipJest, javascript } = this.options;
    const templatePaths = [COMMON_TEMPLATE_PATH, path.join(TEMPLATE_PATH, this.templateFolderName)];
    const excludePaths = [WINDOWS_TEMPLATE_PATH, TEMP_PACKAGE_JSON];

    if (skipJest) {
      excludePaths.push(JEST_TEMPLATE_PATH);
      excludePaths.push(`App.spec.${ javascript ? 'js' : 'tsx' }`);
    }

    const pathParams = {
      ...this.params,
      '_babel.config.js': 'babel.config.js',
      '_eslintrc': '.eslintrc',
      '_gitignore': '.gitignore',
      '_tsconfig.json': 'tsconfig.json',
      '_tslint.json': 'tslint.json',
    };

    const contnetParams = { ...this.params, skipJest };

    templatePaths.forEach(srcPath => this.walk(srcPath, excludePaths).forEach(absolutePath => (
      this.copy(absolutePath, this.buildDestPath(absolutePath, srcPath, pathParams), contnetParams)
    )));
  }

  private generateWindowsApp(): void {
    const currentUser = username.sync();
    const certificateThumbprint = this.buildSelfSignedCertificate(currentUser);

    const contnetParams = {
      ...this.params,
      ...certificateThumbprint && { certificateThumbprint },
      currentUser,
      packageGuid: uuid.v4(),
      projectGuid: uuid.v4(),
    };
    const pathParams = { ...this.params, _gitignore: '.gitignore' };
    const excludePaths = certificateThumbprint ? [WINDOWS_TEMPORARY_KEY_PATH] : [];

    this.walk(WINDOWS_TEMPLATE_PATH, excludePaths).forEach(absolutePath => (
      this.copy(absolutePath, this.buildDestPath(absolutePath, COMMON_TEMPLATE_PATH, pathParams), contnetParams)
    ));
  }

  private buildSelfSignedCertificate(currentUser: string | undefined): string {
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
    const { projectPath, projectName, skipInstall } = this.options;
    const packageJson = JSON.stringify({
      name: projectName.toLowerCase(), ...omit(this.packageJson, skipInstall ? [] : ['devDependencies', 'dependencies']),
    }, null, 2);

    fs.writeFileSync(path.resolve(projectPath, 'package.json'), packageJson);
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
    const { devDependencies, dependencies } = this.packageJson;
    const { projectPath, yarn } = this.options;
    const packageManager = new PackageManager(yarn);

    chdir(projectPath);
    packageManager.install(devDependencies, 'dev dependencies', true);
    packageManager.install(dependencies, 'dependencies');
  }

  private setPackageJson(): void {
    const packageJson = merge(
      this.buildPackageJson(COMMON_FOLDER),
      this.buildPackageJson(this.templateFolderName),
    );

    this.packageJson = {
      ...packageJson,
      devDependencies: sortKeys(packageJson.devDependencies),
      dependencies: sortKeys(packageJson.dependencies),
    };
  }

  private buildPackageJson(srcFolder: string): Dictionary {
    const { skipJest, yarn } = this.options;
    const content = fs.readFileSync(path.join(TEMPLATE_PATH, srcFolder, TEMP_PACKAGE_JSON), { encoding: 'utf8' });
    const params = {
      paramsPrefix: yarn ? ' ' : ' -- ',
      runCommand: this.runCommand,
      skipJest,
    };

    return JSON.parse(template.render(content, params));
  }

  private buildDestPath(absolutePath: string, relativeTo: string, params: Dictionary): string {
    let destPath = path.resolve(this.options.projectPath, path.relative(relativeTo, absolutePath));

    Object
      .keys(params)
      .forEach(regexp => destPath = destPath.replace(new RegExp(`\\b${ regexp }`, 'g'), params[regexp]));

    return destPath;
  }

  private copy(srcPath: string, destPath: string, params: Dictionary): void {
    if (fs.lstatSync(srcPath).isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath);
      }

      return;
    } else {
      if (this.isBinary(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      } else {
        const permissions = fs.statSync(srcPath).mode;
        const content = template.render(fs.readFileSync(srcPath, 'utf8'), params);
        fs.writeFileSync(destPath, content, { encoding: 'utf8', mode: permissions });
      }
    }
  }

  private isBinary(srcPath: string): boolean {
    return ['.png', '.jpg', '.jar', '.ico', '.pfx', '.keystore'].indexOf(path.extname(srcPath)) >= 0;
  }

  private walk(srcPath: string, excludePaths: string[] = []): string[] {
    const isExcluded = (file: string) => excludePaths.some(p => file.indexOf(p) >= 0);

    if (!fs.lstatSync(srcPath).isDirectory()) {
      return isExcluded(srcPath) ? [] : [srcPath];
    }

    return [
      srcPath, ...flatten(fs.readdirSync(srcPath).map(child => this.walk(path.join(srcPath, child)))),
    ].filter(absolutePath => !isExcluded(absolutePath));
  }
}

import template from 'mustache';
import chalk from 'chalk';
import shell from 'shelljs';
import path from 'path';
import fs from 'fs-extra';

interface Dictionary {
  [name: string]: any;
}

type SourceType = 'javascript' | 'typescript';

export interface GeneratorOptions {
  templatePath: string;
  projectName: string;
  projectPath: string;
  sourceType: SourceType;
}

const COMMON_FOLDER = 'common';
const PATH_PATTERNS: Dictionary = {
  '_eslintrc': '.eslintrc',
  '_gitignore': '.gitignore',
  '_tsconfig.json': 'tsconfig.json',
  '_tslint.json': 'tslint.json',
};

export class Generator {
  private projectPatterns: Dictionary = {};
  private packageJson: Dictionary = {};
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    const { projectName } = options;

    this.projectPatterns = {
      DisplayName: projectName,
      ProjectTemplate: projectName,
      projecttemplate: projectName.toLowerCase(),
    };

    this.options = options;
  }

  public run(): void {
    const { projectPath } = this.options;

    console.log(chalk.white.bold('Setting up new ReactXP app in %s'), projectPath);
    fs.mkdirSync(projectPath);
    this.setPackageJson();

    this.generateApp();
    this.generatePackageJson();
    this.installDependencies();
    this.printInstructions();
  }

  private generateApp(): void {
    const { templatePath, sourceType } = this.options;
    const ignorePaths = ['_package.json'];

    [COMMON_FOLDER, sourceType]
      .map(folderName => path.join(templatePath, folderName))
      .forEach(srcPath => (
        this.walk(srcPath, ignorePaths)
          .forEach((absolutePath: string) => this.copy(absolutePath, this.buildDestPath(srcPath, absolutePath)))
      ));
  }

  private generatePackageJson(): void {
    const { projectPath, projectName } = this.options;
    const packageJsonPath = path.resolve(projectPath, 'package.json');
    const packageJsonContent = {
      ...this.packageJson, dependencies: {}, devDependencies: {}, name: projectName.toLowerCase(),
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));
  }

  private printInstructions(): void {
    const { projectName, projectPath } = this.options;
    const xcodeProjectPath = `${ path.resolve(projectPath, 'ios', projectName) }.xcodeproj`;

    console.log(chalk.green.bold('%s was successfully created. \n'), projectName);
    console.log(chalk.green.bold('To run your app on Web:'));
    console.log('  cd %s', projectPath);
    console.log(chalk.white.bold('  npm run start:web \n'));

    console.log(chalk.green.bold('To build Web production version of your app:'));
    console.log('  cd %s', projectPath);
    console.log(chalk.white.bold('  npm run build:web \n'));

    console.log(chalk.green.bold('To run your app on iOS:'));
    console.log('  cd %s', projectPath);
    console.log(chalk.white.bold('  npm run start:ios'));
    console.log('  - or -');
    console.log('  open %s project in Xcode', path.relative(projectPath, xcodeProjectPath));
    console.log('  press the Run button \n');

    console.log(chalk.green.bold('To run your app on Android:'));
    console.log('  cd %s', projectPath);
    console.log('  Have an Android emulator running (quickest way to get started), or a device connected.');
    console.log(chalk.white.bold('  npm run start:android'));
    console.log('  - or -');
    console.log(chalk.white.bold('  open android/ project in Android Studio'));
    console.log('  press the Run button \n');

    console.log(chalk.green.bold('To run your app on Windows:'));
    console.log('  cd %s', projectPath);
    console.log(chalk.white.bold('  npm run start:windows'));
  }

  private installDependencies(): void {
    const { projectPath } = this.options;
    shell.cd(projectPath);

    this.npmInstall(this.packageJson.devDependencies, 'devDependencies', ['--save-dev']);
    this.npmInstall(this.packageJson.dependencies, 'reactxp');

    const peerDependencies = require(path.join(projectPath, 'node_modules', 'reactxp', 'package.json')).peerDependencies;
    if (!peerDependencies) {
      console.log(chalk.red(`Missing react/react-native/react-native-windows peer dependencies in ReactXP's package.json. Aborting`));
      return shell.exit(1);
    }

    if (!peerDependencies.react) {
      console.log(chalk.red(`Missing react peer dependency in ReactXP's package.json. Aborting`));
      return shell.exit(1);
    }

    if (!peerDependencies['react-dom']) {
      console.log(chalk.red(`Missing react-dom peer dependency in ReactXP's package.json. Aborting`));
      return shell.exit(1);
    }

    if (!peerDependencies['react-native']) {
      console.log(chalk.red(`Missing react-native peer dependency in ReactXP's package.json. Aborting`));
      return shell.exit(1);
    }

    if (!peerDependencies['react-native-windows']) {
      console.log(chalk.red(`Missing react-native-windows peer dependency in ReactXP's package.json. Aborting`));
      return shell.exit(1);
    }

    this.npmInstall(peerDependencies, 'peerDependencies');
  }

  private npmInstall(deps: Dictionary, description: string, options: string[] = []): void {
    const packages = Object.keys(deps)
      .map((key: string) => `${ key }@${ deps[key] }`).join(' ');

    const npmCommand = ['npm', 'install', packages, '--save-exact', '--ignore-scripts', ...options];
    const npmInstall = npmCommand.join(' ');

    console.log(chalk.white.bold('\nInstalling %s. This might take a couple minutes.'), description);
    console.log(chalk.white('%s'), npmInstall);

    if (shell.exec(npmInstall).code !== 0) {
      console.log(chalk.red('NPM Error: could not install %s. Aborting.'), description);
      shell.exit(1);
    }
  }

  private setPackageJson(): void {
    const { templatePath, sourceType } = this.options;
    const packageJson = fs.readFileSync(path.join(templatePath, sourceType, '_package.json'));
    this.packageJson = JSON.parse(packageJson as any);
  }

  private buildDestPath(srcPath: string, absolutePath: string): string {
    const patterns = { ...this.projectPatterns, ...PATH_PATTERNS };
    let destPath = path.resolve(this.options.projectPath, path.relative(srcPath, absolutePath));

    Object
      .keys(patterns)
      .forEach(regexp => destPath = destPath.replace(new RegExp(regexp, 'g'), patterns[regexp]));

    return destPath;
  }

  private copy(srcPath: string, destPath: string): void {
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
        const content = template.render(fs.readFileSync(srcPath, 'utf8'), this.projectPatterns);
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

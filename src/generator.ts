import chalk from 'chalk';
import shell from 'shelljs';
import path from 'path';
import fs from 'fs-extra';

export interface GeneratorOptions {
  templatePath: string;
  projectName: string;
  sourceType: string;
  destPath: string;
}

interface Dictionary {
  [name: string]: any;
}

const UNDERSCORE_PATTERN = { _: '' };

export class Generator {
  private defaultPatterns: Dictionary = {};
  private packageJson: Dictionary = {};
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    const { projectName } = options;

    this.defaultPatterns = {
      ProjectTemplate: projectName,
      projecttemplate: projectName.toLowerCase(),
    };

    this.options = options;
  }

  public run() {
    const { destPath } = this.options;

    console.log(chalk.white.bold('Setting up new ReactXP app in %s'), destPath);
    fs.mkdirSync(destPath);
    this.setPackageJson();
    this.generateNative();
    this.generateWeb();
    this.generateApp();
    this.generatePackageJson();
    this.installDependencies();
    this.printInstructions();
  }

  private generateNative() {
    const nativeTemplatePath = path.join(this.options.templatePath, 'native');

    this.walk(nativeTemplatePath)
      .forEach(absolutePath => {
        const destPath = this.buildDestinationPath(nativeTemplatePath, absolutePath, this.defaultPatterns);
        this.copy(absolutePath, destPath, this.defaultPatterns);
      });
  }

  private generateWeb() {
    const { templatePath } = this.options;
    this.walk(path.join(templatePath, 'web'))
      .forEach(absolutePath => (
        this.copy(absolutePath, this.buildDestinationPath(templatePath, absolutePath, UNDERSCORE_PATTERN), this.defaultPatterns)
      ));
  }

  private generateApp() {
    const { templatePath, sourceType } = this.options;
    const tsAppTemplatePath = path.join(templatePath, sourceType);

    this.walk(tsAppTemplatePath)
      .forEach(absolutePath => (
        this.copy(absolutePath, this.buildDestinationPath(tsAppTemplatePath, absolutePath, UNDERSCORE_PATTERN))
      ));
  }

  private generatePackageJson() {
    const { destPath, projectName } = this.options;
    const packageJsonPath = path.resolve(destPath, 'package.json');
    const packageJsonContent = {
      ...this.packageJson, dependencies: {}, devDependencies: {}, name: projectName.toLowerCase(),
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));
  }

  private printInstructions() {
    const { projectName, destPath } = this.options;
    const xcodeProjectPath = `${ path.resolve(destPath, 'ios', projectName) }.xcodeproj`;

    console.log(chalk.green.bold('%s was successfully created. \n'), projectName);
    console.log(chalk.green.bold('To run your app on Web:'));
    console.log('  cd %s', destPath);
    console.log(chalk.white.bold('  npm run start:web \n'));

    console.log(chalk.green.bold('To build Web production version of your app:'));
    console.log('  cd %s', destPath);
    console.log(chalk.white.bold('  npm run build:web \n'));

    console.log(chalk.green.bold('To run your app on iOS:'));
    console.log('  cd %s', destPath);
    console.log(chalk.white.bold('  npm run start:ios'));
    console.log('  - or -');
    console.log('  open %s project in Xcode', path.relative(destPath, xcodeProjectPath));
    console.log('  press the Run button \n');

    console.log(chalk.green.bold('To run your app on Android:'));
    console.log('  cd %s', destPath);
    console.log('  Have an Android emulator running (quickest way to get started), or a device connected.');
    console.log(chalk.white.bold('  npm run start:android'));
    console.log('  - or -');
    console.log(chalk.white.bold('  open android/ project in Android Studio'));
    console.log('  press the Run button \n');

    console.log(chalk.green.bold('To run your app on Windows:'));
    console.log('  cd %s', destPath);
    console.log(chalk.white.bold('  npm run start:windows'));
  }

  private installDependencies() {
    const { destPath } = this.options;
    shell.cd(destPath);

    this.npmInstall(this.packageJson.devDependencies, 'devDependencies', ['--save-dev']);
    this.npmInstall(this.packageJson.dependencies, 'reactxp');

    const peerDependencies = require(path.join(destPath, 'node_modules', 'reactxp', 'package.json')).peerDependencies;
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

  private npmInstall(deps: Dictionary, description: string, options: string[] = []) {
    const packages = Object.keys(deps)
      .map((key: string) => `${ key }@${ deps[key] }`).join(' ');

    let npmCommand = ['npm', 'install', packages, '--save-exact', '--ignore-scripts'];
    if (options.length) {
      npmCommand = npmCommand.concat(...options);
    }

    const npmInstall = npmCommand.join(' ');

    console.log(chalk.white.bold('\nInstalling %s. This might take a couple minutes.'), description);
    console.log(chalk.white('%s'), npmInstall);

    if (shell.exec(npmInstall).code !== 0) {
      console.log(chalk.red('NPM Error: could not install %s. Aborting.'), description);
      shell.exit(1);
    }
  }

  private setPackageJson() {
    const { templatePath, sourceType } = this.options;
    const packageJson = fs.readFileSync(path.join(templatePath, sourceType, '_package.json'));
    this.packageJson = JSON.parse(packageJson as any);
  }

  private buildDestinationPath(templatePath: string, srcPath: string, patterns?: Dictionary) {
    const destPath = path.resolve(this.options.destPath, path.relative(templatePath, srcPath));

    if (patterns) {
      return this.replace(destPath, patterns);
    }

    return destPath;
  }

  private copy(srcPath: string, destPath: string, patterns?: Dictionary): void {
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
        const content = fs.readFileSync(srcPath, 'utf8');

        fs.writeFileSync(destPath, patterns ? this.replace(content, patterns) : content, {
          encoding: 'utf8',
          mode: permissions,
        });
      }
    }
  }

  private isBinary(srcPath: string): boolean {
    return ['.png', '.jpg', '.jar', '.ico'].indexOf(path.extname(srcPath)) >= 0;
  }

  private walk(srcPath: string): string[] {
    if (!fs.lstatSync(srcPath).isDirectory()) {
      return [srcPath];
    }

    return [].concat.apply([srcPath], fs.readdirSync(srcPath).map(child => this.walk(path.join(srcPath, child))));
  }

  private replace = (content: string, patterns: Dictionary = {}): string => {
    Object
      .keys(patterns)
      .forEach(regexp => content = content.replace(new RegExp(regexp, 'g'), patterns[regexp]));

    return content;
  }

}

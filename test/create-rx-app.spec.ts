import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';

const ROOT_PATH = path.join(__dirname, '..');
const BIN_PATH = path.join(ROOT_PATH, 'bin');
const CREATE_RX_APP = path.join(BIN_PATH, 'create-rx-app.js');
const OUTPUT_PATH = path.join(ROOT_PATH, '.test');
const APP_NAME = 'AppName';
const APP_PATH = path.join(OUTPUT_PATH, APP_NAME);

if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH);
}

process.chdir(OUTPUT_PATH);

describe('create-rx-app.spec', () => {
  beforeEach(() => fs.removeSync(APP_PATH));

  it('checks base project structure', () => {
    const { status } = spawnSync('node', [CREATE_RX_APP, APP_NAME, '--skip-install']);

    expect(status).toEqual(0);
    expect(fs.existsSync(APP_PATH)).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'android'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'ios'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'jest'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'src'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'scripts'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'web'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'windows'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, '.eslintrc'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'babel.config.js'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'index.js'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'package.json'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'README.md'))).toBeTruthy();
  });

  it('checks TypeScript project structure', () => {
    const { status } = spawnSync('node', [CREATE_RX_APP, APP_NAME, '--skip-install']);

    expect(status).toEqual(0);
    expect(fs.existsSync(APP_PATH)).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'tsconfig.json'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'src', 'App.spec.tsx'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'src', 'App.tsx'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'src', 'config.ts'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'src', 'index.tsx'))).toBeTruthy();
  });

  it('checks JavaScript project structure', () => {
    const { status } = spawnSync('node', [CREATE_RX_APP, APP_NAME, '--skip-install', '--javascript']);

    expect(status).toEqual(0);
    expect(fs.existsSync(APP_PATH)).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'src', 'App.spec.js'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'src', 'App.js'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'src', 'config.js'))).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'src', 'index.js'))).toBeTruthy();
  });

  it('checks creating project without Jest', () => {
    const { status } = spawnSync('node', [CREATE_RX_APP, APP_NAME, '--skip-install', '--skip-jest']);

    expect(status).toEqual(0);
    expect(fs.existsSync(APP_PATH)).toBeTruthy();
    expect(fs.existsSync(path.join(APP_PATH, 'jest'))).toBeFalsy();

    const packageJson = JSON.parse(fs.readFileSync(path.join(APP_PATH, 'package.json')) as any);

    expect(packageJson.scripts.test).toBeUndefined();
    expect(packageJson.scripts['test:watch']).toBeUndefined();
    expect(packageJson.scripts['test:debug']).toBeUndefined();
    expect(packageJson.devDependencies['babel-core']).toBeUndefined();
    expect(packageJson.devDependencies['babel-jest']).toBeUndefined();
    expect(packageJson.devDependencies['jest']).toBeUndefined();
    expect(packageJson.devDependencies['enzyme']).toBeUndefined();
    expect(packageJson.devDependencies['enzyme-adapter-react-16']).toBeUndefined();
    expect(packageJson.devDependencies['enzyme-to-json']).toBeUndefined();
  });

  it('checks TypeScript template without Jest', () => {
    const { status } = spawnSync('node', [CREATE_RX_APP, APP_NAME, '--skip-install', '--skip-jest']);

    expect(status).toEqual(0);
    expect(fs.existsSync(path.join(APP_PATH, 'src', 'App.spec.tsx'))).toBeFalsy();

    const packageJson = JSON.parse(fs.readFileSync(path.join(APP_PATH, 'package.json')) as any);
    expect(packageJson.devDependencies['@types/enzyme']).toBeUndefined();
    expect(packageJson.devDependencies['@types/jest']).toBeUndefined();
  });

  it('checks JavaScript template without Jest', () => {
    const { status } = spawnSync('node', [CREATE_RX_APP, APP_NAME, '--skip-install', '--skip-jest', '--javascript']);

    expect(status).toEqual(0);
    expect(fs.existsSync(path.join(APP_PATH, 'src', 'App.spec.js'))).toBeFalsy();
  });

  it('checks stdout for invalid project names', () => {
    expect(
      spawnSync('node', [CREATE_RX_APP, 'React', '--skip-install']).stdout.toString().trim()
    ).toEqual('Project name - React is not valid.');

    expect(
      spawnSync('node', [CREATE_RX_APP, 'react', '--skip-install']).stdout.toString().trim()
    ).toEqual('Project name - react is not valid.');

    expect(
      spawnSync('node', [CREATE_RX_APP, '../test/', '--skip-install']).stdout.toString().trim()
    ).toEqual('Project name - ../test/ is not valid.');

    expect(
      spawnSync('node', [CREATE_RX_APP, '.appname', '--skip-install']).stdout.toString().trim()
    ).toEqual('Project name - .appname is not valid.');
  });

});

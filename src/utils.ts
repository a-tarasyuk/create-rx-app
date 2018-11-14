import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { Dictionary } from './types';

export const isValidProjectName = (projectName: string): boolean => (
  /^[$A-Z_][0-9A-Z_$]*$/i.test(projectName) && projectName.toLowerCase() !== 'react'
);

export const yarnExists = (): boolean => {
  try {
    execSync('yarn --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

export const sortKeys = (obj: Dictionary): Dictionary => (
  Object.keys(obj)
    .sort((a: string, b: string) => a.localeCompare(b))
    .reduce((res: Dictionary, key: string) => ({ ...res, [key]: obj[key] }), { })
);

export const getVersion = (): string => (
  JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), { encoding: 'utf8' })).version
);

import { spawnSync } from 'child_process';
import { Dictionary } from './types';

export const isValidProjectName = (projectName: string): boolean => (
  /^[$A-Z_][0-9A-Z_$]*$/i.test(projectName) && projectName.toLowerCase() !== 'react'
);

export const yarnExists = (): boolean => spawnSync('yarn', ['-v']).status === 0;

export const sortKeys = (obj: Dictionary): Dictionary => (
  Object.keys(obj)
    .sort((a: string, b: string) => a.localeCompare(b))
    .reduce((res: Dictionary, key: string) => ({ ...res, [key]: obj[key] }), { })
);

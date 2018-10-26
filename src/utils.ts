import { spawnSync } from 'child_process';

export const isValidProjectName = (projectName: string): boolean => (
  /^[$A-Z_][0-9A-Z_$]*$/i.test(projectName) && projectName.toLowerCase() !== 'react'
);

export const yarnExists = (): boolean => spawnSync('yarn', ['-v']).status === 0;

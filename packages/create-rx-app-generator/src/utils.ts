import { Dictionary } from './types';

export const sortKeys = (obj: Dictionary): Dictionary => (
  Object.keys(obj)
    .sort((a: string, b: string) => a.localeCompare(b))
    .reduce((res: Dictionary, key: string) => ({ ...res, [key]: obj[key] }), { })
);


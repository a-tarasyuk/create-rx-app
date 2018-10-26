export interface Dictionary {
  [name: string]: any;
}

export interface Options {
  javascript: boolean;
  skipInstall: boolean;
  skipJest: boolean;
  yarn: boolean;
}

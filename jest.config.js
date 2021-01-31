module.exports = {
  preset: 'ts-jest',

  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],

  moduleFileExtensions: [
    'ts', 'tsx', 'js', 'json', 'node',
  ],

  moduleDirectories: ['node_modules']
};

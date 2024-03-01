// In your Mocha configuration file or package.json script
module.exports = {
  spec: './tests/**/*.ts', // Path to your TypeScript test files
  timeout: 5000000, // Set test timeout
  ui: 'bdd', // The interface to use
  require: [
    'ts-node/register', // Transpile TypeScript on the fly
    'tsconfig-paths/register', // Use tsconfig paths for module resolution
    './mocha-setup.js' // Your Mocha setup file
  ],
};

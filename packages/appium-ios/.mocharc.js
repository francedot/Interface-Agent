module.exports = {
  spec: './tests/**/*.ts', // Path to your TypeScript test files
  timeout: 60000, // Set test timeout, especially useful for async tests
  ui: 'bdd', // The interface to use (BDD is the default and most common for WebDriverIO tests)
  require: ['ts-node/register'], // Use ts-node to transpile TypeScript tests on the fly
};

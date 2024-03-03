exports.config = {
    framework: 'mocha',
    mochaOpts: {
      ui: 'bdd',
      timeout: 60000 // Increase timeout for WebDriverIO tests
    },
  };
  
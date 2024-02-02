/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest/presets/default-esm",
    modulePathIgnorePatterns: ["dist/", "docs/"],
    moduleNameMapper: {
      "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transform: {
      '^.+\\.tsx?$': 'ts-jest'
    },
    transformIgnorePatterns: [
      "/node_modules/",
      "\\.pnp\\.[^\\/]+$"
    ],
    setupFiles: ['./jest.setup.js'],
    testTimeout: 1200_000,
};
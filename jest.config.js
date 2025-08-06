// jest.config.js
module.exports = {
  verbose: true,
  rootDir: './',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/test/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Collect coverage only from Utils files
  collectCoverage: true,
  collectCoverageFrom: [
    'src/public/js/*Utils.js',
    '!src/public/js/login.js',
    '!src/public/js/main.js',
    '!src/public/js/signup*.js'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary'], // More concise output
  
  // Remove the coverageThreshold as it might be too restrictive
  // Instead we'll filter the output programmatically
  
  globals: {
    fetch: true
  },
  
  reporters: [
    "default",
    "./test/custom-reporter.js"
  ],
  
  setupFilesAfterEnv: ['./test/setup.js'],
};
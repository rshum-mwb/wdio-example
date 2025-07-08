import { initializeCliArgs } from './test/utils/cliArgs.js';
import { closeAndEraseAllSimulators } from './test/utils/xcrun.js';
import getCapabilities from './test/utils/capabilities.js';
import { getConfig } from './env.config.js';
import { AllureTestReporter } from './test/utils/allureTestReporter.js';

const logsDir = './results/logs';
const allureResultsDir = './results/allure-results';
const { selectedSimulators, selectedRealDevices } = initializeCliArgs();

const testSuites = {
  //debug
  debug: ['./test/specs/debug/test.debugBuild.js'],
};

const exclude = ['./test/specs/exclude/**/*.js'];

export const config = {
  runner: 'local',
  port: 4723,

  suites: testSuites,

  exclude: exclude,

  maxInstances: 1,

  capabilities: getCapabilities(selectedSimulators, selectedRealDevices),

  logLevel: 'debug',

  outputDir: logsDir,

  bail: 0,

  specFileRetries: 0,

  groupLogsByTestSpec: true,

  waitforTimeout: 10000,
  connectionRetryTimeout: 180000,
  connectionRetryCount: 3,

  services: ['appium'],

  appium: {
    command: 'appium',
    args: {},
  },

  framework: 'mocha',

  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: allureResultsDir,
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false,
      },
    ],
  ],

  onPrepare: async () => {
    AllureTestReporter.ensureResultsDirectoryExists();
  },

  beforeTest: async (test, context) => {},

  afterSession: async () => {
    if (getConfig().isSimulator) {
      await closeAndEraseAllSimulators();
    }
  },

  mochaOpts: {
    ui: 'bdd',
    timeout: 30000000,
  },
};

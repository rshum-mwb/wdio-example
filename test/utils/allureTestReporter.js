import fs from 'fs';
import path from 'path';
import allure from '@wdio/allure-reporter';
import { getConfig } from '../../env.config.js';
import { FileUtils } from '../../utils/fileUtils.js';
import { execSync } from 'child_process';

export class AllureTestReporter {
  static addTestInfo(tags, severity, testId) {
    tags.forEach((tag) => allure.addTag(tag));
    allure.addSeverity(severity);
    if (testId) {
      allure.addTestId(testId);
    }
  }

  static async addTestStep(stepName, stepFunction) {
    return await allure.step(stepName, async () => {
      return await stepFunction();
    });
  }

  static addDeviceInfo() {
    const config = getConfig();
    allure.addArgument('iOS Version', `iOS ${browser.capabilities.platformVersion}`);
    allure.addArgument('Device Type', config.isSimulator ? 'Simulator' : 'Real Device');

    if (!config.isSimulator) {
      const build = `${config.appVersion}(${config.buildRun}) ${config.artifactType} [${config.environment.toUpperCase()}]`;
      allure.addArgument('Build', build);
    }
  }

  static cleanResultsDirectory() {
    const { resultsDir, archiveDir } = this.getResultsPaths();

    if (fs.existsSync(resultsDir)) {
      console.log('🗑️ Cleaning previous test results...');
      fs.rmSync(resultsDir, { recursive: true, force: true });
    }

    if (fs.existsSync(archiveDir)) {
      console.log('🗑️ Cleaning previous results archive...');
      fs.rmSync(archiveDir, { recursive: true, force: true });
    }

    console.log('✅ Results directories cleaned!');
  }

  static ensureResultsDirectoryExists() {
    const { resultsDir, logsDir, allureResultsDir, archiveDir } = this.getResultsPaths();

    console.log('📂 Ensuring result directories exist...');
    fs.mkdirSync(resultsDir, { recursive: true });
    fs.mkdirSync(logsDir, { recursive: true });
    fs.mkdirSync(allureResultsDir, { recursive: true });
    fs.mkdirSync(archiveDir, { recursive: true });

    console.log('✅ Results directories ready!');
  }

  static async generateAndArchiveReport() {
    const resultsDir = './results';
    const resultsArchiveDir = './results-archive';
    const allureResultsDir = path.join(resultsDir, 'allure-results');
    const allureReportDir = path.join(resultsDir, 'allure-report');

    try {
      console.log('✅ Generating Allure report...');

      execSync(`allure generate ${allureResultsDir} -o ${allureReportDir} --clean --single-file`, {
        stdio: 'inherit',
      });

      console.log('✅ Allure report generated successfully!');
    } catch (error) {
      console.error('❌ Failed to generate Allure report:', error.message);
      return; // Exit early if generation fails
    }

    try {
      console.log('✅ Archiving results...');

      FileUtils.ensureDirectoryExists(resultsDir);
      FileUtils.ensureDirectoryExists(resultsArchiveDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveDir = path.join(resultsArchiveDir, timestamp);

      await FileUtils.copyDirectory(resultsDir, archiveDir);

      console.log(`✅ Results archived successfully to: ${archiveDir}`);
    } catch (error) {
      console.error('❌ Failed to archive test results:', error.message);
    }
  }
}

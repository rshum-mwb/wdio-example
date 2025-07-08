import dotenv from 'dotenv';
import { join } from 'path';
import { parseArgs, getWorkflow, getArtifactType, getEnvironment, getBuildRun } from './test/utils/cliArgs.js';

let cachedConfig = null;

const environment = (() => {
  dotenv.config();

  const env = process.env.TARGET_ENV || 'stage';

  dotenv.config({ path: join(process.cwd(), `.env.${env}`) });

  return env;
})();

export function getConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  const cliArgs = parseArgs();

  const baseConfig = {
    isSimulator: (process.env.IS_SIMULATOR || '').trim().toLowerCase() === 'true',
    environment: process.env.TARGET_ENV || getEnvironment(cliArgs),
    workflow: getWorkflow(cliArgs),
    buildRun: getBuildRun(cliArgs),
    artifactType: getArtifactType(cliArgs),
    wdaPath: `${process.env.WDA_PATH || './wda'}`,
    debugBuildPath: process.env.DEBUG_BUILD_PATH,
    // Xcode Org ID
    xcodeOrgId: process.env.XCODE_ORG_ID,
    // MyAccount credentials
    maStandardEmail: process.env.MA_STANDARD_EMAIL,
    maStandardPassword: process.env.MA_STANDARD_PASSWORD,
    maPlusEmail: process.env.MA_PLUS_EMAIL,
    maPlusPassword: process.env.MA_PLUS_PASSWORD,
    maTotalEmail: process.env.MA_TOTAL_EMAIL,
    maTotalPassword: process.env.MA_TOTAL_PASSWORD,
    maAdvancedEmail: process.env.MA_ADVANCED_EMAIL,
    maAdvancedPassword: process.env.MA_ADVANCED_PASSWORD,
  };

  let additionalConfig = {};

  if (environment !== 'prod') {
    additionalConfig = {
      firebaseAdminSdkJsonBase64: process.env.FIREBASE_ADMIN_SDK_JSON_BASE64,
      mailosaurApiKey: process.env.MAILOSAUR_API_KEY,
      mailosaurServerId: process.env.MAILOSAUR_SERVER_ID,
      amplitudeApiKey: process.env.AMPLITUDE_API_KEY,
      amplitudeApiSecret: process.env.AMPLITUDE_API_SECRET,
    };
  }

  const finalConfig = { ...baseConfig, ...additionalConfig };
  console.log(`[INFO] workflow: ${finalConfig.workflow}`);
  if (finalConfig.workflow === 'Debug') {
    console.log(`[INFO] Debug Build Path: ${finalConfig.debugBuildPath}`);
  }

  cachedConfig = finalConfig;

  return finalConfig;
}

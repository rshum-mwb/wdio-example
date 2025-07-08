import fs from 'fs';
import path from 'path';

const ARTIFACTS_ROOT = process.env.ARTIFACTS_ROOT || './artifacts';

export function parseArgs() {
  const args = process.argv.slice(2);
  const parsedArgs = {};
  args.forEach((arg) => {
    if (arg.includes('=')) {
      const [key, value] = arg.split('=');
      const cleanKey = key.replace('--', '');
      // Handle quoted values by removing quotes
      const cleanValue = value ? value.replace(/^['"](.*)['"]$/, '$1') : '';

      // Check if value contains commas to determine if it should be an array
      if (cleanValue && cleanValue.includes(',')) {
        parsedArgs[cleanKey] = cleanValue.split(',').map((v) => v.trim());
      } else {
        // Store as is, without splitting
        parsedArgs[cleanKey] = cleanValue;
      }
    }
  });
  return parsedArgs;
}

export function getSelectedSimulators(cliArgs) {
  // Convert to array if it's a string
  const simValue = cliArgs.sim || [];
  const selectedSimulators = Array.isArray(simValue) ? simValue : [simValue];
  return selectedSimulators.map((sim) => {
    // Check if the simulator has iOS version specified (format: deviceName:iOSVersion)
    if (sim.includes(':')) {
      const [deviceName, platformVersion] = sim.split(':');
      return { deviceName, platformVersion };
    }
    // If no version specified, just return the device name
    return { deviceName: sim };
  });
}

export function getSelectedRealDevices(cliArgs) {
  // Convert to array if it's a string
  const realValue = cliArgs.real || [];
  const selectedDevices = Array.isArray(realValue) ? realValue : [realValue];
  return selectedDevices.map((device) => {
    // Check if the device has iOS version specified (format: deviceName:iOSVersion)
    if (device.includes(':')) {
      const [deviceName, platformVersion] = device.split(':');
      return { deviceName, platformVersion };
    }
    // If no version specified, just return the device name
    return { deviceName: device };
  });
}

export function getEnvironment(cliArgs) {
  return cliArgs.env || 'stage';
}

export function getBuildRun(cliArgs) {
  return cliArgs.buildRun || 'latest';
}

export function getWorkflow(cliArgs) {
  const workflow = cliArgs.workflow || 'Continuous Delivery';
  // We don't sanitize here because this is just the base workflow name without the environment
  return workflow;
}

export function getArtifactType(cliArgs) {
  return cliArgs.artifactType || 'ad-hoc';
}

export function getArtifactPath(workflow, env, buildRun, artifactType, appName) {
  const workflowName = `${workflow} [${env}]`;
  const sanitizedWorkflowName = 'Release Candidates'
  const resolvedPath = path.resolve(ARTIFACTS_ROOT, sanitizedWorkflowName, buildRun, artifactType, appName);
  return resolvedPath;
}

export function initializeCliArgs() {
  const cliArgs = parseArgs();
  process.env.TARGET_ENV = getEnvironment(cliArgs);
  const selectedSimulators = getSelectedSimulators(cliArgs);
  const selectedRealDevices = getSelectedRealDevices(cliArgs);

  if (selectedSimulators.length === 0 && selectedRealDevices.length === 0) {
    console.error('[ERROR] No devices specified. Exiting.');
    process.exit(1);
  }

  process.env.IS_SIMULATOR = selectedSimulators.length > 0 ? 'true' : 'false';
  process.env.BUILD_RUN = getBuildRun(cliArgs);
  process.env.WORKFLOW = getWorkflow(cliArgs);
  process.env.ARTIFACT_TYPE = getArtifactType(cliArgs);

  return { ...cliArgs, selectedSimulators, selectedRealDevices };
}

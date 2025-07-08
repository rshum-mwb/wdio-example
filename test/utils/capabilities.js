import realDevices from './realDevices.js';
import simulators from './simulators.js';
import { getConfig } from '../../env.config.js';

function getCapabilities(selectedSimulators, selectedRealDevices) {
  const capabilities = [];

  function generateCapabilities(devices, isRealDevice) {
    if (!Array.isArray(devices)) {
      throw new TypeError('devices should be an array');
    }

    devices.forEach((device) => {
      const selectedDevices = isRealDevice ? selectedRealDevices : selectedSimulators;
      let isSelectedDevice = false;
      let matchedSelection = null;

      for (const selected of selectedDevices) {
        // Case 1: Both device name and platform version are specified and match
        if (
          selected.platformVersion &&
          selected.deviceName === device.deviceName &&
          selected.platformVersion === device.platformVersion
        ) {
          isSelectedDevice = true;
          matchedSelection = selected;
          break;
        }

        // Case 2: Only device name is specified and matches
        if (!selected.platformVersion && selected.deviceName === device.deviceName) {
          isSelectedDevice = true;
          matchedSelection = selected;
          break;
        }

        // Case 3: For real devices, try more precise name matching to avoid partial matches
        if (isRealDevice && device.deviceName && selected.deviceName) {
          // Use exact match or model-specific matching
          // Avoid substrings that could cause incorrect matches (like iPhone X matching iPhone XS MAX)
          const deviceNameLower = device.deviceName.toLowerCase();
          const selectedNameLower = selected.deviceName.toLowerCase();

          // Only match if device names are exactly equal or if both have specific model identifiers
          const exactMatch = deviceNameLower === selectedNameLower;

          // For model-specific matches, ensure we're matching full model names
          // by checking for word boundaries or specific delimiters
          const modelMatch =
            deviceNameLower.includes(' ' + selectedNameLower + ' ') ||
            deviceNameLower.includes(' ' + selectedNameLower) ||
            deviceNameLower.includes(selectedNameLower + ' ');

          if (
            (exactMatch || modelMatch) &&
            (!selected.platformVersion || selected.platformVersion === device.platformVersion)
          ) {
            isSelectedDevice = true;
            matchedSelection = selected;
            break;
          }
        }
      }

      if (isSelectedDevice) {
        console.log(
          `[DEBUG] Matched device: ${device.deviceName} (${device.platformVersion}) with selection:`,
          matchedSelection,
        );

        let baseCapability = {
          platformName: 'iOS',
          'appium:deviceName': device.deviceName,
          'appium:platformVersion': device.platformVersion,
          'appium:automationName': 'XCUITest',
          'appium:useNewWDA': false,
          'appium:usePreinstalledWDA': true,
          'appium:wdaLaunchTimeout': 60000,
          'appium:wdaConnectionTimeout': 240000,
          'appium:wdaLocalPort': device.port,
          'appium:includeSafariInWebviews': true,
        };

        if (getConfig().environment === 'prod') {
          baseCapability = {
            ...baseCapability,
            'appium:settings': {
              'appium:autoDismissAlerts': true,
            },
          };
        } else if (getConfig().environment === 'stage') {
          baseCapability = {
            ...baseCapability,
            'appium:settings': {
              'appium:respectSystemAlerts': true,
            },
          };
        }

        if (isRealDevice && device.udid) {
          baseCapability = {
            ...baseCapability,
            'appium:prebuiltWDAPath': `${getConfig().wdaPath}/real-device/WebDriverAgentRunner-Runner.app`,
            'appium:xcodeOrgId': getConfig().xcodeOrgId,
            'appium:xcodeSigningId': 'Apple Developer',
            'appium:fullReset': false,
            'appium:udid': device.udid,
          };
        } else {
          baseCapability = {
            ...baseCapability,
            'appium:prebuiltWDAPath': `${getConfig().wdaPath}/simulator/WebDriverAgentRunner-Runner.app`,
            'appium:fullReset': true,
            'appium:forceSimulatorSoftwareKeyboardPresence': true,
          };
        }

        capabilities.push(baseCapability);
      }
    });
  }

  if (selectedSimulators.length > 0) {
    generateCapabilities(simulators, false);
  }

  if (selectedRealDevices.length > 0) {
    const filteredRealDevices = realDevices.realDevices;

    console.log(
      '[INFO] Selected real devices:',
      selectedRealDevices.map((d) =>
        JSON.stringify({
          deviceName: d.deviceName,
          platformVersion: d.platformVersion,
        }),
      ),
    );

    generateCapabilities(filteredRealDevices, true);
  }

  // Log devices that couldn't be found
  if (capabilities.length === 0) {
    console.error('[ERROR] No matching devices found for the specified device names and iOS versions.');
    process.exit(1);
  } else if (capabilities.length < selectedSimulators.length + selectedRealDevices.length) {
    const foundDeviceNames = capabilities.map(
      (cap) => `${cap['appium:deviceName']} (iOS ${cap['appium:platformVersion']})`,
    );
    const requestedSimulators = selectedSimulators.map((sim) =>
      sim.platformVersion ? `${sim.deviceName} (iOS ${sim.platformVersion})` : sim.deviceName,
    );
    const requestedRealDevices = selectedRealDevices.map((device) =>
      device.platformVersion ? `${device.deviceName} (iOS ${device.platformVersion})` : device.deviceName,
    );

    const allRequested = [...requestedSimulators, ...requestedRealDevices];
    const notFound = allRequested.filter(
      (requested) => !foundDeviceNames.some((found) => found.includes(requested.split(' (')[0])),
    );

    console.warn('[WARNING] Some requested devices were not found:');
    notFound.forEach((device) => console.warn(`- ${device}`));
  }

  return capabilities;
}

export default getCapabilities;

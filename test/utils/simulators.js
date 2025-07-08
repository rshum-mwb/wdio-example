import { execSync } from 'child_process';

function getSimulators(portStart = 8100) {
  try {
    const simctlJson = execSync('xcrun simctl list devices -j', { encoding: 'utf8' });
    const parsed = JSON.parse(simctlJson);

    const simulators = [];
    let port = portStart;

    for (const runtime in parsed.devices) {
      if (!runtime.includes('iOS')) continue; // only iOS simulators

      const platformVersion = runtime.match(/iOS-(\d+-\d+)/)?.[1]?.replace('-', '.');
      if (!platformVersion) continue;

      parsed.devices[runtime].forEach((device) => {
        if (device.isAvailable) {
          simulators.push({
            deviceName: device.name,
            platformVersion,
            port: port++,
            udid: device.udid,
          });
        }
      });
    }

    return simulators;
  } catch (error) {
    console.error('❌ Error fetching simulators:', error.message);
    return [];
  }
}

const simulators = getSimulators();

export default simulators;

import dotenv from 'dotenv';
dotenv.config();

const sharedAccounts = {
  GENERAL: {
    ALIAS: 'General',
    EMAIL: process.env.SANDBOX_GENERAL_EMAIL,
    PASSWORD: process.env.SANDBOX_GENERAL_PASSWORD,
  },
  FRESH: {
    ALIAS: 'Fresh',
    EMAIL: process.env.SANDBOX_FRESH_EMAIL,
    PASSWORD: process.env.SANDBOX_FRESH_PASSWORD,
  },
};

const realDevices = [];

for (let index = 0; index < 10; index++) {
  // Check if a device name exists for this index
  if (!process.env[`DEVICE_${index}_NAME`]) {
    // Skip to next iteration if undefined
    continue;
  }

  realDevices.push({
    deviceName: process.env[`DEVICE_${index}_NAME`],
    platformVersion: process.env[`DEVICE_${index}_VERSION`],
    udid: process.env[`DEVICE_${index}_UDID`],
    port: 8100 + index, // Each device gets a unique port
    sandboxAccounts: {
      STANDARD: {
        ALIAS: 'Standard',
        EMAIL: process.env[`DEVICE_${index}_SANDBOX_STANDARD_EMAIL`],
        PASSWORD: process.env[`DEVICE_${index}_SANDBOX_STANDARD_PASSWORD`],
      },
      PLUS: {
        ALIAS: 'Plus',
        EMAIL: process.env[`DEVICE_${index}_SANDBOX_PLUS_EMAIL`],
        PASSWORD: process.env[`DEVICE_${index}_SANDBOX_PLUS_PASSWORD`],
      },
    },
  });
}

export const getSandboxAccounts = async () => {
  const deviceName = await browser.capabilities.deviceName;
  const device = realDevices.find((d) => d.deviceName === deviceName);
  return device ? { ...device.sandboxAccounts, ...sharedAccounts } : sharedAccounts;
};

export default { realDevices, getSandboxAccounts };

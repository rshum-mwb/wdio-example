import { exec } from 'child_process';

export const shutdownAllSimulators = async () => {
  return new Promise((resolve, reject) => {
    exec('xcrun simctl shutdown all', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error shutting down simulators: ${stderr}`);
        return reject(error);
      }
      // console.log('Simulators shut down successfully:', stdout);
      resolve();
    });
  });
};

export const eraseAllSimulators = async () => {
  return new Promise((resolve, reject) => {
    exec('xcrun simctl erase all', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error erasing simulators: ${stderr}`);
        return reject(error);
      }
      // console.log('Simulators erased successfully:', stdout);
      resolve();
    });
  });
};

export const closeAndEraseAllSimulators = async () => {
  try {
    await shutdownAllSimulators();
    await eraseAllSimulators();
    // console.log('All simulators have been shut down and erased.');
  } catch (error) {
    console.error('An error occurred during the process:', error);
  }
};

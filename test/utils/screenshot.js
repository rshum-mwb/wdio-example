import { join } from 'path';
import fs from 'fs';

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-');
}

export async function takeScreenshot(context) {
  const screenshotsDir = join(process.cwd(), 'results', 'screenshots');

  await fs.promises.mkdir(screenshotsDir, { recursive: true }).catch((err) => {
    console.error(`Failed to create screenshots directory: ${err.message}`);
  });

  const timestamp = getTimestamp();

  const describeText = context?.test?.title
    ? context.test.title.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_')
    : 'unknown_test';

  const screenshotPath = join(screenshotsDir, `${describeText}-${timestamp}.png`);

  try {
    await browser.saveScreenshot(screenshotPath);
  } catch (err) {
    console.error('Failed to take screenshot:', err.message);
  }
}

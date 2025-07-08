import allure from '@wdio/allure-reporter';

export async function startScreenRecording() {
  await browser.startRecordingScreen({ videoType: 'libx264', videoQuality: 'low', timeLimit: 600 });
}

export async function stopScreenRecording(test, context, hasError = false) {
  try {
    const videoBase64 = await browser.stopRecordingScreen();

    if (hasError && videoBase64) {
      allure.addAttachment('Screen Recording', Buffer.from(videoBase64, 'base64'), 'video/mp4');
      console.log('Video attached to Allure report');
    }
  } catch (error) {
    console.error('Error while stopping screen recording:', error.message);
  }
}

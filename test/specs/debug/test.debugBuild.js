import { AllureTestReporter } from '../../utils/allureTestReporter.js'
import applePreferencesPage from '../../pageobjects/apple/apple.preferences.page.js';

describe('Debug', () => {
  it('Open Apple Preferences App', async () => {
    await AllureTestReporter.addTestStep('Verify UI', async () => {
      const isMobile = await browser.isMobile;
      console.log(`Is mobile: ${isMobile} (type: ${typeof isMobile})`);
      if (typeof isMobile !== 'boolean') {
        throw new Error('isMobile is not a boolean');
      }
      const isNativeContext = await browser.isNativeContext;
      console.log(`Is native context: ${isNativeContext} (type: ${typeof isNativeContext})`);
      await applePreferencesPage.launchApp();
      await applePreferencesPage.waitForPageDisplay();
      const isDisplayed = await applePreferencesPage.isPageDisplayed();
      expect(isDisplayed).toBe(true);
    });
  });
});

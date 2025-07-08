import { AllureTestReporter } from '../../utils/allureTestReporter.js'
import applePreferencesPage from '../../pageobjects/apple/apple.preferences.page.js';

describe('Debug', () => {
  it('Open Apple Preferences App', async () => {
    await AllureTestReporter.addTestStep('Verify UI', async () => {
      await applePreferencesPage.launchApp();
      await applePreferencesPage.waitForPageDisplay();
      const isDisplayed = await applePreferencesPage.isPageDisplayed();
      expect(isDisplayed).toBe(true);
    });
  });
});

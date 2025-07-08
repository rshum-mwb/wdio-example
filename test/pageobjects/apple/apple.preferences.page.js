import BaseIOSPage from '../base/base.ios.page.js';
import { getSandboxAccounts } from '../../utils/realDevices.js';

class PreferencesPage extends BaseIOSPage {
  constructor() {
    super();
    this.bundleId = 'com.apple.Preferences';
  }

  get navigationBarTitle() {
    return $('-ios predicate string:name == "Settings" AND type == "XCUIElementTypeNavigationBar"');
  }

  async launchApp() {
    await super.launchApp(this.bundleId);
  }
  async terminateApp() {
    await super.terminateApp(this.bundleId);
  }

  async isPageDisplayed() {
    return await this.isElementDisplayed(this.navigationBarTitle);
  }

  async waitForPageDisplay(timeout = 10000) {
    return await this.navigationBarTitle.waitForDisplayed({
      timeout: timeout,
    });
  }

}

export default new PreferencesPage();

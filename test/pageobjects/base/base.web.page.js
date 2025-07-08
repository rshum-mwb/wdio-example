export default class WebBasePage {
  open(path) {
    browser.url(path);
  }

  getTitle() {
    return browser.getTitle();
  }

  async isElementDisplayed(element) {
    const isDisplayed = await element.isDisplayed();
    return Boolean(isDisplayed);
  }

  async getElementText(element) {
    await element.waitForDisplayed({ timeout: 5000 });
    const text = await element.getText();
    return Array.isArray(text) ? text[0] : text;
  }
}

import { getConfig } from '../../../env.config.js';

export default class BaseIosPage {
  async installApp(appPath) {
    try {
      await browser.execute('mobile: installApp', { app: appPath });
    } catch (error) {
      console.error(`Failed to install app from path: ${appPath}. Error: ${error.message}`);
    }
  }

  async uninstallApp(bundleId) {
    try {
      await browser.execute('mobile: removeApp', { bundleId: bundleId });
    } catch (error) {
      console.error(`Failed to uninstall app with bundle ID: ${bundleId}. Error: ${error.message}`);
    }
  }

  async isAppInstalled(bundleId) {
    const isInstalled = await browser.execute('mobile: isAppInstalled', {
      bundleId,
    });
    return Boolean(isInstalled);
  }
  async isAppUninstalled(packageName) {
    return !this.getInstalledApps().includes(packageName);
  }

  async launchApp(bundleId, processArgs = [], environmentVars = {}) {
    const params = {};
    if (bundleId) params.bundleId = bundleId;
    if (processArgs && processArgs.length > 0) params.arguments = processArgs;
    if (environmentVars && Object.keys(environmentVars).length > 0) params.environment = environmentVars;
    await browser.execute('mobile: launchApp', params);
  }

  async terminateApp(bundleId) {
    await browser.execute('mobile: terminateApp', { bundleId });
  }

  async queryAppState(bundleId) {
    const appState = await browser.execute('mobile: queryAppState', { bundleId });
    return appState;
  }

  async switchContextToWebView() {
    const currentContext = await browser.getContext();
    if (!currentContext.includes('WEBVIEW')) {
      const contexts = await browser.getContexts();
      for (const context of contexts) {
        if (context.includes('WEBVIEW')) {
          await browser.switchContext(context);
          await this.waitUntilContextIsWebView();
          break;
        }
      }
    }
  }

  async switchContextToNativeApp() {
    const currentContext = await browser.getContext();
    if (currentContext !== 'NATIVE_APP') {
      await browser.switchContext('NATIVE_APP');
      await this.waitUntilContextIsNativeApp();
    }
  }

  async clearFilledValue(element, maxAttempts = 10) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await element.clearValue();
      const value = await element.getValue();
      if (!value) {
        return;
      }
    }
    throw new Error('Failed to clear the value after maximum attempts');
  }

  async waitUntilContextIsWebView() {
    await browser.waitUntil(
      async () => {
        const currentContext = await browser.getContext();
        return currentContext.includes('WEBVIEW');
      },
      { timeout: 5000, timeoutMsg: 'Failed to switch to the WebView context' },
    );
  }

  async waitUntilContextIsNativeApp() {
    await browser.waitUntil(
      async () => {
        const currentContext = await browser.getContext();
        return currentContext.includes('NATIVE_APP');
      },
      { timeout: 5000, timeoutMsg: 'Failed to switch to the Native App context' },
    );
  }

  async isIOSVersionAtLeast(requiredVersion) {
    const platformVersion = await browser.capabilities.platformVersion;
    return parseFloat(platformVersion) >= requiredVersion;
  }

  async waitForAttributeToBe(element, attribute, value, timeout = 5000) {
    await element.waitUntil(
      async () => {
        const attr = await element.getAttribute(attribute);
        return attr === value;
      },
      { timeout, timeoutMsg: `Element attribute ${attribute} is not set to ${value}` },
    );
  }

  async isElementDisplayed(element) {
    const isDisplayed = await element.isDisplayed();

    if (Array.isArray(isDisplayed)) {
      return Boolean(isDisplayed[0]);
    }

    return Boolean(isDisplayed);
  }

  async isElementEnabled(element) {
    const isEnabled = await element.isEnabled();

    if (Array.isArray(isEnabled)) {
      return Boolean(isEnabled[0]);
    }

    return Boolean(isEnabled);
  }

  async getElementText(element) {
    const text = await element.getText();
    return Array.isArray(text) ? text[0] : text;
  }

  async getElementAttribute(element, attribute) {
    const result = await element.getAttribute(attribute);
    return Array.isArray(result) ? result[0] : result;
  }

  async swipe(direction = 'up', duration = 1500) {
    await browser.execute('mobile: swipe', { direction: direction, duration: duration });
  }

  async swipeUp(duration = 1500) {
    await browser.execute('mobile: swipe', { direction: 'up', duration: duration });
  }

  async swipeDown(duration = 1500) {
    await browser.execute('mobile: swipe', { direction: 'down', duration: duration });
  }

  async swipeLeft(duration = 1500) {
    await browser.execute('mobile: swipe', { direction: 'left', duration: duration });
  }

  async swipeRight(duration = 1500) {
    await browser.execute('mobile: swipe', { direction: 'right', duration: duration });
  }

  async swipeToElement(element, direction = 'up', duration = 3000, maxSwipes = 30) {
    for (let i = 0; i < maxSwipes; i++) {
      if ((await element.isDisplayed()) && (await this.isElementInViewport(element))) {
        await browser.pause(1000);
        return;
      } else {
        await this.swipe(direction, duration);
        await browser.pause(1000);
      }
    }
    throw new Error(`Element not found after ${maxSwipes} swipes`);
  }

  async isElementInViewport(element) {
    const { y } = await this.getElementPosition(element);
    const { height } = await this.getWindowSize();
    return y > 50 && y < height - 50;
  }

  async adjustSwipe(element) {
    const { y } = await this.getElementPosition(element);
    const { height } = await this.getWindowSize();

    if (y <= 50) {
      await this.swipeDown(3000);
    } else if (y >= height - 50) {
      await this.swipeUp(3000);
    }
  }

  async getWindowSize() {
    const windowSize = await browser.getWindowSize();
    let width, height;
    if (Array.isArray(windowSize)) {
      [width, height] = windowSize;
    } else if (windowSize && typeof windowSize === 'object') {
      width = windowSize.width;
      height = windowSize.height;
    } else {
      throw new Error('Invalid window size');
    }

    if (isNaN(width) || isNaN(height)) {
      // Default fallback
      width = 300;
      height = 600;
    }
    return { width, height };
  }

  async getElementSize(element) {
    const size = await element.getSize();
    let width, height;
    if (Array.isArray(size)) {
      [width, height] = size;
    } else if (size && typeof size === 'object') {
      width = size.width;
      height = size.height;
    }
    return { width, height };
  }

  async getElementPosition(element) {
    const location = await element.getLocation();
    let x, y;
    if (Array.isArray(location)) {
      [x, y] = location;
    } else if (location && typeof location === 'object') {
      x = location.x;
      y = location.y;
    }
    return { x, y };
  }

  async performSwipe(startX, startY, endX, duration = 1500) {
    await browser.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: startX, y: startY },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 100 },
          { type: 'pointerMove', duration: duration, x: endX, y: startY },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ]);
  }

  async performSwipeOnElement(element, direction = 'left', duration = 1500) {
    const { x, y } = await this.getElementPosition(element);
    const { width, height } = await this.getElementSize(element);
    let startX, startY, endX, endY;

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    switch (direction) {
      case 'up':
        startX = centerX;
        startY = y + height - 1;
        endX = centerX;
        endY = y + 1;
        break;
      case 'down':
        startX = centerX;
        startY = y + 1;
        endX = centerX;
        endY = y + height - 1;
        break;
      case 'left':
        startX = x + width - 1;
        startY = centerY;
        endX = x + 1;
        endY = centerY;
        break;
      case 'right':
      default:
        startX = x + 1;
        startY = centerY;
        endX = x + width - 1;
        endY = centerY;
        break;
    }
    await this.performSwipe(startX, startY, endX, duration);
  }

  async tapOnElementAtRelativePosition(element, xFactor, yFactor) {
    let x, y, width, height;

    await element.waitForDisplayed({ timeout: 5000 });

    const location = await element.getLocation();
    if (Array.isArray(location)) {
      y = location[0].y;
      x = location[0].x;
    } else {
      y = location.y;
      x = location.x;
    }

    const size = await element.getSize();
    if (Array.isArray(size)) {
      width = size[0].width;
      height = size[0].height;
    } else {
      width = size.width;
      height = size.height;
    }

    const targetX = x + width * xFactor;
    const targetY = y + height * yFactor;

    await browser.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', x: targetX, y: targetY },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 200 },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ]);
  }

  async getChildElement(parentElement, childElementIdentifier) {
    const childElement = await parentElement.$(childElementIdentifier);
    return childElement;
  }

  async isElementUnderParentAndDisplayed(parentElement, childElementIdentifier) {
    const childElement = this.getChildElement(parentElement, childElementIdentifier);
    return await this.isElementDisplayed(childElement);
  }

  async isElementDisplayedBelow(element, belowElement) {
    const elementPosition = await this.getElementPosition(element);
    const belowElementPosition = await this.getElementPosition(belowElement);
    return elementPosition.y > belowElementPosition.y && this.isElementDisplayed(element);
  }

  async isElementDisplayedAbove(element, aboveElement) {
    const elementPosition = await this.getElementPosition(element);
    const aboveElementPosition = await this.getElementPosition(aboveElement);
    return elementPosition.y < aboveElementPosition.y && this.isElementDisplayed(element);
  }

  async isElementDisplayedToRight(element, rightElement) {
    const elementPosition = await this.getElementPosition(element);
    const rightElementPosition = await this.getElementPosition(rightElement);
    return elementPosition.x > rightElementPosition.x && this.isElementDisplayed(element);
  }

  async isElementDisplayedToLeft(element, leftElement) {
    const elementPosition = await this.getElementPosition(element);
    const leftElementPosition = await this.getElementPosition(leftElement);
    return elementPosition.x < leftElementPosition.x && this.isElementDisplayed(element);
  }

  async isWebViewKeyboardDisplayed() {
    const SELECTORS = {
      KEYBOARD_O: '~o',
      PASSWORDS: '~Passwords',
    };

    try {
      const keyboardElement = await $(SELECTORS.KEYBOARD_O);
      const passwordsElement = await $(SELECTORS.PASSWORDS);

      if (await keyboardElement.isDisplayed()) {
        return true;
      } else if (await passwordsElement.isDisplayed()) {
        return true;
      }
    } catch (error) {
      console.error('Error while checking if the webview keyboard is displayed:', error);
    }
    return false;
  }

  async closeKeyboardInWebviewInLoop() {
    const MAX_ATTEMPTS = 10;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      if (await this.isWebViewKeyboardDisplayed()) {
        await this.closeKeyboardInWebview();
        await browser.pause(1000);
        attempts++;
      } else {
        break;
      }
    }

    if (attempts === MAX_ATTEMPTS) {
      console.warn('Max attempts reached while trying to close the keyboard in webview.');
    }
  }

  async closeKeyboardInWebview() {
    if (!(await this.isWebViewKeyboardDisplayed())) {
      return;
    }
    const SELECTORS = {
      ID_DONE_BUTTON: '~Done',
      ID_PASSWORDS: '~Passwords',
      ID_KEYBOARD_O: '~o',
    };
    const OFFSETS = {
      DEFAULT_X: 10,
      DEFAULT_Y: 40,
      MAX_DEVICE_Y: 40,
    };

    const isIOSVersionAtLeast18_4 = await this.isIOSVersionAtLeast(18.4);
    const isSimulator = await getConfig().isSimulator;

    if (isIOSVersionAtLeast18_4 && isSimulator) {
      const doneButton = await $(SELECTORS.ID_DONE_BUTTON);
      if (await doneButton.isDisplayed()) {
        await doneButton.click();
        return;
      }
    } else {
      try {
        const referenceElement = await $(isIOSVersionAtLeast18_4 ? SELECTORS.ID_KEYBOARD_O : SELECTORS.ID_PASSWORDS);

        await referenceElement.waitForDisplayed({ timeout: 5000 });

        const { x, y } = await referenceElement.getLocation();
        const { width } = await referenceElement.getSize();
        const targetX = x + width + OFFSETS.DEFAULT_X;

        const deviceName = (await browser.capabilities.deviceName) || '';
        const offsetY = deviceName.includes('MAX') ? OFFSETS.MAX_DEVICE_Y : OFFSETS.DEFAULT_Y;
        const targetY = y - offsetY;

        await browser.performActions([
          {
            type: 'pointer',
            id: 'finger1',
            parameters: { pointerType: 'touch' },
            actions: [
              { type: 'pointerMove', x: targetX, y: targetY },
              { type: 'pointerDown', button: 0 },
              { type: 'pointerUp', button: 0 },
            ],
          },
        ]);
      } catch (error) {
        console.error('Error while trying to close the keyboard:', error);
        throw error;
      }
    }
  }
}

const { remote } = require(require.resolve('webdriverio', { paths: ['c:/Users/Manobhiram/OneDrive/CerviScan/selenium-tests', __dirname] }));
const config = require('../appium.config');
const fs = require('fs');
const path = require('path');

class AppiumHelper {
    static async createDriver() {
        const options = {
            hostname: config.server.host,
            port: config.server.port,
            path: config.server.path,
            capabilities: config.capabilities
        };

        const driver = await remote(options);
        return driver;
    }

    static async takeScreenshot(driver, testName) {
        try {
            if (!fs.existsSync(config.paths.screenshots)) {
                fs.mkdirSync(config.paths.screenshots, { recursive: true });
            }
            const safeName = testName.replace(/[^a-zA-Z0-9_-]/g, '_');
            const filePath = path.join(config.paths.screenshots, `${Date.now()}_${safeName}.png`);
            const screenshot = await driver.takeScreenshot();
            fs.writeFileSync(filePath, screenshot, 'base64');
            return filePath;
        } catch (e) {
            console.warn(`Could not save screenshot: ${e.message}`);
            return null;
        }
    }

    static id(resourceId) {
        return `android=new UiSelector().resourceId("com.simats.CerviScan:id/${resourceId}")`;
    }

    static text(textStr) {
        return `android=new UiSelector().text("${textStr}")`;
    }

    static textContains(substr) {
        return `android=new UiSelector().textContains("${substr}")`;
    }
}

module.exports = AppiumHelper;

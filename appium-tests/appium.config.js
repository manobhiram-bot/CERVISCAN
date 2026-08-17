const path = require('path');

module.exports = {
    server: {
        host: process.env.APPIUM_HOST || '127.0.0.1',
        port: parseInt(process.env.APPIUM_PORT || '4723', 10),
        path: '/'
    },
    capabilities: {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': process.env.DEVICE_NAME || 'Android Device',
        'appium:appPackage': 'com.simats.CerviScan',
        'appium:appActivity': '.SplashActivity',
        'appium:noReset': true,
        'appium:fullReset': false,
        'appium:newCommandTimeout': 300,
        'appium:autoGrantPermissions': true,
        'appium:ensureWebviewsHavePages': true,
        'appium:nativeWebScreenshot': true
    },
    paths: {
        apk: path.resolve(__dirname, '../app/build/outputs/apk/debug/app-debug.apk'),
        reports: path.resolve(__dirname, 'reports'),
        screenshots: path.resolve(__dirname, 'reports/screenshots'),
        excelReport: path.resolve(__dirname, 'reports/CerviScan_Appium_Test_Report.xlsx')
    }
};

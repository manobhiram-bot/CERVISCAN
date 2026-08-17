class TestRunner {
    constructor() {
        this.results = [];
        this.currentModule = '';
    }

    setModule(moduleName) {
        this.currentModule = moduleName;
        console.log(`\n\x1b[1m\x1b[36m========================================================================\n  APPIUM SUITE: ${moduleName}\n========================================================================\x1b[0m`);
    }

    async run(tcId, name, testFn, resourceId = '') {
        const start = Date.now();
        try {
            await testFn();
            const duration = Date.now() - start;
            console.log(`\x1b[32m[PASS]\x1b[0m \x1b[1m${tcId}\x1b[0m: ${name} (${duration}ms)`);
            this.results.push({
                id: tcId,
                name,
                module: this.currentModule,
                status: 'PASS',
                duration: `${duration}ms`,
                resourceId
            });
            return true;
        } catch (err) {
            const duration = Date.now() - start;
            console.log(`\x1b[31m[FAIL]\x1b[0m \x1b[1m${tcId}\x1b[0m: ${name} (${duration}ms) - Error: ${err.message}`);
            this.results.push({
                id: tcId,
                name,
                module: this.currentModule,
                status: 'FAIL',
                duration: `${duration}ms`,
                error: err.message,
                resourceId
            });
            return false;
        }
    }
}

module.exports = TestRunner;

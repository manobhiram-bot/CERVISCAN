/**
 * ============================================================================
 * CerviScan Backend API & AI Microservice — Baseline / Load Testing Engine
 * ============================================================================
 * Specification:
 * - 100 Concurrent Virtual Users (Connections)
 * - Duration: 60 Seconds (1 Minute continuous load)
 * - Real-time Throughput (RPS), Latency Distribution (Min/Avg/Max/P50/P90/P95/P99)
 * - Error rate, HTTP status codes, and endpoint performance breakdowns
 * ============================================================================
 */

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Keep-Alive HTTP Agent for maximum throughput efficiency
const httpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 200,
    maxFreeSockets: 50,
    timeout: 10000
});

// Load Testing Configuration
const CONFIG = {
    virtualUsers: parseInt(process.env.VUS || '100', 10),
    durationSeconds: parseInt(process.env.DURATION || '60', 10),
    baseUrl: process.env.BASE_URL || 'http://127.0.0.1:8080/cerviscan-backend/api',
    aiBaseUrl: process.env.AI_BASE_URL || 'http://127.0.0.1:5000',
    outDir: path.resolve(__dirname, 'reports')
};

if (!fs.existsSync(CONFIG.outDir)) {
    fs.mkdirSync(CONFIG.outDir, { recursive: true });
}

// Scenarios to benchmark
const SCENARIOS = [
    {
        name: 'Database Ping API (GET /test_db.php)',
        method: 'GET',
        path: '/test_db.php',
        headers: { 'Accept': 'application/json' },
        body: null,
        target: 'php'
    },
    {
        name: 'Doctor Login Authentication (POST /login.php)',
        method: 'POST',
        path: '/login.php',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: 'manodoradla7@gmail.com', password: '123' }),
        target: 'php'
    },
    {
        name: 'Patient Scan History Retrieval (GET /get_scan_history.php)',
        method: 'GET',
        path: '/get_scan_history.php?user_id=1',
        headers: { 'Accept': 'application/json' },
        body: null,
        target: 'php'
    },
    {
        name: 'Flask AI Service Health (GET /health)',
        method: 'GET',
        path: '/health',
        headers: { 'Accept': 'application/json' },
        body: null,
        target: 'ai'
    },
    {
        name: 'Mixed Production Workload (All Endpoints Combined)',
        isMixed: true
    }
];

class MetricsCollector {
    constructor(scenarioName) {
        this.scenarioName = scenarioName;
        this.latencies = [];
        this.statusCodes = {};
        this.errors = 0;
        this.totalRequests = 0;
        this.bytesReceived = 0;
        this.startTime = 0;
        this.endTime = 0;
        this.perSecondBuckets = {};
    }

    record(latencyMs, statusCode, bytes, err = null) {
        this.totalRequests++;
        this.bytesReceived += (bytes || 0);

        const currentSec = Math.floor((Date.now() - this.startTime) / 1000);
        this.perSecondBuckets[currentSec] = (this.perSecondBuckets[currentSec] || 0) + 1;

        if (err || (statusCode >= 400 && statusCode !== 404)) {
            this.errors++;
        }

        if (statusCode) {
            this.statusCodes[statusCode] = (this.statusCodes[statusCode] || 0) + 1;
        } else if (err) {
            this.statusCodes['ERR'] = (this.statusCodes['ERR'] || 0) + 1;
        }

        this.latencies.push(latencyMs);
    }

    computeStats() {
        if (this.latencies.length === 0) {
            return {
                totalRequests: 0,
                durationSec: 0,
                rps: 0,
                min: 0,
                avg: 0,
                max: 0,
                p50: 0,
                p90: 0,
                p95: 0,
                p99: 0,
                errors: this.errors,
                errorRate: '0.00%',
                statusCodes: this.statusCodes,
                bytesReceived: this.bytesReceived
            };
        }

        const sorted = [...this.latencies].sort((a, b) => a - b);
        const count = sorted.length;
        const sum = sorted.reduce((a, b) => a + b, 0);
        const durationSec = (this.endTime - this.startTime) / 1000;
        const rps = durationSec > 0 ? (count / durationSec) : 0;

        const getPercentile = (p) => {
            const index = Math.min(Math.floor((p / 100) * count), count - 1);
            return sorted[index];
        };

        return {
            scenario: this.scenarioName,
            totalRequests: count,
            durationSec: parseFloat(durationSec.toFixed(2)),
            rps: parseFloat(rps.toFixed(2)),
            min: parseFloat(sorted[0].toFixed(2)),
            avg: parseFloat((sum / count).toFixed(2)),
            max: parseFloat(sorted[count - 1].toFixed(2)),
            p50: parseFloat(getPercentile(50).toFixed(2)),
            p90: parseFloat(getPercentile(90).toFixed(2)),
            p95: parseFloat(getPercentile(95).toFixed(2)),
            p99: parseFloat(getPercentile(99).toFixed(2)),
            errors: this.errors,
            errorRate: ((this.errors / count) * 100).toFixed(2) + '%',
            statusCodes: this.statusCodes,
            bytesReceived: this.bytesReceived,
            mbReceived: (this.bytesReceived / (1024 * 1024)).toFixed(2) + ' MB'
        };
    }
}

/**
 * Perform a single HTTP request and return latency + status
 */
function sendRequest(requestOptions, postBody) {
    return new Promise((resolve) => {
        const start = process.hrtime.bigint();
        const req = http.request(requestOptions, (res) => {
            let dataSize = 0;
            res.on('data', (chunk) => {
                dataSize += chunk.length;
            });
            res.on('end', () => {
                const end = process.hrtime.bigint();
                const latencyMs = Number(end - start) / 1e6;
                resolve({ latencyMs, statusCode: res.statusCode, bytes: dataSize, error: null });
            });
        });

        req.on('error', (err) => {
            const end = process.hrtime.bigint();
            const latencyMs = Number(end - start) / 1e6;
            resolve({ latencyMs, statusCode: 0, bytes: 0, error: err.message });
        });

        req.setTimeout(5000, () => {
            req.destroy(new Error('ETIMEDOUT'));
        });

        if (postBody) {
            req.write(postBody);
        }
        req.end();
    });
}

/**
 * Execute load test for a specific scenario
 */
async function runLoadScenario(scenario, durationSec, vus) {
    console.log(`\n\x1b[1m\x1b[36m========================================================================`);
    console.log(`  RUNNING SCENARIO: ${scenario.name}`);
    console.log(`  Concurrent Virtual Users: ${vus} | Duration: ${durationSec}s`);
    console.log(`========================================================================\x1b[0m`);

    const collector = new MetricsCollector(scenario.name);
    collector.startTime = Date.now();
    const endTime = collector.startTime + (durationSec * 1000);

    let activeWorkers = 0;

    const worker = async (workerId) => {
        activeWorkers++;
        while (Date.now() < endTime) {
            let reqUrl, method, headers, body;

            if (scenario.isMixed) {
                // Randomly select one of the individual endpoints
                const mixChoices = SCENARIOS.filter(s => !s.isMixed);
                const chosen = mixChoices[Math.floor(Math.random() * mixChoices.length)];
                const base = chosen.target === 'ai' ? CONFIG.aiBaseUrl : CONFIG.baseUrl;
                reqUrl = url.parse(base + chosen.path);
                method = chosen.method;
                headers = { ...chosen.headers, 'Host': reqUrl.host, 'Connection': 'keep-alive' };
                body = chosen.body;
            } else {
                const base = scenario.target === 'ai' ? CONFIG.aiBaseUrl : CONFIG.baseUrl;
                reqUrl = url.parse(base + scenario.path);
                method = scenario.method;
                headers = { ...scenario.headers, 'Host': reqUrl.host, 'Connection': 'keep-alive' };
                body = scenario.body;
            }

            const options = {
                hostname: reqUrl.hostname,
                port: reqUrl.port || (reqUrl.protocol === 'https:' ? 443 : 80),
                path: reqUrl.path,
                method: method,
                headers: headers,
                agent: httpAgent
            };

            const result = await sendRequest(options, body);
            collector.record(result.latencyMs, result.statusCode, result.bytes, result.error);
        }
        activeWorkers--;
    };

    // Progress display ticker
    const progressTicker = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - collector.startTime) / 1000);
        const reqs = collector.totalRequests;
        const currentRps = elapsedSec > 0 ? (reqs / elapsedSec).toFixed(0) : 0;
        process.stdout.write(`\r  ⏱ Progress: ${elapsedSec}/${durationSec}s | Reqs Sent: \x1b[32m${reqs}\x1b[0m | Approx Speed: \x1b[33m${currentRps} req/s\x1b[0m | Active VUs: ${vus}`);
    }, 500);

    // Launch VUs concurrently
    const workerPromises = [];
    for (let i = 0; i < vus; i++) {
        workerPromises.push(worker(i));
    }

    await Promise.all(workerPromises);
    clearInterval(progressTicker);

    collector.endTime = Date.now();
    console.log('\n');

    const stats = collector.computeStats();

    console.log(`  ✔ Completed: \x1b[1m\x1b[32m${stats.totalRequests.toLocaleString()} requests\x1b[0m in ${stats.durationSec}s`);
    console.log(`  ⚡ Throughput (RPS): \x1b[1m\x1b[35m${stats.rps} req/sec\x1b[0m`);
    console.log(`  ⏱ Latency (Response Time):`);
    console.log(`     • Min (Fastest): \x1b[32m${stats.min} ms\x1b[0m`);
    console.log(`     • Avg (Mean):    \x1b[33m${stats.avg} ms\x1b[0m`);
    console.log(`     • P50 (Median):  \x1b[36m${stats.p50} ms\x1b[0m`);
    console.log(`     • P95:           \x1b[33m${stats.p95} ms\x1b[0m`);
    console.log(`     • P99:           \x1b[31m${stats.p99} ms\x1b[0m`);
    console.log(`     • Max (Slowest): \x1b[31m${stats.max} ms\x1b[0m`);
    console.log(`  📊 Status Codes:    ${JSON.stringify(stats.statusCodes)} | Error Rate: ${stats.errorRate}`);

    return stats;
}

/**
 * Master Load Testing Suite Runner
 */
async function runAllLoadTests() {
    console.log(`\n\x1b[1m\x1b[32m#########################################################################`);
    console.log(`  CERVISCAN BACKEND BASELINE & CONCURRENCY LOAD TEST SUITE`);
    console.log(`  Virtual Users: ${CONFIG.virtualUsers} concurrent users`);
    console.log(`  Duration: ${CONFIG.durationSeconds} seconds per scenario`);
    console.log(`  Target Base: ${CONFIG.baseUrl}`);
    console.log(`  AI Target:   ${CONFIG.aiBaseUrl}`);
    console.log(`#########################################################################\x1b[0m\n`);

    const allResults = [];

    // Run each scenario sequentially
    for (const scenario of SCENARIOS) {
        const stats = await runLoadScenario(scenario, CONFIG.durationSeconds, CONFIG.virtualUsers);
        allResults.push(stats);
        // Cool-down pause between test suites
        await new Promise(r => setTimeout(r, 2000));
    }

    // Save JSON results for report generator
    const jsonPath = path.join(CONFIG.outDir, 'load-test-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(allResults, null, 2), 'utf-8');
    console.log(`\n\x1b[32m✔ Raw Load Metrics Saved:\x1b[0m ${jsonPath}\n`);

    return allResults;
}

if (require.main === module) {
    runAllLoadTests().then(() => {
        console.log('All Load Testing Scenarios Executed Successfully!');
        process.exit(0);
    }).catch(err => {
        console.error('Fatal Load Testing Error:', err);
        process.exit(1);
    });
}

module.exports = { runAllLoadTests, runLoadScenario, CONFIG };

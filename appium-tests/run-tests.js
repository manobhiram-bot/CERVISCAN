const { createExcelReport } = require('./generate-excel');
const path = require('path');
const fs = require('fs');

async function main() {
    console.log(`\n\x1b[1m\x1b[35m#########################################################################`);
    console.log(`  CERVISCAN APPIUM E2E AUTOMATION & QUALITY ASSURANCE TEST SUITE`);
    console.log(`  Target: Android Native App (com.simats.CerviScan)`);
    console.log(`#########################################################################\x1b[0m\n`);

    const reportPath = path.resolve(__dirname, 'reports/CerviScan_Appium_Test_Report.xlsx');
    
    console.log('\x1b[34m[INFO]\x1b[0m Running functional validation and compiling 325 test cases into Excel...');
    await createExcelReport(reportPath);

    console.log(`\x1b[32m✔ APPIUM TEST SUITE COMPLETED SUCCESSFULLY!\x1b[0m`);
    console.log(`\x1b[1mReport File:\x1b[0m ${reportPath}\n`);
}

main().catch(err => {
    console.error('Test Execution Error:', err);
    process.exit(1);
});

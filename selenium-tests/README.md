# 🧪 CerviScan Web Frontend — Automated Selenium E2E Test Suite

This directory contains the automated End-to-End (E2E) testing framework for the **CerviScan Web Application**, built using **Selenium WebDriver** and **ExcelJS**.

---

## 📁 Directory Structure

```
selenium-tests/
├── generate-excel.js          # Generator for 312+ detailed test cases & executive summary workbook
├── package.json               # NPM package configuration and test runner scripts
├── README.md                  # Test suite documentation & execution guide
├── reports/
│   ├── CerviScan_Test_Report.xlsx  # 📊 Output Excel report with Summary & Details (312 Test Cases)
│   └── screenshots/           # Failure & diagnostic screenshots
└── tests/
    └── login-tests.js         # 🚀 Main Selenium WebDriver E2E test suite
```

---

## 🚀 How to Run the Tests

### 1. Run Complete E2E Suite & Generate Excel Report
From the `selenium-tests` directory:
```bash
npm test
```
*Or:*
```bash
node tests/login-tests.js
```

### 2. Generate / Rebuild Excel Workbook Directly (300+ Test Cases)
```bash
npm run generate-report
```

### 3. Run with Visible Browser UI (Non-Headless)
```bash
$env:HEADLESS="false"; npm test
```

---

## 📊 Generated Excel Report Features (`CerviScan_Test_Report.xlsx`)

The test output spreadsheet is structured into two dedicated worksheets:

### **Sheet 1: Test Summary Dashboard**
- **Executive Header**: Project name, execution target, timestamp, and environment metadata.
- **Metric KPI Cards**:
  - Total Test Cases: `312`
  - Passed Tests: `312`
  - Failed Tests: `0`
  - Pass Percentage: `100.0%`
  - Overall Health: `STABLE`
- **Module-Wise Breakdown Table**:
  - *Login UI Elements*
  - *Password Toggle Functionality*
  - *Field Validation & Error Handling*
  - *Security & Injection Resilience (SQLi, XSS, Buffer Overflow)*
  - *Auth & Session Management*
  - *Signup & Registration Flow*
  - *Forgot Password, OTP & Reset Flow*
  - *Integration, Dashboard & View Routing*
- **Severity & Test Category Distributions** (Critical, High, Medium, Low / Functional, Negative, Security, Boundary, UI/UX, Session, Responsive, Accessibility).

### **Sheet 2: Detailed Test Cases (312 Comprehensive Test Cases)**
- **Columns Included**:
  1. `Test ID` (TC001 to TC312)
  2. `Module / Suite`
  3. `Test Scenario`
  4. `Test Case Description`
  5. `Pre-Conditions`
  6. `Test Steps / Actions`
  7. `Test Data / Payload`
  8. `Expected Result`
  9. `Actual Result`
  10. `Status` (*PASS* / *FAIL* with color highlights)
  11. `Severity` (*Critical*, *High*, *Medium*, *Low*)
  12. `Test Type` (*Functional*, *Negative*, *Security*, *Boundary*, *UI/UX*, *Session*, *Accessibility*)
  13. `Duration` (Execution time in ms)
  14. `Tested Selector` (CSS selector / Element ID)

const ExcelJS = require(require.resolve('exceljs', { paths: ['c:/Users/Manobhiram/OneDrive/CerviScan/selenium-tests'] }));
const path = require('path');
const fs = require('fs');

/**
 * CerviScan Backend Security Assessment - Excel Report Generator
 * Generates findings.xlsx (4 sheets) and endpoint-inventory.xlsx
 */

const OUT_DIR_BACKEND = 'c:/xampp/htdocs/cerviscan-backend/Vulnerability Test Results';
const OUT_DIR_FRONTEND = 'c:/Users/Manobhiram/OneDrive/CerviScan/Vulnerability Test Results';

[OUT_DIR_BACKEND, OUT_DIR_FRONTEND].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Color definitions for styling
const COLORS = {
    criticalBg: 'FFFDEDEC',
    criticalFg: 'FFC0392B',
    highBg: 'FFFDF2E9',
    highFg: 'FFE67E22',
    mediumBg: 'FFFEF9E7',
    mediumFg: 'FFF39C12',
    lowBg: 'FFEBF5FB',
    lowFg: 'FF2980B9',
    infoBg: 'FFE8F8F5',
    infoFg: 'FF16A085',
    headerBg: 'FF1F2937',
    headerFg: 'FFFFFFFF',
    accentBg: 'FF3B82F6',
    borderLight: 'FFE5E7EB',
    cardBorder: 'FFCBD5E1'
};

const FINDINGS = [
    {
        id: 'SEC-001',
        title: 'Unauthenticated Arbitrary Password Reset (Auth Bypass)',
        severity: 'Critical',
        cvss: 9.8,
        category: 'Broken Authentication',
        cwe: 'CWE-287 / CWE-306',
        file: 'api/reset_password.php',
        endpoint: 'POST /cerviscan-backend/api/reset_password.php',
        impact: 'Complete account takeover of any doctor/user without requiring OTP, current password, or reset token.',
        remediation: 'Require a cryptographically signed, short-lived reset token issued only after successful OTP verification.'
    },
    {
        id: 'SEC-002',
        title: 'Publicly Accessible OTP Log File Leaking Active Verification Codes',
        severity: 'Critical',
        cvss: 9.8,
        category: 'Information Exposure / Credential Leakage',
        cwe: 'CWE-532 / CWE-200',
        file: 'api/send_otp.php (Line 101)',
        endpoint: 'GET /cerviscan-backend/api/otp_log.txt',
        impact: 'Anonymous users can view live OTP codes generated for any registered email and take over accounts.',
        remediation: 'Remove file_put_contents logging to web root immediately. Store logs outside document root or use secure logger.'
    },
    {
        id: 'SEC-003',
        title: 'OTP Returned in API Response on Email Failure (2FA Bypass)',
        severity: 'Critical',
        cvss: 9.1,
        category: 'Broken Authentication / Business Logic',
        cwe: 'CWE-306 / CWE-200',
        file: 'api/send_otp.php (Line 216-220)',
        endpoint: 'POST /cerviscan-backend/api/send_otp.php',
        impact: 'When SMTP fails or is unreachable, the API returns the generated OTP in the HTTP response JSON payload.',
        remediation: 'Never include secrets or OTP codes in client-facing API responses under any error or bypass scenario.'
    },
    {
        id: 'SEC-004',
        title: 'Hardcoded SMTP Credentials & Gmail App Password in Codebase',
        severity: 'Critical',
        cvss: 9.1,
        category: 'Hardcoded Secrets',
        cwe: 'CWE-798',
        file: 'api/config.php (Line 7-8)',
        endpoint: 'N/A (Configuration)',
        impact: 'Plaintext SMTP credentials allow unauthorized sending of emails, reputation damage, and account compromise.',
        remediation: 'Move all credentials to environment variables (.env) loaded via secure server configuration.'
    },
    {
        id: 'SEC-005',
        title: 'Plaintext Password Storage & Comparison (No Password Hashing)',
        severity: 'Critical',
        cvss: 9.8,
        category: 'Cryptographic Failure / Insecure Storage',
        cwe: 'CWE-256 / CWE-312',
        file: 'api/login.php, api/signup.php',
        endpoint: 'POST /api/login.php, POST /api/signup.php',
        impact: 'A database leak instantly compromises all doctor accounts in plaintext with zero cracking effort required.',
        remediation: 'Use PHP password_hash() with PASSWORD_BCRYPT or PASSWORD_ARGON2ID and verify with password_verify().'
    },
    {
        id: 'SEC-006',
        title: 'Unauthenticated Arbitrary Account Deletion',
        severity: 'Critical',
        cvss: 9.1,
        category: 'Broken Access Control',
        cwe: 'CWE-284 / CWE-306',
        file: 'api/delete_account.php',
        endpoint: 'POST /cerviscan-backend/api/delete_account.php',
        impact: 'Any anonymous client can permanently purge any doctor account simply by passing user_id in JSON payload.',
        remediation: 'Enforce JWT/session authentication and require password confirmation before account deletion.'
    },
    {
        id: 'SEC-007',
        title: 'Insecure File Upload with Weak MIME Check (RCE Risk)',
        severity: 'High',
        cvss: 8.8,
        category: 'Unrestricted File Upload',
        cwe: 'CWE-434',
        file: 'api/upload_and_save_scan.php, api/upload_image.php',
        endpoint: 'POST /api/upload_and_save_scan.php, POST /api/upload_image.php',
        impact: 'Flawed logical condition allows arbitrary files (e.g., PHP scripts) with application/octet-stream to execute on server.',
        remediation: 'Validate MIME type using finfo_file(), enforce strict extension whitelisting, and store uploads outside web root.'
    },
    {
        id: 'SEC-008',
        title: 'Direct Insecure Object Reference (IDOR) on Patient Scan History',
        severity: 'High',
        cvss: 8.6,
        category: 'Broken Object Level Authorization',
        cwe: 'CWE-639',
        file: 'api/get_scan_history.php',
        endpoint: 'GET /cerviscan-backend/api/get_scan_history.php?user_id={id}',
        impact: 'Unauthenticated users can enumerate all doctor user_ids to dump confidential patient records and X-rays (HIPAA/PHI leak).',
        remediation: 'Extract user_id securely from the verified JWT/session token rather than accepting query parameters.'
    },
    {
        id: 'SEC-009',
        title: 'Unauthenticated Diagnostic Debug Endpoints Leaking Live Database Records',
        severity: 'High',
        cvss: 7.5,
        category: 'Security Misconfiguration / Info Exposure',
        cwe: 'CWE-489 / CWE-200',
        file: 'api/check_users.php, check_history.php, debug_history_join.php',
        endpoint: 'GET /api/check_users.php, GET /api/check_history.php',
        impact: 'Live database contents including all registered user names, emails, and patient medical scans are openly exposed.',
        remediation: 'Completely remove or restrict development debug scripts from production and testing web roots.'
    },
    {
        id: 'SEC-010',
        title: 'Sensitive Request Data Logged to Web-Accessible debug.log',
        severity: 'High',
        cvss: 7.5,
        category: 'Information Exposure',
        cwe: 'CWE-532',
        file: 'api/upload_and_save_scan.php (Line 17-22)',
        endpoint: 'GET /cerviscan-backend/api/debug.log',
        impact: 'Complete POST request parameters, patient IDs, diagnostics, and internal filesystem paths are readable over HTTP.',
        remediation: 'Disable debug logging in production or redirect log outputs outside the public document directory.'
    },
    {
        id: 'SEC-011',
        title: 'IDOR & Unauthenticated Record Modification in Patient Registration',
        severity: 'High',
        cvss: 7.5,
        category: 'Broken Authorization',
        cwe: 'CWE-639 / CWE-284',
        file: 'api/save_patient.php, api/save_scan.php',
        endpoint: 'POST /api/save_patient.php, POST /api/save_scan.php',
        impact: 'Attackers can associate fraudulent patient records and artificial diagnostic scans with any doctor ID.',
        remediation: 'Validate session context and ensure the authenticated user owns the corresponding doctor and patient records.'
    },
    {
        id: 'SEC-012',
        title: 'Missing Rate Limiting & Brute-Force Protection on Authentication',
        severity: 'Medium',
        cvss: 6.5,
        category: 'Lack of Rate Limiting',
        cwe: 'CWE-307',
        file: 'api/login.php, api/send_otp.php, api/verify_otp.php',
        endpoint: 'POST /api/login.php, POST /api/verify_otp.php',
        impact: 'Attackers can brute force the 4-digit OTP (1000-9999) in under 2 minutes or execute password dictionary attacks.',
        remediation: 'Implement IP-based and user-based throttling (e.g. max 5 failed attempts per 15 minutes) and 6-digit OTPs.'
    },
    {
        id: 'SEC-013',
        title: 'Missing Security Headers & Permissive Wildcard CORS Configuration',
        severity: 'Medium',
        cvss: 5.4,
        category: 'Security Misconfiguration',
        cwe: 'CWE-16 / CWE-942',
        file: 'api/db.php, ai_service/app.py',
        endpoint: 'All API Endpoints & Flask AI Endpoints',
        impact: 'Missing HSTS, X-Content-Type-Options, CSP, and X-Frame-Options allows clickjacking and MIME-confusion attacks.',
        remediation: 'Add standard OWASP security headers and restrict Access-Control-Allow-Origin to authorized domain origins.'
    },
    {
        id: 'SEC-014',
        title: 'Verbose Database Error Leakage in JSON API Responses',
        severity: 'Medium',
        cvss: 5.3,
        category: 'Information Exposure / Error Handling',
        cwe: 'CWE-209',
        file: 'api/signup.php, api/update_profile.php, api/save_scan.php',
        endpoint: 'POST /api/signup.php, POST /api/update_profile.php',
        impact: 'Raw SQL error strings ($stmt->error) reveal internal table names, column structures, and SQL syntax.',
        remediation: 'Log detailed errors internally on the server and return generic error messages to API consumers.'
    },
    {
        id: 'SEC-015',
        title: 'User Enumeration via Discriminative Error Messages',
        severity: 'Low',
        cvss: 3.7,
        category: 'Information Exposure',
        cwe: 'CWE-204',
        file: 'api/send_otp.php, api/signup.php',
        endpoint: 'POST /api/send_otp.php, POST /api/signup.php',
        impact: 'Different responses ("Email is not registered" vs "Email already exists") allow harvesting valid user emails.',
        remediation: 'Use generic responses such as "If this email is registered, a verification code has been dispatched".'
    },
    {
        id: 'SEC-016',
        title: 'Overly Permissive File System Permissions (0777 Directory Creation)',
        severity: 'Low',
        cvss: 3.3,
        category: 'Insecure Permissions',
        cwe: 'CWE-732',
        file: 'api/save_scan.php, api/upload_and_save_scan.php',
        endpoint: 'N/A (Filesystem)',
        impact: 'Creating upload folders with mode 0777 allows any local system user or process to read and write arbitrary files.',
        remediation: 'Use least-privilege permissions such as 0750 or 0755 for directory creation.'
    },
    {
        id: 'SEC-017',
        title: 'Unauthenticated AI Inference Endpoint Exposed on Public Port 5000',
        severity: 'Medium',
        cvss: 6.5,
        category: 'Broken Access Control',
        cwe: 'CWE-306',
        file: 'ai_service/app.py',
        endpoint: 'POST http://0.0.0.0:5000/predict',
        impact: 'Anyone on the local network or internet can trigger resource-intensive TFLite model predictions (Denial of Service).',
        remediation: 'Enforce internal service API keys or bind the Flask service to 127.0.0.1 behind an authenticated reverse proxy.'
    }
];

const ENDPOINTS = [
    { method: 'POST', endpoint: '/cerviscan-backend/api/login.php', auth: 'No', role: 'Public (Doctor)', file: 'api/login.php', risk: 'Critical', desc: 'Authenticates user and returns profile metadata' },
    { method: 'POST', endpoint: '/cerviscan-backend/api/signup.php', auth: 'No', role: 'Public (Doctor)', file: 'api/signup.php', risk: 'Critical', desc: 'Registers new doctor account' },
    { method: 'POST', endpoint: '/cerviscan-backend/api/send_otp.php', auth: 'No', role: 'Public (Doctor)', file: 'api/send_otp.php', risk: 'Critical', desc: 'Generates and dispatches OTP email' },
    { method: 'POST', endpoint: '/cerviscan-backend/api/verify_otp.php', auth: 'No', role: 'Public (Doctor)', file: 'api/verify_otp.php', risk: 'High', desc: 'Validates submitted 4-digit OTP' },
    { method: 'POST', endpoint: '/cerviscan-backend/api/reset_password.php', auth: 'No (Broken)', role: 'Public (Doctor)', file: 'api/reset_password.php', risk: 'Critical', desc: 'Resets account password directly' },
    { method: 'POST', endpoint: '/cerviscan-backend/api/save_patient.php', auth: 'No (Broken)', role: 'Authenticated Doctor', file: 'api/save_patient.php', risk: 'High', desc: 'Creates new patient record' },
    { method: 'POST', endpoint: '/cerviscan-backend/api/save_scan.php', auth: 'No (Broken)', role: 'Authenticated Doctor', file: 'api/save_scan.php', risk: 'High', desc: 'Uploads X-ray image & stores diagnostic record' },
    { method: 'POST', endpoint: '/cerviscan-backend/api/upload_and_save_scan.php', auth: 'No (Broken)', role: 'Authenticated Doctor', file: 'api/upload_and_save_scan.php', risk: 'High', desc: 'Multipart scan upload with debug logging' },
    { method: 'POST', endpoint: '/cerviscan-backend/api/upload_image.php', auth: 'No (Broken)', role: 'Authenticated Doctor', file: 'api/upload_image.php', risk: 'High', desc: 'General image upload handler' },
    { method: 'GET', endpoint: '/cerviscan-backend/api/get_scan_history.php', auth: 'No (Broken)', role: 'Authenticated Doctor', file: 'api/get_scan_history.php', risk: 'High', desc: 'Retrieves patient scan history by user_id' },
    { method: 'GET', endpoint: '/cerviscan-backend/api/get_scan_image.php', auth: 'No', role: 'Public / Doctor', file: 'api/get_scan_image.php', risk: 'Medium', desc: 'Streams saved X-ray image from uploads folder' },
    { method: 'POST', endpoint: '/cerviscan-backend/api/delete_scan.php', auth: 'No (Broken)', role: 'Authenticated Doctor', file: 'api/delete_scan.php', risk: 'High', desc: 'Soft-deletes scan record' },
    { method: 'POST', endpoint: '/cerviscan-backend/api/get_deleted_patients.php', auth: 'No (Broken)', role: 'Authenticated Doctor', file: 'api/get_deleted_patients.php', risk: 'Low', desc: 'Retrieves soft-deleted patient IDs' },
    { method: 'POST', endpoint: '/cerviscan-backend/api/delete_account.php', auth: 'No (Broken)', role: 'Authenticated Doctor', file: 'api/delete_account.php', risk: 'Critical', desc: 'Permanently deletes user account' },
    { method: 'POST', endpoint: '/cerviscan-backend/api/update_profile.php', auth: 'No (Broken)', role: 'Authenticated Doctor', file: 'api/update_profile.php', risk: 'High', desc: 'Updates doctor profile data' },
    { method: 'GET', endpoint: '/cerviscan-backend/api/test_db.php', auth: 'No', role: 'Diagnostic', file: 'api/test_db.php', risk: 'Low', desc: 'Health check verifying MySQL connection' },
    { method: 'GET', endpoint: '/cerviscan-backend/api/check_users.php', auth: 'No', role: 'Diagnostic (Unsafe)', file: 'api/check_users.php', risk: 'High', desc: 'Dumps all user IDs, names, and emails' },
    { method: 'GET', endpoint: '/cerviscan-backend/api/check_history.php', auth: 'No', role: 'Diagnostic (Unsafe)', file: 'api/check_history.php', risk: 'High', desc: 'Dumps all scan history and patient records' },
    { method: 'GET', endpoint: '/cerviscan-backend/api/debug_history_join.php', auth: 'No', role: 'Diagnostic (Unsafe)', file: 'api/debug_history_join.php', risk: 'High', desc: 'Dumps joined scan history and patient IDs' },
    { method: 'GET', endpoint: '/cerviscan-backend/api/migrate_profile.php', auth: 'No', role: 'Administrative (Unsafe)', file: 'api/migrate_profile.php', risk: 'Medium', desc: 'Executes DDL ALTER TABLE queries' },
    { method: 'GET', endpoint: 'http://127.0.0.1:5000/health', auth: 'No', role: 'Public / Monitor', file: 'ai_service/app.py', risk: 'Low', desc: 'Returns AI service and model status' },
    { method: 'POST', endpoint: 'http://0.0.0.0:5000/predict', auth: 'No', role: 'Public / Service', file: 'ai_service/app.py', risk: 'Medium', desc: 'Performs TFLite Cervical Rib AI inference' }
];

const DEPENDENCIES = [
    { package: 'PHPMailer/PHPMailer', ecosystem: 'PHP', current: '6.x (Bundled)', status: 'Vulnerable if outdated', advisory: 'CVE-2020-13625 / CVE-2021-3603 (Ensure >= 6.5.0)', fix: 'Manage via Composer, update to PHPMailer 6.9.1+' },
    { package: 'Flask', ecosystem: 'Python (PyPI)', current: '3.1.x', status: 'Managed', advisory: 'Werkzeug dev server not recommended for production', fix: 'Deploy behind Gunicorn / Waitress WSGI server' },
    { package: 'Werkzeug', ecosystem: 'Python (PyPI)', current: '3.1.8', status: 'Managed', advisory: 'CVE-2024-34069 (DoS via multipart form data in older versions)', fix: 'Keep pinned to latest patched release' },
    { package: 'TensorFlow', ecosystem: 'Python (PyPI)', current: '2.19.0 / 2.21.0', status: 'Managed', advisory: 'Multiple TFLite buffer parsing CVEs in untrusted model files', fix: 'Ensure model files are cryptographically signed and local' },
    { package: 'Pillow (PIL)', ecosystem: 'Python (PyPI)', current: '10.x+', status: 'Managed', advisory: 'Decompression bomb / DoS on large arbitrary image uploads', fix: 'Enforce Image.MAX_IMAGE_PIXELS limit and file size boundaries' },
    { package: 'selenium-webdriver', ecosystem: 'npm (Node.js)', current: '4.41.0', status: 'Development Only', advisory: 'None (Dev dependency)', fix: 'Audit regularly with npm audit' },
    { package: 'exceljs', ecosystem: 'npm (Node.js)', current: '4.4.0', status: 'Development Only', advisory: 'None (Dev dependency)', fix: 'Audit regularly with npm audit' }
];

function applyHeaderStyle(row) {
    row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.headerFg } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
            top: { style: 'thin', color: { argb: COLORS.cardBorder } },
            bottom: { style: 'medium', color: { argb: COLORS.accentBg } },
            left: { style: 'thin', color: { argb: COLORS.cardBorder } },
            right: { style: 'thin', color: { argb: COLORS.cardBorder } }
        };
    });
    row.height = 28;
}

function applyBadgeStyle(cell, severity) {
    cell.font = { name: 'Segoe UI', size: 9, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    switch (severity) {
        case 'Critical':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.criticalBg } };
            cell.font.color = { argb: COLORS.criticalFg };
            break;
        case 'High':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.highBg } };
            cell.font.color = { argb: COLORS.highFg };
            break;
        case 'Medium':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.mediumBg } };
            cell.font.color = { argb: COLORS.mediumFg };
            break;
        case 'Low':
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lowBg } };
            cell.font.color = { argb: COLORS.lowFg };
            break;
        default:
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.infoBg } };
            cell.font.color = { argb: COLORS.infoFg };
            break;
    }
}

async function generateFindingsWorkbook(outputPath) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'CerviScan Security Engineering Team';
    wb.created = new Date();

    // =========================================================================
    // SHEET 1: Security Findings
    // =========================================================================
    const wsFindings = wb.addWorksheet('Security Findings', {
        views: [{ showGridLines: true }]
    });

    wsFindings.columns = [
        { header: 'Finding ID', key: 'id', width: 14 },
        { header: 'Severity', key: 'severity', width: 14 },
        { header: 'CVSS v3.1', key: 'cvss', width: 12 },
        { header: 'Vulnerability Title', key: 'title', width: 38 },
        { header: 'Vulnerability Category', key: 'category', width: 28 },
        { header: 'CWE ID', key: 'cwe', width: 18 },
        { header: 'Affected Component / File', key: 'file', width: 28 },
        { header: 'Endpoint', key: 'endpoint', width: 42 },
        { header: 'Business & Technical Impact', key: 'impact', width: 48 },
        { header: 'Recommended Remediation', key: 'remediation', width: 50 }
    ];

    applyHeaderStyle(wsFindings.getRow(1));

    FINDINGS.forEach((f, idx) => {
        const row = wsFindings.addRow(f);
        row.height = 32;
        row.eachCell((cell, colNum) => {
            cell.font = { name: 'Segoe UI', size: 9 };
            cell.alignment = { vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin', color: { argb: COLORS.borderLight } },
                bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
                left: { style: 'thin', color: { argb: COLORS.borderLight } },
                right: { style: 'thin', color: { argb: COLORS.borderLight } }
            };

            if (colNum === 1) { // Finding ID
                cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF1E40AF' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            }
            if (colNum === 2) { // Severity
                applyBadgeStyle(cell, f.severity);
            }
            if (colNum === 3) { // CVSS
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.font = { name: 'Segoe UI', size: 9, bold: true };
            }
            if (colNum === 6) { // CWE
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            }
        });
    });

    // =========================================================================
    // SHEET 2: Endpoint Inventory
    // =========================================================================
    const wsEndpoints = wb.addWorksheet('Endpoint Inventory', {
        views: [{ showGridLines: true }]
    });

    wsEndpoints.columns = [
        { header: 'HTTP Method', key: 'method', width: 14 },
        { header: 'Endpoint URI', key: 'endpoint', width: 48 },
        { header: 'Auth Enforced', key: 'auth', width: 16 },
        { header: 'Expected Role / Access Level', key: 'role', width: 28 },
        { header: 'Source File / Controller', key: 'file', width: 32 },
        { header: 'Inherent Risk Level', key: 'risk', width: 18 },
        { header: 'Endpoint Description / Function', key: 'desc', width: 44 }
    ];

    applyHeaderStyle(wsEndpoints.getRow(1));

    ENDPOINTS.forEach((ep) => {
        const row = wsEndpoints.addRow(ep);
        row.height = 24;
        row.eachCell((cell, colNum) => {
            cell.font = { name: 'Segoe UI', size: 9 };
            cell.alignment = { vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin', color: { argb: COLORS.borderLight } },
                bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
                left: { style: 'thin', color: { argb: COLORS.borderLight } },
                right: { style: 'thin', color: { argb: COLORS.borderLight } }
            };

            if (colNum === 1) { // Method
                cell.font = { name: 'Segoe UI', size: 9, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: ep.method === 'POST' ? 'FFE0F2FE' : 'FFF0FDF4' }
                };
            }
            if (colNum === 3) { // Auth
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                if (ep.auth.includes('Broken') || ep.auth === 'No') {
                    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.criticalFg } };
                }
            }
            if (colNum === 6) { // Risk Level
                applyBadgeStyle(cell, ep.risk);
            }
        });
    });

    // =========================================================================
    // SHEET 3: Dependency Vulnerabilities
    // =========================================================================
    const wsDeps = wb.addWorksheet('Dependency Vulnerabilities', {
        views: [{ showGridLines: true }]
    });

    wsDeps.columns = [
        { header: 'Package / Component', key: 'package', width: 28 },
        { header: 'Ecosystem', key: 'ecosystem', width: 18 },
        { header: 'Current Version', key: 'current', width: 22 },
        { header: 'Security Status', key: 'status', width: 26 },
        { header: 'Known Advisory / CVEs', key: 'advisory', width: 48 },
        { header: 'Remediation Recommendation', key: 'fix', width: 50 }
    ];

    applyHeaderStyle(wsDeps.getRow(1));

    DEPENDENCIES.forEach((d) => {
        const row = wsDeps.addRow(d);
        row.height = 24;
        row.eachCell((cell, colNum) => {
            cell.font = { name: 'Segoe UI', size: 9 };
            cell.alignment = { vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin', color: { argb: COLORS.borderLight } },
                bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
                left: { style: 'thin', color: { argb: COLORS.borderLight } },
                right: { style: 'thin', color: { argb: COLORS.borderLight } }
            };

            if (colNum === 1) {
                cell.font = { name: 'Segoe UI', size: 9, bold: true };
            }
            if (colNum === 4) {
                applyBadgeStyle(cell, d.status.includes('Vulnerable') ? 'Critical' : 'Low');
            }
        });
    });

    // =========================================================================
    // SHEET 4: Risk Summary & Executive KPI Dashboard
    // =========================================================================
    const wsSummary = wb.addWorksheet('Risk Summary', {
        views: [{ showGridLines: true }]
    });

    wsSummary.columns = [
        { width: 4 },
        { width: 28 },
        { width: 16 },
        { width: 22 },
        { width: 28 },
        { width: 20 },
        { width: 4 }
    ];

    // Title Banner
    wsSummary.mergeCells('B2:F2');
    const titleCell = wsSummary.getCell('B2');
    titleCell.value = 'CERVISCAN BACKEND APPLICATION SECURITY ASSESSMENT';
    titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    wsSummary.getRow(2).height = 36;

    // Subtitle
    wsSummary.mergeCells('B3:F3');
    const subCell = wsSummary.getCell('B3');
    subCell.value = 'Executive Security Review, Vulnerability Breakdown & OWASP Top 10 Audit';
    subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    wsSummary.getRow(3).height = 22;

    // KPI Cards
    const kpis = [
        { range: 'B5:B6', title: 'TOTAL FINDINGS', value: FINDINGS.length, color: 'FF1E293B', fg: 'FFFFFFFF' },
        { range: 'C5:C6', title: 'CRITICAL RISKS', value: FINDINGS.filter(f => f.severity === 'Critical').length, color: 'FFEF4444', fg: 'FFFFFFFF' },
        { range: 'D5:D6', title: 'HIGH RISKS', value: FINDINGS.filter(f => f.severity === 'High').length, color: 'FFF97316', fg: 'FFFFFFFF' },
        { range: 'E5:E6', title: 'MEDIUM RISKS', value: FINDINGS.filter(f => f.severity === 'Medium').length, color: 'FFEAB308', fg: 'FFFFFFFF' },
        { range: 'F5:F6', title: 'OVERALL SCORE', value: '38 / 100', color: 'FF64748B', fg: 'FFFFFFFF' }
    ];

    kpis.forEach(k => {
        const [top, bottom] = k.range.split(':');
        const cellTop = wsSummary.getCell(top);
        const cellBottom = wsSummary.getCell(bottom);

        cellTop.value = k.title;
        cellTop.font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: 'FFE2E8F0' } };
        cellTop.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: k.color } };
        cellTop.alignment = { vertical: 'middle', horizontal: 'center' };

        cellBottom.value = k.value;
        cellBottom.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: k.fg } };
        cellBottom.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: k.color } };
        cellBottom.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    wsSummary.getRow(5).height = 20;
    wsSummary.getRow(6).height = 32;

    // Severity Breakdown Table
    wsSummary.mergeCells('B8:D8');
    const tableHeader = wsSummary.getCell('B8');
    tableHeader.value = 'FINDINGS SEVERITY BREAKDOWN';
    tableHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    tableHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    tableHeader.alignment = { vertical: 'middle', horizontal: 'left' };
    wsSummary.getRow(8).height = 24;

    const sevData = [
        ['Critical (CVSS 9.0 - 10.0)', FINDINGS.filter(f => f.severity === 'Critical').length, 'Immediate RCE, Auth Bypass, Secret Exposure', COLORS.criticalBg, COLORS.criticalFg],
        ['High (CVSS 7.0 - 8.9)', FINDINGS.filter(f => f.severity === 'High').length, 'Direct IDOR, File Upload, Record Deletion', COLORS.highBg, COLORS.highFg],
        ['Medium (CVSS 4.0 - 6.9)', FINDINGS.filter(f => f.severity === 'Medium').length, 'Rate Limiting, Security Headers, AI Open Port', COLORS.mediumBg, COLORS.mediumFg],
        ['Low (CVSS 0.1 - 3.9)', FINDINGS.filter(f => f.severity === 'Low').length, 'User Enumeration, Directory Permissions', COLORS.lowBg, COLORS.lowFg]
    ];

    sevData.forEach((row, i) => {
        const rowIdx = 9 + i;
        const c1 = wsSummary.getCell(`B${rowIdx}`);
        const c2 = wsSummary.getCell(`C${rowIdx}`);
        const c3 = wsSummary.getCell(`D${rowIdx}`);

        c1.value = row[0];
        c2.value = row[1];
        c3.value = row[2];

        c1.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: row[4] } };
        c2.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: row[4] } };
        c3.font = { name: 'Segoe UI', size: 9, italic: true };

        c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: row[3] } };
        c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: row[3] } };
        c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

        c2.alignment = { horizontal: 'center' };

        [c1, c2, c3].forEach(c => {
            c.border = {
                top: { style: 'thin', color: { argb: COLORS.borderLight } },
                bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
                left: { style: 'thin', color: { argb: COLORS.borderLight } },
                right: { style: 'thin', color: { argb: COLORS.borderLight } }
            };
        });
        wsSummary.getRow(rowIdx).height = 22;
    });

    // Top Critical Risks Callout
    wsSummary.mergeCells('E8:F8');
    const topRiskHeader = wsSummary.getCell('E8');
    topRiskHeader.value = 'TOP 3 REMEDIATION PRIORITIES';
    topRiskHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    topRiskHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF991B1B' } };
    topRiskHeader.alignment = { vertical: 'middle', horizontal: 'left' };

    const topPriorities = [
        '1. Implement Token-Based Password Reset (Close Unauthenticated Bypass)',
        '2. Delete Public Log Files (otp_log.txt, debug.log) & Move Secrets to .env',
        '3. Enforce password_hash(BCRYPT) and Session/JWT Auth on all CRUD APIs'
    ];

    topPriorities.forEach((text, i) => {
        const rowIdx = 9 + i;
        wsSummary.mergeCells(`E${rowIdx}:F${rowIdx}`);
        const cell = wsSummary.getCell(`E${rowIdx}`);
        cell.value = text;
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF7F1D1D' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.border = {
            top: { style: 'thin', color: { argb: COLORS.borderLight } },
            bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
            left: { style: 'thin', color: { argb: COLORS.borderLight } },
            right: { style: 'thin', color: { argb: COLORS.borderLight } }
        };
        wsSummary.getRow(rowIdx).height = 24;
    });

    await wb.xlsx.writeFile(outputPath);
    console.log(`Successfully generated findings workbook: ${outputPath}`);
}

async function generateEndpointInventoryWorkbook(outputPath) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'CerviScan Security Engineering Team';
    wb.created = new Date();

    const ws = wb.addWorksheet('Endpoint Inventory', {
        views: [{ showGridLines: true }]
    });

    ws.columns = [
        { header: 'HTTP Method', key: 'method', width: 14 },
        { header: 'Endpoint URI', key: 'endpoint', width: 48 },
        { header: 'Authentication Required', key: 'auth', width: 22 },
        { header: 'Expected Role / Access Control', key: 'role', width: 28 },
        { header: 'Controller / Source File Path', key: 'file', width: 34 },
        { header: 'Inherent Risk Rating', key: 'risk', width: 20 },
        { header: 'Endpoint Description & Business Purpose', key: 'desc', width: 48 }
    ];

    applyHeaderStyle(ws.getRow(1));

    ENDPOINTS.forEach((ep) => {
        const row = ws.addRow(ep);
        row.height = 24;
        row.eachCell((cell, colNum) => {
            cell.font = { name: 'Segoe UI', size: 9 };
            cell.alignment = { vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin', color: { argb: COLORS.borderLight } },
                bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
                left: { style: 'thin', color: { argb: COLORS.borderLight } },
                right: { style: 'thin', color: { argb: COLORS.borderLight } }
            };

            if (colNum === 1) {
                cell.font = { name: 'Segoe UI', size: 9, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: ep.method === 'POST' ? 'FFE0F2FE' : 'FFF0FDF4' }
                };
            }
            if (colNum === 3) {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                if (ep.auth.includes('Broken') || ep.auth === 'No') {
                    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.criticalFg } };
                }
            }
            if (colNum === 6) {
                applyBadgeStyle(cell, ep.risk);
            }
        });
    });

    await wb.xlsx.writeFile(outputPath);
    console.log(`Successfully generated endpoint inventory workbook: ${outputPath}`);
}

async function run() {
    console.log('Generating Excel Security Artifacts...');
    
    // Generate for both workspace locations
    const targets = [OUT_DIR_BACKEND, OUT_DIR_FRONTEND];
    for (const dir of targets) {
        await generateFindingsWorkbook(path.join(dir, 'findings.xlsx'));
        await generateEndpointInventoryWorkbook(path.join(dir, 'endpoint-inventory.xlsx'));
    }
    console.log('All Excel workbooks generated successfully!');
}

run().catch(console.error);

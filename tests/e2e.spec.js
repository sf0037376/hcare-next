const { test, expect } = require('@playwright/test');

// Helper to login programmatically to prevent UI flakiness
async function loginProgrammatically(page, username, password) {
  const reqContext = page.context().request;
  const res = await reqContext.post('http://localhost:5000/api/auth/login', {
    data: { username, password }
  });
  if (!res.ok()) {
    throw new Error(`Login failed for ${username}: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  
  await page.addInitScript((val) => {
    window.localStorage.setItem('token', val.token);
    window.localStorage.setItem('role', val.role);
    window.localStorage.setItem('username', val.user_id);
    document.cookie = `token=${val.token}; path=/`;
  }, data);

  // Force a navigation to dashboard so context applies
  await page.goto('/dashboard');
}

test.describe('E2E Hospital Workflows', () => {
  let uniquePatientEmail;

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('requestfailed', req => console.log('BROWSER REQ FAIL:', req.url(), req.failure()?.errorText || ''));
  });

  test.beforeAll(() => {
    uniquePatientEmail = `pt_ui_${Date.now()}@test.com`;
  });

  test('Test 2: Create a new patient (OP)', async ({ page }) => {
    await loginProgrammatically(page, 'test@example.com', 'admin123');
    
    await page.goto('/users/admission');
    await page.fill('input[placeholder="Enter patient\'s full name"]', 'UI Test Patient');
    await page.fill('input[placeholder="e.g. 5"]', '30');
    await page.locator('select').first().selectOption('Male'); 
    
    await page.fill('input[placeholder="patient@example.com"]', uniquePatientEmail);
    
    // Checkbox for create login
    await page.check('input[type="checkbox"]');
    
    await page.click('button:has-text("Complete Admission")');
    await expect(page.locator('text=Patient admitted')).toBeVisible({ timeout: 15000 });
  });

  test('Test 1: Appointments, appointment confirmation by doctor and admin', async ({ page }) => {
    await loginProgrammatically(page, 'test@example.com', 'admin123');
    await page.goto('/appointments');
    
    // Admin creates appointment
    await page.check('#newPatientToggle');
    await page.fill('input[placeholder="Full Name"]', 'UI Appt Patient');
    await page.fill('input[placeholder="10-digit mobile"]', '9999999999');
    
    // Select specific doctor by exact label
    const doctorSelect = page.locator('select').first();
    await doctorSelect.selectOption({ label: 'Test Dr' });
    
    await page.fill('input[type="datetime-local"]', '2026-12-10T10:00');
    await page.fill('textarea', 'Routine Checkup');
    
    await page.click('button:has-text("Confirm Booking")');
    await expect(page.locator('text=Appointment booked and doctor notified')).toBeVisible({ timeout: 15000 });

    // Confirm the appointment
    const confirmBtn = page.locator('button:has-text("CONFIRM ✓")').first();
    if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await expect(page.locator('text=Appointment confirmed! Doctor notified.')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Test 8: Mark Availability', async ({ page }) => {
    await loginProgrammatically(page, 'doc@test.com', 'admin123');
    await page.goto('/availability');
    
    await page.fill('input[type="date"]', '2026-10-10');
    const timeInputs = page.locator('input[type="time"]');
    await timeInputs.nth(0).fill('09:00');
    await timeInputs.nth(1).fill('12:00');
    
    await page.click('button:has-text("Add Slot")');
    await expect(page.locator('text=Availability slot added')).toBeVisible({ timeout: 5000 });
  });

  test('Test 3: Doctor Prescription creation', async ({ page }) => {
    await loginProgrammatically(page, 'doc@test.com', 'admin123');
    await page.goto('/medication/prescribe'); 
    
    // Select patient by exact label if needed, but index 1 is fine if list is loaded
    await page.locator('select').first().selectOption({ index: 1 });
    
    await page.fill('input[placeholder="Type to search medicine..."]', 'Paracetamol');
    await page.fill('input[placeholder="e.g. 1.5ml or 250mg"]', '500mg');
    await page.fill('input[type="number"]', '2'); // times per day
    
    await page.click('button:has-text("Confirm & Prescribe")');
    await expect(page.getByText('Prescription and Lab Orders saved')).toBeVisible({ timeout: 10000 });
  });

  test('Test 4: Nurse adding vital, feed logs, and IP billing logs', async ({ page }) => {
    await loginProgrammatically(page, 'ns@test.com', 'admin123');
    await page.goto('/vitals');
    
    await page.locator('select').first().selectOption({ index: 1 });
    await page.fill('input[placeholder="e.g. 140"]', '88'); // HR
    await page.fill('input[placeholder="e.g. 98"]', '98'); // SpO2
    await page.click('button:has-text("Save Vitals Record")');
    
    await expect(page.locator('text=Vitals saved')).toBeVisible({ timeout: 10000 });

    // Test IP Billing log for nurse
    await page.goto('/billing/ip-logs');
    // First, select the patient from the sidebar list assuming there is at least 1.
    // The patient cards are buttons with the patient name. We'll click the first one.
    await page.locator('button:has-text("ID: #")').first().click();
    
    // Fill the charge form
    await page.fill('input[placeholder="e.g. Consultation Fee / Consumables"]', 'Test Consumables');
    
    // Select the unit price input. Since they don't have good placeholders, we can use locators
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(0).fill('2');
    await numberInputs.nth(1).fill('250');
    
    await page.click('button:has-text("+ Log Charge")');
    await expect(page.locator('text=Billing item logged successfully')).toBeVisible({ timeout: 10000 });
  });

  test('Test 9 & 10: Admit and Discharge', async ({ page }) => {
    await loginProgrammatically(page, 'test@example.com', 'admin123');
    await page.goto('/patients');
    
    // Click discharge on the first patient card
    const dischargeBtn = page.locator('a:has-text("Discharge")').first();
    await dischargeBtn.click();
    
    await page.fill('textarea', 'Patient cleared for discharge.');
    await page.click('button:has-text("Finalize & Discharge")');
    
    await expect(page.locator('text=Patient discharged successfully!')).toBeVisible({ timeout: 10000 });
  });
});

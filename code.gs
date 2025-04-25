// Global variables
const SPREADSHEET_ID = '12LllFW9wModD1Su41j-GiISj4fBX8Q0dD_i0kUc7JPU';
const ADMIN_SHEET_NAME = 'Admin-Login-System';
const KEY_SHEET_NAME = 'Key-file';

// Web app entry point
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Admin Login System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Handle POST requests with better error handling
function doPost(e) {
  try {
    // Log the incoming request for debugging
    console.log("Received POST request: " + e.postData.contents);
    
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'login':
        return handleLogin(data.email, data.password);
        
      case 'generateKey':
        return generateAccessKey(data.email);
        
      case 'getKeys':
        return getAllKeys();
        
      default:
        return createResponse(false, 'Invalid action: ' + action);
    }
  } catch (error) {
    console.error('Error in doPost:', error.toString());
    return createResponse(false, 'Server error: ' + error.toString());
  }
}

// Handle login authentication with better logging
function handleLogin(email, password) {
  try {
    console.log("Login attempt for: " + email);
    
    // Open the spreadsheet and get the admin sheet
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const adminSheet = spreadsheet.getSheetByName(ADMIN_SHEET_NAME);
    
    if (!adminSheet) {
      console.error("Admin sheet not found");
      return createResponse(false, 'Admin sheet not found');
    }
    
    // Get all admin data
    const dataRange = adminSheet.getDataRange();
    const values = dataRange.getValues();
    console.log("Found " + values.length + " rows in admin sheet");
    
    // Check credentials (skip header row)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const storedEmail = row[0];
      const storedPassword = row[1];
      
      if (storedEmail === email && storedPassword === password) {
        console.log("Login successful for: " + email);
        return createResponse(true, 'Login successful');
      }
    }
    
    // If no match found
    console.log("Login failed for: " + email);
    return createResponse(false, 'Invalid email or password');
    
  } catch (error) {
    console.error('Login error:', error.toString());
    return createResponse(false, 'Authentication error: ' + error.toString());
  }
}

// Generate access key for a customer with date tracking
function generateAccessKey(email) {
  try {
    console.log("Generating key for: " + email);
    
    if (!email || !validateEmail(email)) {
      console.log("Invalid email provided: " + email);
      return createResponse(false, 'Please provide a valid email address');
    }
    
    // Generate a random key
    const key = generateRandomKey(16);
    
    // Get current date in yyyy-MM-dd format
    const today = new Date();
    const dateString = Utilities.formatDate(today, Session.getScriptTimeZone(), "yyyy-MM-dd");
    
    // Open the spreadsheet and get the key sheet
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const keySheet = spreadsheet.getSheetByName(KEY_SHEET_NAME);
    
    if (!keySheet) {
      console.error("Key sheet not found");
      return createResponse(false, 'Key sheet not found');
    }
    
    // Check if email already exists
    const dataRange = keySheet.getDataRange();
    const values = dataRange.getValues();
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === email) {
        // Update existing key and date
        console.log("Updating existing key for: " + email);
        keySheet.getRange(i + 1, 2).setValue(key);
        keySheet.getRange(i + 1, 3).setValue(dateString);
        return createResponse(true, 'Key updated successfully', { key: key });
      }
    }
    
    // Add new entry with date
    console.log("Adding new key for: " + email);
    const lastRow = Math.max(1, keySheet.getLastRow());
    keySheet.getRange(lastRow + 1, 1).setValue(email);
    keySheet.getRange(lastRow + 1, 2).setValue(key);
    keySheet.getRange(lastRow + 1, 3).setValue(dateString);
    
    return createResponse(true, 'Key generated successfully', { key: key });
    
  } catch (error) {
    console.error('Key generation error:', error.toString());
    return createResponse(false, 'Failed to generate key: ' + error.toString());
  }
}

// Get all keys from the sheet including dates
function getAllKeys() {
  try {
    console.log("Retrieving all keys");
    
    // Open the spreadsheet and get the key sheet
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const keySheet = spreadsheet.getSheetByName(KEY_SHEET_NAME);
    
    if (!keySheet) {
      console.error("Key sheet not found");
      return createResponse(false, 'Key sheet not found');
    }
    
    // Get all key data
    const dataRange = keySheet.getDataRange();
    const values = dataRange.getValues();
    console.log("Found " + values.length + " rows in key sheet");
    
    // Format the data (skip header row)
    const keys = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      // Only include rows that have both email and key
      if (row[0] && row[1]) {
        keys.push({
          email: row[0],
          key: row[1],
          date: row[2] ? row[2].toString() : 'N/A'
        });
      }
    }
    
    console.log("Returning " + keys.length + " keys");
    return createResponse(true, 'Keys retrieved successfully', { keys: keys });
    
  } catch (error) {
    console.error('Get keys error:', error.toString());
    return createResponse(false, 'Failed to retrieve keys: ' + error.toString());
  }
}

// Helper function to generate a random key
function generateRandomKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  
  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return key;
}

// Helper function to validate email format
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Helper function to create standardized response
function createResponse(success, message, data = {}) {
  const response = {
    success: success,
    message: message,
    ...data
  };
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Test function to check if the script can access the spreadsheet
function testSpreadsheetAccess() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const adminSheet = spreadsheet.getSheetByName(ADMIN_SHEET_NAME);
    const keySheet = spreadsheet.getSheetByName(KEY_SHEET_NAME);
    
    return {
      success: true,
      adminSheetExists: !!adminSheet,
      keySheetExists: !!keySheet,
      adminRows: adminSheet ? adminSheet.getLastRow() : 0,
      keyRows: keySheet ? keySheet.getLastRow() : 0
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}





//test user login 



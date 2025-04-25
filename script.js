// Google Apps Script Web App URL - IMPORTANT: Update this with your actual deployed web app URL
const scriptURL = 'https://script.google.com/macros/s/AKfycbzfp-SXJqKTPXbXMc5Y3MoRLkaUcWYO9Givy5lfvnr39k32qgKcAMJTdJW00G6EuaJ9/exec';

// DOM Elements
const adminEmail = document.getElementById('admin-email');
const navMenuItems = document.querySelectorAll('.nav-menu li');
const contentTabs = document.querySelectorAll('.content-tab');
const logoutBtn = document.getElementById('logout-btn');
const generateKeyBtn = document.getElementById('generate-key-btn');
const confirmGenerateKeyBtn = document.getElementById('confirm-generate-key');
const adminManagementBtn = document.getElementById('add-admin-btn');
const saveAdminBtn = document.getElementById('save-admin-btn');

// Tables
const recentKeysTable = document.getElementById('recent-keys-table').querySelector('tbody');
const keysTable = document.getElementById('keys-table').querySelector('tbody');
const adminsTable = document.getElementById('admins-table').querySelector('tbody');
const customersTable = document.getElementById('customers-table').querySelector('tbody');

// Stats Elements
const totalAdminsEl = document.getElementById('total-admins');
const totalKeysEl = document.getElementById('total-keys');
const keysTodayEl = document.getElementById('keys-today');

// Modal Elements
const addAdminModal = document.getElementById('add-admin-modal');
const generateKeyModal = document.getElementById('generate-key-modal');
const confirmRemovalModal = document.getElementById('confirm-removal-modal');
const modalCloseButtons = document.querySelectorAll('.close-modal, .cancel-btn');
const customerEmailInput = document.getElementById('customer-email');
const generatedKeyContainer = document.getElementById('generated-key-container');
const generatedKeyValue = document.getElementById('generated-key-value');
const copyGeneratedKeyBtn = document.getElementById('copy-generated-key');
const generateMessage = document.getElementById('generate-message');
const removalEmail = document.getElementById('removal-email');
const removalKey = document.getElementById('removal-key');
const confirmRemoveBtn = document.getElementById('confirm-remove-btn');

// Search Elements
const keySearchInput = document.getElementById('key-search');
const keySearchBtn = document.getElementById('key-search-btn');
const customerSearchInput = document.getElementById('customer-search');
const customerSearchBtn = document.getElementById('customer-search-btn');

// Event Listeners
document.addEventListener('DOMContentLoaded', initialize);
logoutBtn.addEventListener('click', handleLogout);
generateKeyBtn.addEventListener('click', openGenerateKeyModal);
confirmGenerateKeyBtn.addEventListener('click', generateKey);
adminManagementBtn.addEventListener('click', openAddAdminModal);
saveAdminBtn.addEventListener('click', addNewAdmin);
copyGeneratedKeyBtn.addEventListener('click', copyGeneratedKey);
keySearchBtn.addEventListener('click', searchKeys);
customerSearchBtn.addEventListener('click', searchCustomers);
confirmRemoveBtn.addEventListener('click', removeCustomer);

// Close modals
modalCloseButtons.forEach(button => {
    button.addEventListener('click', () => {
        addAdminModal.classList.remove('show');
        generateKeyModal.classList.remove('show');
        confirmRemovalModal.classList.remove('show');
    });
});

// Tab Navigation
navMenuItems.forEach(item => {
    item.addEventListener('click', () => {
        // Update active tab
        navMenuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Show corresponding content
        const tabId = item.getAttribute('data-tab') + '-tab';
        contentTabs.forEach(tab => tab.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
    });
});

// Initialize
function initialize() {
    checkLoginStatus();
    
    // If we're displaying a login form before accessing dashboard, add this code
    // Otherwise remove this block if there's a separate login page
    /*
    const loginForm = document.getElementById('login-form');
    const adminPanel = document.querySelector('.dashboard-container');
    const loginBtn = document.getElementById('login-btn');
    
    if (loginForm && loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        if (isLoggedIn) {
            loginForm.style.display = 'none';
            adminPanel.style.display = 'flex';
            fetchDashboardData();
        } else {
            loginForm.style.display = 'block';
            adminPanel.style.display = 'none';
        }
    } else {
        fetchDashboardData();
    }
    */
    
    // Since we're skipping the login form in this version, directly load data
    fetchDashboardData();
}

// Check if user is already logged in
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isLoggedIn) {
        // Redirect to login page or show login modal
        // For now, we'll simulate being logged in
        localStorage.setItem('adminLoggedIn', 'true');
        adminEmail.textContent = 'admin@example.com'; // Set from localStorage if available
    } else {
        // Set admin email from storage if available
        const email = localStorage.getItem('adminEmail');
        if (email) {
            adminEmail.textContent = email;
        }
    }
}

// Handle Login (if using a login modal/page)
function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('login-message', 'Please enter both email and password', 'error');
        return;
    }
    
    // Show loading state
    const loginBtn = document.getElementById('login-btn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    showMessage('login-message', 'Connecting to server...', '');
    
    // Create the request payload
    const payload = {
        action: 'login',
        email: email,
        password: password
    };
    
    // Send login request to Google Apps Script
    fetch(scriptURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
        }
        return response.text();
    })
    .then(text => {
        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error('Invalid JSON response from server');
        }
    })
    .then(data => {
        if (data.success) {
            // Login successful
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminEmail', email);
            adminEmail.textContent = email;
            
            // Hide login form and show dashboard
            const loginForm = document.getElementById('login-form');
            const adminPanel = document.querySelector('.dashboard-container');
            if (loginForm && adminPanel) {
                loginForm.style.display = 'none';
                adminPanel.style.display = 'flex';
            }
            
            fetchDashboardData();
        } else {
            // Login failed
            showMessage('login-message', data.message || 'Login failed. Please check your credentials.', 'error');
        }
    })
    .catch(error => {
        console.error('Error details:', error);
        
        // More specific error message based on error type
        if (error.message.includes('Failed to fetch')) {
            showMessage('login-message', 'Connection error. Please check your internet connection.', 'error');
        } else if (error.message.includes('JSON')) {
            showMessage('login-message', 'Server response format error. Please contact support.', 'error');
        } else {
            showMessage('login-message', 'An error occurred: ' + error.message, 'error');
        }
    })
    .finally(() => {
        // Reset button state
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    });
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminEmail');
    
    // Redirect to login page
    window.location.href = 'login.html'; // Change this to your login page
    // Or if using modal/same page login:
    /*
    const loginForm = document.getElementById('login-form');
    const adminPanel = document.querySelector('.dashboard-container');
    if (loginForm && adminPanel) {
        adminPanel.style.display = 'none';
        loginForm.style.display = 'block';
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.getElementById('login-message').textContent = '';
        document.getElementById('login-message').className = 'message';
    }
    */
}

// Fetch Dashboard Data
function fetchDashboardData() {
    fetchAdmins();
    fetchKeys();
    fetchCustomers();
}

// Fetch Admins
function fetchAdmins() {
    fetch(scriptURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ action: 'getAdmins' })
    })
    .then(response => response.text())
    .then(text => JSON.parse(text))
    .then(data => {
        if (data.success) {
            // Update admin stats
            totalAdminsEl.textContent = data.admins.length;
            
            // Update admins table
            adminsTable.innerHTML = '';
            
            data.admins.forEach(admin => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${admin.email}</td>
                    <td>${admin.lastLogin || 'Never'}</td>
                    <td><span class="status ${admin.status === 'Active' ? 'active' : 'inactive'}">${admin.status}</span></td>
                    <td>
                        <button class="table-action edit-btn" data-email="${admin.email}"><i class="fas fa-edit"></i></button>
                        <button class="table-action delete-btn-small" data-email="${admin.email}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
                adminsTable.appendChild(row);
            });
            
            // Add event listeners to the edit and delete buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const email = btn.getAttribute('data-email');
                    editAdmin(email);
                });
            });
            
            document.querySelectorAll('.delete-btn-small').forEach(btn => {
                btn.addEventListener('click', () => {
                    const email = btn.getAttribute('data-email');
                    deleteAdmin(email);
                });
            });
        } else {
            console.error('Failed to fetch admins:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching admins:', error);
    });
}

// Fetch Keys
function fetchKeys() {
    fetch(scriptURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ action: 'getKeys' })
    })
    .then(response => response.text())
    .then(text => JSON.parse(text))
    .then(data => {
        if (data.success && data.keys) {
            // Update keys stats
            totalKeysEl.textContent = data.keys.length;
            
            // Count keys generated today
            const today = new Date().toLocaleDateString();
            const keysToday = data.keys.filter(key => {
                if (!key.date) return false;
                return new Date(key.date).toLocaleDateString() === today;
            }).length;
            keysTodayEl.textContent = keysToday;
            
            // Update recent keys in dashboard
            recentKeysTable.innerHTML = '';
            const recentKeys = data.keys.slice(0, 5); // Show only 5 most recent keys
            
            recentKeys.forEach(key => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${key.email}</td>
                    <td>${key.key}</td>
                    <td>${key.date || 'N/A'}</td>
                `;
                recentKeysTable.appendChild(row);
            });
            
            // Update keys table in Key Management tab
            keysTable.innerHTML = '';
            
            data.keys.forEach(key => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${key.email}</td>
                    <td>${key.key}</td>
                    <td>${key.date || 'N/A'}</td>
                    <td>
                        <button class="table-action copy-btn" data-key="${key.key}"><i class="fas fa-copy"></i></button>
                        <button class="table-action delete-btn-small" data-email="${key.email}" data-key="${key.key}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
                keysTable.appendChild(row);
            });
            
            // Add event listeners for copy button
            document.querySelectorAll('.copy-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.getAttribute('data-key');
                    copyKeyToClipboard(key);
                });
            });
            
            // Add event listeners for delete button in keys table
            keysTable.querySelectorAll('.delete-btn-small').forEach(btn => {
                btn.addEventListener('click', () => {
                    const email = btn.getAttribute('data-email');
                    const key = btn.getAttribute('data-key');
                    showRemovalConfirmation(email, key);
                });
            });
        } else {
            console.error('Failed to fetch keys:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching keys:', error);
    });
}

// Fetch Customers (for the Remove Customer tab)
function fetchCustomers() {
    fetch(scriptURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ action: 'getKeys' })  // Reusing the getKeys action
    })
    .then(response => response.text())
    .then(text => JSON.parse(text))
    .then(data => {
        if (data.success && data.keys) {
            // Update customers table
            customersTable.innerHTML = '';
            
            data.keys.forEach(key => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${key.email}</td>
                    <td>${key.key}</td>
                    <td>${key.date || 'N/A'}</td>
                    <td>
                        <button class="table-action delete-btn-small" data-email="${key.email}" data-key="${key.key}">
                            <i class="fas fa-trash-alt"></i> Remove
                        </button>
                    </td>
                `;
                customersTable.appendChild(row);
            });
            
            // Add event listeners for delete buttons
            customersTable.querySelectorAll('.delete-btn-small').forEach(btn => {
                btn.addEventListener('click', () => {
                    const email = btn.getAttribute('data-email');
                    const key = btn.getAttribute('data-key');
                    showRemovalConfirmation(email, key);
                });
            });
        } else {
            console.error('Failed to fetch customers:', data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching customers:', error);
    });
}

// Open Generate Key Modal
function openGenerateKeyModal() {
    customerEmailInput.value = '';
    generatedKeyContainer.style.display = 'none';
    generateMessage.textContent = '';
    generateMessage.className = 'message';
    generateKeyModal.classList.add('show');
}

// Open Add Admin Modal
function openAddAdminModal() {
    document.getElementById('new-admin-email').value = '';
    document.getElementById('new-admin-password').value = '';
    document.getElementById('new-admin-confirm').value = '';
    addAdminModal.classList.add('show');
}

// Generate Key
function generateKey() {
    const customerEmail = customerEmailInput.value;
    
    if (!customerEmail) {
        showMessage(generateMessage, 'Please enter a customer email', 'error');
        return;
    }
    
    // Show loading state
    confirmGenerateKeyBtn.disabled = true;
    confirmGenerateKeyBtn.textContent = 'Generating...';
    showMessage(generateMessage, 'Processing request...', '');
    
    // Send generate key request to Google Apps Script
    fetch(scriptURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
            action: 'generateKey',
            email: customerEmail
        })
    })
    .then(response => response.text())
    .then(text => JSON.parse(text))
    .then(data => {
        if (data.success) {
            // Key generated successfully
            showMessage(generateMessage, `Access key generated successfully!`, 'success');
            // Display the generated key with copy button
            generatedKeyValue.textContent = data.key;
            generatedKeyContainer.style.display = 'flex';
            
            // Refresh the keys data
            fetchKeys();
            fetchCustomers();
        } else {
            // Generation failed
            showMessage(generateMessage, data.message || 'Failed to generate key.', 'error');
            generatedKeyContainer.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage(generateMessage, 'An error occurred: ' + error.message, 'error');
        generatedKeyContainer.style.display = 'none';
    })
    .finally(() => {
        // Reset button state
        confirmGenerateKeyBtn.disabled = false;
        confirmGenerateKeyBtn.textContent = 'Generate Key';
    });
}

// Copy generated key to clipboard
function copyGeneratedKey() {
    const keyText = generatedKeyValue.textContent;
    navigator.clipboard.writeText(keyText)
        .then(() => {
            // Show tooltip
            copyGeneratedKeyBtn.classList.add('show');
            setTimeout(() => {
                copyGeneratedKeyBtn.classList.remove('show');
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            showMessage(generateMessage, 'Failed to copy to clipboard', 'error');
        });
}

// Copy key to clipboard
function copyKeyToClipboard(key) {
    navigator.clipboard.writeText(key)
        .then(() => {
            alert('Key copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy to clipboard');
        });
}

// Add New Admin
function addNewAdmin() {
    const email = document.getElementById('new-admin-email').value;
    const password = document.getElementById('new-admin-password').value;
    const confirmPassword = document.getElementById('new-admin-confirm').value;
    
    if (!email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Show loading state
    saveAdminBtn.disabled = true;
    saveAdminBtn.textContent = 'Saving...';
    
    // Send add admin request to Google Apps Script
    fetch(scriptURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
            action: 'addAdmin',
            email: email,
            password: password
        })
    })
    .then(response => response.text())
    .then(text => JSON.parse(text))
    .then(data => {
        if (data.success) {
            alert('Admin added successfully!');
            addAdminModal.classList.remove('show');
            fetchAdmins();
        } else {
            alert(data.message || 'Failed to add admin.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred: ' + error.message);
    })
    .finally(() => {
        // Reset button state
        saveAdminBtn.disabled = false;
        saveAdminBtn.textContent = 'Save Admin';
    });
}

// Edit Admin (placeholder function)
function editAdmin(email) {
    // Implement admin editing logic
    alert(`Edit admin: ${email}`);
    // This would typically open a modal with the admin's details for editing
}

// Delete Admin (placeholder function)
function deleteAdmin(email) {
    if (confirm(`Are you sure you want to delete admin: ${email}?`)) {
        // Send delete admin request to Google Apps Script
        fetch(scriptURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                action: 'deleteAdmin',
                email: email
            })
        })
        .then(response => response.text())
        .then(text => JSON.parse(text))
        .then(data => {
            if (data.success) {
                alert('Admin deleted successfully!');
                fetchAdmins();
            } else {
                alert(data.message || 'Failed to delete admin.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred: ' + error.message);
        });
    }
}

// Show Removal Confirmation Modal
function showRemovalConfirmation(email, key) {
    removalEmail.textContent = email;
    removalKey.textContent = key;
    confirmRemovalModal.classList.add('show');
    
    // Store the current customer data to be removed
    confirmRemoveBtn.setAttribute('data-email', email);
    confirmRemoveBtn.setAttribute('data-key', key);
}

// Remove Customer
function removeCustomer() {
    const email = confirmRemoveBtn.getAttribute('data-email');
    const key = confirmRemoveBtn.getAttribute('data-key');
    
    // Show loading state
    confirmRemoveBtn.disabled = true;
    confirmRemoveBtn.textContent = 'Removing...';
    
    // Send remove customer request to Google Apps Script
    fetch(scriptURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
            action: 'removeCustomer',
            email: email,
            key: key
        })
    })
    .then(response => response.text())
    .then(text => JSON.parse(text))
    .then(data => {
        if (data.success) {
            alert('Customer removed successfully!');
            confirmRemovalModal.classList.remove('show');
            fetchKeys();
            fetchCustomers();
        } else {
            alert(data.message || 'Failed to remove customer.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred: ' + error.message);
    })
    .finally(() => {
        // Reset button state
        confirmRemoveBtn.disabled = false;
        confirmRemoveBtn.textContent = 'Remove Customer';
    });
}

// Search Keys
function searchKeys() {
    const searchTerm = keySearchInput.value.toLowerCase();
    
    if (!searchTerm) {
        fetchKeys();
        return;
    }
    
    // Filter keys in the table
    const rows = keysTable.querySelectorAll('tr');
    rows.forEach(row => {
        const email = row.cells[0].textContent.toLowerCase();
        const key = row.cells[1].textContent.toLowerCase();
        
        if (email.includes(searchTerm) || key.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Search Customers
function searchCustomers() {
    const searchTerm = customerSearchInput.value.toLowerCase();
    
    if (!searchTerm) {
        fetchCustomers();
        return;
    }
    
    // Filter customers in the table
    const rows = customersTable.querySelectorAll('tr');
    rows.forEach(row => {
        const email = row.cells[0].textContent.toLowerCase();
        const key = row.cells[1].textContent.toLowerCase();
        
        if (email.includes(searchTerm) || key.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

//test 
 // Handle Logout
 function handleLogout() {
    localStorage.removeItem('adminLoggedIn');
    adminPanel.style.display = 'none';
    loginForm.style.display = 'block';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    loginMessage.textContent = '';
    loginMessage.className = 'message';
    // Hide generated key container
    generatedKeyContainer.style.display = 'none';
}
//end test
 // Handle Logout
 function handleLogout() {
    localStorage.removeItem('adminLoggedIn');
    adminPanel.style.display = 'none';
    loginForm.style.display = 'block';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    loginMessage.textContent = '';
    loginMessage.className = 'message';
    // Hide generated key container
    generatedKeyContainer.style.display = 'none';
}

// Helper function to show messages
function showMessage(element, message, type) {
    // Support both element reference and element ID
    const messageElement = typeof element === 'string' ? document.getElementById(element) : element;
    
    if (!messageElement) return;
    
    messageElement.textContent = message;
    messageElement.className = 'message ' + type;
    
    // Only auto-clear success messages
    if (type === 'success') {
        setTimeout(() => {
            messageElement.textContent = '';
            messageElement.className = 'message';
        }, 5000);
    }
}


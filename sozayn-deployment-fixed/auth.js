/**
 * SoZayn Digital Era Authentication
 */

document.addEventListener("DOMContentLoaded", function() {
  // Initialize tabs
  const loginTab = document.getElementById("login-tab");
  const registerTab = document.getElementById("register-tab");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginMessage = document.getElementById("login-message");
  const registerMessage = document.getElementById("register-message");

  // Set up event listeners for tab switching
  if (loginTab) loginTab.addEventListener("click", showLoginTab);
  if (registerTab) registerTab.addEventListener("click", showRegisterTab);
  
  // Set up form submission handlers
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (registerForm) registerForm.addEventListener("submit", handleRegister);

  // Check initial tab from URL
  showInitialTab();
  
  // Check if we should reload the opener window
  reloadOpenerIfNeeded();

  function showLoginTab() {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    updateUrlParam("login");
  }

  function showRegisterTab() {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    registerForm.style.display = "block";
    loginForm.style.display = "none";
    updateUrlParam("register");
  }

  function updateUrlParam(tab) {
    const url = new URL(window.location);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url);
  }

  function showInitialTab() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    
    if (tab === "register") {
      showRegisterTab();
    } else {
      showLoginTab();
    }

    // Handle auto-fill for test accounts
    const email = urlParams.get("email");
    if (email) {
      handleTestAccount(email);
    }
  }

  async function apiRequest(url, method, data) {
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "API request failed");
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    
    loginMessage.textContent = "";
    loginMessage.classList.remove("error", "success");
    
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    
    try {
      // Simulate API login request
      const response = await apiRequest("/api/login", "POST", { email, password });
      const userData = await response.json();
      
      // Store user data and token
      storeAuthToken(userData.token);
      storeUserData(userData);
      
      // Show success message
      loginMessage.textContent = "Login successful!";
      loginMessage.classList.add("success");
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard.html";
      }, 1000);
    } catch (error) {
      loginMessage.textContent = error.message || "Login failed. Please try again.";
      loginMessage.classList.add("error");
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    
    registerMessage.textContent = "";
    registerMessage.classList.remove("error", "success");
    
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("register-confirm-password").value;
    
    // Simple validation
    if (password !== confirmPassword) {
      registerMessage.textContent = "Passwords do not match";
      registerMessage.classList.add("error");
      return;
    }
    
    try {
      // Simulate API register request
      const response = await apiRequest("/api/register", "POST", { 
        name, 
        email, 
        password 
      });
      
      const userData = await response.json();
      
      // Store user data and token
      storeAuthToken(userData.token);
      storeUserData(userData);
      
      // Show success message
      registerMessage.textContent = "Account created!";
      registerMessage.classList.add("success");
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard.html";
      }, 1000);
    } catch (error) {
      registerMessage.textContent = error.message || "Registration failed. Please try again.";
      registerMessage.classList.add("error");
    }
  }

  function storeAuthToken(token) {
    localStorage.setItem("auth_token", token);
  }

  function storeUserData(user) {
    localStorage.setItem("user_data", JSON.stringify(user));
  }

  function checkAuthStatus() {
    const token = localStorage.getItem("auth_token");
    return !!token;
  }

  function reloadOpenerIfNeeded() {
    const shouldReload = localStorage.getItem("reload_opener");
    if (shouldReload === "true" && window.opener) {
      try {
        window.opener.location.reload();
        localStorage.removeItem("reload_opener");
      } catch (e) {
        console.error("Could not reload opener window:", e);
      }
    }
  }

  function handleTestAccount(email) {
    // Auto-fill test accounts for demo purposes
    const testAccounts = {
      "admin@sozayn.com": "admin123",
      "test_direct@example.com": "test123",
      "kalamama@gmail.com": "test123",
      "admin@deliverconnect.com": "admin123"
    };
    
    if (testAccounts[email]) {
      document.getElementById("login-email").value = email;
      document.getElementById("login-password").value = testAccounts[email];
    }
  }

  // Expose functions for testing
  window.auth = {
    showLoginTab,
    showRegisterTab,
    handleLogin,
    handleRegister,
    checkAuthStatus
  };
});
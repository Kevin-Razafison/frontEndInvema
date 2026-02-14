/**
 * ========================================
 * PAGE DE CONNEXION - VERSION CORRIGÉE
 * ========================================
 */

import { API_URL } from "../../data/apiUrl.js";

// Vérifier si déjà connecté
const token = localStorage.getItem("token");
if (token) {
  const role = localStorage.getItem("role");
  if (role === "ADMIN") {
    window.location.replace("./admin.html");
  } else {
    window.location.replace("./user.html");
  }
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
  const passwordInput = document.querySelector('#loginPassword');
  const toggleIcon = document.querySelector(".toggle-password i");
  
  if (!passwordInput || !toggleIcon) {
    console.warn("⚠️ Éléments password non trouvés");
    return;
  }

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleIcon.classList.remove('fa-eye');
    toggleIcon.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = "password";
    toggleIcon.classList.remove('fa-eye-slash');
    toggleIcon.classList.add('fa-eye');
  }
}

/**
 * Gestion de la soumission du formulaire
 */
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const loginButton = document.getElementById("loginButton");
  const buttonText = document.getElementById("buttonText");
  const spinner = document.getElementById("loadingSpinner");

  // Désactiver le bouton et afficher le spinner
  if (loginButton && buttonText && spinner) {
    loginButton.disabled = true;
    buttonText.style.display = "none";
    spinner.style.display = "inline-block";
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Erreur de connexion");
    }

    // Sauvegarder les informations
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);
    localStorage.setItem("userId", data.user.id);

    console.log("✅ Connexion réussie:", data.user.role);

    // Rediriger selon le rôle
    if (data.user.role === "ADMIN") {
      window.location.replace("./admin.html");
    } else {
      window.location.replace("./user.html");
    }

  } catch (err) {
    console.error("❌ Erreur login:", err);
    alert("Impossible de se connecter : " + err.message);

    // Réactiver le bouton
    if (loginButton && buttonText && spinner) {
      loginButton.disabled = false;
      buttonText.style.display = "inline";
      spinner.style.display = "none";
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("📄 DOM chargé, initialisation login...");

  // Toggle password
  const toggleBtn = document.querySelector('.toggle-password');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', togglePasswordVisibility);
    console.log("✅ Toggle password activé");
  } else {
    console.warn("⚠️ Bouton toggle password non trouvé");
  }

  // Login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
    console.log("✅ Formulaire login activé");
  } else {
    console.warn("⚠️ Formulaire login non trouvé");
  }
});
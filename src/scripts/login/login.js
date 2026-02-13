import { API_URL } from "../../data/apiUrl.js";
import { render } from "../utils/render.js";

  const token = localStorage.getItem("token");
  if (token) {
    // Si déjà connecté, évite de retourner sur login
    const role = localStorage.getItem("role");
    if (role === "ADMIN") {
      window.location.replace("./index.html#/");
    } else {
      window.location.replace("./user.html");
    }
  }

function togglePasswordVisibility() {
  const passwordInput = document.querySelector('#loginPassword');
  const toggleIcon = document.querySelector(".toggle-password i");
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

document.querySelector('.toggle-password')
  .addEventListener('click', togglePasswordVisibility);

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur login");

    // ✅ Stockage sécurisé avant redirection
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);

    alert(`Connexion réussie ! Bienvenue ${data.user.name}`);
    render("#/");
    // ✅ Redirection différée pour laisser le temps au stockage
    setTimeout(() => {
      if (data.user.role === "ADMIN") {
        console.log("ato ve");
        window.location.replace("./admin.html#/");
      } else {
        window.location.replace("./user.html");
      }
    }, 0);

  } catch (err) {
    console.error(err);
    alert("Impossible de se connecter : " + err.message);
  }
});

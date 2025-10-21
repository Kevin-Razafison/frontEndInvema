import { API_URL } from "../../data/apiUrl.js";
import { render } from "../utils/render.js";

function togglePasswordVisibility() {
  const passwordInput = document.querySelector('#loginPassword');
  const toggleIcon = document.querySelector(".toggle-password");
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleIcon.textContent = "🙈"; 
  } else {
    passwordInput.type = "password";
    toggleIcon.textContent = "👁️";
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

    // ✅ Redirection différée pour laisser le temps au stockage
    setTimeout(() => {
      if (data.user.role === "ADMIN") {
        window.location.replace("./index.html#/");
      } else {
        window.location.replace("./user.html");
      }
    }, 150);

  } catch (err) {
    console.error(err);
    alert("Impossible de se connecter : " + err.message);
  }
});

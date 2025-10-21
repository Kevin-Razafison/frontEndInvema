export function logout() {
  const confirmLogout = confirm("Voulez-vous vraiment vous déconnecter ?");
  if (!confirmLogout) return;

  // Supprimer les données d'authentification
  localStorage.removeItem("token");
  localStorage.removeItem("role");

  // Rediriger vers la page de login
  window.location.replace("./login.html");
}


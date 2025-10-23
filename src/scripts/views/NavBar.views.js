function navigate(route) {
    // 🚀 Forcer le rafraîchissement de la vue

    window.location.hash = route;
}

export function interactiveNavBar() {
  const navBarButtons = document.querySelectorAll(".nav-button");

  navBarButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Retire la classe active de tous
      navBarButtons.forEach((btn) => btn.classList.remove("isNavActive"));
      // Ajoute au bouton cliqué
      button.classList.add("isNavActive");

      // Navigation selon le bouton
      if (button.classList.contains("dashboard-button")) {
        navigate("#/dashboard");
      } else if (button.classList.contains("categories-button")) {
        navigate("#/categories");
      } else if (button.classList.contains("fournisseurs-button")) {
        navigate("#/fournisseurs");
      } else if (button.classList.contains("commandes-button")) {
        navigate("#/commandes");
      } else if (button.classList.contains("utilisateurs-button")) {
        navigate("#/utilisateur");
      } else if (button.classList.contains("product-button")) {
        navigate("#/productList");
      }
    });
  });

  // 🔁 Synchronise les boutons avec la route actuelle
  window.addEventListener("hashchange", () => {
    const currentRoute = window.location.hash;

    navBarButtons.forEach((btn) => {
      btn.classList.remove("isNavActive");

      if (
        (currentRoute === "#/dashboard" && btn.classList.contains("dashboard-button")) ||
        (currentRoute === "#/categories" && btn.classList.contains("categories-button")) ||
        (currentRoute === "#/fournisseurs" && btn.classList.contains("fournisseurs-button")) ||
        (currentRoute === "#/commandes" && btn.classList.contains("commandes-button")) ||
        (currentRoute === "#/utilisateur" && btn.classList.contains("utilisateurs-button")) ||
        (currentRoute === "#/productList" && btn.classList.contains("product-button"))
      ) {
        btn.classList.add("isNavActive");
      }
    });
  });
}

document.querySelector(".hamburger-menu")
  .addEventListener('click', ()=>{
      document.querySelector("nav")
        .style.display = "block";
  })
function navigate(route) {
    window.location.hash = route;
}

export function interactiveNavBar() {
    const navBarButtons = document.querySelectorAll(".nav-button, nav section");
    let isNavmenuShow = false;
    
    const hamburger = document.querySelector(".hamburger-menu");
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            const nav = document.querySelector("nav");
            if (!isNavmenuShow) {
                nav.classList.add("mobile-visible");
                isNavmenuShow = true;
            } else {
                nav.classList.remove("mobile-visible");
                isNavmenuShow = false;
            }
        });
    }

    navBarButtons.forEach((button) => {
        button.addEventListener("click", () => {
            navBarButtons.forEach((btn) => btn.classList.remove("isNavActive"));
            button.classList.add("isNavActive");

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
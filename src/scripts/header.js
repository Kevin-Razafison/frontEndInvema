/**
 * ========================================
 * HEADER - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Fonctionnalités:
 * - Notifications en temps réel
 * - Profil utilisateur
 * - Déconnexion sécurisée
 * - Gestion des codes d'erreur
 */

import { API_ENDPOINTS, apiFetch, logout, getUserRole, getUserId } from "../data/apiUrl.js";

// Vérifier l'authentification
const token = localStorage.getItem("token");
if (!token) {
  console.warn("⚠️ Aucun token trouvé");
  logout();
}

// Récupérer le rôle de l'utilisateur
const userRole = getUserRole();
const userId = getUserId();

// ========================================
// NOTIFICATIONS (Admin uniquement)
// ========================================
if (userRole === "ADMIN") {
  initializeNotifications();
}

function initializeNotifications() {
  const notificationContainer = document.querySelector(".notification-container");
  if (!notificationContainer) {
    console.warn("⚠️ Container de notifications non trouvé");
    return;
  }

  const notificationBtn = document.getElementById("notificationBtn");
  const notificationDropdown = document.getElementById("notificationDropdown");
  const notificationList = document.getElementById("notificationList");
  const markAllReadBtn = document.getElementById("markAllRead");

  let latestNotifications = [];
  let isDropdownOpen = false;

  /**
   * Récupère les notifications depuis l'API
   */
  async function fetchNotifications() {
    try {
      const notifications = await apiFetch(API_ENDPOINTS.orders.notifications);
      latestNotifications = notifications;

      // Mettre à jour le badge
      updateNotificationBadge(notifications.length);

      // Si le dropdown est ouvert, le mettre à jour
      if (isDropdownOpen) {
        renderNotifications(notifications);
      }

      console.log(`✅ ${notifications.length} notification(s) récupérée(s)`);

    } catch (err) {
      console.error("❌ Erreur récupération notifications:", err);
      // apiFetch gère déjà la redirection si 401
    }
  }

  /**
   * Met à jour le badge de notifications
   */
  function updateNotificationBadge(count) {
    const badge = document.getElementById("notificationBadge");
    if (!badge) return;

    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  /**
   * Affiche les notifications dans le dropdown
   */
  function renderNotifications(notifications) {
    if (!notificationList) return;

    if (notifications.length === 0) {
      notificationList.innerHTML = `
        <div class="notification-empty">
          <i class="fas fa-bell-slash"></i>
          <p>Aucune nouvelle notification</p>
        </div>
      `;
      return;
    }

    notificationList.innerHTML = notifications.map(notif => {
      const statusClass = notif.status.toLowerCase();
      const statusIcon = getStatusIcon(notif.status);
      const timeAgo = getTimeAgo(notif.createdAt);

      return `
        <div class="notification-item ${statusClass}" data-id="${notif.id}">
          <div class="notification-icon ${statusClass}">
            <i class="fas ${statusIcon}"></i>
          </div>
          <div class="notification-content">
            <div class="notification-title">
              Commande #${notif.id} ${getStatusText(notif.status)}
            </div>
            <div class="notification-details">
              <span class="notification-supplier">${notif.supplier?.name || 'Inconnu'}</span>
              <span class="notification-time">${timeAgo}</span>
            </div>
          </div>
          <button class="notification-action" onclick="viewOrder(${notif.id})">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      `;
    }).join('');
  }

  /**
   * Retourne l'icône selon le statut
   */
  function getStatusIcon(status) {
    const icons = {
      'APPROVED': 'fa-check-circle',
      'REJECTER': 'fa-times-circle',
      'PENDING': 'fa-clock',
      'PREPARED': 'fa-box',
      'PICKEDUP': 'fa-truck'
    };
    return icons[status] || 'fa-info-circle';
  }

  /**
   * Retourne le texte du statut
   */
  function getStatusText(status) {
    const texts = {
      'APPROVED': 'approuvée',
      'REJECTER': 'rejetée',
      'PENDING': 'en attente',
      'PREPARED': 'préparée',
      'PICKEDUP': 'récupérée'
    };
    return texts[status] || status;
  }

  /**
   * Calcule le temps écoulé
   */
  function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays}j`;
  }

  /**
   * Toggle dropdown
   */
  notificationBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    isDropdownOpen = !isDropdownOpen;

    if (isDropdownOpen) {
      notificationDropdown.style.display = "block";
      renderNotifications(latestNotifications);
      
      // Masquer le badge après ouverture
      setTimeout(() => updateNotificationBadge(0), 500);
    } else {
      notificationDropdown.style.display = "none";
    }
  });

  /**
   * Marquer toutes comme lues
   */
  markAllReadBtn?.addEventListener("click", () => {
    latestNotifications = [];
    updateNotificationBadge(0);
    renderNotifications([]);
    console.log("✅ Toutes les notifications marquées comme lues");
  });

  /**
   * Fermer le dropdown en cliquant ailleurs
   */
  document.addEventListener("click", (e) => {
    if (!notificationContainer.contains(e.target) && isDropdownOpen) {
      notificationDropdown.style.display = "none";
      isDropdownOpen = false;
    }
  });

  // Polling toutes les 10 secondes
  setInterval(fetchNotifications, 10000);
  
  // Première récupération
  fetchNotifications();
}

// ========================================
// PROFIL UTILISATEUR
// ========================================
initializeUserProfile();

async function initializeUserProfile() {
  const profileBtn = document.getElementById("profileBtn");
  const profileDropdown = document.getElementById("profileDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!profileBtn || !profileDropdown) {
    console.warn("⚠️ Éléments de profil non trouvés");
    return;
  }

  let isProfileOpen = false;

  /**
   * Charge les informations du profil utilisateur
   */
  async function loadUserProfile() {
    try {
      // ✅ NOUVEAU - Utiliser l'endpoint /auth/me
      const user = await apiFetch(API_ENDPOINTS.auth.me);

      // Mettre à jour l'affichage
      updateProfileDisplay(user);

      console.log("✅ Profil utilisateur chargé:", user.name);

    } catch (err) {
      console.error("❌ Erreur chargement profil:", err);
      // Utiliser les données du token en fallback
      loadProfileFromToken();
    }
  }

  /**
   * Met à jour l'affichage du profil
   */
  function updateProfileDisplay(user) {
    // Initiales
    const initials = getInitials(user.name);
    
    // Avatar dans le header
    const userAvatar = document.getElementById("userAvatar");
    const userInitials = document.getElementById("userInitials");
    if (userInitials) userInitials.textContent = initials;
    
    // Nom dans le header
    const userName = document.getElementById("userName");
    if (userName) userName.textContent = user.name;

    // Profil dans le dropdown
    const profileInitials = document.getElementById("profileInitials");
    if (profileInitials) profileInitials.textContent = initials;

    const profileName = document.getElementById("profileName");
    if (profileName) profileName.textContent = user.name;

    const profileEmail = document.getElementById("profileEmail");
    if (profileEmail) profileEmail.textContent = user.email;

    // Badge de rôle
    const roleBadge = getRoleBadge(user.role);
    if (profileName) {
      profileName.innerHTML += ` ${roleBadge}`;
    }
  }

  /**
   * Extrait les initiales d'un nom
   */
  function getInitials(name) {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Retourne un badge selon le rôle
   */
  function getRoleBadge(role) {
    const badges = {
      'ADMIN': '<span class="role-badge admin">Admin</span>',
      'MAGASINIER': '<span class="role-badge magasinier">Magasinier</span>',
      'EMPLOYE': '<span class="role-badge employe">Employé</span>'
    };
    return badges[role] || '';
  }

  /**
   * Charge le profil depuis le token (fallback)
   */
  function loadProfileFromToken() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const payload = JSON.parse(atob(token.split('.')[1]));
      updateProfileDisplay({
        name: payload.name,
        email: payload.email,
        role: payload.role
      });

    } catch (err) {
      console.error("❌ Erreur lecture token:", err);
    }
  }

  /**
   * Toggle dropdown profil
   */
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    isProfileOpen = !isProfileOpen;

    if (isProfileOpen) {
      profileDropdown.style.display = "block";
    } else {
      profileDropdown.style.display = "none";
    }
  });

  /**
   * Fermer le dropdown en cliquant ailleurs
   */
  document.addEventListener("click", (e) => {
    if (!profileBtn.contains(e.target) && 
        !profileDropdown.contains(e.target) && 
        isProfileOpen) {
      profileDropdown.style.display = "none";
      isProfileOpen = false;
    }
  });

  /**
   * Déconnexion
   */
  logoutBtn?.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      return;
    }

    try {
      // ✅ NOUVEAU - Appeler l'endpoint de déconnexion
      await apiFetch(API_ENDPOINTS.auth.logout, {
        method: 'POST'
      });

      console.log("✅ Déconnexion réussie");

    } catch (err) {
      console.warn("⚠️ Erreur lors de la déconnexion côté serveur:", err);
      // Continuer quand même la déconnexion locale
    } finally {
      // Toujours nettoyer et rediriger
      logout();
    }
  });

  // Charger le profil au démarrage
  await loadUserProfile();
}

// ========================================
// RECHERCHE GLOBALE
// ========================================
initializeGlobalSearch();

function initializeGlobalSearch() {
  const searchInput = document.getElementById("globalSearch");
  if (!searchInput) return;

  let searchTimeout;

  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      hideSearchResults();
      return;
    }

    // Debounce de 300ms
    searchTimeout = setTimeout(() => {
      performGlobalSearch(query);
    }, 300);
  });

  /**
   * Effectue une recherche globale
   */
  async function performGlobalSearch(query) {
    console.log("🔍 Recherche:", query);

    try {
      // Rechercher dans plusieurs entités en parallèle
      const [products, categories, suppliers] = await Promise.all([
        searchProducts(query),
        searchCategories(query),
        searchSuppliers(query)
      ]);

      // Afficher les résultats
      displaySearchResults({ products, categories, suppliers });

    } catch (err) {
      console.error("❌ Erreur recherche:", err);
    }
  }

  /**
   * Recherche dans les produits
   */
  async function searchProducts(query) {
    try {
      const products = await apiFetch(API_ENDPOINTS.products.base);
      return products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
    } catch (err) {
      return [];
    }
  }

  /**
   * Recherche dans les catégories
   */
  async function searchCategories(query) {
    try {
      const categories = await apiFetch(API_ENDPOINTS.categories.base);
      return categories.filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3);
    } catch (err) {
      return [];
    }
  }

  /**
   * Recherche dans les fournisseurs
   */
  async function searchSuppliers(query) {
    try {
      const suppliers = await apiFetch(API_ENDPOINTS.suppliers.base);
      return suppliers.filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3);
    } catch (err) {
      return [];
    }
  }

  /**
   * Affiche les résultats de recherche
   */
  function displaySearchResults(results) {
    // À implémenter selon votre UI
    console.log("📊 Résultats:", results);
  }

  /**
   * Masque les résultats
   */
  function hideSearchResults() {
    // À implémenter
  }
}

// ========================================
// RAFRAÎCHISSEMENT AUTOMATIQUE DU TOKEN
// ========================================
initializeTokenRefresh();

function initializeTokenRefresh() {
  // Vérifier toutes les 5 minutes
  setInterval(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresIn = payload.exp * 1000 - Date.now();

      // Si expire dans moins de 30 minutes, rafraîchir
      if (expiresIn < 30 * 60 * 1000 && expiresIn > 0) {
        console.log("⏰ Token expire bientôt, rafraîchissement...");
        
        const response = await apiFetch(API_ENDPOINTS.auth.refresh, {
          method: 'POST'
        });

        if (response.token) {
          localStorage.setItem('token', response.token);
          console.log("✅ Token rafraîchi avec succès");
        }
      }

    } catch (err) {
      console.error("❌ Erreur rafraîchissement token:", err);
    }
  }, 5 * 60 * 1000); // Toutes les 5 minutes
}

// ========================================
// GESTION DU MENU HAMBURGER (Mobile)
// ========================================
initializeHamburgerMenu();

function initializeHamburgerMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const navOverlay = document.getElementById("navOverlay");

  if (!menuToggle || !sidebar) return;

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    navOverlay?.classList.toggle("active");
    document.body.classList.toggle("nav-open");
  });

  navOverlay?.addEventListener("click", () => {
    sidebar.classList.remove("active");
    navOverlay.classList.remove("active");
    document.body.classList.remove("nav-open");
  });
}

// ========================================
// FONCTION UTILITAIRE - Voir une commande
// ========================================
window.viewOrder = async function(orderId) {
  console.log("👁️ Voir commande #" + orderId);
  
  try {
    const order = await apiFetch(API_ENDPOINTS.orders.byId(orderId));
    console.log("📦 Commande:", order);
    
    // Rediriger vers la page de détails
    window.location.hash = `#/commandes/details?id=${orderId}`;
    
  } catch (err) {
    console.error("❌ Erreur chargement commande:", err);
    alert("Impossible de charger les détails de la commande");
  }
};

console.log("✅ Header initialisé avec toutes les fonctionnalités");
/**
 * ========================================
 * CONFIGURATION API - VERSION COMPLÈTE
 * Conforme au backend amélioré avec Cloudinary
 * ========================================
 */

// ========================================
// CONFIGURATION DE BASE
// ========================================

// URL de base de l'API
export const API_URL = "https://backentinvema.onrender.com/api";

// URL pour les images (legacy - utilisé par anciens fichiers)
// ⚠️ IMPORTANT : Avec Cloudinary, les URLs d'images viennent directement de l'API
// Elles sont au format : https://res.cloudinary.com/your-cloud/image/upload/...
export const API_URLimg = "https://backentinvema.onrender.com";

// ========================================
// ENDPOINTS ORGANISÉS PAR RESSOURCE
// ========================================

export const API_ENDPOINTS = {
  // ==================
  // AUTHENTIFICATION
  // ==================
  auth: {
    login: `${API_URL}/auth/login`,
    logout: `${API_URL}/auth/logout`,          // ✅ NOUVEAU
    refresh: `${API_URL}/auth/refresh`,        // ✅ NOUVEAU
    me: `${API_URL}/auth/me`                   // ✅ NOUVEAU
  },

  // ==================
  // UTILISATEURS
  // ==================
  users: {
    base: `${API_URL}/users`,
    byId: (id) => `${API_URL}/users/${id}`,
    create: `${API_URL}/users`,
    update: (id) => `${API_URL}/users/${id}`,
    delete: (id) => `${API_URL}/users/${id}`
  },

  // ==================
  // FOURNISSEURS
  // ==================
  suppliers: {
    base: `${API_URL}/supplier`,
    byId: (id) => `${API_URL}/supplier/${id}`,
    create: `${API_URL}/supplier`,
    update: (id) => `${API_URL}/supplier/${id}`,
    delete: (id) => `${API_URL}/supplier/${id}`
    // ✅ Note : Les images sont uploadées via FormData avec Cloudinary
    // Le backend retourne imageUrl: "https://res.cloudinary.com/..."
  },

  // ==================
  // CATÉGORIES
  // ==================
  categories: {
    base: `${API_URL}/categories`,
    byId: (id) => `${API_URL}/categories/${id}`,
    create: `${API_URL}/categories`,
    update: (id) => `${API_URL}/categories/${id}`,
    delete: (id) => `${API_URL}/categories/${id}`
    // ✅ Supporte les sous-catégories via parentID
    // ✅ Détection automatique des cycles
  },

  // ==================
  // PRODUITS
  // ==================
  products: {
    base: `${API_URL}/products`,
    byId: (id) => `${API_URL}/products/${id}`,
    create: `${API_URL}/products`,
    update: (id) => `${API_URL}/products/${id}`,
    delete: (id) => `${API_URL}/products/${id}`
    // ✅ Note : Les images sont uploadées via FormData avec Cloudinary
    // Le backend retourne imageUrl: "https://res.cloudinary.com/..."
  },

  // ==================
  // COMMANDES
  // ==================
  orders: {
    base: `${API_URL}/orders`,
    byId: (id) => `${API_URL}/orders/${id}`,    // ✅ NOUVEAU
    create: `${API_URL}/orders`,
    update: (id) => `${API_URL}/orders/${id}`,
    delete: (id) => `${API_URL}/orders/${id}`,
    notifications: `${API_URL}/orders/notifications`
    // ✅ Envoie automatiquement email au fournisseur
    // ✅ Validation des stocks
  },

  // ==================
  // REQUÊTES/DEMANDES
  // ==================
  requests: {
    base: `${API_URL}/requests`,
    byId: (id) => `${API_URL}/requests/${id}`,
    create: `${API_URL}/requests`,
    update: (id) => `${API_URL}/requests/${id}`,  // ✅ NOUVEAU
    delete: (id) => `${API_URL}/requests/${id}`,
    stats: `${API_URL}/requests/stats`            // ✅ NOUVEAU
    // ✅ Gestion automatique du stock après approbation
  }
};

// ========================================
// GESTION DE L'AUTHENTIFICATION
// ========================================

/**
 * Retourne les headers d'authentification
 * @param {boolean} includeContentType - Inclure Content-Type (false pour FormData)
 */
export function getAuthHeaders(includeContentType = true) {
  const token = localStorage.getItem('token');
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // ⚠️ IMPORTANT : Ne pas ajouter Content-Type pour FormData (upload fichiers)
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export function isAuthenticated() {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() < exp;
  } catch {
    return false;
  }
}

/**
 * Récupère le rôle de l'utilisateur
 * @returns {string|null} "ADMIN" | "MAGASINIER" | "EMPLOYE" | null
 */
export function getUserRole() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch {
    return null;
  }
}

/**
 * Récupère l'ID de l'utilisateur
 */
export function getUserId() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id; // attention: dans le backend, le payload contient "id"
  } catch {
    return null;
  }
}

/**
 * Récupère le nom de l'utilisateur
 */
export function getUserName() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.name;
  } catch {
    return null;
  }
}

/**
 * Déconnexion complète
 */
export function logout() {
  // Nettoyer localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  
  // Rediriger vers login
  window.location.replace('/index.html');
}

/**
 * Rafraîchit le token JWT
 * @returns {Promise<string|null>} Nouveau token ou null
 */
export async function refreshToken() {
  try {
    const response = await fetch(API_ENDPOINTS.auth.refresh, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      console.warn('⚠️ Impossible de rafraîchir le token');
      logout();
      return null;
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      console.log('✅ Token rafraîchi avec succès');
      return data.token;
    }

    return null;
  } catch (error) {
    console.error('❌ Erreur refresh token:', error);
    logout();
    return null;
  }
}

// ========================================
// FONCTION FETCH AMÉLIORÉE
// ========================================

/**
 * Fetch wrapper avec gestion automatique des erreurs
 * @param {string} url - URL de l'endpoint
 * @param {Object} options - Options fetch
 * @returns {Promise<any>} Données de la réponse
 */
export async function apiFetch(url, options = {}) {
  // Vérifier authentification (sauf pour login)
  if (!isAuthenticated() && !url.includes('/auth/login')) {
    console.warn('🔒 Session expirée');
    logout();
    throw new Error('SESSION_EXPIRED');
  }

  // Préparer les options
  const defaultOptions = {
    headers: getAuthHeaders(
      // Ne pas ajouter Content-Type si c'est du FormData
      !(options.body instanceof FormData)
    ),
    ...options
  };

  // Merger les headers si fournis
  if (options.headers) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      ...options.headers
    };
  }

  try {
    const response = await fetch(url, defaultOptions);

    // ========================================
    // GESTION DES CODES D'ERREUR
    // ========================================

    // 401 - Token expiré
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));

      // TOKEN_EXPIRED - Tenter de rafraîchir
      if (errorData.code === 'TOKEN_EXPIRED') {
        console.warn('⏰ Token expiré, tentative de refresh...');
        const newToken = await refreshToken();
        
        if (newToken) {
          // Réessayer la requête avec le nouveau token
          defaultOptions.headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, defaultOptions);
          
          if (!retryResponse.ok) {
            throw new Error(`HTTP ${retryResponse.status}`);
          }
          
          return await retryResponse.json();
        }
      }

      // TOKEN_INVALID ou échec refresh - Déconnexion
      logout();
      throw new Error('UNAUTHORIZED');
    }

    // 403 - Permissions insuffisantes
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      
      if (errorData.code === 'INSUFFICIENT_ROLE') {
        throw new Error('Vous n\'avez pas les permissions nécessaires');
      }
      
      if (errorData.code === 'ADMIN_ONLY') {
        throw new Error('Action réservée aux administrateurs');
      }
      
      throw new Error('Accès refusé');
    }

    // 404 - Ressource non trouvée
    if (response.status === 404) {
      throw new Error('Ressource non trouvée');
    }

    // 409 - Conflit (ex: hiérarchie circulaire)
    if (response.status === 409) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Conflit détecté');
    }

    // Autres erreurs
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
    }

    // Succès - Retourner les données
    return await response.json();

  } catch (error) {
    console.error('❌ Erreur API:', error.message);
    throw error;
  }
}

// ========================================
// HELPERS POUR UPLOAD DE FICHIERS
// ========================================

/**
 * Upload un fichier (image) avec FormData
 * @param {string} url - URL de l'endpoint
 * @param {FormData} formData - Données du formulaire avec fichier
 * @returns {Promise<any>} Réponse du serveur
 */
export async function uploadFile(url, formData) {
  if (!(formData instanceof FormData)) {
    throw new Error('formData doit être une instance de FormData');
  }

  // ⚠️ IMPORTANT : Ne pas définir Content-Type pour FormData
  // Le navigateur le fait automatiquement avec boundary
  return await apiFetch(url, {
    method: 'POST',
    body: formData
    // Pas de headers.Content-Type !
  });
}

/**
 * Met à jour un fichier (image)
 * @param {string} url - URL de l'endpoint
 * @param {FormData} formData - Données du formulaire avec fichier
 * @returns {Promise<any>} Réponse du serveur
 */
export async function updateFile(url, formData) {
  if (!(formData instanceof FormData)) {
    throw new Error('formData doit être une instance de FormData');
  }

  return await apiFetch(url, {
    method: 'PUT',
    body: formData
  });
}

// ========================================
// HELPERS POUR CLOUDINARY
// ========================================

/**
 * Vérifie si une URL d'image est une URL Cloudinary
 * @param {string} imageUrl - URL de l'image
 * @returns {boolean}
 */
export function isCloudinaryUrl(imageUrl) {
  return imageUrl && imageUrl.includes('cloudinary.com');
}

/**
 * Récupère l'URL complète d'une image
 * (Gère à la fois les URLs Cloudinary et les URLs locales legacy)
 * @param {string} imageUrl - URL de l'image depuis l'API
 * @returns {string} URL complète
 */
export function getImageUrl(imageUrl) {
  if (!imageUrl) return '/images/placeholder.png';
  
  // Si c'est déjà une URL Cloudinary, la retourner telle quelle
  if (isCloudinaryUrl(imageUrl)) {
    return imageUrl;
  }
  
  // Sinon, c'est une URL locale (legacy)
  return `${API_URLimg}${imageUrl}`;
}

// ========================================
// VÉRIFICATION DES PERMISSIONS
// ========================================

/**
 * Vérifie si l'utilisateur a le rôle requis
 * @param {string|string[]} requiredRole - Rôle(s) requis
 * @returns {boolean}
 */
export function hasRole(requiredRole) {
  const userRole = getUserRole();
  if (!userRole) return false;

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }

  return userRole === requiredRole;
}

/**
 * Vérifie si l'utilisateur est admin
 * @returns {boolean}
 */
export function isAdmin() {
  return getUserRole() === 'ADMIN';
}

/**
 * Vérifie si l'utilisateur est magasinier ou admin
 * @returns {boolean}
 */
export function isMagasinier() {
  return hasRole(['ADMIN', 'MAGASINIER']);
}

/**
 * Vérifie si l'utilisateur est employé
 * @returns {boolean}
 */
export function isEmploye() {
  return getUserRole() === 'EMPLOYE';
}

// Correction: il manquait une accolade fermante pour l'objet export default.
// Nous devons exporter correctement.
export default {
  // Config
  API_URL,
  API_URLimg,
  API_ENDPOINTS,
  
  // Auth
  getAuthHeaders,
  isAuthenticated,
  getUserRole,
  getUserId,
  getUserName,
  logout,
  refreshToken,
  
  // Fetch
  apiFetch,
  uploadFile,
  updateFile,
  
  // Cloudinary
  isCloudinaryUrl,
  getImageUrl,
  
  // Permissions
  hasRole,
  isAdmin,
  isMagasinier,
  isEmploye
};
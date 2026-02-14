/**
 * ========================================
 * MODULE DE GESTION DES CATÉGORIES
 * ========================================
 * 
 * Ce fichier gère toutes les opérations liées aux catégories :
 * - Récupération de la liste des catégories
 * - Création, modification, suppression de catégories
 */

import { API_URL, getAuthHeaders, isAuthenticated } from './apiUrl.js';

/**
 * Récupère la liste complète des catégories
 * @returns {Promise<Array>} Liste des catégories
 */
export async function categorieList() {
    // Vérifier l'authentification
    if (!isAuthenticated()) {
        console.warn('⚠️ Aucun token trouvé, utilisateur non connecté');
        redirectToLogin();
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/categories`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        // Gérer les erreurs HTTP
        if (!response.ok) {
            if (response.status === 401) {
                console.error('🔒 Session expirée');
                redirectToLogin();
                return [];
            }
            throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ ${data.length} catégorie(s) récupérée(s)`);
        return data;

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des catégories:', error);
        showErrorNotification('Impossible de charger les catégories');
        return [];
    }
}

/**
 * Récupère une catégorie spécifique par son ID
 * @param {number|string} categoryId - ID de la catégorie
 * @returns {Promise<Object|null>} La catégorie ou null si non trouvée
 */
export async function fetchCategoryById(categoryId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/categories/${categoryId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`⚠️ Catégorie #${categoryId} non trouvée`);
                return null;
            }
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const category = await response.json();
        console.log(`✅ Catégorie #${categoryId} récupérée:`, category.name);
        return category;

    } catch (error) {
        console.error(`❌ Erreur lors de la récupération de la catégorie #${categoryId}:`, error);
        return null;
    }
}

/**
 * Crée une nouvelle catégorie
 * @param {Object} categoryData - Données de la catégorie à créer
 * @param {string} categoryData.name - Nom de la catégorie
 * @param {string} [categoryData.description] - Description optionnelle
 * @returns {Promise<Object|null>} La catégorie créée ou null en cas d'erreur
 */
export async function createCategory(categoryData) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        // Validation
        if (!categoryData.name || categoryData.name.trim().length === 0) {
            throw new Error('Le nom de la catégorie est obligatoire');
        }

        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la création');
        }

        const newCategory = await response.json();
        console.log(`✅ Catégorie créée: ${newCategory.name} (ID: ${newCategory.id})`);
        showSuccessNotification(`Catégorie "${newCategory.name}" créée avec succès`);
        return newCategory;

    } catch (error) {
        console.error('❌ Erreur lors de la création de la catégorie:', error);
        showErrorNotification(error.message);
        return null;
    }
}

/**
 * Met à jour une catégorie existante
 * @param {number|string} categoryId - ID de la catégorie à modifier
 * @param {Object} updatedData - Nouvelles données de la catégorie
 * @returns {Promise<Object|null>} La catégorie mise à jour ou null en cas d'erreur
 */
export async function updateCategory(categoryId, updatedData) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/categories/${categoryId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la mise à jour');
        }

        const updatedCategory = await response.json();
        console.log(`✅ Catégorie #${categoryId} mise à jour`);
        showSuccessNotification('Catégorie mise à jour avec succès');
        return updatedCategory;

    } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour de la catégorie #${categoryId}:`, error);
        showErrorNotification(error.message);
        return null;
    }
}

/**
 * Supprime une catégorie
 * @param {number|string} categoryId - ID de la catégorie à supprimer
 * @returns {Promise<boolean>} True si suppression réussie, false sinon
 */
export async function deleteCategory(categoryId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/categories/${categoryId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la suppression');
        }

        console.log(`✅ Catégorie #${categoryId} supprimée`);
        showSuccessNotification('Catégorie supprimée avec succès');
        return true;

    } catch (error) {
        console.error(`❌ Erreur lors de la suppression de la catégorie #${categoryId}:`, error);
        showErrorNotification(error.message);
        return false;
    }
}

/**
 * Récupère les produits d'une catégorie spécifique
 * @param {number|string} categoryId - ID de la catégorie
 * @returns {Promise<Array>} Liste des produits de cette catégorie
 */
export async function fetchProductsByCategory(categoryId) {
    if (!isAuthenticated()) {
        redirectToLogin();
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/products?category=${categoryId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const products = await response.json();
        console.log(`✅ ${products.length} produit(s) trouvé(s) dans cette catégorie`);
        return products;

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des produits:', error);
        return [];
    }
}

/**
 * Compte le nombre de produits par catégorie
 * @returns {Promise<Object>} Objet avec categoryId comme clé et count comme valeur
 */
export async function getProductCountByCategory() {
    if (!isAuthenticated()) {
        redirectToLogin();
        return {};
    }

    try {
        const [categories, products] = await Promise.all([
            categorieList(),
            fetch(`${API_URL}/products`, {
                method: 'GET',
                headers: getAuthHeaders()
            }).then(res => res.json())
        ]);

        const counts = {};
        
        categories.forEach(category => {
            counts[category.id] = products.filter(
                product => product.categoryId === category.id || product.category === category.id
            ).length;
        });

        console.log('✅ Comptage des produits par catégorie effectué');
        return counts;

    } catch (error) {
        console.error('❌ Erreur lors du comptage des produits:', error);
        return {};
    }
}

/**
 * Vérifie si une catégorie peut être supprimée (pas de produits associés)
 * @param {number|string} categoryId - ID de la catégorie
 * @returns {Promise<boolean>} True si peut être supprimée, false sinon
 */
export async function canDeleteCategory(categoryId) {
    const products = await fetchProductsByCategory(categoryId);
    
    if (products.length > 0) {
        console.warn(`⚠️ La catégorie #${categoryId} contient ${products.length} produit(s)`);
        showErrorNotification(
            `Impossible de supprimer cette catégorie car elle contient ${products.length} produit(s)`
        );
        return false;
    }

    return true;
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Redirige vers la page de connexion
 */
function redirectToLogin() {
    localStorage.clear();
    window.location.href = '/login.html';
}

/**
 * Affiche une notification de succès
 * @param {string} message - Message à afficher
 */
function showSuccessNotification(message) {
    // À implémenter selon votre système de notifications
    console.log(`✅ ${message}`);
}

/**
 * Affiche une notification d'erreur
 * @param {string} message - Message à afficher
 */
function showErrorNotification(message) {
    // À implémenter selon votre système de notifications
    console.error(`❌ ${message}`);
}

// Export par défaut pour compatibilité
export default {
    categorieList,
    fetchCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchProductsByCategory,
    getProductCountByCategory,
    canDeleteCategory
};
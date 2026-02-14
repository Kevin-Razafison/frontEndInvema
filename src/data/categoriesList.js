/**
 * ========================================
 * MODULE DE GESTION DES CATÉGORIES
 * ========================================
 * 
 * Ce fichier gère toutes les opérations liées aux catégories :
 * - Récupération de la liste des catégories
 * - Création, modification, suppression de catégories
 */

import { API_ENDPOINTS, apiFetch, isAuthenticated } from './apiUrl.js';

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
        const data = await apiFetch(API_ENDPOINTS.categories.base);
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
        const category = await apiFetch(API_ENDPOINTS.categories.byId(categoryId));
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
 * @param {number|null} [categoryData.parentID] - ID de la catégorie parente
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

        const newCategory = await apiFetch(API_ENDPOINTS.categories.create, {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });

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
        const updatedCategory = await apiFetch(API_ENDPOINTS.categories.update(categoryId), {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });

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
        await apiFetch(API_ENDPOINTS.categories.delete(categoryId), {
            method: 'DELETE'
        });

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
        // Note: l'API ne supporte pas directement le filtre par catégorie, on filtre côté client
        const products = await apiFetch(API_ENDPOINTS.products.base);
        return products.filter(p => p.categoryId === Number(categoryId) || p.category?.id === Number(categoryId));

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
            apiFetch(API_ENDPOINTS.products.base)
        ]);

        const counts = {};
        
        categories.forEach(category => {
            counts[category.id] = products.filter(
                product => product.categoryId === category.id || product.category?.id === category.id
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
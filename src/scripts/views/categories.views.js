/**
 * ========================================
 * CATÉGORIES VIEWS - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Fonctionnalités complètes:
 * - Affichage des catégories
 * - Ajout/modification/suppression
 * - Gestion des sous-catégories
 * - Validation avancée
 */

import { render, renderSection } from "../utils/render.js";
import { form } from "../utils/renderForm.js";
import { categorieList, createCategory, updateCategory, deleteCategory } from "../../data/categoriesList.js";
import { API_ENDPOINTS, apiFetch } from "../../data/apiUrl.js";
import { interactiveNavBar } from "./NavBar.views.js";

function navigate(route) {
   window.location.hash = route;
}

/**
 * Affiche la vue principale des catégories
 */
export async function categories() {
    try {
        const categorieListVar = await categorieList();
        
        const cardsHTML = categorieListVar.map(cat => `
            <div class="option-card js-categorie-card" data-id="${cat.id}" data-name="${cat.name}">
                <div class="category-icon">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="category-info">
                    <div class="category-name">${cat.name}</div>
                    ${cat._count ? `
                        <div class="category-stats">
                            <span class="stat">
                                <i class="fas fa-box"></i> ${cat._count.products || 0}
                            </span>
                            ${cat._count.children ? `
                                <span class="stat">
                                    <i class="fas fa-folder-tree"></i> ${cat._count.children}
                                </span>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="category-actions">
                    <button class="action-btn edit-btn" data-id="${cat.id}" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${cat.id}" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join("");

        const categoriesHTML = `
            <div class="categories-header">
                <h2>Gestion des Catégories</h2>
                <div class="header-actions">
                    <button class="btn-primary add-categorie">
                        <i class="fas fa-plus"></i>
                        Ajouter Catégorie
                    </button>
                </div>
            </div>
            
            <div class="categories-stats">
                <div class="stat-card">
                    <i class="fas fa-folder"></i>
                    <div class="stat-info">
                        <span class="stat-value">${categorieListVar.length}</span>
                        <span class="stat-label">Catégories</span>
                    </div>
                </div>
            </div>

            <div class="categories-container">
                ${cardsHTML}
                
                <div class="option-card All-product-card js-categorie-card">
                    <div class="category-icon all">
                        <i class="fas fa-th"></i>
                    </div>
                    <div class="category-info">
                        <div class="category-name">Tous les produits</div>
                    </div>
                </div>
            </div>
        `;
        
        return renderSection("categories-pannel", categoriesHTML);

    } catch (error) {
        console.error("❌ Erreur affichage catégories:", error);
        return renderSection("categories-pannel", `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Impossible de charger les catégories</p>
            </div>
        `);
    }
}

/**
 * Active les cards de catégories (navigation)
 */
export function activateCategoryCard() {
    const categoryCards = document.querySelectorAll('.js-categorie-card');
    
    categoryCards.forEach((card) => {
        // Click sur la card (sauf boutons d'action)
        card.addEventListener('click', (e) => {
            // Ne pas naviguer si on clique sur les boutons d'action
            if (e.target.closest('.category-actions')) {
                return;
            }
            
            const categoryId = card.dataset.id;
            if (categoryId) {
                navigate(`#/productList?category=${categoryId}`);
            } else {
                navigate("#/productList");
            }
        });
    });

    // Gérer les boutons d'édition
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const categoryId = btn.dataset.id;
            await showEditCategoryModal(categoryId);
        });
    });

    // Gérer les boutons de suppression
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const categoryId = btn.dataset.id;
            await deleteCategoryWithConfirm(categoryId);
        });
    });
}

/**
 * Active le bouton d'ajout de catégorie
 */
async function activateCategorieButton() {
    if (!document.querySelector('.categories-pannel')) {
        return;
    }

    const addButton = document.querySelector('.add-categorie');
    if (!addButton) return;

    addButton.addEventListener('click', async () => {
        await showAddCategoryModal();
    });
}

/**
 * Affiche le modal d'ajout de catégorie
 */
async function showAddCategoryModal() {
    const categories = await categorieList();
    const categoriesNames = categories.map(cat => cat.name);

    const labelList = [{
        name: "Nom de la catégorie",
        className: "categorie-input category-name-input",
        placeholder: "Entrer le nom de la catégorie",
        type: "text",
        required: true
    }, {
        name: "Catégorie parente (optionnel)",
        className: "categorie-parent-select",
        type: "select",
        op: ["Aucune", ...categoriesNames]
    }];

    const buttonList = [{
        name: "Ajouter",
        className: "add-category btn-primary"
    }, {
        name: "Annuler",
        className: "annuler btn-secondary"
    }];

    const formHTML = form("Ajouter une Catégorie", labelList, buttonList);
    document.body.innerHTML += formHTML;
    
    await attachAddFormEvents(categories);
}

/**
 * Affiche le modal d'édition de catégorie
 */
async function showEditCategoryModal(categoryId) {
    try {
        const category = await apiFetch(API_ENDPOINTS.categories.byId(categoryId));
        const allCategories = await categorieList();
        
        // Filtrer pour ne pas inclure la catégorie actuelle et ses enfants
        const availableParents = allCategories
            .filter(cat => cat.id !== category.id)
            .map(cat => cat.name);

        const labelList = [{
            name: "Nom de la catégorie",
            className: "categorie-input category-name-input",
            placeholder: "Nom de la catégorie",
            type: "text",
            value: category.name,
            required: true
        }, {
            name: "Catégorie parente",
            className: "categorie-parent-select",
            type: "select",
            op: ["Aucune", ...availableParents],
            value: category.parent?.name || "Aucune"
        }];

        const buttonList = [{
            name: "Mettre à jour",
            className: "update-category btn-primary"
        }, {
            name: "Annuler",
            className: "annuler btn-secondary"
        }];

        const formHTML = form("Modifier la Catégorie", labelList, buttonList);
        document.body.innerHTML += formHTML;
        
        await attachEditFormEvents(category, allCategories);

    } catch (error) {
        console.error("❌ Erreur chargement catégorie:", error);
        alert("Impossible de charger la catégorie");
    }
}

/**
 * Attache les événements au formulaire d'ajout
 */
async function attachAddFormEvents(allCategories) {
    const formSection = document.querySelector('.form');
    if (!formSection) return;
    const nameInput = formSection.querySelector('.category-name-input');
    const parentSelect = formSection.querySelector('.categorie-parent-select');
    const addBtn = formSection.querySelector('.add-category');
    const cancelBtn = formSection.querySelector('.annuler');

    cancelBtn.addEventListener('click', () => {
        formSection.remove();
        interactiveNavBar();
    });

    addBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const parentName = parentSelect.value;

        // Validation
        if (!name) {
            showValidationError(formSection, "Veuillez saisir un nom de catégorie");
            return;
        }

        // Vérifier si existe déjà
        const exists = allCategories.some(cat => 
            cat.name.toLowerCase() === name.toLowerCase()
        );

        if (exists) {
            showValidationError(formSection, "Cette catégorie existe déjà");
            return;
        }

        // Trouver l'ID du parent
        let parentID = null;
        if (parentName && parentName !== "Aucune") {
            const parent = allCategories.find(cat => cat.name === parentName);
            parentID = parent?.id || null;
        }

        try {
            // Désactiver le bouton pendant la requête
            addBtn.disabled = true;
            addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';

            const newCategory = await createCategory({ name, parentID });

            if (newCategory) {
                formSection.remove();
                await refreshCategories();
                showSuccessToast("Catégorie créée avec succès");
            } else {
                throw new Error("Échec de la création");
            }

        } catch (error) {
            console.error("❌ Erreur création:", error);
            showValidationError(formSection, error.message || "Erreur lors de la création");
            addBtn.disabled = false;
            addBtn.innerHTML = '<i class="fas fa-plus"></i> Ajouter';
        }

        interactiveNavBar();
    });
}

/**
 * Attache les événements au formulaire d'édition
 */
async function attachEditFormEvents(category, allCategories) {
    const formSection = document.querySelector('.form');
    if (!formSection) return;
    const nameInput = formSection.querySelector('.category-name-input');
    const parentSelect = formSection.querySelector('.categorie-parent-select');
    const updateBtn = formSection.querySelector('.update-category');
    const cancelBtn = formSection.querySelector('.annuler');

    cancelBtn.addEventListener('click', () => {
        formSection.remove();
        interactiveNavBar();
    });

    updateBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const parentName = parentSelect.value;

        // Validation
        if (!name) {
            showValidationError(formSection, "Veuillez saisir un nom de catégorie");
            return;
        }

        // Vérifier l'unicité du nom (sauf pour la catégorie actuelle)
        const duplicate = allCategories.find(cat => 
            cat.id !== category.id && 
            cat.name.toLowerCase() === name.toLowerCase()
        );

        if (duplicate) {
            showValidationError(formSection, "Ce nom est déjà utilisé par une autre catégorie");
            return;
        }

        // Trouver l'ID du parent
        let parentID = null;
        if (parentName && parentName !== "Aucune") {
            const parent = allCategories.find(cat => cat.name === parentName);
            parentID = parent?.id || null;
        }

        try {
            updateBtn.disabled = true;
            updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mise à jour...';

            const updated = await updateCategory(category.id, { name, parentID });

            if (updated) {
                formSection.remove();
                await refreshCategories();
                showSuccessToast("Catégorie mise à jour avec succès");
            } else {
                throw new Error("Échec de la mise à jour");
            }

        } catch (error) {
            console.error("❌ Erreur mise à jour:", error);
            
            if (error.message.includes('hiérarchie circulaire')) {
                showValidationError(formSection, "Cette modification créerait une boucle dans la hiérarchie");
            } else {
                showValidationError(formSection, error.message || "Erreur lors de la mise à jour");
            }
            
            updateBtn.disabled = false;
            updateBtn.innerHTML = '<i class="fas fa-save"></i> Mettre à jour';
        }

        interactiveNavBar();
    });
}

/**
 * Supprime une catégorie avec confirmation
 */
async function deleteCategoryWithConfirm(categoryId) {
    try {
        const category = await apiFetch(API_ENDPOINTS.categories.byId(categoryId));
        
        // Vérifier les dépendances
        const hasChildren = category._count?.children > 0;
        const hasProducts = category._count?.products > 0;

        if (hasChildren) {
            alert(`Impossible de supprimer cette catégorie car elle contient ${category._count.children} sous-catégorie(s).`);
            return;
        }

        if (hasProducts) {
            alert(`Impossible de supprimer cette catégorie car elle contient ${category._count.products} produit(s).`);
            return;
        }

        const confirmed = confirm(
            `Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`
        );

        if (!confirmed) return;

        const success = await deleteCategory(categoryId);
        if (success) {
            await refreshCategories();
            showSuccessToast("Catégorie supprimée avec succès");
        }

    } catch (error) {
        console.error("❌ Erreur suppression:", error);
        alert(error.message || "Erreur lors de la suppression de la catégorie");
    }
}

/**
 * Rafraîchit l'affichage des catégories
 */
async function refreshCategories() {
    try {
        const categoriesData = await categorieList();
        const container = document.querySelector(".categories-container");
        
        if (!container) {
            // Si on n'est pas sur la page, la recharger complètement
            render("#/categories");
            return;
        }

        // Recréer le HTML
        const cardsHTML = categoriesData.map(cat => `
            <div class="option-card js-categorie-card" data-id="${cat.id}" data-name="${cat.name}">
                <div class="category-icon">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="category-info">
                    <div class="category-name">${cat.name}</div>
                    ${cat._count ? `
                        <div class="category-stats">
                            <span class="stat">
                                <i class="fas fa-box"></i> ${cat._count.products || 0}
                            </span>
                            ${cat._count.children ? `
                                <span class="stat">
                                    <i class="fas fa-folder-tree"></i> ${cat._count.children}
                                </span>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="category-actions">
                    <button class="action-btn edit-btn" data-id="${cat.id}" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${cat.id}" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join("");

        container.innerHTML = cardsHTML + `
            <div class="option-card All-product-card js-categorie-card">
                <div class="category-icon all">
                    <i class="fas fa-th"></i>
                </div>
                <div class="category-info">
                    <div class="category-name">Tous les produits</div>
                </div>
            </div>
        `;

        // Réattacher les événements
        activateCategoryCard();
        await activateCategorieButton();

    } catch (error) {
        console.error("❌ Erreur rafraîchissement:", error);
    }
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Affiche une erreur de validation dans le formulaire
 */
function showValidationError(formSection, message) {
    // Supprimer l'ancienne erreur
    const oldError = formSection.querySelector('.validation-error');
    if (oldError) oldError.remove();

    // Ajouter la nouvelle erreur
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;

    const formContainer = formSection.querySelector('.form-container');
    formContainer.insertBefore(errorDiv, formContainer.firstChild);

    // Faire disparaître après 5 secondes
    setTimeout(() => errorDiv.remove(), 5000);
}

/**
 * Affiche un toast de succès
 */
function showSuccessToast(message) {
    console.log(`✅ ${message}`);
    // À implémenter avec votre système de toast
}

// Exporter les fonctions
export { activateCategorieButton };
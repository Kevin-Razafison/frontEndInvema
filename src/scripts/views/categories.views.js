/**
 * ========================================
 * CATÉGORIES VIEWS - VERSION CORRIGÉE
 * ========================================
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
        
        const result = renderSection("categories-pannel", categoriesHTML);
        
        // ✅ IMPORTANT: Attacher les événements après le rendu
        setTimeout(() => {
            activateCategoryCard();
            activateCategorieButton();
        }, 0);
        
        return result;

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
        card.addEventListener('click', (e) => {
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

    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const categoryId = btn.dataset.id;
            await showEditCategoryModal(categoryId);
        });
    });

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
function activateCategorieButton() {
    const addButton = document.querySelector('.add-categorie');
    if (!addButton) {
        console.warn("⚠️ Bouton 'Ajouter Catégorie' non trouvé");
        return;
    }

    addButton.addEventListener('click', async () => {
        await showAddCategoryModal();
    });
    
    console.log("✅ Bouton 'Ajouter Catégorie' activé");
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
        type: "text"
    }, {
        name: "Catégorie parente (optionnel)",
        className: "categorie-parent-select",
        type: "select",
        op: ["Aucune", ...categoriesNames]
    }];

    const buttonList = [{
        name: "Ajouter",
        className: "add-category"
    }, {
        name: "Annuler",
        className: "annuler"
    }];

    const formHTML = form("Ajouter une Catégorie", labelList, buttonList);
    document.body.innerHTML += formHTML;
    
    await attachAddFormEvents(categories);
}

/**
 * Attache les événements au formulaire d'ajout
 */
async function attachAddFormEvents(categories) {
    const formSection = document.querySelector('.form');
    if (!formSection) return;
    
    const nameInput = formSection.querySelector('.category-name-input');
    const parentSelect = formSection.querySelector('.categorie-parent-select');
    const addBtn = formSection.querySelector('.add-category');
    const cancelBtn = formSection.querySelector('.annuler');

    // Bouton Annuler
    cancelBtn.addEventListener('click', () => {
        formSection.remove();
        interactiveNavBar();
    });

    // Bouton Ajouter
    addBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const parentName = parentSelect.value;

        // Validation
        if (!name) {
            alert("Veuillez saisir un nom de catégorie");
            return;
        }

        // Vérifier l'unicité du nom
        const duplicate = categories.find(cat => 
            cat.name.toLowerCase() === name.toLowerCase()
        );

        if (duplicate) {
            alert("Ce nom est déjà utilisé par une autre catégorie");
            return;
        }

        // Trouver l'ID du parent
        let parentID = null;
        if (parentName && parentName !== "Aucune") {
            const parent = categories.find(cat => cat.name === parentName);
            parentID = parent?.id || null;
        }

        try {
            addBtn.disabled = true;
            addBtn.textContent = "Ajout en cours...";

            const newCategory = await createCategory({ name, parentID });

            if (newCategory) {
                formSection.remove();
                await refreshCategories();
                alert("Catégorie créée avec succès !");
            } else {
                throw new Error("Échec de la création");
            }

        } catch (error) {
            console.error("❌ Erreur création:", error);
            alert(error.message || "Erreur lors de la création");
            addBtn.disabled = false;
            addBtn.textContent = "Ajouter";
        }

        interactiveNavBar();
    });
}

/**
 * Affiche le modal d'édition
 */
async function showEditCategoryModal(categoryId) {
    try {
        const category = await apiFetch(API_ENDPOINTS.categories.byId(categoryId));
        const allCategories = await categorieList();
        
        const availableParents = allCategories
            .filter(cat => cat.id !== category.id)
            .map(cat => cat.name);

        const labelList = [{
            name: "Nom de la catégorie",
            className: "categorie-input category-name-input",
            placeholder: "Nom de la catégorie",
            type: "text"
        }, {
            name: "Catégorie parente",
            className: "categorie-parent-select",
            type: "select",
            op: ["Aucune", ...availableParents]
        }];

        const buttonList = [{
            name: "Mettre à jour",
            className: "update-category"
        }, {
            name: "Annuler",
            className: "annuler"
        }];

        const formHTML = form("Modifier la Catégorie", labelList, buttonList);
        document.body.innerHTML += formHTML;

        // Pré-remplir les valeurs
        setTimeout(() => {
            const nameInput = document.querySelector('.category-name-input');
            const parentSelect = document.querySelector('.categorie-parent-select');
            
            if (nameInput) nameInput.value = category.name;
            if (parentSelect && category.parent) {
                parentSelect.value = category.parent.name;
            }
        }, 0);

        await attachEditFormEvents(category, allCategories);

    } catch (error) {
        console.error("❌ Erreur édition:", error);
        alert("Impossible de charger la catégorie");
    }
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

        if (!name) {
            alert("Veuillez saisir un nom de catégorie");
            return;
        }

        const duplicate = allCategories.find(cat => 
            cat.id !== category.id && 
            cat.name.toLowerCase() === name.toLowerCase()
        );

        if (duplicate) {
            alert("Ce nom est déjà utilisé par une autre catégorie");
            return;
        }

        let parentID = null;
        if (parentName && parentName !== "Aucune") {
            const parent = allCategories.find(cat => cat.name === parentName);
            parentID = parent?.id || null;
        }

        try {
            updateBtn.disabled = true;
            updateBtn.textContent = "Mise à jour...";

            const updated = await updateCategory(category.id, { name, parentID });

            if (updated) {
                formSection.remove();
                await refreshCategories();
                alert("Catégorie mise à jour avec succès !");
            } else {
                throw new Error("Échec de la mise à jour");
            }

        } catch (error) {
            console.error("❌ Erreur mise à jour:", error);
            alert(error.message || "Erreur lors de la mise à jour");
            updateBtn.disabled = false;
            updateBtn.textContent = "Mettre à jour";
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
            alert("Catégorie supprimée avec succès !");
        }

    } catch (error) {
        console.error("❌ Erreur suppression:", error);
        alert(error.message || "Erreur lors de la suppression");
    }
}

/**
 * Rafraîchit l'affichage
 */
async function refreshCategories() {
    try {
        const categoriesData = await categorieList();
        const container = document.querySelector(".categories-container");
        
        if (!container) {
            render("#/categories");
            return;
        }

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

        activateCategoryCard();
        activateCategorieButton();

    } catch (error) {
        console.error("❌ Erreur rafraîchissement:", error);
    }
}

export { activateCategorieButton };
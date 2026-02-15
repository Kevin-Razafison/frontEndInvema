/**
 * ========================================
 * CATÉGORIES VIEWS - VERSION DEBUG
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
    console.log("🎯 categories() appelée");
    
    try {
        const categorieListVar = await categorieList();
        console.log("📊 Catégories récupérées:", categorieListVar.length);
        
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
        
        console.log("✅ HTML rendu, attachement des événements...");
        
        // ✅ IMPORTANT: Attacher les événements APRÈS le rendu
        setTimeout(() => {
            console.log("🔧 Tentative d'attachement des événements...");
            activateCategoryCard();
            activateCategorieButton();
        }, 100); // Augmenté à 100ms pour être sûr
        
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
    console.log("🎯 activateCategoryCard() appelée");
    
    const categoryCards = document.querySelectorAll('.js-categorie-card');
    console.log(`   📌 ${categoryCards.length} cards trouvées`);
    
    categoryCards.forEach((card) => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.category-actions')) {
                return;
            }
            
            const categoryId = card.dataset.id;
            console.log("🖱️ Click sur card:", categoryId);
            
            if (categoryId) {
                navigate(`#/productList?category=${categoryId}`);
            } else {
                navigate("#/productList");
            }
        });
    });

    const editButtons = document.querySelectorAll('.edit-btn');
    console.log(`   📝 ${editButtons.length} boutons edit trouvés`);
    editButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const categoryId = btn.dataset.id;
            console.log("✏️ Click sur edit:", categoryId);
            await showEditCategoryModal(categoryId);
        });
    });

    const deleteButtons = document.querySelectorAll('.delete-btn');
    console.log(`   🗑️ ${deleteButtons.length} boutons delete trouvés`);
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const categoryId = btn.dataset.id;
            console.log("🗑️ Click sur delete:", categoryId);
            await deleteCategoryWithConfirm(categoryId);
        });
    });
}

/**
 * Active le bouton d'ajout de catégorie
 */
function activateCategorieButton() {
    console.log("🎯 activateCategorieButton() appelée");
    
    const addButton = document.querySelector('.add-categorie');
    
    if (!addButton) {
        console.error("❌ ERREUR: Bouton '.add-categorie' non trouvé !");
        console.log("   🔍 Boutons disponibles:", 
            Array.from(document.querySelectorAll('button')).map(b => b.className)
        );
        return;
    }

    console.log("✅ Bouton 'Ajouter Catégorie' trouvé:", addButton);
    
    // Supprimer les anciens listeners
    const newButton = addButton.cloneNode(true);
    addButton.parentNode.replaceChild(newButton, addButton);
    
    newButton.addEventListener('click', async (e) => {
        console.log("🖱️ CLICK SUR AJOUTER CATÉGORIE !");
        e.preventDefault();
        e.stopPropagation();
        await showAddCategoryModal();
    });
    
    console.log("✅ Event listener attaché au bouton");
}

/**
 * Affiche le modal d'ajout de catégorie
 */
async function showAddCategoryModal() {
    console.log("🎯 showAddCategoryModal() appelée");
    
    try {
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

        console.log("📋 Génération du formulaire...");
        const formHTML = form("Ajouter une Catégorie", labelList, buttonList);
        document.body.innerHTML += formHTML;
        
        console.log("✅ Formulaire ajouté au DOM");
        
        await attachAddFormEvents(categories);
        
    } catch (error) {
        console.error("❌ Erreur showAddCategoryModal:", error);
    }
}

/**
 * Attache les événements au formulaire d'ajout
 */
async function attachAddFormEvents(categories) {
    console.log("🎯 attachAddFormEvents() appelée");
    
    const formSection = document.querySelector('.form');
    if (!formSection) {
        console.error("❌ Formulaire non trouvé !");
        return;
    }
    
    const nameInput = formSection.querySelector('.category-name-input');
    const parentSelect = formSection.querySelector('.categorie-parent-select');
    const addBtn = formSection.querySelector('.add-category');
    const cancelBtn = formSection.querySelector('.annuler');

    console.log("📝 Éléments du formulaire:", {
        nameInput: !!nameInput,
        parentSelect: !!parentSelect,
        addBtn: !!addBtn,
        cancelBtn: !!cancelBtn
    });

    // Bouton Annuler
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            console.log("🖱️ Click sur Annuler");
            formSection.remove();
            interactiveNavBar();
        });
    }

    // Bouton Ajouter
    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            console.log("🖱️ CLICK SUR AJOUTER !");
            
            const name = nameInput.value.trim();
            const parentName = parentSelect.value;

            console.log("📝 Données:", { name, parentName });

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

            console.log("📤 Envoi de la requête:", { name, parentID });

            try {
                addBtn.disabled = true;
                addBtn.textContent = "Ajout en cours...";

                const newCategory = await createCategory({ name, parentID });

                console.log("✅ Catégorie créée:", newCategory);

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
        
        console.log("✅ Event listener attaché au bouton Ajouter");
    }
}

/**
 * Affiche le modal d'édition
 */
async function showEditCategoryModal(categoryId) {
    console.log("🎯 showEditCategoryModal() pour ID:", categoryId);
    // ... reste du code identique ...
}

/**
 * Attache les événements au formulaire d'édition
 */
async function attachEditFormEvents(category, allCategories) {
    // ... reste du code identique ...
}

/**
 * Supprime une catégorie avec confirmation
 */
async function deleteCategoryWithConfirm(categoryId) {
    console.log("🎯 deleteCategoryWithConfirm() pour ID:", categoryId);
    
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
    console.log("🔄 refreshCategories() appelée");
    
    try {
        const categoriesData = await categorieList();
        const container = document.querySelector(".categories-container");
        
        if (!container) {
            console.log("⚠️ Container non trouvé, rechargement complet");
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
        
        console.log("✅ Rafraîchissement terminé");

    } catch (error) {
        console.error("❌ Erreur rafraîchissement:", error);
    }
}

export { activateCategorieButton };
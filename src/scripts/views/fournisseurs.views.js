import { render, renderSection } from "../utils/render.js";
import { fournisseursCards, createSupplier } from "../../data/Fournisseurs.js";
import { form } from "../utils/renderForm.js";
import { interactiveNavBar } from "./NavBar.views.js";
import { getImageUrl } from "../../data/apiUrl.js";
import { categorieList } from "../../data/categoriesList.js";

function navigate(route) {    
    window.location.hash = route;
}

let fournisseursCards2 = [];

export async function fournisseurs() {
    try {
        fournisseursCards2 = await fournisseursCards();
        
        if (!fournisseursCards2 || fournisseursCards2.length === 0) {
            const emptyHTML = `
                <div class="fournisseurs-title">
                    <div>LISTE DES FOURNISSEURS</div>
                </div>
                <div class="list-fournisseur">
                    <div class="add-fournisseur">
                        <img src="./src/icons/icons-add.png" alt="Ajouter">
                        <div>Ajouter un fournisseur</div>
                    </div>
                </div>
                <div class="fournisseurs-empty"></div>
            `;
            return renderSection("fournisseurs-container", emptyHTML);
        }

        const fournisseursCardsHTML = fournisseursCards2.map((card, index) => `
            <div class="fournisseurs-card" data-id="${card.id}" style="animation-delay: ${index * 0.05}s;">
                <div class="image-container">
                    <img src="${getImageUrl(card.imageUrl)}" loading="lazy" alt="${card.name}" onerror="this.src='./src/images/placeholder.png'">
                </div>
                <div class="entreprise-name">${card.name}</div>
                <div class="type-materiels-fourni">${card.category || 'Non catégorisé'}</div>
                ${card.products?.length ? `<div class="product-count">📦 ${card.products.length}</div>` : ''}
            </div>
        `).join('');

        const fournisseursHTML = `
            <div class="fournisseurs-title">
                <div>LISTE DES FOURNISSEURS</div>
                <div style="color: #7f8c8d; font-size: 16px; font-weight: normal;">
                    ${fournisseursCards2.length} fournisseur(s)
                </div>
            </div>
            <div class="list-fournisseur">
                <div class="add-fournisseur">
                    <img src="./src/icons/icons-add.png" alt="Ajouter">
                    <div>Ajouter un fournisseur</div>
                </div>
                ${fournisseursCardsHTML}
            </div>
        `;
        
        return renderSection("fournisseurs-container", fournisseursHTML);
        
    } catch (error) {
        console.error('Erreur chargement fournisseurs:', error);
        return renderSection("fournisseurs-container", `
            <div class="fournisseurs-loading">Erreur de chargement</div>
        `);
    }
}

export async function addFournisseur() {
    if (!document.querySelector(".fournisseurs-container")) return;

    const addButton = document.querySelector('.add-fournisseur');
    if (!addButton) return;

    const categories = await categorieList();
    const categoriesNameList = categories.map(c => c.name);

    const labelList = [
        {
            name: "Nom du fournisseur *",
            className: "nom-fournisseur-input Nom",
            placeholder: "Ex: Tech Solutions Madagascar",
            type: "text",
        },
        {
            name: "Téléphone *",
            className: "phone-fournisseur-input Telephone",
            placeholder: "+261 XX XX XXX XX",
            type: "tel"
        },
        {
            name: "Email *",
            className: "email-fournisseur-input Email",
            placeholder: "contact@example.com",
            type: "email"
        },
        {
            name: "Adresse *",
            className: "adresse-fournisseur-input Adresse",
            placeholder: "Ex: Lot 123 Antananarivo",
            type: "text",
        },
        {
            name: "Logo du fournisseur *",
            className: "image-fournisseur-input Image",
            placeholder: "",
            type: "file",
            accept: "image/*"
        },
        {
            name: "Catégorie *",
            className: "category-fournisseur-input category",
            type: "select",
            op: categoriesNameList
        }
    ];

    const buttonList = [
        {
            name: "✓ Ajouter",
            className: "add-fournisseur-btn"
        },
        {
            name: "✖ Annuler",
            className: "annuler"
        }
    ];

    addButton.addEventListener('click', () => {
        document.body.innerHTML += form('Ajouter un nouveau fournisseur', labelList, buttonList);
        attachFormEvents();
    });
}

function attachFormEvents() {
    const formSection = document.querySelector('.form');
    if (!formSection) return;
    
    const inputs = formSection.querySelectorAll("input");
    const addBtn = formSection.querySelector('.add-fournisseur-btn');
    const cancel = formSection.querySelector('.annuler');
    const select = formSection.querySelector("select");

    // Annuler
    cancel.addEventListener('click', () => {
        formSection.remove();
        activateFournisseursButton();
        addFournisseur();
        interactiveNavBar();
    });

    // Ajouter
    addBtn.addEventListener('click', async () => {
        const name = inputs[0].value.trim();
        const phone = inputs[1].value.trim();
        const email = inputs[2].value.trim();
        const address = inputs[3].value.trim();
        const imageFile = inputs[4].files[0];
        const category = select.value;

        // Validation
        if (!name || !phone || !email || !address || !imageFile || !category) {
            alert("⚠️ Veuillez remplir tous les champs obligatoires");
            return;
        }

        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("⚠️ Email invalide");
            return;
        }

        // Validation téléphone
        if (phone.length < 10) {
            alert("⚠️ Numéro de téléphone invalide");
            return;
        }

        // Désactiver le bouton pendant le chargement
        addBtn.disabled = true;
        addBtn.textContent = "⏳ Ajout en cours...";

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("phone", phone);
            formData.append("email", email);
            formData.append("address", address);
            formData.append("category", category);
            formData.append("image", imageFile);

            const newSupplier = await createSupplier(formData);
            
            if (newSupplier) {
                console.log('✅ Fournisseur créé:', newSupplier);
                
                // Fermer le formulaire
                formSection.remove();
                
                // Recharger la liste avec animation
                await refreshFournisseurs();
                
                // Message de succès
                showToast('✅ Fournisseur ajouté avec succès !', 'success');
            } else {
                throw new Error("Échec de la création");
            }
        } catch (err) {
            console.error('❌ Erreur création:', err);
            alert("❌ Erreur lors de la création du fournisseur: " + err.message);
            addBtn.disabled = false;
            addBtn.textContent = "✓ Ajouter";
        }
    });
}

// Fonction pour recharger la liste
async function refreshFournisseurs() {
    try {
        // Afficher un loader
        const container = document.querySelector(".fournisseurs-container");
        if (!container) return;
        
        container.innerHTML = '<div class="fournisseurs-loading"></div>';
        
        // Recharger les données
        const fournisseurData = await fournisseursCards();
        
        // Reconstruire le HTML
        const fournisseursCardsHTML = fournisseurData.map((card, index) => `
            <div class="fournisseurs-card" data-id="${card.id}" style="animation-delay: ${index * 0.05}s;">
                <div class="image-container">
                    <img src="${getImageUrl(card.imageUrl)}" loading="lazy" alt="${card.name}" onerror="this.src='./src/images/placeholder.png'">
                </div>
                <div class="entreprise-name">${card.name}</div>
                <div class="type-materiels-fourni">${card.category || 'Non catégorisé'}</div>
                ${card.products?.length ? `<div class="product-count">📦 ${card.products.length}</div>` : ''}
            </div>
        `).join('');

        const fournisseursHTML = `
            <div class="fournisseurs-title">
                <div>LISTE DES FOURNISSEURS</div>
                <div style="color: #7f8c8d; font-size: 16px; font-weight: normal;">
                    ${fournisseurData.length} fournisseur(s)
                </div>
            </div>
            <div class="list-fournisseur">
                <div class="add-fournisseur">
                    <img src="./src/icons/icons-add.png" alt="Ajouter">
                    <div>Ajouter un fournisseur</div>
                </div>
                ${fournisseursCardsHTML}
            </div>
        `;
        
        container.innerHTML = fournisseursHTML;
        
        // Réactiver les événements
        activateFournisseursButton();
        addFournisseur();
        interactiveNavBar();
        
    } catch (err) {
        console.error('❌ Erreur refresh:', err);
        showToast('❌ Erreur lors du rechargement', 'error');
    }
}

// Activer les cartes cliquables
export function activateFournisseursButton() {
    if (!document.querySelector('.fournisseurs-container')) return;

    const allCards = document.querySelectorAll(".fournisseurs-card");
    allCards.forEach((card) => {
        card.addEventListener("click", async () => {
            const id = card.dataset.id;
            if (id) {
                await render(`#/fournisseurs/pannel`, parseInt(id));
            }
        });
    });
}

// Fonction toast (simple)
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
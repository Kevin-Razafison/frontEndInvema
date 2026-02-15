import { getImageUrl } from "../../data/apiUrl.js";
import { fournisseursCards, updateSupplier, deleteSupplier } from "../../data/Fournisseurs.js";
import { render, renderSection } from "./render.js";

function navigate(route) {
    window.location.hash = route;
}

export async function renderFournisseur(fournisseurId) {
    let fournisseurData = await fournisseursCards();
    let fournisseur = fournisseurData.find(f => f.id === fournisseurId);
    
    if (!fournisseur) {
        return renderSection("fournisseur-Pannel", "<p>Fournisseur non trouvé</p>");
    }

    // Produits fournis
    let productHTML = '';
    if (fournisseur.products && fournisseur.products.length > 0) {
        productHTML = fournisseur.products.map(product => `
            <div class="product-list-card">
                <div class="image-container">
                    <img src="${getImageUrl(product.imageUrl)}" alt="${product.name}" onerror="this.src='./src/images/placeholder.png'">
                </div>
                <div class="card-info">
                    <div class="product-name">${product.name}</div>
                    <div class="type-product">Catégorie : ${product.category?.name || '-'}</div>
                    <div class="Stock">Stock : ${product.quantity}</div>
                    <div class="prix">Prix : Ar ${product.price}</div>
                </div>
            </div>
        `).join('');
    } else {
        productHTML = '<p style="text-align: center; color: #95a5a6; padding: 40px;">Aucun produit pour le moment</p>';
    }

    let fournisseurAboutHTML = `
        <section class="fournisseurs-pannel">
            <div class="fournisseurs-section">
                <img src="./src/icons/icons-arrow-left.png" alt="retour" class="previous">
                
                <div class="image-side">
                    <img src="${getImageUrl(fournisseur.imageUrl)}" alt="${fournisseur.name}" class="fournisseur-logo" onerror="this.src='./src/images/placeholder.png'">
                    <input type="file" class="input-file" accept="image/*" style="display:none;">
                    <div class="button-container">
                        <button class="Modifier">✏️ Modifier</button>
                        <button class="Supprimer">🗑️ Supprimer</button>
                    </div>
                </div>

                <div class="info-side information-container" data-supplier-id="${fournisseur.id}">
                    <h2>${fournisseur.name}</h2>
                    
                    <!-- Mode lecture -->
                    <div class="view-mode">
                        <div class="info-item">
                            <span>📞</span>
                            <strong>Téléphone :</strong>
                            <span class="value-phone">${fournisseur.phone || "-"}</span>
                        </div>
                        
                        <div class="info-item">
                            <span>📧</span>
                            <strong>Email :</strong>
                            <span class="value-email">${fournisseur.email || "-"}</span>
                        </div>
                        
                        <div class="info-item">
                            <span>📍</span>
                            <strong>Adresse :</strong>
                            <span class="value-address">${fournisseur.address || "-"}</span>
                        </div>
                        
                        <div class="info-item">
                            <span>🏷️</span>
                            <strong>Catégorie :</strong>
                            <span class="value-category">${fournisseur.category || "-"}</span>
                        </div>
                        
                        <div class="info-item">
                            <span>📦</span>
                            <strong>Produits fournis :</strong>
                            <span class="value-products">${fournisseur.products?.length || 0}</span>
                        </div>
                    </div>
                    
                    <!-- Mode édition (caché par défaut) -->
                    <div class="edit-mode" style="display:none;">
                        <div class="form-group">
                            <label>📞 Téléphone *</label>
                            <input type="tel" class="input-phone" value="${fournisseur.phone || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>📧 Email *</label>
                            <input type="email" class="input-email" value="${fournisseur.email || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>📍 Adresse *</label>
                            <input type="text" class="input-address" value="${fournisseur.address || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>🏷️ Catégorie *</label>
                            <input type="text" class="input-category" value="${fournisseur.category || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>📷 Changer le logo</label>
                            <div class="image-upload-zone" onclick="document.querySelector('.input-file').click()">
                                <span>Cliquer pour sélectionner une image</span>
                            </div>
                        </div>
                        
                        <div class="button-container-edit">
                            <button class="terminer-modif">✓ Confirmer</button>
                            <button class="annuler-modif">✖ Annuler</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="product-List-Provided">
                <h3>📦 Produits fournis (${fournisseur.products?.length || 0})</h3>
                <div class="List-product-provide-container">
                    ${productHTML}
                </div>
            </div>
        </section>
    `;

    return renderSection("fournisseur-Pannel", fournisseurAboutHTML);
}

export function previousButton() {
    const previous = document.querySelector(".previous");
    if (!previous) {
        console.warn("Bouton retour non trouvé");
        return;
    }

    // Supprimer les anciens écouteurs pour éviter les doublons
    previous.replaceWith(previous.cloneNode(true));
    const newPrevious = document.querySelector(".previous");
    
    newPrevious.addEventListener('click', () => {
        render("#/fournisseurs"); // Utiliser render au lieu de navigate
    });
}

export async function modifierButton() {
    const modifier = document.querySelector(".Modifier");
    if (!modifier) {
        console.warn("Bouton Modifier non trouvé");
        return;
    }

    // Nettoyer les anciens écouteurs
    modifier.replaceWith(modifier.cloneNode(true));
    const newModifier = document.querySelector(".Modifier");

    newModifier.addEventListener("click", () => {
        const viewMode = document.querySelector(".view-mode");
        const editMode = document.querySelector(".edit-mode");
        const buttonContainer = document.querySelector(".image-side .button-container");
        const inputFile = document.querySelector(".input-file");
        
        if (!viewMode || !editMode || !buttonContainer) {
            console.error("Éléments manquants pour le mode édition");
            return;
        }
        
        // Basculer les modes
        viewMode.style.display = "none";
        editMode.style.display = "block";
        buttonContainer.style.display = "none";
        if (inputFile) inputFile.style.display = "block";

        // Gérer l'annulation (en nettoyant les anciens écouteurs)
        const annulerBtn = document.querySelector(".annuler-modif");
        if (annulerBtn) {
            annulerBtn.replaceWith(annulerBtn.cloneNode(true));
            const newAnnuler = document.querySelector(".annuler-modif");
            newAnnuler.addEventListener("click", (e) => {
                e.preventDefault();
                viewMode.style.display = "block";
                editMode.style.display = "none";
                buttonContainer.style.display = "flex";
                if (inputFile) inputFile.style.display = "none";
            });
        }

        // Gérer la confirmation
        const terminerBtn = document.querySelector(".terminer-modif");
        if (terminerBtn) {
            terminerBtn.replaceWith(terminerBtn.cloneNode(true));
            const newTerminer = document.querySelector(".terminer-modif");
            newTerminer.addEventListener("click", async (e) => {
                e.preventDefault();
                
                const informationContainer = document.querySelector(".information-container");
                const supplierID = Number(informationContainer?.dataset.supplierId);
                
                const phone = document.querySelector(".input-phone")?.value.trim();
                const email = document.querySelector(".input-email")?.value.trim();
                const address = document.querySelector(".input-address")?.value.trim();
                const category = document.querySelector(".input-category")?.value.trim();
                
                if (!phone || !email || !address || !category) {
                    alert("⚠️ Veuillez remplir tous les champs obligatoires");
                    return;
                }
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    alert("⚠️ Email invalide");
                    return;
                }

                try {
                    newTerminer.disabled = true;
                    newTerminer.textContent = "⏳ Modification...";
                    
                    const formData = new FormData();
                    formData.append("phone", phone);
                    formData.append("email", email);
                    formData.append("address", address);
                    formData.append("category", category);

                    const fileInput = document.querySelector(".input-file");
                    if (fileInput?.files[0]) {
                        formData.append("image", fileInput.files[0]);
                    }

                    const updated = await updateSupplier(supplierID, formData);
                    
                    if (updated) {
                        // Recharger la vue du fournisseur
                        render("#/fournisseurs/pannel", supplierID);
                    } else {
                        throw new Error("Échec de la modification");
                    }
                } catch (err) {
                    console.error('❌ Erreur:', err);
                    alert("❌ Erreur lors de la modification: " + err.message);
                    newTerminer.disabled = false;
                    newTerminer.textContent = "✓ Confirmer";
                }
            });
        }
    });
}

export async function SupprimerButton() {
    const supprimer = document.querySelector(".Supprimer");
    if (!supprimer) return;
    
    supprimer.replaceWith(supprimer.cloneNode(true));
    const newSupprimer = document.querySelector(".Supprimer");
    
    newSupprimer.addEventListener('click', async () => {
        const informationContainer = document.querySelector(".information-container");
        const supplierID = Number(informationContainer?.dataset.supplierId);
        
        if (!confirm("⚠️ Êtes-vous sûr de vouloir supprimer ce fournisseur ?\nCette action est irréversible.")) {
            return;
        }
        
        try {
            newSupprimer.disabled = true;
            newSupprimer.textContent = "⏳ Suppression...";
            
            const success = await deleteSupplier(supplierID);
            
            if (success) {
                render("#/fournisseurs");
            } else {
                throw new Error("Échec de la suppression");
            }
        } catch (err) {
            console.error('❌ Erreur:', err);
            alert("❌ Erreur lors de la suppression: " + err.message);
            newSupprimer.disabled = false;
            newSupprimer.textContent = "🗑️ Supprimer";
        }
    });
}
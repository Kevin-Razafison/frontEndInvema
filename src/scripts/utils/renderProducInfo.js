import { getImageUrl } from "../../data/apiUrl.js";
import { categorieList } from "../../data/categoriesList.js";
import { fournisseursCards } from "../../data/Fournisseurs.js";
import { fetchProducts, updateProduct, deleteProduct } from "../../data/product.js";
import { interactiveNavBar } from "../views/NavBar.views.js";
import { render, renderSection } from "./render.js";

export async function renderProduct(productId) {
    const categorys = await categorieList();
    const categoryOptionsHTML = categorys.map(cat => 
        `<option value="${cat.id}" ${cat.id === product.categoryId ? 'selected' : ''}>${cat.name}</option>`
    ).join('');

    const suppliers = await fournisseursCards();
    const suppliersOptionsHTML = suppliers.map(sup => 
        `<option value="${sup.id}" ${sup.id === product.supplierId ? 'selected' : ''}>${sup.name}</option>`
    ).join('');

    const products = await fetchProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return renderSection("product-Pannel", "<p>Produit non trouvé</p>");

    const productAboutHTML = `
        <section class="product-pannel">
            <div class="previous arrow">
                <img src="./src/icons/icons-arrow-left.png" alt="retour">
            </div>
            
            <div class="product-image-section">
                <img src="${getImageUrl(product.imageUrl)}" alt="${product.name}" class="product-image" onerror="this.src='./src/images/placeholder.png'">
                <input type="file" class="imageUrl" data-imgUrl="${product.imageUrl}" accept="image/*" style="display:none;">
            </div>
            
            <div class="product-section">
                <div class="information-product-container" data-product-id="${product.id}">
                    <h2>📦 Informations du produit</h2>
                    
                    <!-- Mode lecture -->
                    <div class="view-mode">
                        <div class="info-row">
                            <span class="info-label">Nom :</span>
                            <span class="info-value product-name-value">${product.name}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Description :</span>
                            <span class="info-value product-description-value">${product.description || 'Aucune description'}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">SKU :</span>
                            <span class="info-value product-sku-value">${product.sku || '-'}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Quantité :</span>
                            <span class="info-value product-quantity-value">📦 ${product.quantity}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Prix :</span>
                            <span class="info-value product-price-value" style="color: #27ae60; font-weight: 700;">Ar ${product.price}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Emplacement :</span>
                            <span class="info-value product-location-value">${product.location || '-'}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Catégorie :</span>
                            <span class="info-value product-category-value">${product.category?.name || '-'}</span>
                        </div>
                        
                        <div class="info-row">
                            <span class="info-label">Fournisseur :</span>
                            <span class="info-value product-supplier-value">${product.supplier?.name || '-'}</span>
                        </div>
                    </div>
                    
                    <!-- Mode édition (caché par défaut) -->
                    <div class="edit-mode" style="display:none;">
                        <div class="form-group">
                            <label>Nom *</label>
                            <input type="text" class="input-modifier-name" value="${product.name}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Description</label>
                            <textarea class="input-modifier-description" rows="3">${product.description || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>SKU</label>
                            <input type="text" class="input-modifier-sku" value="${product.sku || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label>Quantité *</label>
                            <input type="number" class="input-modifier-quantity" value="${product.quantity}" required min="0">
                        </div>
                        
                        <div class="form-group">
                            <label>Prix (Ar) *</label>
                            <input type="number" class="input-modifier-price" value="${product.price}" required min="0" step="0.01">
                        </div>
                        
                        <div class="form-group">
                            <label>Emplacement</label>
                            <input type="text" class="input-modifier-location" value="${product.location || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label>Catégorie</label>
                            <select class="input-modifier-category">
                                <option value="">Aucune catégorie</option>
                                ${categoryOptionsHTML}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Fournisseur</label>
                            <select class="input-modifier-supplier">
                                <option value="">Aucun fournisseur</option>
                                ${suppliersOptionsHTML}
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="button-container">
                    <button class="Modifier">Modifier</button>
                    <button class="Supprimer">Supprimer</button>
                    <button class="terminer-modif" style="display:none;">Confirmer</button>
                    <button class="annuler-modif" style="display:none;">Annuler</button>
                </div>
            </div>
        </section>
    `;

    return renderSection("product-Pannel", productAboutHTML);
}

export function previousProductButton() {
    const previous = document.querySelector(".previous");
    if (!previous) return;

    previous.addEventListener('click', () => {
        render("#/productList");
        interactiveNavBar();
    });
}

export async function modifierProductButton() {
    const modifier = document.querySelector(".Modifier");
    if (!modifier) return;

    modifier.addEventListener("click", () => {
        // Passer en mode édition
        document.querySelector(".view-mode").style.display = "none";
        document.querySelector(".edit-mode").style.display = "block";
        document.querySelector(".product-image").style.display = "none";
        document.querySelector(".imageUrl").style.display = "block";
        
        // Basculer les boutons
        modifier.style.display = "none";
        document.querySelector(".Supprimer").style.display = "none";
        document.querySelector(".terminer-modif").style.display = "inline-flex";
        document.querySelector(".annuler-modif").style.display = "inline-flex";
        
        // Gérer l'annulation
        document.querySelector(".annuler-modif").addEventListener("click", () => {
            document.querySelector(".view-mode").style.display = "block";
            document.querySelector(".edit-mode").style.display = "none";
            document.querySelector(".product-image").style.display = "block";
            document.querySelector(".imageUrl").style.display = "none";
            
            modifier.style.display = "inline-flex";
            document.querySelector(".Supprimer").style.display = "inline-flex";
            document.querySelector(".terminer-modif").style.display = "none";
            document.querySelector(".annuler-modif").style.display = "none";
        });
        
        // Gérer la confirmation
        document.querySelector(".terminer-modif").addEventListener("click", async () => {
            const informationContainer = document.querySelector(".information-product-container");
            const productId = Number(informationContainer.dataset.productId);
            
            const name = document.querySelector(".input-modifier-name").value.trim();
            const description = document.querySelector(".input-modifier-description").value.trim();
            const sku = document.querySelector(".input-modifier-sku").value.trim();
            const quantity = Number(document.querySelector(".input-modifier-quantity").value);
            const price = Number(document.querySelector(".input-modifier-price").value);
            const location = document.querySelector(".input-modifier-location").value.trim();
            const categoryId = Number(document.querySelector(".input-modifier-category").value) || null;
            const supplierId = Number(document.querySelector(".input-modifier-supplier").value) || null;

            if (!name || !quantity || !price) {
                alert("Veuillez remplir les champs obligatoires (nom, quantité, prix)");
                return;
            }

            try {
                const formData = new FormData();
                formData.append("name", name);
                if (description) formData.append("description", description);
                formData.append("quantity", quantity);
                if (sku) formData.append("sku", sku);
                formData.append("price", price);
                if (location) formData.append("location", location);
                if (categoryId) formData.append("categoryId", categoryId);
                if (supplierId) formData.append("supplierId", supplierId);

                const fileInput = document.querySelector(".imageUrl");
                if (fileInput && fileInput.files[0]) {
                    formData.append("imageUrl", fileInput.files[0]);
                }

                const updated = await updateProduct(productId, formData);
                if (updated) {
                    // Recharger la page du produit
                    await renderProduct(productId);
                    previousProductButton();
                    modifierProductButton();
                    SupprimerProductButton();
                } else {
                    throw new Error("Échec de la modification");
                }
            } catch (err) {
                console.error(err);
                alert("Erreur lors de la modification: " + err.message);
            }
        });
    });
}

export async function SupprimerProductButton() {
    const supprimer = document.querySelector(".Supprimer");
    if (!supprimer) return;
    
    supprimer.addEventListener('click', async () => {
        const informationContainer = document.querySelector(".information-product-container");
        const productId = Number(informationContainer.dataset.productId);
        
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;
        
        try {
            const success = await deleteProduct(productId);
            if (success) {
                render("#/productList");
                interactiveNavBar();
            } else {
                throw new Error("Échec de la suppression");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la suppression: " + err.message);
        }
    });
}
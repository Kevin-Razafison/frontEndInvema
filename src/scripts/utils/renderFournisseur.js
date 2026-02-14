import { getImageUrl } from "../../data/apiUrl.js";
import { fournisseursCards, updateSupplier, deleteSupplier } from "../../data/Fournisseurs.js";
import { interactiveNavBar } from "../views/NavBar.views.js";
import { render, renderSection } from "./render.js";

function navigate(route) {
   window.location.hash = route;
}

export async function renderFournisseur(fournisseurId) {
    let fournisseurData = await fournisseursCards();
    let fournisseur = fournisseurData.find(f => f.id === fournisseurId);
    if (!fournisseur) return renderSection("fournisseur-Pannel", "<p>Fournisseur non trouvé</p>");

    let productHTML = fournisseur.products.map(product => `
        <div class="product-list-card">
            <div class="image-container">
                <img src="${getImageUrl(product.imageUrl) || './src/images/placeholder.png'}" alt="product-images">
            </div>
            <div class="card-info">
                <div class="product-name">${product.name}</div>
                <div class="type-product">Catégorie : ${product.category?.name || '-'}</div>
                <div class="Stock">Stock : ${product.quantity}</div>
                <div class="prix">Prix : Ar ${product.price}</div>
            </div>
        </div>
    `).join('') || "<p>Aucun produit pour le moment.</p>";

    let fournisseurAboutHTML = `
        <section class="fournisseurs-pannel">
            <div class="fournisseurs-section">
                <img src="./src/icons/icons-arrow-left.png" alt="retour" class="previous">
                <div class="image-side">
                    <img src="${getImageUrl(fournisseur.imageUrl)}" alt="fournisseur-logo" class="fournisseur-logo" onerror="this.src='./src/images/placeholder.png'">
                    <input type="file" class="input-file" accept="image/*" style="display:none;">
                    <div class="button-container">
                        <button class="Modifier">Modifier</button>
                        <button class="Supprimer">Supprimer</button>
                    </div>
                </div>

                <div class="info-side information-container" data-supplier-id="${fournisseur.id}">
                    <h2>${fournisseur.name}</h2>
                    <div class="info-item">📞 Téléphone : <span>${fournisseur.phone || "-"}</span> <input type="text" value="${fournisseur.phone || ''}" /></div>
                    <div class="info-item">📧 Email : <span>${fournisseur.email || "-"}</span> <input type="text" value="${fournisseur.email || ''}" /></div>
                    <div class="info-item">📍 Adresse : <span>${fournisseur.address || "-"}</span> <input type="text" value="${fournisseur.address || ''}" /></div>
                    <div class="info-item">🏷️ Catégorie : <span>${fournisseur.category || "-"}</span> <input type="text" value="${fournisseur.category || ''}" /></div>
                    <div class="info-item">📦 Produits fournis : <span>${fournisseur.products?.length || 0}</span></div>
                    <button class="terminer-modif" style="display:none;">✅ Confirmer Modification</button>
                </div>
            </div>

            <div class="product-List-Provided">
                <h3>Produits fournis</h3>
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
    if (!previous) return;

    previous.addEventListener('click', () => {
        render("#/fournisseurs");
        interactiveNavBar();
    });
}

export async function modifierButton() {
    const modifier = document.querySelector(".Modifier");
    if (!modifier) return;

    modifier.addEventListener("click", () => {
        const informationContainer = document.querySelector(".information-container");
        const supplierID = Number(informationContainer?.dataset.supplierId);
        const divList = informationContainer.querySelectorAll("div.info-item");
        document.querySelector(".fournisseurs-section .button-container").style.display = "none";
        divList.forEach(div => {
            div.querySelector("span").style.display = "none";
            div.querySelector("input").style.display = "block";
        });
        document.querySelector(".terminer-modif").style.display = "block";
        document.querySelector(".terminer-modif").addEventListener("click", async () => {
            const data = [];
            divList.forEach(div => {
                const input = div.querySelector("input");
                if (input) data.push(input.value);
            });
            const [name, phone, email, address, category] = data;
            if (!name || !phone || !email || !address || !category) {
                alert("Veuillez remplir tous les champs");
                return;
            }

            try {
                const formData = new FormData();
                formData.append("name", name);
                formData.append("phone", phone);
                formData.append("email", email);
                formData.append("address", address);
                formData.append("category", category);

                const fileInput = document.querySelector(".input-file");
                if (fileInput.files[0]) {
                    formData.append("image", fileInput.files[0]);
                }

                const updated = await updateSupplier(supplierID, formData);
                if (updated) {
                    render("#/fournisseurs/pannel", supplierID);
                } else {
                    throw new Error("Échec de la modification");
                }
            } catch (err) {
                console.error(err);
                alert("Erreur lors de la modification");
            }
        });
    });
}

export async function SupprimerButton() {
    const supprimer = document.querySelector(".Supprimer");
    if (!supprimer) return;
    supprimer.addEventListener('click', async () => {
        const informationContainer = document.querySelector(".information-container");
        const supplierID = Number(informationContainer.dataset.supplierId);
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) return;
        try {
            const success = await deleteSupplier(supplierID);
            if (success) {
                navigate("#/fournisseurs");
            } else {
                throw new Error("Échec de la suppression");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la suppression");
        }
    });
}
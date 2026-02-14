import { getImageUrl } from "../../data/apiUrl.js";
import { categorieList } from "../../data/categoriesList.js";
import { fournisseursCards } from "../../data/Fournisseurs.js";
import { fetchProducts, updateProduct, deleteProduct } from "../../data/product.js";
import { interactiveNavBar } from "../views/NavBar.views.js";
import { render, renderSection } from "./render.js";

export async function renderProduct(productId) {
    const categorys = await categorieList();
    const categoryOptionsHTML = categorys.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');

    const suppliers = await fournisseursCards();
    const suppliersOptionsHTML = suppliers.map(sup => `<option value="${sup.id}">${sup.name}</option>`).join('');

    const products = await fetchProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return renderSection("product-Pannel", "<p>Produit non trouvé</p>");

    const productAboutHTML = `
        <section class="product-pannel">
            <div class="previous arrow">
                <img src="./src/icons/icons-arrow-left.png" alt="retour">
            </div>
            <div>
                <img src="${getImageUrl(product.imageUrl)}" alt="product-logo" class="product-image" onerror="this.src='./src/images/placeholder.png'">
            </div>
            <div class="product-section">  
                <div class="image-container">
                    <input type="file" class="imageUrl" data-imgUrl="${product.imageUrl}" accept="image/*">
                    <div class="button-container">
                        <button class="Modifier">Modifier</button>
                        <button class="Supprimer">Supprimer</button>
                    </div>
                </div>
                <div class="information-product-container" data-product-id="${product.id}">
                    <div class="product-name">
                        Name : <span class="supplier-name">${product.name}</span> <input type="text" class="input-modifier-name" value="${product.name}" required>
                    </div>
                    <div class="product-description">
                        Description : <span class="supplier-phone">${product.description || ''}</span> <input type="text" class="input-modifier-description" value="${product.description || ''}" required>
                    </div>
                    <div class="product-sku">
                        SKU : <span class="supplier-email">${product.sku || ''}</span> <input type="text" class="input-modifier-sku" value="${product.sku || ''}" required>
                    </div>
                    <div class="product-quantity">
                        Quantité : <span class="supplier-address">${product.quantity}</span> <input type="text" class="input-modifier-quantity" value="${product.quantity}" required>
                    </div>
                    <div class="product-price">
                        Prix : <span class="supplier-category">${product.price}</span> <input type="text" class="input-modifier-price" value="${product.price}" required>
                    </div>
                    <div class="product-location">
                        Location : <span class="supplier-count">${product.location || ''}</span> <input type="text" class="input-modifier-location" value="${product.location || ''}" required>
                    </div>
                    <div class="product-category">
                        Catégorie : <span class="supplier-count">${product.category?.name || ''}</span> 
                        <select style="display:none;">
                            ${categoryOptionsHTML}
                        </select>
                    </div>
                    <div class="product-supplier">
                        Fournisseur : <span class="supplier-count">${product.supplier?.name || ''}</span>
                        <select style="display:none;">
                            ${suppliersOptionsHTML}
                        </select>                        
                    </div>
                </div>
                <div class="terminer-modif" style="cursor:pointer; display:none">Confirmer Modification</div>
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
        const informationContainer = document.querySelector(".information-product-container");
        const productId = Number(informationContainer.dataset.productId);
        const divList = informationContainer.querySelectorAll("div");
        document.querySelector(".product-section .button-container").style.display = "none";
        divList.forEach(div => {
            const span = div.querySelector("span");
            if (span) span.style.display = "none";
            const input = div.querySelector("input");
            if (input) input.style.display = "block";
            const select = div.querySelector("select");
            if (select) select.style.display = "block";
        });
        document.querySelector(".terminer-modif").style.display = "block";
        document.querySelector(".terminer-modif").addEventListener("click", async () => {
            const data = [];
            divList.forEach((div, index) => {
                if (div.querySelector("input")) {
                    data[index] = div.querySelector("input").value;
                } else if (div.querySelector("select")) {
                    data[index] = Number(div.querySelector("select").value);
                }
            });

            const [name, description, sku, quantity, price, location, categoryId, supplierId] = data;
            if (!name || !quantity || !price) {
                alert("Veuillez remplir les champs obligatoires");
                return;
            }

            try {
                const formData = new FormData();
                formData.append("name", name);
                if (description) formData.append("description", description);
                formData.append("quantity", Number(quantity));
                if (sku) formData.append("sku", sku);
                formData.append("price", Number(price));
                if (location) formData.append("location", location);
                if (categoryId) formData.append("categoryId", categoryId);
                if (supplierId) formData.append("supplierId", supplierId);

                const fileInput = document.querySelector(".imageUrl");
                if (fileInput && fileInput.files[0]) {
                    formData.append("imageUrl", fileInput.files[0]);
                }

                const updated = await updateProduct(productId, formData);
                if (updated) {
                    render("#/productList/Pannel", productId);
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
                navigate("#/productList");
                interactiveNavBar();
            } else {
                throw new Error("Échec de la suppression");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la suppression");
        }
    });
}
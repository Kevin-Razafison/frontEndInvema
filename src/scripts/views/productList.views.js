import { fetchProducts } from "../../data/product.js";
import { render, renderSection } from "../utils/render.js";
import { categorieList } from "../../data/categoriesList.js";
import { fournisseursCards } from "../../data/Fournisseurs.js";
import { form } from "../utils/renderForm.js";
import { API_URL, API_URLimg } from "../../data/apiUrl.js";
import { interactiveNavBar } from "./NavBar.views.js";

let productsCache = []; // Pour garder la liste de produits en mémoire

export async function productList() {
    const categories = await categorieList();
    const categoryOptions = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

    productsCache = await fetchProducts();
    const productCardsHTML = renderProductCards(productsCache);

    const token = localStorage.getItem("token");
    const payload = JSON.parse(atob(token.split(".")[1]));
    const adminButtons = payload.role === "ADMIN" ? `
        <div class="button-container">
            <div class="add-product button">Ajouter</div>
            <div class="delete-product button">Supprimer</div>
            <button class="real-delete">really delete</button>
        </div>` : '';

    const html = `
        <div class="product-list-title-pannel">LISTE DES PRODUITS</div>
        ${adminButtons}
        <input type="text" placeholder="search" class="search-bar" id="product-search"/>
        <div class="categorie-product-list-filter">
            <div class="Filter">
                Filter
                <select name="filter" id="category-filter">
                    <option value="Tout">Tout</option>
                    ${categoryOptions}
                </select>
            </div>
        </div>
        <div class="product-list-container">${productCardsHTML}</div>
    `;

    return renderSection("categorie-product-list-pannel", html);
}

// 🔹 Crée le HTML des cartes produits
function renderProductCards(products) {
    return products.map(p => `
        <div class="product-list-card" data-product-id="${p.id}">
            <input type="checkbox" data-product-id="${p.id}" class="product-checkbox">
            <div class="image-container">
                <img src="${API_URLimg}${p.imageUrl}" alt="product-images">
            </div>
            <div class="card-info">
                <div class="product-name">${p.name}</div>
                <div class="type-product">categorie : ${p.category.name}</div>
                <div class="Stock">Stock : ${p.quantity}</div>
                <div class="prix">Prix : Ar ${p.price}</div>
            </div>
        </div>
    `).join('');
}

// 🔹 Réinitialiser et réafficher la liste
export async function refreshProductList() {
    productsCache = await fetchProducts();
    const container = document.querySelector(".product-list-container");
    container.innerHTML = renderProductCards(productsCache);

    // Réactiver tous les boutons / listeners
    activateAjouterProductButton();
    activateProductDeleteButton();
    activateProductSearch();
    activateProductFilter();
    interactiveNavBar();
}

// 🔹 Ajouter produit
export function activateAjouterProductButton() {
    const token = localStorage.getItem("token");
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.role !== "ADMIN") return;

    const addButton = document.querySelector(".add-product");
    if (!addButton) return;

    addButton.addEventListener("click", async () => {
        const categories = await categorieList();
        const suppliers = await fournisseursCards();

        const formHTML = form(
            "Ajouter Produit",
            [
                { name: "Nom", className: "input-product-name", placeholder: "Nom du produit", type: "text" },
                { name: "Description", className: "input-product-description", placeholder: "Description", type: "text-area" },
                { name: "sku", className: "input-product-sku", placeholder: "SKU", type: "text" },
                { name: "Quantité", className: "input-product-quantity", placeholder: "1,2,...", type: "text" },
                { name: "Prix", className: "input-product-price", placeholder: "Prix en Ariary", type: "text" },
                { name: "Location", className: "input-product-location", placeholder: "Entrepôt", type: "text" },
                { name: "Image", className: "input-product-image", type: "file", accept: "image/*" },
                { name: "Categorie", className: "input-product-categorie", type: "select", op: categories.map(c => c.name) },
                { name: "Fournisseur", className: "input-product-supplier", type: "select", op: suppliers.map(s => s.name) }
            ],
            [
                { name: "Ajouter", className: "add-product" },
                { name: "Annuler", className: "annuler" }
            ]
        );

        document.body.innerHTML += formHTML;
        attachAddProductForm();
    });
}

// 🔹 Formulaire Ajouter Produit
async function attachAddProductForm() {
    const categories = await categorieList();
     const suppliers = await fournisseursCards();
    const formSection = document.querySelector(".form");
    if (!formSection) return;
    const addBtn = formSection.querySelector(".add-product");
    const cancelBtn = formSection.querySelector(".annuler");
    const inputs = formSection.querySelectorAll("input");
    const selects = formSection.querySelectorAll("select");

    cancelBtn.addEventListener("click", () => formSection.remove());

    addBtn.addEventListener("click", async () => {
        let quantity = Number(inputs[3].value);
        let alertLevel;
        if (quantity > 100) alertLevel = 1;
        else if (quantity > 50) alertLevel = 2;
        else if (quantity > 30) alertLevel = 3;
        else if (quantity > 20) alertLevel = 4;
        else alertLevel = 5;
        let categoryId;
        let supplierId;
        categories.forEach(category => category.name === selects[0].value ? categoryId = category.id : "");
        suppliers.forEach(supplier => supplier.name === selects[1].value ? supplierId = supplier.id : "");
        console.log(categoryId, supplierId);

        const formData = new FormData();   
        formData.append("name", inputs[0].value);
        formData.append("description", inputs[1].value);
        formData.append("sku", inputs[2].value);
        formData.append("quantity", Number(inputs[3].value));
        formData.append("alertLevel", alertLevel);
        formData.append("price", inputs[4].value);
        formData.append("location", inputs[5].value);
        formData.append("imageUrl", inputs[6].files[0]);
        formData.append("categoryId", categoryId);
        formData.append("supplierId", supplierId);
        console.log(formData);

        const token = localStorage.getItem("token");
        console.log(token);
        try {
            const res = await fetch(`${API_URL}/products`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`
                 },
                body: formData
            });
            if (!res.ok) throw new Error("Erreur création produit");
            formSection.remove();
            await refreshProductList();
        } catch (err) {
            console.error(err);
        }
    });
}

// 🔹 Supprimer produit
export function activateProductDeleteButton() {
    const deleteButton = document.querySelector(".delete-product");
    if (!deleteButton) return;

    deleteButton.addEventListener("click", () => {
        const realDelete = document.querySelector(".real-delete");
        realDelete.style.display = "block";
        deleteButton.style.display = "none";
        document.querySelector(".add-product").style.display = "none";

        realDelete.addEventListener("click", async () => {
            const toDelete = Array.from(document.querySelectorAll(".product-checkbox"))
                .filter(cb => cb.checked)
                .map(cb => Number(cb.dataset.productId));

            if (!toDelete.length) return;

            const token = localStorage.getItem("token");
            for (let id of toDelete) {
                try {
                    await fetch(`${API_URL}/products/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
                } catch (err) { console.error(err); }
            }
            await refreshProductList();
            realDelete.style.display = "none";
            deleteButton.style.display = "";
            document.querySelector(".add-product").style.display = "";
        });
    });
}

// 🔹 Filtrer produits
export function activateProductFilter() {
    const filter = document.getElementById("category-filter");
    if (!filter) return;
    filter.addEventListener("change", () => {
        const value = filter.value;
        const filtered = value === "Tout" ? productsCache : productsCache.filter(p => p.category.name === value);
        document.querySelector(".product-list-container").innerHTML = renderProductCards(filtered);
        activateProductDeleteButton();
        activateProductCardEvent();
    });
}

// 🔹 Recherche produits
export async function activateProductSearch() {
    const searchInput = document.getElementById("product-search");
    if (!searchInput) return;

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const filtered = productsCache.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.category.name.toLowerCase().includes(query)
        );
        document.querySelector(".product-list-container").innerHTML = renderProductCards(filtered);
        activateProductDeleteButton();
        activateProductCardEvent();
    });
}

// 🔹 Carte produit cliquable
export function activateProductCardEvent() {
    document.querySelectorAll(".product-list-card").forEach(card => {
        card.addEventListener("click", () => {
            const id = Number(card.dataset.productId);
             render(`#/productList/Pannel`,id);
        });
    });
}

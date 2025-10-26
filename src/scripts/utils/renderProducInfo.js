import { API_URL,API_URLimg } from "../../data/apiUrl.js";
import { categorieList } from "../../data/categoriesList.js";
import { fournisseursCards } from "../../data/Fournisseurs.js";
import { fetchProducts } from "../../data/product.js";
import { interactiveNavBar } from "../views/NavBar.views.js";
import { render, renderSection } from "./render.js";


export async function renderProduct(productId){

    const categorys = await categorieList();
    let categoryOptionsHTML=``;
    categorys.forEach(category => {
        categoryOptionsHTML += `
            <option value="${category.id}">${category.name}</option>
        `
    })
    const suppliers = await fournisseursCards();
    let suppliersOptionsHTML=``;
    suppliers.forEach(category => {
        suppliersOptionsHTML += `
            <option value="${category.id}">${category.name}</option>
        `
    })

    let products = await fetchProducts();
    let productAboutHTML =``;
    products.forEach(product => {
            productAboutHTML = `
            <section class="product-pannel">
            <div class="previous arrow">
                <img src="./src/icons/icons-arrow-left.png" alt="">
            </div>
            <div>
                <img src="${API_URLimg}${product.imageUrl}" alt="product-logo" class="product-image">
            </div>
            <div class="product-section">  
                <div class="image-container">
                    <input type ="file" class="imageUrl" data-imgUrl="${product.imageUrl}" accept="image/*" >
                    <div class="button-container">
                        <button class="Modifier">Modifier</button>
                        <button class="Supprimer">Supprimer</button>
                    </div>
                </div>
                <div class="information-product-container" data-product-id="${product.id}">
                    <div class="product-name ">
                        Name : <span class="supplier-name">${product.name}</span> <input type="text" class="input-modifier-name" value="${product.name}" required>
                    </div>
                    <div class="product-description">
                        Description : <span class="supplier-phone">${product.description}</span> <input type="text" class="input-modifier-description" value="${product.description}" required>
                    </div>
                    <div class="product-sku">
                        SKU : <span class="supplier-email">${product.sku}</span> <input type="text" class="input-modifier-sku" value="${product.sku}" required>
                    </div>
                    <div class="product-quantity">
                        Quantité : <span class="supplier-address">${product.quantity}</span> <input type="text" class="input-modifier-quantity" value="${product.quantity}" required>
                    </div>
                    <div class="product-price">
                        Prix : <span class="supplier-category">${product.price}</span> <input type="text" class="input-modifier-price" value="${product.price}" required>
                    </div>
                    <div class="product-location">
                        location: <span class="supplier-count">${product.location}</span> <input type="text" class="input-modifier-location" value="${product.location}" required>
                    </div>
                    <div class="product-category">
                        catégorie: <span class="supplier-count">${product.category.name}</span> 
                        <select style="display:none;">
                            ${categoryOptionsHTML}
                        </select>
                    </div>
                    <div class="product-supplier">
                        fournisseur: <span class="supplier-count">${product.supplier}</span>
                        <select style="display:none;">
                            ${suppliersOptionsHTML}
                        </select>                        
                    </div>
                </div>
                <div class="terminer-modif" style="cursor:pointer; display:none">Confirmer Modification</div>
            </div>
        </section>
            `
        })
    return renderSection("product-Pannel", productAboutHTML);
}

export function previousProductButton(){
    const previous = document.querySelector(".previous");
    if(!previous) return;

    previous.addEventListener('click', ()=>{
        render("#/productList")
        interactiveNavBar();
    })
}

export async function modifierProductButton(){
    const modifier = document.querySelector(".Modifier");
    if(!modifier) return;
    modifier.addEventListener("click", ()=> {
        let data = [];
        const informationContainer = document.querySelector(".information-product-container");
        const productId = Number(informationContainer.dataset.productId);
        const divList = informationContainer.querySelectorAll("div");
        console.log(divList);
        document.querySelector("product-section").querySelector(".button-container").style.display = "none";
        document.querySelector(".product-pannel").classList.add("isProductActive");
        divList.forEach((div,index)=>{
                div.querySelector("span").style.display = "none";
                if(div.querySelector("input")) div.querySelector("input").style.display = "block";
                
                if(div.querySelector("select")) div.querySelector("select").style.display = "block";
        })
        document.querySelector(".terminer-modif").style.display = "block";
        if(document.querySelector('.terminer-modif').style.display === "block"){
            document.querySelector(".terminer-modif")
                .addEventListener("click",async ()=>{
                    const imageUrlElementInput = document.querySelector(".imageUrl");
                    let imageUrl = imageUrlElementInput.files[0]? imageUrlElementInput.files[0] : imageUrlElementInput.dataset.imgUrl;
                    imageUrlElementInput.style.display = "block";
                    divList.forEach((div,index)=>{
                        if(index < divList.length -1){
                            if(div.querySelector("input")){
                                data[index] = div.querySelector("input").value;
                            }
                            else if(div.querySelector("select")){
                                data[index] = Number(div.querySelector("select").value);
                            }
                            if(data[index] === "") return alert("remplisser tout les cases");
                        }
                    })
                    console.log(data);
                    let [name, description , sku, quantity, price, location, categoryId, supplierId] = data;
                    try {
                        let formData = new FormData();
                        formData.append("name", name);
                        formData.append("description", description);
                        formData.append("quantity",Number(price));
                        formData.append("sku",sku);
                        formData.append("quantity",Number(quantity));
                        formData.append("location",location);
                        formData.append("categoryId",categoryId);
                        formData.append("supplierId",supplierId);

                        const token = localStorage.getItem("token");
                        const res = await fetch(`${API_URL}/products/${productId}`,{
                            method: "PUT",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                            },
                            body: formData
                        })
                        if(!res.ok) throw Error("Echec de la modification");
                        document.querySelector(".product-pannel").classList.remove("isProductActive");
                        render("#/productList", productId);
                    }
                    catch(err){
                        console.error(err);
                    }
                
                })
        }
    })
}

export async function SupprimerProductButton() {
    const supprimer = document.querySelector(".Supprimer");
    if(!supprimer) return;
    supprimer.addEventListener('click',async ()=> {
        const informationContainer = document.querySelector(".information-product-container");
        const productId = Number(informationContainer.dataset.productId);
        try{
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/products/${productId}`,{
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if(!res.ok) throw Error("Echec de la supprésson");
            const fako = await res.json();
            navigate("#/productList");
            interactiveNavBar();
        }
        catch(err) {
            console.error(err);
        }
    })
}
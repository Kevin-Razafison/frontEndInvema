import { API_URL,API_URLimg } from "../../data/apiUrl.js";
import { fournisseursCards } from "../../data/Fournisseurs.js";
import { interactiveNavBar } from "../views/NavBar.views.js";
import { popUp } from "./popUp.js";
import { render, renderSection } from "./render.js";

function navigate(route) {
   window.location.hash = route;
}

export async function renderFournisseur(fournisseurId) {
    let fournisseurData = await fournisseursCards();
    let fournisseurAboutHTML = ``;

    fournisseurData.forEach(fournisseur => {
        if (fournisseur.id === fournisseurId) {
            let productHTML = fournisseur.products.map(product => `
                <div class="product-list-card">
                    <div class="image-container">
                        <img src="./src/images/product-images/images.jpeg" alt="product-images">
                    </div>
                    <div class="card-info">
                        <div class="product-name">${product.name}</div>
                        <div class="type-product">Catégorie : ${product.category}</div>
                        <div class="Stock">Stock : ${product.quantity}</div>
                        <div class="prix">Prix : Ar ${product.price}</div>
                    </div>
                </div>
            `).join('');

            fournisseurAboutHTML = `
            <section class="fournisseurs-pannel">
                <div class="fournisseurs-section">
                    <img src="./src/icons/icons-arrow-left.png" alt="fournisseur-logo" class="previous">
                    <div class="image-side">
                        <img src="${API_URLimg}${fournisseur.imageUrl}" alt="fournisseur-logo" class="fournisseur-logo">
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
                        <div class="info-item">📦 Produits fournis : <span>${fournisseur.count || 0}</span></div>
                        <button class="terminer-modif" style="display:none;">✅ Confirmer Modification</button>
                    </div>
                </div>

                <div class="product-List-Provided">
                    <h3>Produits fournis</h3>
                    <div class="List-product-provide-container">
                        ${productHTML || "<p>Aucun produit pour le moment.</p>"}
                    </div>
                </div>
            </section>
            `;
        }
    });

    return renderSection("fournisseur-Pannel", fournisseurAboutHTML);
}


export function previousButton(){
    const previous = document.querySelector(".previous");
    if(!previous) return;

    previous.addEventListener('click', ()=>{
        render("#/fournisseurs");
        interactiveNavBar();
    })
}

export async function modifierButton(){
    const modifier = document.querySelector(".Modifier");
    if(!modifier) return;
    modifier.addEventListener("click", ()=> {
        let data = [];
        const informationContainer = document.querySelector(".information-container");
        const supplierID = Number(informationContainer.dataset.supplierId);
        const divList = informationContainer.querySelectorAll("div");
        document.querySelector(".fournisseurs-section").querySelector(".button-container").style.display = "none";
        divList.forEach((div,index)=>{
            if(index < divList.length -1){
                div.querySelector("span").style.display = "none";
                div.querySelector("input").style.display = "block";
            }
        })
        document.querySelector(".terminer-modif").style.display = "block";
        if(document.querySelector('.terminer-modif').style.display === "block"){
            document.querySelector(".terminer-modif")
                .addEventListener("click",async ()=>{
                    
                    divList.forEach((div,index)=>{
                        if(index < divList.length -1){
                            data[index] = div.querySelector("input").value;
                            if(data[index] === "") return alert("remplisser tout les cases");
                        }
                    })
                    console.log(data);
                    let [name, phone, email, address, category] = data;
                    try {
                        let formData = new FormData();
                        formData.append("name", name);
                        formData.append("phone", phone);
                        formData.append("email",email);
                        formData.append("address",address);
                        formData.append("category",category);

                        const token = localStorage.getItem("token");
                        const res = await fetch(`${API_URL}/supplier/${supplierID}`,{
                            method: "PUT",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                            },
                            body: formData
                        })
                        if(!res.ok) throw Error("Echec de la modification");
                        const FournisseurUptaded = await res.json();
                        render("#/fournisseurs/pannel", supplierID);
                    }
                    catch(err){
                        console.error(err);
                    }
                })
        }
    })
}

export async function SupprimerButton() {
    const supprimer = document.querySelector(".Supprimer");
    if(!supprimer) return;
    supprimer.addEventListener('click',async ()=> {
        const informationContainer = document.querySelector(".information-container");
        const supplierID = Number(informationContainer.dataset.supplierId);
        console.log(supplierID);
        try{
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/supplier/${supplierID}`,{
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if(!res.ok) throw Error("Echec de la supprésson");
            const fako = await res.json();
        }
        catch(err) {
            console.error(err);
        }
        navigate("#/fournisseurs");
    })
}

function popUpActivation(){
    const popUpHTML = popUp("Modifier la");
}
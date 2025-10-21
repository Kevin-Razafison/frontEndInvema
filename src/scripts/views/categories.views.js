import { render, renderSection } from "../utils/render.js";
import { form } from "../utils/renderForm.js";
import { categorieList } from "../../data/categoriesList.js";
import { API_URL } from "../../data/apiUrl.js";
import { interactiveNavBar } from "./NavBar.views.js";
function navigate(route) {
   window.location.hash = route;
}


export async function categories(){
    let categorieListVar = await categorieList();
      const cardsHTML = categorieListVar.map(cat => `
      <div class="option-card js-categorie-card" data-id="${cat.id}">
        ${cat.name}
      </div>
    `).join("");

      let categoriesHTML = `
      <button class="add-categorie">
          Ajouter Catégorie
      </button>
      <button class="delete-categorie">
          Supprimer Catégorie
      </button>
      <div class="categories-container">
          ${cardsHTML} 
          <div class="option-card All-product-card js-categorie-card">
              All Product
          </div>
      </div>
      
  `;
  return renderSection("categories-pannel",categoriesHTML);
}

export function activateCategoryCard(){
    let categorys = document.querySelectorAll('.js-categorie-card');
    categorys.forEach((elemnt)=>{
      console.log(elemnt);
        elemnt.addEventListener('click', ()=>{
            navigate("#/productList");
        })
    })
}

async function activateCategorieButton() {
    if(document.querySelector('.categories-pannel'))
    {
       let labelAddList = [{
              name: "Entrer le nom de la nouvelle catégorie",
              className: "categorie-input",
              placeholder: "Entrer categorie"
            }];
        let buttonAddList = [
              {
                name: "Ajouter",
                className: "add-category"
              },

              {
                name: "Annuler",
                className: "annuler"
              }
            ];
        let categorieAddButton = document.querySelector('.add-categorie');
            categorieAddButton.addEventListener('click',async ()=> {
            const formHTML = form("Ajouter Catégorie",labelAddList,buttonAddList);
            document.body.innerHTML += formHTML;
            await attachFormEvents();
            })
       let labelDeleteList = [{
              name: "Entrer le nom du catégorie à supprimer",
              className: "categorie-input",
              placeholder: "Entrer le nom du catégorie à supprimer"
            }];
        let buttonDeleteList = [
              {
                name: "Supprimer",
                className: "delete-category"
              },

              {
                name: "Annuler",
                className: "annuler"
              }
            ];
        let categorieDeleteButton = document.querySelector('.delete-categorie');
            categorieDeleteButton.addEventListener('click', async ()=>{
            const formHTML =form("Supprimer Categores",labelDeleteList, buttonDeleteList) 
            document.body.innerHTML += formHTML;
            await deleteFormEvents();
            })
    }
}

async function attachFormEvents() {
  const formSection = document.querySelector('.form');
  const input = formSection.querySelector('input');
  const add = formSection.querySelector('.add-category');
  const cancel = formSection.querySelector('.annuler');

  cancel.addEventListener('click', () => {
    console.log("mandeha le boutton alony ve?");
    formSection.remove(); 
    render(`#/categories`);
    interactiveNavBar();
  });

  add.addEventListener('click', async () => {
    const name = input.value.trim();
    async function isAlreadyExistent(){
      const categorieListVar = await categorieList();
      let isExistent =false;
      categorieListVar.forEach((categorie)=> {
        if(categorie.name === name){
          isExistent = true;
        }
      })
      return isExistent;
    }
    if (!name) {
      alert("Veuillez saisir un nom de catégorie");
      return;
    }
    else if(await isAlreadyExistent()){
      alert("catégorie déjà existante");
      return;
    }
    else {
      try {
      const token = localStorage.getItem("token"); // si route protégée
      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // retire si pas d'auth
        },
        body: JSON.stringify({ name })
      });

      if (!res.ok) throw new Error("Échec de la création");
      const newCategory = await res.json();
      formSection.remove();
      await refreshCategories();
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la création de la catégorie");
      }
    }

    interactiveNavBar();
  });
}

async function deleteFormEvents() {
  const formSection = document.querySelector('.form');
  const input = formSection.querySelector('input');
  const add = formSection.querySelector('.delete-category');
  const cancel = formSection.querySelector('.annuler');

  cancel.addEventListener('click', () => {
    formSection.remove(); 
    render("#/categories");
    interactiveNavBar();
  });

  add.addEventListener('click', async () => {
    const name = input.value.trim();
    name.toLowerCase();
    const productList = await takeProducts();
    let nameList = productList.map(elemnt => elemnt.name);
    if (!name) {
      alert("Veuillez saisir un nom de catégorie");
      return;
    }
    else if(!nameList.includes(name))
    {
      alert("Veuillez saisir un nom valide");
      return;
    }
    let id;
    productList.forEach(elemnt=> {
      if(elemnt.name === name)
      {
        id = parseInt(elemnt.id);
      }
      else{
        return;
      }  
      });
    try {
      const token = localStorage.getItem("token"); // si route protégée
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // retire si pas d'auth
        },
      });

      if (!res.ok) throw new Error("Échec de la suppréssion");
      const newCategory = await res.json();

      formSection.remove();
      refreshCategories();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppresion de la catégorie");
    }
  });
}

async function refreshCategories() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/categories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    if (!res.ok) throw new Error("Erreur de récupération des catégories");
    const categoriesData = await res.json();

    const container = document.querySelector(".categories-container");
    if (!container) return;

    // Recrée le HTML
    container.innerHTML = categoriesData
      .map(cat => `
        <div class="option-card js-categorie-card" data-id="${cat.id}">
          ${cat.name}
        </div>
      `)
      .join("");
    
      container.innerHTML += `
        <div class="option-card All-product-card js-categorie-card">
            All Product
        </div>
      `
    // 🔁 Réattacher les listeners sur les nouvelles cartes
    attachCategoryCardEvents();
  } catch (err) {
    console.error(err);
  }
}

function attachCategoryCardEvents() {
  document.querySelectorAll(".js-categorie-card").forEach(el => {
    el.addEventListener("click", () => {
      render(`index.html#/categories`);
    });
  });
}

async function takeProducts() {
  const token = localStorage.getItem("token");
        const res = await fetch (`${API_URL}/categories`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });
        if(!res.ok) throw new Error("Erreur lors de la récupération des produits");

        const data = await res.json();
        return data;
}
export {activateCategorieButton};
import { render, renderSection } from "../utils/render.js";
import { fournisseursCards } from "../../data/Fournisseurs.js";
import { form } from "../utils/renderForm.js";
import { interactiveNavBar } from "./NavBar.views.js";
import { API_URL, API_URLimg } from "../../data/apiUrl.js";
import { categorieList } from "../../data/categoriesList.js";

function getIdFromHash(hash) {
  const params = new URLSearchParams(hash.split("?")[1]);
  return parseInt(params.get("id") || 0);
}
function navigate(route, id) {    
    render(route,id);
}

let fournisseursCardsHTML=``;
let fournisseursCards2 = await fournisseursCards();
fournisseursCards2.forEach((card)=>{
    fournisseursCardsHTML += `
        <div class="fournisseurs-card ${card.name}">
            <div class="image-container">
                <img src="${API_URLimg}${card.imageUrl}" loading= "lazy"alt="fournisseurs-logo">
            </div>
            <div class="entreprise-name">
                ${card.name}
            </div>
            <div class="type-materiels-fourni">
                ${card.category}
            </div>
        </div>
    `
})

function fournisseurs() {
    let fournisseursHTML = `
        <div class="fournisseurs-title">
            <div>
                LISTE DES FOURNISSEURS
            </div>
        </div>
        <div class="list-fournisseur">
            ${fournisseursCardsHTML}
            <div class="add-fournisseur">
                <img src="./src/icons/icons-add.png">
                <div>Ajouter</div>
            </div>
        </div>
    `
    return renderSection("fournisseurs-container", fournisseursHTML);
}

async function addFournisseur(){
    if(document.querySelector(".fournisseurs-container")){
        let categories = await categorieList();
        console.log(categories);
        let categoriesNameList = [];
        categories.forEach(category=> {
            categoriesNameList.push(category.name);
        })
        const addButton = document.querySelector('.add-fournisseur');
            let labelList = [{
              name: "Entrer le nom du fournisseur",
              className: "nom-fournisseur-input Nom",
              placeholder: "fournisseur",
              type: "text",
            },
            {
              name: "Téléphone",
              className: "phone-fournisseur-input Telephone",
              placeholder: "+261",
              type: "tel"
            },
            {
                name : "Email",
                className: "email-fournisseur-input Email",
                placeholder: "example@email.com",
                type: "email"
            },
            {
                name: "Adresse",
                className: "adresse-fournisseur-input Adresse",
                placeholder: "lot",
                type: "text",
            },
            {
                name : "Image",
                className: "image-fournisseur-input Image",
                placeholder: "",
                type: "file",
                accept: "image/*"
            },
            {
                name : "Category",
                className: "category-fournisseur-input category",
                type: "select",
                op: categoriesNameList
            }       
        ];
        let buttonList = [
              {
                name: "Ajouter",
                className: "add-fournisseur"
              },

              {
                name: "Annuler",
                className: "annuler"
              }
            ];
        addButton.addEventListener('click', ()=>{
            document.body.innerHTML += form('Ajouter Fournisseur', labelList, buttonList)
            attachFromEvents();
        })
    }
}

function attachFromEvents(){
    const formSection = document.querySelector('.form');
    const formContainer = document.querySelector('.form-container')
    const inputs = formSection.querySelectorAll("input");
    const add = formSection.querySelector('.add-fournisseur');
    const cancel = formSection.querySelector('.annuler');
    const select = formSection.querySelector("select");

    cancel.addEventListener('click', () => {
        formSection.remove();
        addFournisseur();
        interactiveNavBar();
    })
    add.addEventListener('click', async ()=> {
        const name = inputs[0].value;
        const phone = inputs[1].value;
        const email = inputs[2].value;
        const address = inputs[3].value;
        const imageFile = inputs[4].files[0];
        const category = select.value;

        let inputInvalid = []; 
        inputs.forEach((input,index) => {
            if(input.value === ""){
                inputInvalid.push(index);
            }
        })

        async function isAlreadyExistent(){
            const fournisseursCards1 = await fournisseursCards();
            inputs.forEach((input, index)=>{
                fournisseursCards1.forEach((fournisseursa)=>{
                    if(input.value === fournisseursa[index]){
                       return true;
                    }
                })
            })
            return false;
        }

        function isValidPhoneNumber(){
            const phoneNumber = inputs[1].value.replaceAll(" ", "");
            const fourFirstDigits = phoneNumber.slice(0,4);
            const threeDigit = phoneNumber.slice(0,3);
            const headNumber =["020","029","032","033","034","037","038"];
            if(!fourFirstDigits.includes("+261")){
                if(!headNumber.includes(threeDigit)){
                    console.log("Doit commencer par" + headNumber.forEach((head)=> head) );
                    return false;
                }
                else if(headNumber.includes(threeDigit) && phoneNumber.length !== 10){
                    console.log("le numéro est invalide tsisy ao anaty norme");
                    return false;
                }
                else {
                    return true;
                }
                console.log("Invalid Phone Number");
                return false
            }
            else if(phoneNumber.length != 13){
                return false;
            }
            else if(isNaN(Number(phoneNumber.slice(1)))){
                alert("entrer un numéro valide")
                return false;
            }
            return true
        }

        function isValidEmail(){
            if(!(inputs[2].value.includes("@")) && !(inputs[2].value.includes("."))){
                return false;
            }
            return true;
        }

        if(inputInvalid.length >= 1) {
            const akondro ="<div class=\"akondro\" style=\"margin-top:25px; color: red \">Veuillez remplir tout les champs!</div>";
            if(!formContainer.contains(formSection.querySelector(".akondro"))){
                formContainer.innerHTML += akondro;
            }
            attachFromEvents();
        }
        else if(await isAlreadyExistent()){
            alert("Fournisseurs déjà existant");
            attachFromEvents();
            return;
        }
        else if(!isValidPhoneNumber()){
            alert("phone Number invalid");
            attachFromEvents();
            return;
        }
        else if(!isValidEmail()) {
            alert('invalid email');
            attachFromEvents();
            return;
        }
        else {
            try {
                const formData = new FormData();
                formData.append("name", name);
                formData.append("phone", phone);
                formData.append("email", email);
                formData.append("address", address);
                formData.append("category", category);
                formData.append("image", imageFile);
                
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_URL}/supplier`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: formData
                });
                if(!res.ok) throw Error("Échec de la création");
                const newFournisseurs = await res.json();
                formSection.remove();
                refreshFournisseurs();
            }
            catch (err) {
                console.error(err);
                alert("Erreur lors de la créatino du fournisseurs");
            }
        }
 
    })
}

async function refreshFournisseurs() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/supplier`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    if (!res.ok) throw new Error("Erreur de récupération des catégories");
    const fournisseurData = await res.json();

    const container = document.querySelector(".fournisseurs-container");
    if (!container) return;

    // Recrée le HTML
    container.innerHTML = fournisseurData
        .map(card => `
        <div class="fournisseurs-card">
            <div class="image-container">
                <img src="./src/images/fournisseurs-logo/${card.imageUrl}" alt="fournisseurs-logo">
            </div>
            <div class="entreprise-name">
                ${card.name}
            </div>
            <div class="type-materiels-fourni">
                ${card.category}
            </div>
        </div>
        `)
        .join("");
    // 🔁 Réattacher les listeners sur les nouvelles cartes
    interactiveNavBar();
    render(`index.html#/fournisseurs`);
  } catch (err) {
    console.error(err);
  }
}
function activateFournisseursButton(){
 if(document.querySelector('.fournisseurs-container')){
        const allButtons = document.querySelectorAll(".fournisseurs-card");
        allButtons.forEach((button)=>{
            button.addEventListener("click", async ()=> {
                fournisseursCards2.forEach((fournisseur)=> {
                    if(fournisseur.name === button.classList[1]){
                        console.log(fournisseur.id);
                        render(`#/fournisseurs/pannel`, fournisseur.id);
                    }
                })
            })
        })
    }
};
export {fournisseurs, addFournisseur, activateFournisseursButton};
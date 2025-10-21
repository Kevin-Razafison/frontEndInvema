import { API_URL } from "../../data/apiUrl.js";
import { popUp } from "../utils/popUp.js";
import { Users } from "../../data/Users.js";
import { renderSection,render } from "../utils/render.js";
import { interactiveNavBar } from "./NavBar.views.js";
import { form, togglePasswordVisibility } from "../utils/renderForm.js";

const users = await Users();
let usersListHTML ='';
users.forEach((user,index)=>{
    usersListHTML += `
        <div class="list-users-row">
            <div class="user-id-column">
                ${index + 1}
            </div>
            <div class="user-name-column" data-user-id=${user.id}>
                ${user.name}
            </div>
            <div class="user-permission-type-column">
                <div>
                    ${user.role}
                </div>
            </div>
            <div class="actions">
                <div class="delete-user-button button" data-user-id = "${user.id}">
                    <img src="./src/icons/icons-delete.png" alt="delete" class="delete-button">
                </div>
                <div class="modify-user" data-user-id = "${user.id}" data><img src="src/icons/icons-3-dots.png" alt=""></div>
            </div>
        </div>
    `
})
function gestionUtilisateur(){
    let AllPartHTML =``;
    AllPartHTML =`
        <div class="pannel-title">
            GESTION DES UTILISATEURS
        </div>
        <div class="ajouter-utilisateurs filter-container">
            <button>Ajouter utilisateur</button>
            <div class="filter-button-container">
                <button class="admin-filter filter admin" data-is-active="false">Admin</button>
                <button class="employe-filter filter employe" data-is-active="false">Employe</button>
                <button class="all-filter filter is-filter-active all" data-is-active="true">Tout les utilisateurs</button>
            </div>
        </div>
        <div class="list-users-containers">
            <div class="list-users-title">
                <div class="user-id-column">
                    User ID
                </div>
                <div class="user-name-column">
                    User name
                </div>
                <div class="user-permission-type-column">
                    permission
                </div>
                <div class="actions">
                    action
                </div>
            </div>
            <div class="list-html-container">
            ${usersListHTML}
            <div>
        </div>
    `
    return renderSection("utilisateur-pannel-container", AllPartHTML);
}

export function filter(elementToFilter, elementClassName){
    if(document.querySelector('.utilisateur-pannel-container')){
        function removeClass(){
            const allfilter = document.querySelectorAll(".filter");
            allfilter.forEach(filter=> {
            filter.classList.remove("is-filter-active");
        })
        }

        const button = document.querySelector("."+elementClassName);
        button.addEventListener("click",async ()=> {
            let usersHTML = "";
            if(button.dataset.isActive === "true"){
                return
            }
            else{
                removeClass();
                button.classList.add("is-filter-active");
                const users = await Users();
                let index1 = 0;
                
                if(elementToFilter === "ALL"){
                    users.forEach((user, index) => {
                        index1++;
                            usersHTML += `
                                <div class="list-users-row">
                                    <div class="user-id-column">
                                        ${index1}
                                    </div>
                                    <div class="user-name-column" data-user-id=${user.id}>
                                        ${user.name}
                                    </div>
                                    <div class="user-permission-type-column">
                                        <div>
                                            ${user.role}
                                        </div>
                                    </div>
                                    <div class="actions">
                                        <div class="delete-user-button button" data-user-id = "${user.id}">
                                            <img src="./src/icons/icons-delete.png" alt="delete" class="delete-button">
                                        </div>
                                        <div class="modify-user" data-user-id = "${user.id}" data><img src="src/icons/icons-3-dots.png" alt=""></div>
                                    </div>
                                </div>
                             `
                    })

                }else{
                    users.forEach((user, index)=>{
                    if(user.role === elementToFilter){
                            index1 = index1 + 1;
                            usersHTML += `
                                <div class="list-users-row">
            <div class="user-id-column">
                ${index1}
            </div>
            <div class="user-name-column" data-user-id=${user.id}>
                ${user.name}
            </div>
            <div class="user-permission-type-column">
                <div>
                    ${user.role}
                </div>
            </div>
            <div class="actions">
                <div class="delete-user-button button" data-user-id = "${user.id}">
                    <img src="./src/icons/icons-delete.png" alt="delete" class="delete-button">
                </div>
                <div class="modify-user" data-user-id = "${user.id}" data><img src="src/icons/icons-3-dots.png" alt=""></div>
            </div>
        </div>
                            `
                    }
                })
                }
                const allfilter = document.querySelectorAll(".filter")
                allfilter.forEach(filter=>{
                    filter.dataset.isActive = "false";
                })
                button.dataset.isActive ="true";
                let listContainer = document.querySelector('.list-html-container');
                listContainer.innerHTML = usersHTML;
                modifyButton();
                activeDeleteButton();
            }
        })

    }

}

export function modifyButton(){
    let labelList = [{
            name: "Entrer le nom de l'utilisateur",
            className: "nom-utilisateur-input Nom",
            placeholder: "Utilisateur",
            type: "text",
            },
            {
                name : "Email",
                className: "email-utilisateyr-input Email",
                placeholder: "example@email.com",
                type: "email"
            },
            {
                name: "Mot de passe",
                className: "password-input Password",
                className1: "password-input",
                placeholder: "Laisser vide si vous ne voulez pas changer",
                type: "password",
            },  
            {
                name: "Role",
                className: "role-input Role",
                placeholder: "",
                type: "select",
                op: [
                    "ADMIN",
                    "EMPLOYE"
                ]
            },     
        ];
    let buttonAddList = [
        {
        name: "Modifier",
        className: "add-user"
        },

        {
        name: "Annuler",
        className: "annuler"
        }
    ];
    const modify_button = document.querySelectorAll(".modify-user");
    modify_button.forEach(modify => {
        modify.addEventListener("click", async ()=> {
            const id = modify.dataset.userId;
            const formHTML = form("Modifier Utilisateur",labelList,buttonAddList);
            document.body.innerHTML += formHTML;
            await processModify(id);
            togglePasswordVisibility("password-input");
        })
    })

}

async function processModify(id){
    const formSection = document.querySelector('.form');
    const formContainer = document.querySelector('.form-container');
    const inputs = formSection.querySelectorAll("input");
    const selectHTML = formSection.querySelector("select");
    const add = formSection.querySelector('.add-user');
    const cancel = formSection.querySelector('.annuler');
    const usersList = await Users();
    let userPassword;

    usersList.forEach(user => {
        if(user.id === Number(id)){
            inputs.forEach((input,index) => {
                const userArr = Object.values(user);
                if(userArr[index +1] === user.password){
                    userPassword = user.password;
                }
                else{
                    input.value = userArr[index +1];
                }
            })
        }
    })

    cancel.addEventListener('click', async () => {
        formSection.remove();
        addUsers();
        modifyButton()
        interactiveNavBar();
        filter("ADMIN","admin-filter");
        filter("EMPLOYE","employe-filter");
        filter("ALL", "all-filter");
    })
    add.addEventListener("click",async ()=>{
            const name = inputs[0].value;
            console.log(name)
            const email = inputs[1].value;
            let password = "";
            if(!(inputs[2].value === "")){
                password = inputs[2].value;
            }
            else{
                password = userPassword;
            }
            const role = selectHTML.value;

            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/users/${id}`,{
                method: "PUT",
                headers: {
                    "Content-Type" : "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ name, email,  password, role })
            })
            formSection.remove();
            if(!res.ok) throw Error("Echec de la modification");
            refreshAfterModify();
            interactiveNavBar();
            filter("ADMIN","admin-filter");
            filter("EMPLOYE","employe-filter");
            filter("ALL", "all-filter");
            modifyButton();
            addUsers();
        })
}

export async function activeDeleteButton() {
    const deletesButton = document.querySelectorAll(".delete-user-button");
    deletesButton.forEach(deleteButton => {
        let id = Number(deleteButton.dataset.userId);
        deleteButton.addEventListener("click", ()=>{
            document.body.innerHTML += popUp("Supprimer Utilisateur", "voulez-vous vraiment supprimer l'utilisateur?","popUp-supprimer-utilisateur");
            const popup = document.querySelector(".popUp-supprimer-utilisateur");
            popup.querySelector(".Annuler")
                .addEventListener("click", ()=>{
                    popup.remove();
                    interactiveNavBar();
                    addUsers;
                    modifyButton();
                    activeDeleteButton();
                    filter("ADMIN","admin-filter");
                    filter("EMPLOYE","employe-filter");
                    filter("ALL", "all-filter");
                })
            popup.querySelector(".confirmer")
                .addEventListener("click", async () => {
                    try {
                        const token = localStorage.getItem("token");
                        const res = await fetch(`${API_URL}/users/${id}`, {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                        });
                        if(!res.ok) throw new Error("Echec de la supprésion");

                        popup.remove();
                        interactiveNavBar();
                        addUsers();
                        modifyButton();
                        activeDeleteButton();
                        filter("ADMIN","admin-filter");
                        filter("EMPLOYE","employe-filter");
                        filter("ALL", "all-filter");
                        refreshAfterModify();
                    }
                    catch(err){
                        console.error(err);
                    }
                })
        })
    })
}

function refreshAfterModify(){
    const filter = document.querySelectorAll(".filter");
    filter.forEach(async (filter) => {
        if(filter.dataset.isActive === "true")
        {
            const users = await Users();
            let index1 = 0;
            let usersHTML = '';
            if(filter.classList.contains("all")){
                users.forEach(user => {
                    index1++;
                        usersHTML += `
                            <div class="list-users-row">
                                <div class="user-id-column">
                                    ${index1}
                                </div>
                                <div class="user-name-column" data-user-id=${user.id}>
                                    ${user.name}
                                </div>
                                <div class="user-permission-type-column">
                                    <div>
                                        ${user.role}
                                    </div>
                                </div>
                                <div class="actions">
                                    <div class="delete-user-button button" data-user-id = "${user.id}">
                                        <img src="./src/icons/icons-delete.png" alt="delete" class="delete-button">
                                    </div>
                                    <div class="modify-user" data-user-id = "${user.id}" data><img src="src/icons/icons-3-dots.png" alt=""></div>
                                </div>
                            </div>
                `
                let listContainer = document.querySelector('.list-html-container');
                listContainer.innerHTML = usersHTML;
                addUsers();
                modifyButton();
                activeDeleteButton();
                })
            }
            else if(filter.classList.contains("admin")){
            users.forEach(user => {
                if(user.role === "ADMIN"){
                    index1++;
                        usersHTML += `
                            <div class="list-users-row">
                                <div class="user-id-column">
                                    ${index1}
                                </div>
                                <div class="user-name-column" data-user-id=${user.id}>
                                    ${user.name}
                                </div>
                                <div class="user-permission-type-column">
                                    <div>
                                        ${user.role}
                                    </div>
                                </div>
                                <div class="actions">
                                    <div class="delete-user-button button" data-user-id = "${user.id}">
                                        <img src="./src/icons/icons-delete.png" alt="delete" class="delete-button">
                                    </div>
                                    <div class="modify-user" data-user-id = "${user.id}" data><img src="src/icons/icons-3-dots.png" alt=""></div>
                                </div>
                            </div>
                        `
                        let listContainer = document.querySelector('.list-html-container');
                        listContainer.innerHTML = usersHTML;
                        addUsers();
                        modifyButton();
                        activeDeleteButton();
                    }
                })
            }
            else if(filter.classList.contains("employe")){
            console.log("akondro2")
            users.forEach(user => {
                if(user.role === "EMPLOYE"){
                    index1++;
                        usersHTML += `
                            <div class="list-users-row">
                                <div class="user-id-column">
                                    ${index1}
                                </div>
                                <div class="user-name-column" data-user-id=${user.id}>
                                    ${user.name}
                                </div>
                                <div class="user-permission-type-column">
                                    <div>
                                        ${user.role}
                                    </div>
                                </div>
                                <div class="actions">
                                    <div class="delete-user-button button" data-user-id = "${user.id}">
                                        <img src="./src/icons/icons-delete.png" alt="delete" class="delete-button">
                                    </div>
                                    <div class="modify-user" data-user-id = "${user.id}" data><img src="src/icons/icons-3-dots.png" alt=""></div>
                                </div>
                            </div>
                        `
                        let listContainer = document.querySelector('.list-html-container');
                        listContainer.innerHTML = usersHTML;
                            addUsers();
                            modifyButton();
                            activeDeleteButton();
                    }
                })
            }
        }
    })

}
export function addUsers(){
    if(document.querySelector('.utilisateur-pannel-container'))
    {
         let labelList = [{
                    name: "Entrer le nom de l'utilisateur",
                    className: "nom-utilisateur-input Nom",
                    placeholder: "Utilisateur",
                    type: "text",
                    },
                    {
                        name : "Email",
                        className: "email-utilisateyr-input Email",
                        placeholder: "example@email.com",
                        type: "email"
                    },
                    {
                        name: "Mot de passe",
                        className: "password-input Password",
                        className1: "password-input",
                        placeholder: "Mot de passe",
                        type: "password",
                    },  
                    {
                        name: "Role",
                        className: "role-input Role",
                        placeholder: "",
                        type: "select",
                        op: [
                            "ADMIN",
                            "EMPLOYE"
                        ]
                    },     
                ];
        let buttonAddList = [
                {
                name: "Ajouter",
                className: "add-user"
                },

                {
                name: "Annuler",
                className: "annuler"
                }
            ];
        let UserAddButton = document.querySelector(".ajouter-utilisateurs");
            let button = UserAddButton.querySelector("button")
            button.addEventListener('click', ()=> {
                const formHTML = form("Ajouter un Utilisateur",labelList,buttonAddList);
                document.body.innerHTML += formHTML;
                attachFromEvents();
                togglePasswordVisibility(labelList[2].className1);
            })
    }
}
function attachFromEvents(){
    const formSection = document.querySelector('.form');
    const formContainer = document.querySelector('.form-container');
    const inputs = formSection.querySelectorAll("input");
    const selectHTML = formSection.querySelector("select");
    const add = formSection.querySelector('.add-user');
    const cancel = formSection.querySelector('.annuler');

    cancel.addEventListener('click', async () => {
        formSection.remove();
        addUsers();
        modifyButton();
        activeDeleteButton();
        interactiveNavBar();
        filter("ADMIN","admin-filter");
        filter("EMPLOYE","employe-filter");
        filter("ALL", "all-filter");
    })
    add.addEventListener('click', async ()=> {
        document.body.innerHTML += popUp("Confimer l'ajout d'utilisateur", "voulez-vous vraiment créer l'utilisateur?","popUp-gestion-Utilisateur");
        const popup = document.querySelector(".popUp-gestion-Utilisateur");
        popup.querySelector(".Annuler")
            .addEventListener("click", ()=>{
                popup.remove()
                attachFromEvents();
                togglePasswordVisibility("password-input");
            })
        popup.querySelector(".confirmer").addEventListener("click", async()=> {
            popup.remove();
            await confirmation();
        });

        async function confirmation(){
            let newUser = "";
            const name = inputs[0].value;
            const email = inputs[1].value;
            const password = inputs[2].value;
            const role = selectHTML.value;

            let inputInvalid = []; 
            inputs.forEach((input,index) => {
                if(input.value === ""){
                    inputInvalid.push(index);
                }
            })

            async function isAlreadyExistent(){
                const users = await Users();
                    users.forEach((user)=>{
                        if(inputs[1].value === user[1]){
                            return true;
                        }
                    })
                return false;
            }

            function isValidEmail(){
                if(!(inputs[1].value.includes("@")) && !(inputs[1].value.includes("."))){
                    return false;
                }
                return true;
            }
            function isCase(alphabet){
                let isTrue = false;
                const input = Array.from(inputs[2].value);
                for(let i =0 ; i< input.length -1 ; i++){
                    for(let j=0; j< alphabet.length -1; j++){
                        if(input[i] == alphabet[j]){
                            isTrue = true;
                            break;
                        }
                    }
                }
                return isTrue
            }
            function isValidPassword(){
                const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode('a'.charCodeAt(0) + i));
                const alphabetUpper = Array.from({ length: 26 }, (_, i) => String.fromCharCode('A'.charCodeAt(0) + i));
                if(inputs[2].value.length < 8){
                    console.log(inputs[2].value);
                    console.log("fako");
                    return false;
                }
                else if(!(inputs[2].value.includes("0") ||
                inputs[2].value.includes("1") ||
                inputs[2].value.includes("2") ||
                inputs[2].value.includes("3") ||
                inputs[2].value.includes("4") ||
                inputs[2].value.includes("5") ||
                inputs[2].value.includes("6") ||
                inputs[2].value.includes("7") ||
                inputs[2].value.includes("8") ||
                inputs[2].value.includes("9") )
                ){
                    console.log("akondro");
                    return false;
                }
                else if(!(isCase(alphabet))){
                    console.log("akondro 1")
                    return false;
                }
                else if(!(isCase(alphabetUpper))){
                    console.log("akondro2");
                    return false
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
                alert("Email déjà utilisé");
                attachFromEvents();
                return;
            }
            else if(!isValidEmail()) {
                alert('invalid email');
                attachFromEvents();
                return;
            }
            else if(!isValidPassword()){
                alert("Le mot de passe doit contenir au moins 8 caractères avec Majuscule, minuscule et des chiffres");
                attachFromEvents();
                return;
            }
            else {
                try {
                    
                    const token = localStorage.getItem("token");
                    const res = await fetch(`${API_URL}/users`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            name,
                            email,
                            password,
                            role
                        })
                    });
                    const User = await res.json();
                    newUser = User.user;
                    if(!res.ok) throw Error("Échec de la création");
                }
                catch (err) {
                    console.error(err);
                }
            }
            let users = await Users();
            let usersCount = users.length;
            console.log(newUser);
            const formSection = document.querySelector('.form');
            formSection.remove();
            refreshUsers(newUser, usersCount);
            activeDeleteButton();
            modifyButton();
            filter("ADMIN","admin-filter");
            filter("EMPLOYE","employe-filter");
            filter("ALL", "all-filter");
        }
    })
}
function refreshUsers(user, usersCount){
    interactiveNavBar();
    render("#/utilisateur")
    let userHTML = `
        <div class="list-users-row" data-user-id="${user.id}">
            <div class="user-id-column">
                ${usersCount}
            </div>
            <div class="user-name-column">
                ${user.name} 
            </div>
            <div class="user-permission-type-column">
                <div>
                    ${user.role}
                </div>
            </div>
            <div class="actions">
                <div class="delete-user-button button" data-user-id = "${user.id}">
                    <img src="./src/icons/icons-delete.png" alt="delete">
                </div>
                <div class="modify-permission" data-user-id = "${user.id}"><img src="src/icons/icons-3-dots.png" alt=""></div>
            </div>
        </div>`;
    const listContainer = document.querySelector(".list-users-containers");
    listContainer.innerHTML += userHTML;
    addUsers();
    modifyButton();
    activeDeleteButton();
    filter("ADMIN","admin-filter");
    filter("EMPLOYE","employe-filter");
    filter("ALL", "all-filter");
}
export {gestionUtilisateur}
import { render } from "./render.js";

export function form(title,label=[],button = {}){
    let buttonHTML = ``;
    let fieldsContainer =``;
    let buttonContainer =``;
    let className;
    label.forEach(element => {
        if(element.type === "select"){
            let optionHTML =``;
            element.op.forEach((e)=>{
                optionHTML +=`
                    <option value="${e}">${e}</option>
                `;
            })

            fieldsContainer +=`
                <div class="fields-input input">
                    <div class="fields-input-name">${element.name}:</div>
                    <select name="role">
                        ${optionHTML}
                    </select>
                </div>
            `
        }
        else if(element.type === "password"){
            className = element.className1;
                fieldsContainer += `
                <div class="fields-input input">
                    <div class="fields-input-name">${element.name}:</div>
                    <input type="${element.type}" class= "${element.className}" placeholder="${element.placeholder}" name="${element.name}" ${element.accept? `accept= "${element.accept}"`: ""} required>
                    <div class="icons">👁️</div>
                </div>
                `;
        }
        else{
            fieldsContainer += `
                <div class="fields-input input">
                    <div class="fields-input-name">${element.name}:</div>
                    <input type="${element.type}" class= "${element.className}" placeholder="${element.placeholder}" name="${element.name}" ${element.accept? `accept= "${element.accept}"`: ""} required>
                </div>
            `
        }
    });
    button.forEach(element => {
        buttonHTML += `
            <button class="${element.className} button">${element.name}</button>
        `
    })
    buttonContainer = `
        <div class="button-container">
            ${buttonHTML}
        <div>
    `
    let formContainer =``;
    formContainer += `
    <div class="form-container">
        <div class="form-img-container">
            <img src="./src/images/logo.png" alt="logo.png">
        </div>
        <div class="title">
            ${title}
        </div>
        ${fieldsContainer}
        ${buttonContainer}
    </div>
    `;
    const form = `
    <section class="form">
        <div class="back-ground">

        </div>
        ${formContainer}
    </section>
`
    return form;
}

export function togglePasswordVisibility(className){
    const passwordInput = document.querySelector(`.${className}`);
    const toggleIcon = document.querySelector(".icons");
    toggleIcon.addEventListener("click", ()=>{
        if(passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.textContent = "🙈"; 
    }
    else {
    // Sinon, on le remet en 'password' et l'icône revient
        passwordInput.type = "password";
        toggleIcon.textContent = "👁️"; // Icône pour montrer
    }
    })
}
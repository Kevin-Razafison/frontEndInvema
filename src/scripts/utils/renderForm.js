export function form(title, label = [], button = {}) {
    let fieldsContainer = ``;
    let buttonContainer = ``;

    label.forEach(element => {
        if (element.type === "select") {
            let optionHTML = element.op.map(e => `<option value="${e}">${e}</option>`).join('');
            fieldsContainer += `
                <div class="fields-input input">
                    <div class="fields-input-name">${element.name}:</div>
                    <select class="${element.className || ''}">
                        ${optionHTML}
                    </select>
                </div>
            `;
        } else if (element.type === "password") {
            fieldsContainer += `
                <div class="fields-input input">
                    <div class="fields-input-name">${element.name}:</div>
                    <input type="password" class="${element.className}" placeholder="${element.placeholder}" ${element.accept ? `accept="${element.accept}"` : ''} required>
                    <div class="icons">👁️</div>
                </div>
            `;
        } else {
            fieldsContainer += `
                <div class="fields-input input">
                    <div class="fields-input-name">${element.name}:</div>
                    <input type="${element.type}" class="${element.className}" placeholder="${element.placeholder}" ${element.accept ? `accept="${element.accept}"` : ''} required>
                </div>
            `;
        }
    });

    button.forEach(element => {
        buttonContainer += `<button class="${element.className} button">${element.name}</button>`;
    });

    const formContainer = `
        <div class="form-container">
            <div class="form-img-container">
                <img src="./src/images/logo.png" alt="logo.png">
            </div>
            <div class="title">
                ${title}
            </div>
            ${fieldsContainer}
            <div class="button-container">
                ${buttonContainer}
            </div>
        </div>
    `;

    const form = `
        <section class="form">
            <div class="back-ground"></div>
            ${formContainer}
        </section>
    `;
    return form;
}

export function togglePasswordVisibility(className) {
    const passwordInput = document.querySelector(`.${className}`);
    const toggleIcon = document.querySelector(".icons");
    if (toggleIcon) {
        toggleIcon.addEventListener("click", () => {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                toggleIcon.textContent = "🙈";
            } else {
                passwordInput.type = "password";
                toggleIcon.textContent = "👁️";
            }
        });
    }
}
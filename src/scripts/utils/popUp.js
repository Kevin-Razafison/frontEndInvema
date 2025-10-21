export function popUp(title,message,className){
    let popUpHTML =`
        <div class="popUp ${className}">
            <div class="title">${title} </div>
            <div class="message">${message}</div>
            <div class="pop-up-button-container">
                <button class="confirmer">CONFIRMER</button>
                <button class="Annuler""> ANNULER</button>
            </div>
        </div>
        `
    return popUpHTML;
}


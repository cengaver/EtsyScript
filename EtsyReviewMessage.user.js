// ==UserScript==
// @name         Etsy Review Message
// @version      1.1
// @description  Send review message for buyer
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/orders/sold/completed?completed_status=delivered*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyReviewMessage.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyReviewMessage.user.js
// ==/UserScript==

(async function () {
    const defaultMessage = `
Hello {{userName}},
 🙏
`;

    async function setMessage() {
        const currentMessage = await GM.getValue("reviewMessage", defaultMessage);
        const newMessage = prompt(
            "Lütfen alıcıya göndermek istediğiniz mesajı yazın (başına ve sonuna otomatik olarak boş satır eklenir):",
            currentMessage
        );
        if (newMessage !== null) {
            const formattedMessage = `\n${newMessage}\n`; // Başına ve sonuna \n ekle
            await GM.setValue("reviewMessage", formattedMessage);
            alert("Mesaj kaydedildi!");
        }
    }

    async function main(send = false) {
        const orderName = document.querySelector("#order-details-header-text > span")?.innerText;
        if (!orderName) return;

        const userName = orderName.replace("Order from ", "");
        const savedMessage = await GM.getValue("reviewMessage", defaultMessage);
        const personalizedMessage = savedMessage.replace("{{userName}}", userName);

        const textAreaEl = document.querySelector('textarea[name="message"]');
        if (textAreaEl) {
            if (!textAreaEl.value.includes(personalizedMessage)) {
                textAreaEl.value += personalizedMessage; // Mevcut içeriğin sonuna ekle
                textAreaEl.setAttribute("value", textAreaEl.value); // Value'yi açıkça ayarla
                textAreaEl.dispatchEvent(new Event('input', { bubbles: true })); // "input" etkinliğini tetikle
                textAreaEl.dispatchEvent(new Event('change', { bubbles: true })); // "change" etkinliğini tetikle
            }
            textAreaEl.focus(); // Kutuyu odakla

            // Eğer "send" parametresi true ise mesaj dolu mu kontrol et ve gönder
            if (send && textAreaEl.value.trim()) {
                const sendButton = document.querySelector('button[data-test-id="submit"]');
                if (sendButton) {
                    //setTimeout(() => sendButton.click(), 500); // Gönderim için zamanlama ekle
                    //console.log("gömderildi")
                }
            } else if (send) {
                alert("Mesaj kutusu boş! Mesaj doldurulmadan gönderilemez.");
            }
        }
    }

    GM.registerMenuCommand("Mesajı Ayarla", setMessage);

    // Ctrl + Space ile sadece doldurma
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && !event.altKey && event.code === "Space") {
            main(false); // Sadece doldur
        }
    });

    // Ctrl + Alt  gönderme
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.altKey) {
            const sendButton = document.querySelector('button[data-test-id="submit"]');
            if (sendButton) {
                setTimeout(() => sendButton.click(), 500); // Gönderim için zamanlama ekle
                //console.log("gömderildi")
            }
        }
    });

    // Ctrl + Alt + Space ile doldurma ve gönderme
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.altKey && event.code === "Space") {
            main(true); // Doldur ve gönder
        }
    });
})();

// ==UserScript==
// @name         Etsy Review Message
// @version      1.5
// @description  Send review message for buyer
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/orders/sold/completed*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyReviewMessage.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyReviewMessage.user.js
// @run-at       document-en
// ==/UserScript==

(async function () {
    const defaultMessage = `Hello {{userName}}, 🙏`;

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
    GM.registerMenuCommand("Mesajı Ayarla", setMessage);

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

    async function butonsAll(el){
        //console.log("Betik başlatıldı.");
        // Butonlara tab sırası ekle
        el.forEach((button, index) => {
            let parentElement = button; // Başlangıç noktası olarak buton
            let skip = false;

            // 4 üst seviyeyi dolaşarak `data-icon="star"` kontrolü yap
            for (let i = 0; i < 5; i++) {
                if (!parentElement) break; // Eğer parent kalmazsa döngüyü kır
                parentElement = parentElement.parentElement; // Bir üst seviyeye çık

                if (parentElement && parentElement.querySelector('[data-icon="star"]')) {
                    skip = true; // Eğer `data-icon="star"` bulunursa atla
                    break;
                }
            }

            if (skip) return; // Atla

            // Tab sırasını ekle ve yaz
            button.tabIndex = index + 1;
            button.innerText = `...`;
        });

        let isTriggered = false;

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Control') isTriggered = false; // Tekrar basmaya izin verir.
            if (event.ctrlKey && event.key === 'ArrowRight' && !isTriggered) {
                isTriggered = true;

                // 1. Sayfayı geri götür
                window.history.back();

                // 2. 1 saniye sonra bir sonraki tabindex öğesine tıkla
                setTimeout(() => clickNextTabIndex(), 1000);
            }
        });

        function clickNextTabIndex() {
            const focusableElements = Array.from(document.querySelectorAll('[tabindex]'))
            .filter(el => !isNaN(el.getAttribute('tabindex')))
            .sort((a, b) => parseInt(a.getAttribute('tabindex')) - parseInt(b.getAttribute('tabindex')));

            const activeElement = document.activeElement;
            const currentIndex = focusableElements.indexOf(activeElement);

            const nextElement = focusableElements[currentIndex + 1] || focusableElements[0]; // Döngüsel olsun
            if (nextElement) {
                nextElement.focus();
                nextElement.click();
                console.log('Clicked on element with tabindex:', nextElement.getAttribute('tabindex'));
            }
        }

    }

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
    //console.log("Betik yüklendi.");

    const observer = new MutationObserver(() => {
                // Butonları seç
        const messageButtonsEL =
              "#browse-view > div > div.col-lg-9.pl-xs-0.pl-md-4.pr-xs-0.pr-md-4.pr-lg-0.float-left > div > section > div > div.panel-body > div > div > div.flag-img.flag-img-right.pt-xs-2.pt-xl-3.pl-xs-2.pl-xl-3.pr-xs-3.pr-xl-3.vertical-align-top.icon-t-2.hide-xs.hide-sm > div >";
        const buttons = document.querySelectorAll(
            messageButtonsEL+" div:nth-child(2) > span > button"
        );
        //const buttons = document.querySelectorAll('button.wt-btn--transparent.wt-tooltip__trigger');
        //console.log(buttons);
        if (buttons.length > 0) {
            butonsAll(buttons)
            //console.log("Butonlar bulundu:", buttons);
            observer.disconnect(); // Gözlemlemeyi durdur
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();

// ==UserScript==
// @name         Etsy Ad Wordlist
// @description  Ad Wordlist for T-shirt
// @version      1.39
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @match        https://www.etsy.com/your/shops/me/advertising/listings/*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addElement
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/notyf@3.0.0/notyf.min.js
// @resource     notyf-css https://cdn.jsdelivr.net/npm/notyf@3.0.0/notyf.min.css
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/AdWordlist.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/AdWordlist.user.js
// ==/UserScript==

(function () {
    "use strict"
    GM_addStyle(`
.wt-table__row__cell.wt-no-wrap.wt-pl-xs-2.wt-width-auto-lg.wt-width-full-xs {
    max-width: 700px; /* Genişliği ihtiyaca göre ayarla */
    white-space: nowrap; /* Metnin satırları taşmasın */
    overflow: hidden; /* Taşan metni gizle */
    text-overflow: ellipsis; /* Taşan metnin sonuna "..." ekle */
}

`);

    let isToastCssInjected = false
    let _Notyf = null
    /** @returns {import("notyf")} */
    const getToast = () => {
        if (!isToastCssInjected) {
            GM_addElement("style", {
                type: "text/css",
                textContent: GM_getResourceText("notyf-css"),
            })
            isToastCssInjected = true
        }

        return _Notyf || (_Notyf = new Notyf.Notyf())
    }

    /** @param {HTMLElement} rowEl */
    const getRowWord = (rowEl) => {
        const wordEl = rowEl.querySelector("th.wt-table__row__cell")
        const divEl = wordEl?.lastChild
        const pEl = divEl.querySelector("p")
        //if (!pEl) console.error("P element not found in", divEl)
        return pEl?.textContent
    }

    const getFilteredRows = async () => {
        let wordlist = (await GM.getValue("adWordlist", ""))
        .split("\n")
        .map((word) => word.replace("\r", "").trim())
        .filter((word) => word.length > 0)

        if (wordlist.length == 0) {
            await GM.setValue(
                "adWordlist",
                `dtf
svg
png
sticker
zip
hat
cup
slippers
doll
top
design
decal
embroider
transfer
iron on
pants
earrings
jewelry
purse
ornament
headband
bracelet
necklace
decor
patch
cardigan
skirt
mug
bag
tumbler
dxf
vinyl
glitter
cricut
ready to press
jacket
=football
=men&#39;s hoodies
=nurse
=shirt
=mens sweatshirt
=gender-neutral adult sweatshirts
=gender-neutral adult hoodies
=baseball
=tshirt
=comfort colors
=graphic tees
socks
=hoody
=hoddy
=hoodie
=womens hoodie
=womens sweatshirts
=women&#39;s sweatshirts
=women hoodies
=graphic hoodies
=graphic hoodie
=hoddies&#39; for women
=graphic hoodies for women
=sweatshirt
=sweater
=mens hoodies
=hoodie women
=hoodies for men
=trendy hoodies
=oversized hoodie
=trendy
=graphic sweatshirt
=plus size hoodie
=toddler
=halloween
=basketball`
      )
        return await getFilteredRows()
    }

      //console.log("Kelimeler:", wordlist)

      const rowEls = Array.from(document.querySelectorAll("tr.wt-table__row"))
      //console.log("All row elements:", rowEls)

      const filteredRowEls = rowEls.filter((rowEl) => {
          const word = getRowWord(rowEl)
          //console.log("Checking word:", word)
          return wordlist.some((w) => {
              if (w.startsWith("=")) {
                  return word === w.slice(1)
              }
              if (w.startsWith("/") && w.endsWith("/")) {
                  const regex = new RegExp(w.slice(1, -1))
                  return regex.test(word)
              }
              return word?.includes(w)
          })
      })
      //console.log("Filtered row elements:", filteredRowEls)
      return filteredRowEls
  }

  /** Get random number between start and end
   * @param {number} start
   * @param {number} end
   */
  const getRandomInt = (start, end) =>
  Math.floor(Math.random() * (end - start + 1)) + start

  /** @param {number} ms */
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  /** @param {bool} targetState */
  const toggleRows = async (targetState,closeSection) => {
      const filteredRows = await getFilteredRows()

      let affectedCount = 0
      const actionName = targetState ? "açıldı" : "kapatıldı"
      for (const rowEl of filteredRows) {
          const checkbox = rowEl.querySelector("input[type=checkbox]")
          if (checkbox.checked !== targetState) {
              checkbox.click()

              getToast().success(`${getRowWord(rowEl)} <br> Kelime ${actionName}`)
              affectedCount++
              const sleepMs = getRandomInt(800, 1200)
              await sleep(sleepMs)
          }
      }

      getToast().success(`Toplam ${affectedCount} kelime ${actionName}.`)
      if (closeSection) checkNextButton();
  }

      async function checkNextButton() {
        const nav = document.querySelector('#listing-detail-targeted-keywords-accordion nav');
        if (!nav) return;

        const nextButton = Array.from(nav.querySelectorAll('button')).find(btn => {
            const span = btn.querySelector('span.wt-screen-reader-only');
            return span && span.textContent.trim() === 'Next';
        });

          if (nextButton) {
              if (nextButton.getAttribute('aria-disabled') === 'true') {
                  window.close();
                  console.log("Sayfa Kapandı");
              } else {
                  nextButton.click();
                  console.log("Sonraki Sayfaya Geçildi");
                  const sleepMs = getRandomInt(1200, 2500)
                  await sleep(sleepMs)
                  toggleRows(false,true);
              }
          }
      }

    async function colorRoas() {
        //console.log("colorRoas çalıştı");
        const roassEl = document.querySelectorAll("tr.wt-table__row");
        roassEl.forEach((roas, index) => {
            setTimeout(() => {
                const clicks = Number(roas.querySelector("td:nth-child(3) > p")?.textContent.trim() || 0);
                const order = Number(roas.querySelector("td:nth-child(5) > p")?.textContent.trim() || 0);
                if ((order>0 && (clicks / order)>25) || (order == 0 && clicks > 25)){
                    console.log("order: ", order);
                    console.log("clicks: ", clicks);
                    roas.style.backgroundColor = "#e814b1";
                }else{
                    //roas.style.backgroundColor = "";
                }
                //console.log(roas);
            }, index * 20);
        });
    }

    window.addEventListener("load", async () => {
        await colorRoas()
        let filteredRows = await getFilteredRows()
        for (const rowEl of filteredRows) {
            rowEl.style.backgroundColor = "#ffa59e"
        }
        // Show welcome message
        getToast().success("Ads Tool : CTRL + Alt");
    })


    GM_registerMenuCommand("Kelimeleri kapat", () => toggleRows(false))
    GM_registerMenuCommand("Kelimeleri aç", () => toggleRows(true))

    GM_registerMenuCommand("Yasaklı kelimeleri düzenle", async () => {
        const popup = window.open(
            "about:blank",
            "popupWindow",
            "width=400,height=600"
        )
        popup.document.title = "Yasaklı kelimeleri düzenle"

        window.addEventListener("message", (event) => {
            if (event.source !== popup) return
            GM.setValue("adWordlist", event.data)
        })

        const info = document.createElement("p")
        info.textContent =
            "Her satırdaki kelimeler, metin içinde geçiyorsa işaretlenecektir. Tam eşleşme yapılacaksa satırın başına = koyun. Düzenli ifadeler (regex) için satırın başına ve sonuna / koyun."
        info.style.fontFamily = "system-ui"
        info.style.fontSize = "small"
        info.style.lineHeight = "1"
        popup.document.body.appendChild(info)

        const container = document.createElement("div")
        container.id = "container"
        container.style.width = "100%"
        container.style.height = "100%"
        popup.document.body.appendChild(container)

        const linkTag = document.createElement("link")
        linkTag.rel = "stylesheet"
        linkTag.href =
            "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs/editor/editor.main.css"
        linkTag.integrity = "sha256-BRc+GN/apOv/hPbPAd2cp5FXIrQGkg6TkYgRYHQEmvo="
        linkTag.crossOrigin = "anonymous"
        popup.document.head.appendChild(linkTag)

        const scriptTag = document.createElement("script")
        scriptTag.src =
            "https://requirejs.org/docs/release/2.3.7/minified/require.js"

        const scriptTag2 = document.createElement("script")
        const value = JSON.stringify(await GM.getValue("adWordlist", ""))
        scriptTag2.innerHTML = `
        opener.onbeforeunload = () => window.close();

        require.config({ paths: { "vs": 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs' } })

        require(['vs/editor/editor.main'], function () {
          var editor = monaco.editor.create(document.getElementById('container'), {
            value: ${value},
            language: 'plaintext',
            minimap: { enabled: false },
          })

          editor.onDidChangeModelContent(function () {
            opener.postMessage(editor.getValue(), "*")
          })
        });
    `

        scriptTag.addEventListener("load", () => {
            popup.document.body.appendChild(scriptTag2)
        })

        popup.document.body.appendChild(scriptTag)
    })
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.code === "Space") {
            toggleRows(false)
        }else if(event.ctrlKey && event.altKey){
            toggleRows(false,true)
        }
    })
})()

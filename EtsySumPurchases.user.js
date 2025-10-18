// ==UserScript==
// @name         Etsy Purchases
// @namespace    https://github.com/cengaver
// @version      0.21
// @description  Etsy Purchases
// @author       Cengaver
// @match        https://www.etsy.com/your/purchases*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyPurchases.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyPurchases.user.js
// ==/UserScript==

(() => {
  console.log('[TX-DEBUG] starter');

  function parsePriceToNumber(s){
    if(!s) return null;
    s = s.toString().trim().replace(/\s+/g,'').replace(/[^0-9\.,-]/g,'');
    if(s.indexOf('.')!==-1 && s.indexOf(',')!==-1){
      const lastComma=s.lastIndexOf(','), lastDot=s.lastIndexOf('.');
      if(lastComma>lastDot){ s = s.replace(/\./g,''); s = s.replace(/,/g,'.'); }
      else { s = s.replace(/,/g,''); }
    } else if(s.indexOf(',')!==-1) s = s.replace(/,/g,'.');
    const v = parseFloat(s); return Number.isFinite(v)? v : null;
  }

  function readTransaction(li){
    const titleEl = li.querySelector('.transaction-title a');
    const imgEl = li.querySelector('.transaction-image img');
    const priceEl = li.querySelector('.currency-value');
    const priceText = priceEl ? priceEl.innerText.trim() : null;
    return {
      transactionId: li.getAttribute('data-transaction-id') || null,
      receiptId: li.getAttribute('data-receipt-id') || null,
      title: titleEl?.innerText?.trim() || null,
      link: titleEl?.href || null,
      image: imgEl?.src || imgEl?.getAttribute('data-src') || null,
      priceText,
      priceNumber: parsePriceToNumber(priceText)
    };
  }

  function attachButton(li){
    if(li.querySelector('.tx-get-info-btn')) {
      console.log('[TX-DEBUG] button already exists for', li.getAttribute('data-transaction-id'));
      return;
    }

    const target = li.querySelector('.transaction-download.transaction-data') || li.querySelector('.transaction-downloads') || li.querySelector('.transaction-download');
    const container = target || li;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tx-get-info-btn btn btn-small';
    btn.textContent = 'Bilgileri Al';
    btn.style.marginLeft = '8px';
    btn.style.cursor = 'pointer';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const info = readTransaction(li);
      console.log('[TX-DEBUG] clicked info:', info);
      const blob = new Blob([JSON.stringify(info, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction-${info.transactionId||info.receiptId||'unknown'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      btn.textContent = 'İndirildi';
      btn.disabled = true;
      li.setAttribute('data-last-exported', new Date().toISOString());
    });

    container.appendChild(btn);
    console.log('[TX-DEBUG] attached button to', li.getAttribute('data-transaction-id') || li);
  }

  // Li için "hazır" olup olmadığını kontrol eden fonksiyon
  function isReady(li){
    if(!li) return false;
    const title = li.querySelector('.transaction-title a');
    const price = li.querySelector('.currency-value');
    // READY koşulu: başlık mutlaka; fiyat varsa daha iyi ama olmasa da buton ekleyebiliriz
    return Boolean(title) && (price || true);
  }

  // Her li için deneme yap (maxRetries * interval ms süre boyunca)
  function waitAndAttach(li){
    if(!li) return;
    if(li.getAttribute('data-read') === 'true'){
      console.log('[TX-DEBUG] already read:', li.getAttribute('data-transaction-id'));
      return;
    }

    let attempts = 0;
    const maxRetries = 10;
    const intervalMs = 1000;

    const tryOnce = () => {
      attempts++;
      const titleEl = li.querySelector('.transaction-title a');
      const priceEl = li.querySelector('.currency-value');
      console.log(`[TX-DEBUG] try ${attempts} for li ${li.getAttribute('data-transaction-id')}, title=${!!titleEl}, price=${!!priceEl}`);
      if(titleEl){ // title varsa botón ekle (price sonradan eklenirse click okur)
        li.setAttribute('data-read','true');
        attachButton(li);
        return true;
      }
      if(attempts >= maxRetries){
        console.log('[TX-DEBUG] giving up after max attempts for', li.getAttribute('data-transaction-id'));
        // yine de attach (title yoksa li sonuna ekle)
        li.setAttribute('data-read','true');
        attachButton(li);
        return true;
      }
      return false;
    };

    if(tryOnce()) return;

    const intId = setInterval(()=>{
      if(tryOnce()){
        clearInterval(intId);
      }
    }, intervalMs);

    // ayrıca, li içinde değişiklik olursa hızlıca dene
    const obs = new MutationObserver((muts, o) => {
      const titleNow = li.querySelector('.transaction-title a');
      if(titleNow){
        if(intId) clearInterval(intId);
        li.setAttribute('data-read','true');
        attachButton(li);
        o.disconnect();
      }
    });
    obs.observe(li, {childList: true, subtree: true, attributes: true});
    // güvenlik: 12s sonra cleanup
    setTimeout(()=>{
      try{ obs.disconnect(); } catch(e){}
      try{ clearInterval(intId); } catch(e){}
    }, (maxRetries+2)*intervalMs);
  }

  // Başlangıçtaki li'ler
  const initial = document.querySelectorAll('li.transaction');
  console.log('[TX-DEBUG] initial li count:', initial.length);
  initial.forEach(li => waitAndAttach(li));

  // Tüm sayfayı gözle, yeni li eklendiğinde işleme al
  const pageObs = new MutationObserver((muts) => {
    for(const m of muts){
      if(m.type === 'childList' && m.addedNodes.length){
        m.addedNodes.forEach(n => {
          if(n.nodeType !== 1) return;
          if(n.matches && n.matches('li.transaction')){
            console.log('[TX-DEBUG] new li added');
            waitAndAttach(n);
          } else if(n.querySelectorAll){
            const nested = n.querySelectorAll('li.transaction');
            if(nested.length){
              console.log('[TX-DEBUG] added parent with', nested.length, 'li.transaction');
              nested.forEach(li => waitAndAttach(li));
            }
          }
        });
      }
    }
  });
  pageObs.observe(document.body, {childList: true, subtree: true});

  // Fallback periyodik tarama kısa süre
  const fallbackInterval = setInterval(() => {
    const toProcess = [...document.querySelectorAll('li.transaction')].filter(li => li.getAttribute('data-read') !== 'true');
    if(toProcess.length){
      console.log('[TX-DEBUG] fallback scanning, toProcess:', toProcess.length);
      toProcess.forEach(li => waitAndAttach(li));
    }
    // 60s sonra fallback'i durdur
  }, 3000);

  setTimeout(()=>{
    clearInterval(fallbackInterval);
    console.log('[TX-DEBUG] stopped fallback interval');
  }, 60000);

  // temizleme fonksiyonu konsola ekle (isteğe bağlı)
  window.__tx_debug_cleanup = () => {
    try{ pageObs.disconnect(); } catch(e) {}
    try{ clearInterval(fallbackInterval); } catch(e) {}
    console.log('[TX-DEBUG] cleaned up observers');
  };

  console.log('[TX-DEBUG] ready');
})();

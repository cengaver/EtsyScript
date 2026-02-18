// ==UserScript==
// @name         Etsy Title GEM Optimizer
// @namespace    https://github.com/cengaver
// @author       Cengaver
// @version      1.0.2
// @description  Etsy listing title GEM ile yeniden yazma butonu
// @match        https://www.etsy.com/your/shops/me/listing-editor/edit/*
// @icon         https://www.google.com/s2/favicons?domain=etsy.com
// @connect      generativelanguage.googleapis.com
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.addStyle
// @downloadURL  https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyTitleOptimizer.user.js
// @updateURL    https://github.com/cengaver/EtsyScript/raw/refs/heads/main/EtsyTitleOptimizer.user.js
// ==/UserScript==

(function(){
  'use strict'
      GM.addStyle(`
       :root {
            --primary-color: #4285f4;
            --primary-dark: #3367d6;
            --secondary-color: #34a853;
            --secondary-dark: #2e7d32;
            --danger-color: #ea4335;
            --danger-dark: #c62828;
            --warning-color: #fbbc05;
            --warning-dark: #f57f17;
            --light-color: #f8f9fa;
            --dark-color: #202124;
            --gray-color: #5f6368;
            --border-radius: 4px;
            --box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            --transition: all 0.3s ease;
            --font-family: 'Segoe UI', Roboto, Arial, sans-serif;
        }

        /* Toast Notifications */
        .toast-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .toast {
            min-width: 280px;
            padding: 12px 16px;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            font-family: var(--font-family);
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            opacity: 0;
            transform: translateY(20px);
            transition: var(--transition);
        }

        .toast.show {
            opacity: 1;
            transform: translateY(0);
        }

        .toast-success {
            background-color: var(--secondary-color);
            color: white;
        }

        .toast-error {
            background-color: var(--danger-color);
            color: white;
        }

        .toast-warning {
            background-color: var(--warning-color);
            color: var(--dark-color);
        }

        .toast-info {
            background-color: var(--primary-color);
            color: white;
        }

        .toast-close {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            font-size: 16px;
            margin-left: 10px;
            opacity: 0.7;
        }

        .toast-close:hover {
            opacity: 1;
        }
    `);
    GM.registerMenuCommand("⚙️ API Key Ayarla", async () => {
        const currentKey = await getApiKey();
        const key = prompt(" Sheet Url'nizi girin:" ,currentKey);
        if (key) {
            await GM.setValue("api_key", key.trim());
            showToast('✅ Kaydedildi','info');
        }
    });
    async function getApiKey() {
        const key = await GM.getValue("api_key", "");
        return key;
    }

    let isProcessing = false; // Flag to prevent multiple executions
    let toastContainer = null;
    // Modern Toast Notification System
    function createToastContainer() {
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        return toastContainer;
    }

    function showToast(message, type = 'success', duration = 3000) {
        const container = createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        });

        toast.appendChild(messageSpan);
        toast.appendChild(closeBtn);
        container.appendChild(toast);

        // Show animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    const waitFor=(fn,timeout=10000)=>{
        const start=Date.now()
        return new Promise((res,rej)=>{
            const t=setInterval(()=>{
                const v=fn()
                if(v){clearInterval(t);res(v)}
                if(Date.now()-start>timeout){clearInterval(t);rej()}
            },200)
            })
    }

    const getTitleInput=()=>document.querySelector('input[name="title"], textarea[name="title"]')

    const createButton=()=>{
        const btn=document.createElement('button')
        btn.type='button'
        btn.innerHTML='✨ Optimize Title(GEM)'
        btn.className='wt-btn wt-btn--small wt-btn--secondary'
        btn.style.marginBottom='8px'
        btn.onclick=async()=>{
            const input=getTitleInput()
            if(!input||!input.value.trim())return

            const oldTitle=input.value.trim()
            btn.disabled=true
            btn.innerText='⏳ Optimizing...'
            const GEM_PROMPT=`
You are an expert Etsy SEO optimization engine specialized in Etsy’s 2025 search model.

Rules:
- Do NOT rewrite from scratch
- Keep at least 70% of original wording
- Improve keyword order and clarity
- No emojis, no fluff, no new claims
- Ideal length 110–130 chars (max 140)

Output STRICT JSON:
{
  "new_title": "...",
  "confidence": 0.0,
  "change_type": "none|micro|light"
}
`;

            const payload={
                system_instruction:{
                    parts:[{text:GEM_PROMPT}]
                },
                contents:[{
                    role:"user",
                    parts:[{
                        text: JSON.stringify({ title: oldTitle })
                    }]
                }]
            };
            const GEM_API_KEY= await getApiKey()
            if(!GEM_API_KEY) return;
            const GEM_ENDPOINT=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEM_API_KEY}`
            console.log(GEM_ENDPOINT);
            GM.xmlHttpRequest({
                method:"POST",
                url:GEM_ENDPOINT,
                headers:{
                    "Content-Type":"application/json"
                },
                data: JSON.stringify(payload),
                onload:function(res){
                    try{
                        const j=JSON.parse(res.responseText);
                        let raw=j.candidates?.[0]?.content?.parts?.[0]?.text;
                        if(!raw) throw 'empty';

                        raw=cleanJson(raw); // 🔴 KRİTİK SATIR

                        const data=JSON.parse(raw);

                        if(data.new_title){
                            input.value=data.new_title;
                            input.dispatchEvent(new Event('input',{bubbles:true}));

                            showToast(
                                `Optimize edildi (${data.change_type}, ${Math.round(data.confidence*100)}%)`,
                                'success'
                            );

                            console.log('✨ GEM OK', data);
                        }

                    }catch(e){
                        console.log('❌ GEM parse hatası', res.responseText);
                    }
                }

            });

            btn.disabled=false
            btn.innerText='✨ Optimize Title(GEM)'
        }
        return btn
    }
    function cleanJson(text){
        return text
            .replace(/```json/gi,'')
            .replace(/```/g,'')
            .trim();
    }
    const mount=async()=>{
        const input=await waitFor(getTitleInput)
        const wrap=input.closest('.wt-mb-xs-2,.wt-mb-xs-3')||input.parentElement
        if(wrap.querySelector('.gem-btn'))return
        const btn=createButton()
        btn.classList.add('gem-btn')
        wrap.prepend(btn)
  }

  mount()
})()

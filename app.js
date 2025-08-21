document.addEventListener("DOMContentLoaded", () => {
  // ---- Konfigurace výpočtu ----
  const COMMISSION_RATE = 0.30;        // 30 % z netto tržby
  const BASE_FULL_SHIFT = 1000;        // fix pro plnou směnu
  const BASE_HALF_SHIFT = 500;         // fix pro 1/2 směnu
  const THRESHOLD_FULL = 3330;         // hranice, od které se jede % (plná)
  const THRESHOLD_HALF = THRESHOLD_FULL / 2; // hranice pro 1/2 směnu
  const MIN_TRZBA_PER_KM = 15;
  // === ULTRA enhancements (v9_ultra_20250820192037) ===
  const HISTORY_KEY = "rbTaxiHistory";
  function pushHistory(entry) { 
    try { 
      const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      arr.unshift(entry);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0,10)));
    } catch(_e) {}
  }
  function renderHistory(){
    const box = document.getElementById("history");
    const list = document.getElementById("historyList");
    const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    if (!arr.length) { box.classList.add("hidden"); return; }
    const shiftMap = { "den":"Denní","noc":"Noční","odpo":"Odpolední","pul":"1/2 směna" };
    const rows = arr.map(e => `
      <div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px dashed rgba(255,255,255,.15)">
        <div style="flex:1;min-width:0">
          <div style="font-weight:700">${e.datum} – ${e.driver} (${shiftMap[e.shift] || e.shift})</div>
          <div style="opacity:.85">Tržba ${e.trzba} Kč • K odevzdání ${e.kOdevzdani.toFixed(2)} Kč • Výplata ${e.vyplata.toFixed(2)} Kč</div>
        </div>
        <button type="button" class="secondary" onclick="navigator.clipboard && navigator.clipboard.writeText(this.previousElementSibling.innerText).catch(()=>{})">Kopírovat</button>
      </div>`).join("");
    list.innerHTML = rows;
    box.classList.remove("hidden");
  }
         // minimální požadavek (Kč/km)

  const form = document.getElementById("calcForm");
  const output = document.getElementById("output");
  const resetBtn = document.getElementById("resetBtn");
  const pdfBtn = document.getElementById("pdfExport");
  const themeToggle = document.getElementById("themeToggle");
  const historyBox = document.getElementById("history");

  // Theme persistence
  (function(){
    const key="rbTheme";
    const saved = localStorage.getItem(key);
    if (saved === "light") document.body.classList.add("light-mode");
    updateThemeLabel();
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("light-mode");
      localStorage.setItem(key, document.body.classList.contains("light-mode") ? "light" : "dark");
      updateThemeLabel();
      try{renderHistory();}catch(_e){}
    });
    function updateThemeLabel(){
      const light = document.body.classList.contains("light-mode");
      const ico = light ? '#icon-sun' : '#icon-moon';
      const label = light ? 'Světlý režim' : 'Tmavý režim';
      const el = document.getElementById("themeToggle");
      if (el){
        el.innerHTML = '<svg class="icon"><use href="'+ico+'"/></svg> ' + label;
      }
    }
  })();
form.addEventListener("submit", e => {
    e.preventDefault();

    const driver = getValue("driverName");
    const shift = getValue("shiftType");
    const shiftLabelMap = { den: "Denní", noc: "Noční", odpo: "Odpolední", pul: "1/2 směna" };
    const shiftLabel = shiftLabelMap[shift] || shift;
    const km = getNumber("km");
    const trzba = getNumber("trzba");
    const pristavne = getNumber("pristavne");
    const palivo = getNumber("palivo");
    const myti = getNumber("myti");
    const kartou = getNumber("kartou");
    const fakturou = getNumber("fakturou");
    const jine = getNumber("jine");

    
    const netto = trzba - pristavne;
    const minTrzba = km * MIN_TRZBA_PER_KM;
    const nedoplatek = trzba < minTrzba;
    const doplatek = nedoplatek ? (minTrzba - trzba) : 0;

    // Výplata řidiče
    let vyplata = 0;
    const isHalf = (shift === "pul");
    const threshold = isHalf ? THRESHOLD_HALF : THRESHOLD_FULL;
    vyplata = (netto > threshold) ? (netto * COMMISSION_RATE) : (isHalf ? BASE_HALF_SHIFT : BASE_FULL_SHIFT);
    vyplata = Math.round(vyplata * 100) / 100;

    // K odevzdání (hotovost) – dle ukázky neodečítá přístavné ani výplatu
    const kOdevzdani = trzba - palivo - myti - kartou - fakturou - jine;

    const datum = new Date().toLocaleString("cs-CZ");

    const html = `
      <div class="title"><svg class="icon"><use href="#icon-doc"/></svg> Výčetka řidiče</div>
      <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-clock"/></svg></span> Datum:</div><div class="val">${datum}</div></div>
      <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-user"/></svg></span> Řidič:</div><div class="val">${driver}</div></div>
      <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-clock"/></svg></span> Směna:</div><div class="val">${shiftLabel}</div></div>
      <div class="hr"></div>
      <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-cash"/></svg></span> Tržba:</div><div class="val">${trzba} Kč</div></div>
      <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-fuel"/></svg></span> Palivo:</div><div class="val">${palivo} Kč</div></div>
      <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-wash"/></svg></span> Mytí:</div><div class="val">${myti} Kč</div></div>
      <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-card"/></svg></span> Kartou:</div><div class="val">${kartou} Kč</div></div>
      <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-doc"/></svg></span> Faktura:</div><div class="val">${fakturou} Kč</div></div>
      <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-flag"/></svg></span> Přístavné:</div><div class="val">${pristavne} Kč</div></div>
      <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-box"/></svg></span> Jiné platby:</div><div class="val">${jine} Kč</div></div>
      <div class="hr"></div>
      <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-box"/></svg></span> K odevzdání:</div><div class="val money-blue">${kOdevzdani.toFixed(2)} Kč</div></div>
      <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-cash"/></svg></span> Výplata řidiče:</div><div class="val money-green">${vyplata.toFixed(2)} Kč</div></div>
      ${nedoplatek ? `<div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-flag"/></svg></span> Doplatek do minima:</div><div class="val money-red">${doplatek.toFixed(2)} Kč</div></div>` : ``}
      <div class="note">
        <label for="note"><strong><span class="ico"><svg class="icon"><use href="#icon-doc"/></svg></span> Poznámka ke směně:</strong></label>
        <textarea id="note" rows="3" placeholder="Volitelná poznámka..."></textarea>
      </div>
    `;

    output.innerHTML = html;
    output.classList.remove("hidden");
    document.getElementById('actions').classList.remove('hidden');
    try{
      pushHistory({driver, shift, km, trzba, pristavne, palivo, myti, kartou, fakturou, jine, kOdevzdani, vyplata, datum});
      renderHistory();
    }catch(_e){}
  });

  resetBtn.addEventListener("click", () => {
    const keepName = document.getElementById("driverName").value;
    form.reset();
    document.getElementById("driverName").value = keepName;
    output.classList.add("hidden");
    document.getElementById('actions').classList.add('hidden');
  });

  pdfBtn.addEventListener("click", () => {
    const node = output;
    if (!node || node.classList.contains("hidden")) { alert("Nejprve vypočítejte výčetku."); return; }
    html2canvas(node, {scale:2, useCORS:true}).then(canvas => {
      const img = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({orientation:"portrait", unit:"pt", format:"a4"});
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 28;
      const w = pageWidth - margin*2;
      const h = canvas.height * (w / canvas.width);
      pdf.addImage(img, "PNG", margin, margin, w, h, undefined, "FAST");
      pdf.save("RB-TAXI-vycetka.pdf");
    }).catch(e => alert("Export do PDF selhal: " + e.message));
  });
  
  // Sdílení výstupu
  const shareBtn = document.getElementById("shareBtn");
  const newShiftBtn = document.getElementById("newShiftBtn");

  shareBtn.addEventListener("click", async () => {
    try{
      const text = output.innerText.trim();
      if (!text) return;
      if (navigator.share){
        await navigator.share({title:"Výčetka řidiče", text});
      } else if (navigator.clipboard){
        await navigator.clipboard.writeText(text);
        alert("Zkopírováno do schránky.");
      } else {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta);
        ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
        alert("Zkopírováno do schránky.");
      }
    }catch(e){ alert("Sdílení selhalo: " + e.message); }
  });} else if (navigator.clipboard){
        await navigator.clipboard.writeText(text);
        alert("Zkopírováno do schránky.");
      } else {
        const w = window.open("", "_blank"); 
        w.document.write("<pre>"+text.replace(/</g,"&lt;")+"</pre>");
        w.document.close();
      }
    }catch(e){ alert("Sdílení selhalo: " + e.message); }
  });}else{
        await navigator.clipboard.writeText(text);
        alert("Zkopírováno do schránky.");
      }
    }catch(e){ console.warn(e); }
  });

  newShiftBtn.addEventListener("click", () => {
    const keepName = document.getElementById("driverName").value;
    form.reset();
    document.getElementById("driverName").value = keepName;
    const note = document.getElementById("note");
    if (note) note.value = "";
    output.classList.add("hidden");
    document.getElementById('actions').classList.add('hidden');
  });
});

  function getValue(id) {
    return document.getElementById(id).value.trim();
  }

  function getNumber(id) {
    const raw = document.getElementById(id).value.trim().replace(",", ".");
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
  }


  // Registrace service workeru pro PWA (pokud je podporováno)
  if (location.protocol.startsWith("http") && "serviceWorker" in navigator) { window.addEventListener("load", () => { navigator.serviceWorker.register("service-worker.js?v=v10_ultra_fix_20250820194050").catch(console.warn); }); });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // === CONFIG ===
  const COMMISSION_RATE = 0.30;        // 30 % z netto tržby
  const BASE_FULL_SHIFT = 1000;        // fix pro plnou směnu
  const BASE_HALF_SHIFT = 500;         // fix pro 1/2 směnu
  const THRESHOLD_FULL = 3330;         // hranice, od které se jede % (plná)
  const THRESHOLD_HALF = THRESHOLD_FULL / 2; // hranice pro 1/2 směnu
  const MIN_TRZBA_PER_KM = 15;         // minimum Kč/km

  // === ELEMENTS ===
  const form = document.getElementById("calcForm");
  const output = document.getElementById("output");
  const actions = document.getElementById("actions");
    
  const resetBtn = document.getElementById("resetBtn");
  const pdfBtn = document.getElementById("pdfExport");
  const shareBtn = document.getElementById("shareBtn");
  const newShiftBtn = document.getElementById("newShiftBtn");
  const themeToggle = document.getElementById("themeToggle");

  // === HELPERS ===
  function getValue(id) {
    const el = document.getElementById(id);
    return el ? (el.value || "").trim() : "";
  }
  function getNumber(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const raw = (el.value || "").trim().replace(",", ".");
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
  }

  // === THEME (persist + system default) ===
  (function initTheme(){
    const key = "rbTheme";
    let saved = localStorage.getItem(key);
    if (!saved) {
      try {
        saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
      } catch (_e) { saved = 'dark'; }
      localStorage.setItem(key, saved);
    }
    if (saved === "light") document.body.classList.add("light-mode");
    updateThemeLabel();
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
        localStorage.setItem(key, document.body.classList.contains("light-mode") ? "light" : "dark");
        updateThemeLabel();
        });
    }
  })();

  function updateThemeLabel(){
    const light = document.body.classList.contains("light-mode");
    const ico = light ? '#icon-sun' : '#icon-moon';
    const label = light ? 'Světlý režim' : 'Tmavý režim';
    const el = document.getElementById("themeToggle");
    if (el) el.innerHTML = '<svg class="icon"><use href="'+ico+'"/></svg> ' + label;
  }

  // === HISTORY ===
  
  let lastData = null;
  // === SUBMIT ===
  if (form) {
    form.addEventListener("submit", (e) => {
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

      const isHalf = (shift === "pul");
      const threshold = isHalf ? THRESHOLD_HALF : THRESHOLD_FULL;
      let vyplata = (netto > threshold) ? (netto * COMMISSION_RATE) : (isHalf ? BASE_HALF_SHIFT : BASE_FULL_SHIFT);
      vyplata = Math.round(vyplata * 100) / 100;

      const kOdevzdani = trzba - palivo - myti - kartou - fakturou - jine;

      const datum = new Date().toLocaleString("cs-CZ");
      const kcPerKm = km>0 ? (trzba/km) : 0;
      const podilBezhotovost = trzba>0 ? ((kartou+fakturou)/trzba)*100 : 0;
      const rozdilVsMinimum = trzba - minTrzba;
      const rezimVyplaty = (netto > (isHalf ? THRESHOLD_HALF : THRESHOLD_FULL)) ? "% z netto" : (isHalf ? "Fix 1/2 směna" : "Fix plná směna");
      lastData = { datum, driver, shiftLabel, km, trzba, pristavne, palivo, myti, kartou, fakturou, jine, netto, minTrzba, doplatek, nedoplatek, vyplata, kOdevzdani, kcPerKm, podilBezhotovost, rezimVyplaty, rozdilVsMinimum };
      const html = `
        <div class="title"><svg class="icon"><use href="#icon-doc"/></svg> Výčetka řidiče</div>
        <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-clock"/></svg></span> Datum:</div><div class="val">${datum}</div></div>
        <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-user"/></svg></span> Řidič:</div><div class="val">${driver}</div></div>
        <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-clock"/></svg></span> Směna:</div><div class="val">${shiftLabel}</div></div>
        <div class="hr"></div>
        <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-road"/></svg></span> Kč / km:</div><div class="val">${(km>0 ? (trzba/km).toFixed(2) : "0.00")} Kč/km</div></div>
        <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-cash"/></svg></span> Netto (tržba − přístavné):</div><div class="val">${netto.toFixed(2)} Kč</div></div>
        <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-flag"/></svg></span> Minimum dle KM:</div><div class="val">${minTrzba.toFixed(2)} Kč</div></div>
        <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-flag"/></svg></span> Rozdíl vs. minimum:</div><div class="val">${(trzba - minTrzba).toFixed(2)} Kč</div></div>
        <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-card"/></svg></span> Podíl bezhotovost (kartou+faktura):</div><div class="val">${(trzba>0 ? (((kartou+fakturou)/trzba)*100).toFixed(1) : "0.0")} %</div></div>
        <div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-doc"/></svg></span> Režim výplaty:</div><div class="val">${(netto > (shift==="pul" ? THRESHOLD_HALF : THRESHOLD_FULL)) ? "% z netto" : (shift==="pul" ? "Fix 1/2 směna" : "Fix plná směna")}</div></div>
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
        ${nedoplatek ? `<div class="row"><div class="key"><span class="ico"><svg class="icon"><use href="#icon-flag"/></svg></span> Doplatek řidiče na KM:</div><div class="val money-red">${doplatek.toFixed(2)} Kč</div></div>` : ``}
        <div class="note">
          <label for="note"><span class="ico"><svg class="icon"><use href="#icon-doc"/></svg></span> <strong>Poznámka ke směně:</strong></label>
          <textarea id="note" rows="3" placeholder="Volitelná poznámka..."></textarea>
        </div>
      `;

      output.innerHTML = html;
      output.classList.remove("hidden");
      if (actions) actions.classList.remove("hidden");

          });
  }

  // === BUTTONS ===
  if (resetBtn) resetBtn.addEventListener("click", () => {
    const keepName = document.getElementById("driverName")?.value || "";
    form?.reset();
    if (keepName) document.getElementById("driverName").value = keepName;
    output?.classList.add("hidden");
    actions?.classList.add("hidden");
  });

  if (newShiftBtn) newShiftBtn.addEventListener("click", () => {
    const keepName = document.getElementById("driverName")?.value || "";
    form?.reset();
    if (keepName) document.getElementById("driverName").value = keepName;
    const note = document.getElementById("note");
    if (note) note.value = "";
    output?.classList.add("hidden");
    actions?.classList.add("hidden");
  });

  if (shareBtn) shareBtn.addEventListener("click", async () => {
    try {
      const text = (output && !output.classList.contains("hidden")) ? output.innerText.trim() : "";
      if (!text) { alert("Nejprve vypočítejte výčetku."); return; }
      if (navigator.share) {
        await navigator.share({ title: "Výčetka řidiče", text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert("Zkopírováno do schránky.");
      } else {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta);
        ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
        alert("Zkopírováno do schránky.");
      }
    } catch(e) {
      alert("Sdílení selhalo: " + (e && e.message ? e.message : e));
    }
  });

  if (pdfBtn) pdfBtn.addEventListener("click", () => {
    const node = output;
    if (!node || node.classList.contains("hidden")) { alert("Nejprve vypočítejte výčetku."); return; }
    html2canvas(node, { scale: 2, useCORS: true }).then(canvas => {
      const img = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) { alert("Chybí jsPDF knihovna."); return; }
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 28;
      const w = pageWidth - margin*2;
      const h = canvas.height * (w / canvas.width);
      pdf.addImage(img, "PNG", margin, margin, w, h, undefined, "FAST");
      pdf.save("RB-TAXI-vycetka.pdf");
    }).catch(e => alert("Export do PDF selhal: " + (e && e.message ? e.message : e)));
  });

  // === SERVICE WORKER (https only) ===
  if ((location.protocol.startsWith("http")) && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js?v=v13_hardfix_20250821103429").catch(console.warn);
    });
  }
});

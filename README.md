# RB TAXI – Mobile ULTRA

Luxusní jednostránková PWA pro výčetku řidiče. Připraveno pro GitHub Pages / Netlify / Vercel.

## Novinky
- 💎 Luxusní UI (gold gradient, sklo, jemné stíny), sjednocené tlačítko **40 px**.
- 📲 PWA (manifest + service worker), **cache-busting** pro spolehlivé aktualizace.
- 🧮 Zachována původní metrika a výstupy (vzorce beze změny).
- 🧾 PDF export (A4) přes html2canvas + jsPDF.
- 📌 Sdílení s fallbackem na schránku.
- 🗂 Historie posledních 10 výpočtů (localStorage).
- ♻️ Reset & „Nová směna“ zachovává jméno řidiče.

## Použití lokálně
Stačí otevřít `index.html` v prohlížeči. Pro PWA a SW je ideální malý server (např. `npx serve`).
 
## Nasazení na GitHub Pages
1. Vytvořte repo a nahrajte všechny soubory.
2. Zapněte Pages (branch `main`, folder `/root`).
3. Po první publikaci udělejte Refresh (Ctrl/Cmd+F5).

## Poznámky
- Service Worker má verzi v názvu (`rb-taxi-cache-v4`) a soubory mají `?v=...`, aby se změny vždy načetly.
- „Historie“ ukládá jen do prohlížeče (neposílá data na server).

**Kontakt:** Pokud chcete rozšířit o přihlášení řidičů, exporty XLSX, nebo napojení na účetnictví, kód je připraven na modulární rozšíření v `app.js`.

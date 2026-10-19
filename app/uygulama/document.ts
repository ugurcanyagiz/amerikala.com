type StoreLinks = { appStore?: string; googlePlay?: string };

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

function storeUrl(value: string | undefined, hostname: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== hostname || url.username || url.password || url.port) return null;
    if (hostname === "apps.apple.com" && !/\/id\d+(?:\/|$)/.test(url.pathname)) return null;
    if (hostname === "play.google.com" && (url.pathname !== "/store/apps/details" || !url.searchParams.get("id"))) return null;
    return escapeHtml(url.href);
  } catch {
    return null;
  }
}

const phoneIcon = `<svg viewBox="0 0 24 28" fill="none" aria-hidden="true"><rect x="4" y="1.5" width="16" height="25" rx="4" stroke="currentColor" stroke-width="1.8"/><path d="M9 5h6M10 23h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const playIcon = `<svg viewBox="0 0 28 30" aria-hidden="true"><path d="M2 2 17 15 2 28Z" fill="#53C7EF"/><path d="m2 2 19 10-4 3Z" fill="#70D28A"/><path d="m2 28 19-10-4-3Z" fill="#F16C72"/><path d="m17 15 4-3 5 3-5 3Z" fill="#FFD36C"/></svg>`;

function badge(label: string, url: string | null, icon: string) {
  const inner = `${icon}<span><span class="store-kicker">${url ? "UYGULAMAYI İNDİR" : "YAKINDA"}</span><span class="store-name">${label}</span></span>${url ? '<span class="store-arrow" aria-hidden="true">↗</span>' : '<span class="status-dot" aria-hidden="true"></span>'}`;
  return url
    ? `<a class="store" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="Amerikala uygulamasını ${label} üzerinden indir">${inner}</a>`
    : `<div class="store store-pending" aria-label="${label} — yakında">${inner}</div>`;
}

export function renderLanding(links: StoreLinks = {}) {
  const appStore = storeUrl(links.appStore, "apps.apple.com");
  const googlePlay = storeUrl(links.googlePlay, "play.google.com");
  const anyLive = Boolean(appStore || googlePlay);
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#F8F7F4">
  <title>Amerikala — Amerika’daki topluluğun.</title>
  <meta name="description" content="Amerika’daki Türk topluluğu için Amerikala. Tanış, keşfet, paylaş. Topluluğun, cebinde.">
  <link rel="canonical" href="https://amerikala.com/uygulama">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:title" content="Amerika’daki topluluğun. Artık cebinde.">
  <meta property="og:description" content="Tanış, keşfet, paylaş. Amerikala’da bir araya gel.">
  <meta property="og:url" content="https://amerikala.com/uygulama">
  <meta property="og:image" content="https://amerikala.com/marketing/concepts/phones-concept.webp">
  <link rel="icon" href="/logo.png" type="image/png">
  <link rel="preload" href="/marketing/concepts/phones-concept.webp" as="image" type="image/webp">
  <link rel="stylesheet" href="/marketing/app-promo.css">
</head>
<body>
  <a class="skip-link" href="#icerik">İçeriğe geç</a>
  <div class="poster">
    <header class="masthead">
      <a class="brand" href="/uygulama" aria-label="Amerikala uygulama tanıtımı">
        <img src="/logo.png" alt="" width="48" height="48">
        <span>amerikala<span class="brand-period">.</span></span>
      </a>
      <a class="header-link" href="#indir">${anyLive ? "Uygulamayı indir" : "Çok yakında"}<span aria-hidden="true">↓</span></a>
    </header>
    <main class="hero" id="icerik">
      <div class="hero-copy">
        <p class="eyebrow"><span aria-hidden="true"></span>AMERİKA’DAKİ TÜRK TOPLULUĞU</p>
        <h1>Amerika’daki<br>topluluğun.<br><em>Artık cebinde.</em></h1>
        <p class="intro">Tanış, keşfet, paylaş.<br>Amerikala’da bir araya gel.</p>
        <div class="download" id="indir" aria-label="Uygulamayı indir">
          <div class="store-row">
            ${badge("App Store", appStore, phoneIcon)}
            ${badge("Google Play", googlePlay, playIcon)}
          </div>
          <p class="availability">${anyLive ? "Topluluğunla her an, her yerde." : "iOS ve Android için hazırlanıyor."}</p>
        </div>
      </div>
      <figure class="hero-art">
        <img class="phones" src="/marketing/concepts/phones-concept.webp" alt="Amerikala’nın etkinlik ve keşif ekranlarını gösteren iki telefon maketi" width="1024" height="1536" fetchpriority="high" decoding="async">
        <figcaption>Temsili uygulama görünümü.</figcaption>
      </figure>
    </main>
    <footer class="footer">
      <p>© ${new Date().getFullYear()} Amerikala</p>
      <nav aria-label="Yasal bilgiler ve iletişim">
        <a href="/privacy">Gizlilik Politikası</a>
        <a href="/support">Destek</a>
      </nav>
      <span class="footer-note">Birlikte, daha yakın.</span>
    </footer>
  </div>
</body>
</html>`;
}

/* Site MyGCFlow — animations et petits comportements, sans dépendance. */
(() => {
  "use strict";

  const REPO = "TherionAcribus/MyGCFlow";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  /* ------------------------------------------------------------------
     Vidéo d'accroche : un export réel de l'application, lu en boucle.
     Sans JavaScript ou avec l'animation réduite, seule l'affiche est montrée.
     ------------------------------------------------------------------ */
  function initDemoVideo() {
    const video = document.getElementById("demo-video");
    const toggle = document.getElementById("demo-toggle");
    if (!video || !toggle) return;
    const label = toggle.querySelector(".demo-toggle-label");
    let wanted = !reducedMotion;
    let visible = false;

    const render = () => {
      toggle.setAttribute("aria-pressed", String(!wanted));
      toggle.classList.toggle("is-paused", !wanted);
      label.textContent = wanted ? "Pause" : "Lire";
    };
    const sync = () => {
      if (wanted && visible && !document.hidden) {
        video.play().catch(() => { wanted = false; render(); });
      } else {
        video.pause();
      }
    };

    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      wanted = !wanted;
      render();
      sync();
    });
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      sync();
    }, { threshold: 0.25 }).observe(video);
    document.addEventListener("visibilitychange", sync);
    render();
  }

  /* ------------------------------------------------------------------
     Galerie des thèmes : un clic sur une vignette l'affiche en grand.
     ------------------------------------------------------------------ */
  function initGallery() {
    const gallery = document.getElementById("gallery");
    if (!gallery) return;
    const image = document.getElementById("gallery-image");
    const name = document.getElementById("gallery-name");
    const caption = document.getElementById("gallery-caption");
    const links = Array.from(gallery.querySelectorAll(".gallery-thumbs a"));

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        links.forEach((other) => other.removeAttribute("aria-current"));
        link.setAttribute("aria-current", "true");
        image.src = link.getAttribute("href");
        image.alt = `Thème ${link.dataset.name}, animation en cours`;
        name.textContent = link.dataset.name;
        caption.textContent = link.dataset.caption;
      });
    });
  }

  /* ------------------------------------------------------------------
     Vidéo YouTube : rien n'est chargé depuis YouTube avant le clic.
     ------------------------------------------------------------------ */
  function initVideos() {
    document.querySelectorAll(".video[data-youtube-id]").forEach((figure) => {
      const button = figure.querySelector(".video-facade");
      button.addEventListener("click", () => {
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(figure.dataset.youtubeId)}?autoplay=1&rel=0`;
        iframe.title = "Vidéo de démonstration de MyGCFlow";
        iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        iframe.allowFullscreen = true;
        button.replaceWith(iframe);
        iframe.focus();
      });
    });
  }

  /* ------------------------------------------------------------------
     Dernière version publiée : liens directs vers les fichiers.
     En cas d'échec, les liens vers la page des Releases restent en place.
     ------------------------------------------------------------------ */
  async function initRelease() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
        headers: { Accept: "application/vnd.github+json" },
        signal: controller.signal,
      });
      if (!response.ok) return;
      const release = await response.json();
      const version = String(release.tag_name || "").replace(/^v/i, "");
      if (!version) return;

      document.querySelectorAll(".js-version").forEach((el) => { el.textContent = version; });

      const info = document.getElementById("release-info");
      if (info && release.published_at) {
        const published = dateFormat.format(new Date(release.published_at));
        info.innerHTML = "";
        info.append("Dernière version : ");
        const strong = document.createElement("strong");
        strong.textContent = version;
        info.append(strong, `, publiée le ${published}, pour Windows.`);
      }

      const size = (bytes) =>
        `${(bytes / 1048576).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} Mo`;
      const bind = (linkId, metaId, pattern, ext) => {
        const asset = (release.assets || []).find((a) => pattern.test(a.name));
        if (!asset) return;
        document.getElementById(linkId).href = asset.browser_download_url;
        document.getElementById(metaId).textContent = `${ext} · ${size(asset.size)}`;
      };
      bind("dl-setup", "dl-setup-meta", /setup.*\.exe$/i, ".exe");
      bind("dl-portable", "dl-portable-meta", /portable.*\.zip$/i, ".zip");
    } catch {
      // Hors ligne, quota de l'API dépassé… les liens par défaut suffisent.
    } finally {
      clearTimeout(timeout);
    }
  }

  /* ------------------------------------------------------------------
     Apparition des blocs au défilement.
     ------------------------------------------------------------------ */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    items.forEach((el) => observer.observe(el));
  }

  initReveal();
  initDemoVideo();
  initGallery();
  initVideos();
  initRelease();
})();

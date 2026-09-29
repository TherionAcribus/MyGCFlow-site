/* Site MyGCFlow — animations et petits comportements, sans dépendance. */
(() => {
  "use strict";

  const REPO = "TherionAcribus/MyGCFlow";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  /* Générateur pseudo-aléatoire reproductible (mulberry32). */
  function makeRandom(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussian(rand) {
    const u = Math.max(rand(), 1e-9);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  }

  /* Lance une boucle d'animation seulement quand l'élément est visible. */
  function runWhenVisible(element, onFrame) {
    let visible = false;
    let last = 0;
    let rafId = 0;

    const tick = (now) => {
      const dt = last ? Math.min(now - last, 100) : 16;
      last = now;
      onFrame(dt);
      rafId = requestAnimationFrame(tick);
    };
    const update = () => {
      const shouldRun = visible && !document.hidden;
      if (shouldRun && !rafId) {
        last = 0;
        rafId = requestAnimationFrame(tick);
      } else if (!shouldRun && rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      update();
    }).observe(element);
    document.addEventListener("visibilitychange", update);
  }

  /* ------------------------------------------------------------------
     Rediffusion : des caches fictives apparaissent jour après jour.
     ------------------------------------------------------------------ */
  function initReplay() {
    const canvas = document.getElementById("replay");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const countEl = document.getElementById("replay-count");
    const dateEl = document.getElementById("replay-date");
    const barEl = document.getElementById("replay-bar");

    const TYPES = [
      { color: "#29D34E", weight: 0.62 }, // traditionnelles
      { color: "#009DFF", weight: 0.18 }, // mystères
      { color: "#F5A524", weight: 0.1 },  // multis
      { color: "#00C5A1", weight: 0.1 },  // autres
    ];
    const RUN_MS = 13000;
    const HOLD_MS = 3200;
    const FADE_MS = 700;
    const FLASH_MS = 900;
    const DAY = 86400000;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let background = null;
    let scene = null;
    let clock = 0;
    let seed = 7;

    /* Terre : une forme polaire irrégulière, en coordonnées normalisées. */
    function makeLand(rand) {
      const waves = Array.from({ length: 5 }, (_, i) => ({
        k: i + 2,
        amp: (0.06 / (i + 1)) * (0.6 + rand()),
        phase: rand() * Math.PI * 2,
      }));
      const radius = (theta) =>
        0.36 + waves.reduce((sum, w) => sum + w.amp * Math.sin(w.k * theta + w.phase), 0);
      return { cx: 0.46, cy: 0.54, radius };
    }

    function insideLand(land, x, y) {
      const dx = x - land.cx;
      const dy = y - land.cy;
      return Math.hypot(dx, dy) < land.radius(Math.atan2(dy, dx)) - 0.02;
    }

    function pickType(rand) {
      let r = rand();
      for (const type of TYPES) {
        if ((r -= type.weight) <= 0) return type.color;
      }
      return TYPES[0].color;
    }

    function buildScene(currentSeed) {
      const rand = makeRandom(currentSeed);
      const land = makeLand(rand);
      const start = Date.UTC(2015, 3, 12);
      const end = Date.UTC(2026, 7, 30);
      const span = end - start;
      const points = [];

      const home = { x: land.cx - 0.04 + rand() * 0.08, y: land.cy - 0.04 + rand() * 0.08 };
      const place = (cx, cy, sigma) => {
        for (let tries = 0; tries < 30; tries++) {
          const x = cx + gaussian(rand) * sigma;
          const y = cy + gaussian(rand) * sigma * 1.2;
          if (insideLand(land, x, y)) return { x, y };
        }
        return { x: cx, y: cy };
      };

      // Autour de chez soi, avec un rythme qui s'accélère un peu au fil des ans.
      for (let i = 0; i < 230; i++) {
        const near = rand() < 0.7;
        const pos = place(home.x, home.y, near ? 0.045 : 0.11);
        points.push({ ...pos, t: start + Math.pow(rand(), 0.8) * span, color: pickType(rand) });
      }
      // Quelques séjours : des grappes serrées dans le temps et l'espace.
      for (let trip = 0; trip < 5; trip++) {
        let center;
        do {
          center = { x: 0.15 + rand() * 0.7, y: 0.2 + rand() * 0.7 };
        } while (!insideLand(land, center.x, center.y) || Math.hypot(center.x - home.x, center.y - home.y) < 0.15);
        const tripStart = start + rand() * (span - 14 * DAY);
        const n = 14 + Math.floor(rand() * 22);
        for (let i = 0; i < n; i++) {
          const pos = place(center.x, center.y, 0.022);
          points.push({ ...pos, t: tripStart + rand() * 10 * DAY, color: pickType(rand) });
        }
      }
      points.sort((a, b) => a.t - b.t);
      return { land, points, start, span, shown: 0, elapsed: 0, flashes: new Map() };
    }

    function drawBackground() {
      background = document.createElement("canvas");
      background.width = width * dpr;
      background.height = height * dpr;
      const g = background.getContext("2d");
      g.scale(dpr, dpr);

      g.fillStyle = "#061d36";
      g.fillRect(0, 0, width, height);

      // Graticule discret.
      g.strokeStyle = "rgba(255,255,255,0.045)";
      g.lineWidth = 1;
      const step = Math.max(28, width / 14);
      for (let x = step / 2; x < width; x += step) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x, height); g.stroke();
      }
      for (let y = step / 2; y < height; y += step) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(width, y); g.stroke();
      }

      // Terre.
      const { land } = scene;
      g.beginPath();
      for (let i = 0; i <= 180; i++) {
        const theta = (i / 180) * Math.PI * 2 - Math.PI;
        const r = land.radius(theta);
        const x = (land.cx + Math.cos(theta) * r) * width;
        const y = (land.cy + Math.sin(theta) * r) * height;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath();
      const fill = g.createLinearGradient(0, 0, width, 0);
      fill.addColorStop(0, "rgba(41,211,78,0.10)");
      fill.addColorStop(0.47, "rgba(0,197,161,0.09)");
      fill.addColorStop(1, "rgba(0,157,255,0.11)");
      g.fillStyle = fill;
      g.fill();
      g.strokeStyle = "rgba(0,197,161,0.35)";
      g.lineWidth = 1.2;
      g.stroke();
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      drawBackground();
      render(0);
    }

    function updateOverlay(progress) {
      const { points, start, span, shown } = scene;
      countEl.textContent = shown.toLocaleString("fr-FR");
      const day = shown ? points[shown - 1].t : start + progress * span;
      dateEl.textContent = dateFormat.format(new Date(Math.min(day, start + span)));
      barEl.style.width = `${(progress * 100).toFixed(2)}%`;
    }

    function render(fade) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(background, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { points, shown, flashes } = scene;
      const alpha = 1 - fade;
      const dot = Math.max(1.8, width / 260);

      // Parcours récent : relie les dernières trouvailles, comme sur le logo.
      if (shown > 1) {
        ctx.lineWidth = 1.4;
        ctx.lineCap = "round";
        for (let i = Math.max(1, shown - 5); i < shown; i++) {
          const a = points[i - 1];
          const b = points[i];
          ctx.strokeStyle = `rgba(255,255,255,${(0.08 + 0.07 * (i - shown + 5)) * alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x * width, a.y * height);
          ctx.lineTo(b.x * width, b.y * height);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 0.9 * alpha;
      for (let i = 0; i < shown; i++) {
        const p = points[i];
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, dot, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flash d'apparition : halo et onde qui s'élargit.
      for (const [index, born] of flashes) {
        const age = (clock - born) / FLASH_MS;
        if (age >= 1) { flashes.delete(index); continue; }
        const p = points[index];
        const x = p.x * width;
        const y = p.y * height;
        ctx.globalAlpha = (1 - age) * alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, dot + age * dot * 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = (1 - age) * 0.85 * alpha;
        ctx.beginPath();
        ctx.arc(x, y, dot * (1.6 - age * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function frame(dt) {
      clock += dt;
      const total = RUN_MS + HOLD_MS + FADE_MS;
      if (scene.elapsed >= total) {
        seed += 1;
        scene = buildScene(seed);
        drawBackground();
      }
      scene.elapsed += dt;
      const progress = Math.min(scene.elapsed / RUN_MS, 1);
      const day = scene.start + progress * scene.span;
      while (scene.shown < scene.points.length && scene.points[scene.shown].t <= day) {
        scene.flashes.set(scene.shown, clock);
        scene.shown += 1;
      }
      const fade = Math.max(0, (scene.elapsed - RUN_MS - HOLD_MS) / FADE_MS);
      render(Math.min(fade, 1));
      updateOverlay(progress);
    }

    scene = buildScene(seed);
    resize();
    new ResizeObserver(resize).observe(canvas);

    if (reducedMotion) {
      // État final, sans animation.
      scene.shown = scene.points.length;
      render(0);
      updateOverlay(1);
      return;
    }
    runWhenVisible(canvas, frame);
  }

  /* ------------------------------------------------------------------
     Maquette de matrice difficulté / terrain qui se remplit.
     ------------------------------------------------------------------ */
  function initMatrix() {
    const grid = document.getElementById("matrix");
    const filledEl = document.getElementById("matrix-filled");
    if (!grid) return;

    // Répartition plausible : beaucoup de caches faciles, peu de 5/5.
    const D_WEIGHTS = [10, 14, 16, 13, 10, 7, 5, 3, 2];
    const T_WEIGHTS = [9, 15, 16, 12, 9, 6, 4, 3, 3];
    const TOTAL = 420;
    const STEP_MS = 75;
    const HOLD_MS = 3500;

    const cells = Array.from({ length: 81 }, () => {
      const cell = document.createElement("span");
      grid.appendChild(cell);
      return cell;
    });
    let counts;
    let filled;
    let added;
    let timer;
    let rand = makeRandom(42);

    const weighted = (weights) => {
      const sum = weights.reduce((a, b) => a + b, 0);
      let r = rand() * sum;
      for (let i = 0; i < weights.length; i++) {
        if ((r -= weights[i]) <= 0) return i;
      }
      return weights.length - 1;
    };

    function reset() {
      counts = new Array(81).fill(0);
      filled = 0;
      added = 0;
      timer = 0;
      cells.forEach((cell) => cell.style.setProperty("--lvl", 0));
      filledEl.textContent = "0";
    }

    function addCache(animate) {
      const index = weighted(D_WEIGHTS) * 9 + weighted(T_WEIGHTS);
      const cell = cells[index];
      counts[index] += 1;
      if (counts[index] === 1) {
        filled += 1;
        filledEl.textContent = String(filled);
        if (animate) {
          cell.classList.remove("pop");
          void cell.offsetWidth; // relance l'animation CSS
          cell.classList.add("pop");
        }
      }
      cell.style.setProperty("--lvl", (0.3 + 0.7 * Math.min(1, counts[index] / 14)).toFixed(2));
      added += 1;
    }

    reset();

    if (reducedMotion) {
      while (added < TOTAL) addCache(false);
      return;
    }

    runWhenVisible(grid, (dt) => {
      timer += dt;
      if (added < TOTAL) {
        while (timer >= STEP_MS && added < TOTAL) {
          timer -= STEP_MS;
          addCache(true);
        }
      } else if (timer >= HOLD_MS) {
        rand = makeRandom(Math.floor(Math.random() * 1e9));
        reset();
      }
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
  initReplay();
  initMatrix();
  initVideos();
  initRelease();
})();

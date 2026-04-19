const hasGSAP = typeof window.gsap !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const gsap = hasGSAP
  ? window.gsap
  : {
      registerPlugin: () => {},
      set: (_target, vars = {}) => {
        if (typeof vars.onComplete === "function") vars.onComplete();
      },
      to: (_target, vars = {}) => {
        if (typeof vars.onComplete === "function") vars.onComplete();
        return {};
      },
      fromTo: (_target, _fromVars, toVars = {}) => {
        if (typeof toVars.onComplete === "function") toVars.onComplete();
        return {};
      },
      timeline: (opts = {}) => {
        const api = {
          to: (_target, vars = {}) => {
            if (typeof vars.onComplete === "function") vars.onComplete();
            return api;
          },
          fromTo: (_target, _fromVars, toVars = {}) => {
            if (typeof toVars.onComplete === "function") toVars.onComplete();
            return api;
          },
        };
        if (typeof opts.onComplete === "function") {
          setTimeout(opts.onComplete, 0);
        }
        return api;
      },
      utils: {
        toArray: (selector) => Array.from(document.querySelectorAll(selector)),
      },
    };

const ScrollTrigger = hasScrollTrigger
  ? window.ScrollTrigger
  : {
      create: () => {},
      batch: () => {},
      update: () => {},
      refresh: () => {},
    };

if (hasGSAP && hasScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

if (!hasGSAP) {
  document.body.classList.add("page-ready");
}

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

const isHomeLuxe = document.querySelector(".home-luxe") !== null;
const isInnerLuxe = document.querySelector(".inner-luxe") !== null;

/* ───────────────────────────────────────────────
   Loader (activado tras el intro-gate)
   ─────────────────────────────────────────────── */
const loader = document.getElementById("loader");
const loaderScenes = gsap.utils.toArray(".loader-scene");

const runLoader = () => {
  if (!loader) return;

  // Mostrar loader con clase CSS — preserva flex centering sin que GSAP lo rompa
  loader.classList.add("is-visible");
  gsap.set(loader, { opacity: 1, visibility: "visible" });

  const loaderTl = gsap.timeline();

  if (loaderScenes.length) {
    loaderScenes.forEach((scene, index) => {
      loaderTl.fromTo(
        scene,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.75, ease: "power2.out" },
        index === 0 ? 0 : ">-0.02",
      );
      if (index < loaderScenes.length - 1) {
        loaderTl.to(
          scene,
          { autoAlpha: 0, duration: 0.55, ease: "power2.in" },
          ">+0.7",
        );
      }
    });
  }

  loaderTl.to(loader, {
    opacity: 0,
    duration: 0.7,
    ease: "power2.inOut",
    delay: 0.5,
    onComplete: () => {
      loader.classList.remove("is-visible");
      loader.classList.add("hide");
      // Revelar la página solo cuando el loader termina
      document.body.classList.add("page-ready");
      // Refrescar ScrollTrigger DESPUÉS de que la página sea visible
      // (crítico en móvil: los elementos estaban hidden y las posiciones eran 0)
      requestAnimationFrame(() => {
        ScrollTrigger.refresh(true);
      });
    },
  });
};

/* ───────────────────────────────────────────────
   Intro Gate — pantalla inicial
   ─────────────────────────────────────────────── */
const introGate = document.getElementById("introGate");
const introGateBtn = document.getElementById("introGateBtn");

if (introGate && introGateBtn) {
  introGateBtn.addEventListener("click", () => {
    // 1. Cubrir con loader negro INMEDIATAMENTE — sin flash del hero
    if (loader) {
      loader.classList.add("is-visible");
      gsap.set(loader, { opacity: 1, visibility: "visible" });
    }

    // 2. Animar salida del gate encima del fondo negro
    introGate.classList.add("is-leaving");

    // 3. Tras la animación de salida, reproducir audio y lanzar textos del loader
    setTimeout(() => {
      introGate.style.display = "none";

      // Reproducir voiceover (garantizado porque viene de click de usuario)
      if (isHomeLuxe) {
        const loaderVoice = document.getElementById("loaderVoice");
        if (loaderVoice) {
          loaderVoice.volume = 0.85;
          loaderVoice.play().catch(() => {});
        }
      }

      // Lanzar animación del loader (ya visible, solo anima los textos y luego sale)
      runLoader();
    }, 680);
  });
} else {
  // No hay gate (otras páginas): ejecutar loader directo
  runLoader();
}

/* ───────────────────────────────────────────────
   Smooth scroll
   ─────────────────────────────────────────────── */
if (typeof Lenis !== "undefined" && !prefersReducedMotion) {
  const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
  const raf = (t) => {
    lenis.raf(t);
    ScrollTrigger.update();
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

/* ───────────────────────────────────────────────
   Topbar scroll state
   ─────────────────────────────────────────────── */
const topbar = document.querySelector(".topbar");
window.addEventListener(
  "scroll",
  () => topbar?.classList.toggle("scrolled", window.scrollY > 16),
  { passive: true },
);

/* ───────────────────────────────────────────────
   Scroll progress line (páginas internas)
   ─────────────────────────────────────────────── */
const progressLine = document.querySelector(".scroll-progress-line");
if (progressLine) {
  const updateProgress = () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (scrolled / total) * 100 : 0;
    progressLine.style.width = pct + "%";
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();
}

/* ───────────────────────────────────────────────
   Generic reveal engine (all pages)
   ─────────────────────────────────────────────── */
const initGenericReveals = () => {
  if (!prefersReducedMotion) {
    if (document.querySelector(".reveal-title")) {
      gsap.to(".reveal-title", {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        delay: 0.08,
      });
    }

    const isMobile = window.matchMedia("(max-width: 860px)").matches;

    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.fromTo(
        el,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: isMobile ? "top 98%" : "top 88%",
            toggleActions: "play none none none",
          },
        },
      );
    });
  }
};

/* ───────────────────────────────────────────────
   Cursor luxe (home + inner)
   ─────────────────────────────────────────────── */
const initLuxeCursor = () => {
  const cursor = document.querySelector(".luxe-cursor");
  if (!cursor || prefersReducedMotion) return;

  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  let mx = 0,
    my = 0,
    cx = 0,
    cy = 0;
  gsap.set(cursor, { opacity: 1 });

  window.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  const tick = () => {
    cx += (mx - cx) * 0.13;
    cy += (my - cy) * 0.13;
    gsap.set(cursor, { x: cx, y: cy });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Magnetic expansion on interactive elements
  document
    .querySelectorAll("a, button, .prop-card, .srv-panel-media")
    .forEach((el) => {
      el.addEventListener("mouseenter", () => {
        gsap.to(cursor, {
          scale: 2.2,
          opacity: 0.6,
          duration: 0.3,
          ease: "power2.out",
        });
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(cursor, {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      });
    });
};

/* ───────────────────────────────────────────────
   Inner hero word-level stagger
   ─────────────────────────────────────────────── */
const initInnerHero = () => {
  const innerTitle = document.getElementById("innerTitle");
  const eyebrowLine = document.querySelector(".inner-hero-line");
  const innerSub = document.querySelector(".inner-hero-sub");

  if (eyebrowLine) {
    // Trigger clip-path reveal
    eyebrowLine.classList.add("revealed");
  }

  if (innerTitle && !prefersReducedMotion) {
    // Split text into word-wrapped spans
    const rawHTML = innerTitle.innerHTML;
    const parts = rawHTML.split(/(<br\s*\/?>)/i);
    innerTitle.innerHTML = parts
      .map((part) => {
        if (/^<br/i.test(part)) return part;
        return part
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map(
            (word) =>
              `<span class="word"><span class="word-inner">${word}</span></span>`,
          )
          .join(" ");
      })
      .join("");

    const wordInners = innerTitle.querySelectorAll(".word-inner");
    gsap.fromTo(
      wordInners,
      { y: "110%", opacity: 0 },
      {
        y: "0%",
        opacity: 1,
        duration: 0.78,
        ease: "power3.out",
        stagger: { each: 0.055, from: "start" },
        delay: 0.15,
      },
    );
  } else if (innerTitle) {
    innerTitle.classList.add("revealed");
  }

  if (innerSub && !prefersReducedMotion) {
    gsap.fromTo(
      innerSub,
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", delay: 0.55 },
    );
  }
};

/* ───────────────────────────────────────────────
   Prop cards: stagger + 3D tilt on hover
   ─────────────────────────────────────────────── */
const initPropCards = () => {
  const cards = gsap.utils.toArray(".prop-card");
  if (!cards.length) return;

  const isMobile = window.matchMedia("(max-width: 860px)").matches;

  if (!prefersReducedMotion && !isMobile) {
    // Stagger entrance — solo desktop
    ScrollTrigger.batch(cards, {
      onEnter: (els) => {
        gsap.fromTo(
          els,
          { y: 48, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.72,
            ease: "power3.out",
            stagger: 0.1,
          },
        );
      },
      start: "top 86%",
    });
  } else {
    // Móvil: mostrar inmediatamente sin animación
    gsap.set(cards, { opacity: 1, y: 0, scale: 1, visibility: "visible" });
  }

  // 3D tilt on hover (desktop only)
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, {
          rotateY: px * 8,
          rotateX: py * -6,
          transformPerspective: 900,
          duration: 0.4,
          ease: "power2.out",
        });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(card, {
          rotateY: 0,
          rotateX: 0,
          duration: 0.6,
          ease: "power3.out",
        });
      });
    });
  }
};

/* ───────────────────────────────────────────────
   Srv panels: clip-path image reveal
   ─────────────────────────────────────────────── */
const initSrvPanels = () => {
  const panels = document.querySelectorAll(".srv-panel-media");
  if (!panels.length) return;

  // En móvil (sin hover) no hacer clip-path reveal ni parallax — mostrar directo
  const isMobile = window.matchMedia("(max-width: 860px)").matches;

  if (prefersReducedMotion || isMobile) {
    panels.forEach((p) => p.classList.add("revealed"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: "0px" },
  );
  panels.forEach((p) => io.observe(p));

  // Parallax subtle on srv images
  panels.forEach((panel) => {
    const img = panel.querySelector("img");
    if (!img) return;
    gsap.fromTo(
      img,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: "none",
        scrollTrigger: {
          trigger: panel,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  });
};

/* ───────────────────────────────────────────────
   Stats strip counters
   ─────────────────────────────────────────────── */
const initCounters = () => {
  document.querySelectorAll(".counter").forEach((counter) => {
    const target = Number(counter.dataset.target || 0);
    const model = { val: 0 };

    if (prefersReducedMotion) {
      counter.textContent = target.toLocaleString("es-MX");
      return;
    }

    gsap.fromTo(
      model,
      { val: 0 },
      {
        val: target,
        ease: "none",
        snap: { val: 1 },
        onUpdate: () => {
          counter.textContent = Math.round(model.val).toLocaleString("es-MX");
        },
        scrollTrigger: {
          trigger: counter,
          start: "top 92%",
          end: "top 40%",
          scrub: true,
        },
      },
    );
  });
};

/* ───────────────────────────────────────────────
   Form contacto premium
   ─────────────────────────────────────────────── */
const initContactForm = () => {
  const form = document.getElementById("contactForm");
  const success = document.getElementById("formSuccess");
  const submitBtn = document.getElementById("formSubmit");

  // Float label for select
  const selects = document.querySelectorAll(".form-field select");
  selects.forEach((sel) => {
    sel.addEventListener("change", () => {
      sel.classList.toggle("has-value", sel.value !== "");
    });
  });

  // Add placeholder attribute so :not(:placeholder-shown) works on inputs
  document
    .querySelectorAll(".form-field input, .form-field textarea")
    .forEach((input) => {
      if (!input.getAttribute("placeholder")) {
        input.setAttribute("placeholder", " ");
      }
    });

  if (!form || !success) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!submitBtn) return;

    // Button loading state
    const btnText = submitBtn.querySelector(".btn-text");
    const btnCheck = submitBtn.querySelector(".btn-check");

    gsap.to(submitBtn, {
      scale: 0.97,
      duration: 0.12,
      yoyo: true,
      repeat: 1,
      ease: "power1.inOut",
    });

    setTimeout(() => {
      if (btnText) btnText.style.display = "none";
      if (btnCheck) btnCheck.style.display = "inline";

      setTimeout(() => {
        // Show success panel
        form.style.display = "none";
        success.classList.add("is-visible");
        gsap.fromTo(
          success,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, ease: "power3.out" },
        );
      }, 600);
    }, 300);
  });
};

/* ───────────────────────────────────────────────
   Home premium experience
   ─────────────────────────────────────────────── */
const initHomeLuxe = () => {
  const heroTitle = document.getElementById("heroTitle");
  const heroImage = document.querySelector(".hero-main-media img");
  const heroLightCanvas = document.getElementById("heroLightCanvas");

  // Hero title split-by-char animation
  if (heroTitle && !prefersReducedMotion) {
    const raw = heroTitle.innerHTML;
    const parts = raw.split(/(<br\s*\/?>)/i);
    heroTitle.innerHTML = parts
      .map((part) => {
        if (/^<br/i.test(part)) return part;
        return part
          .split("")
          .map((ch) => {
            if (ch.trim() === "") {
              return `<span style="display:inline-block">&nbsp;</span>`;
            }
            return `<span class="char" style="display:inline-block;opacity:0;transform:translateY(65%)">${ch}</span>`;
          })
          .join("");
      })
      .join("");

    const chars = heroTitle.querySelectorAll(".char");
    gsap.to(chars, {
      opacity: 1,
      y: "0%",
      duration: 0.86,
      ease: "power3.out",
      stagger: { each: 0.024, from: "start" },
      delay: 0.14,
    });
  }

  // Hero image parallax
  if (heroImage && !prefersReducedMotion) {
    gsap.fromTo(
      heroImage,
      { yPercent: -5, scale: 1.14 },
      {
        yPercent: 10,
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-luxe",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  }

  // Hero light pass (Three.js)
  if (
    heroLightCanvas &&
    !prefersReducedMotion &&
    typeof THREE !== "undefined"
  ) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({
      canvas: heroLightCanvas,
      alpha: true,
      antialias: true,
    });

    const count = window.innerWidth < 768 ? 420 : 920;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 52;
      positions[i + 1] = (Math.random() - 0.5) * 32;
      positions[i + 2] = (Math.random() - 0.5) * 34;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: "#f5d8a6",
      size: 0.2,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const cloud = new THREE.Points(geometry, material);
    scene.add(cloud);

    const resizeLightPass = () => {
      const host = heroLightCanvas.parentElement;
      const width = host?.clientWidth || window.innerWidth;
      const height = host?.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resizeLightPass();
    window.addEventListener("resize", resizeLightPass);

    gsap.to(cloud.rotation, {
      y: 0.42,
      x: 0.18,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero-luxe",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    const renderLightPass = () => {
      cloud.rotation.y += 0.00075;
      cloud.rotation.x += 0.00018;
      renderer.render(scene, camera);
      requestAnimationFrame(renderLightPass);
    };
    renderLightPass();
  }

  // Floating metric cards drift
  if (!prefersReducedMotion) {
    gsap.utils.toArray(".hero-float-card").forEach((card, idx) => {
      gsap.to(card, {
        y: idx === 0 ? -20 : 22,
        duration: 2.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    });
  }

  // Hero cinematic micro-parallax (desktop)
  if (
    !prefersReducedMotion &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  ) {
    const heroStage = document.querySelector(".hero-stage");
    const heroMedia = document.querySelector(".hero-main-media");
    const floatCards = gsap.utils.toArray(".hero-float-card");

    if (heroStage && heroMedia) {
      heroStage.addEventListener("mousemove", (event) => {
        const rect = heroStage.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;

        gsap.to(heroMedia, {
          rotateY: px * 3.2,
          rotateX: py * -2.2,
          transformPerspective: 1100,
          duration: 0.55,
          ease: "power3.out",
        });

        floatCards.forEach((card, idx) => {
          const direction = idx === 0 ? 1 : -1;
          gsap.to(card, {
            x: px * 18 * direction,
            rotateZ: px * 1.6 * direction,
            duration: 0.6,
            ease: "power3.out",
          });
        });
      });

      heroStage.addEventListener("mouseleave", () => {
        gsap.to(heroMedia, {
          rotateY: 0,
          rotateX: 0,
          duration: 0.8,
          ease: "power3.out",
        });
        floatCards.forEach((card) => {
          gsap.to(card, {
            x: 0,
            rotateZ: 0,
            duration: 0.8,
            ease: "power3.out",
          });
        });
      });
    }
  }

  // Scrollytelling chapters (pin + image switching)
  const visualWrap = document.querySelector(".chapter-visual-wrap");
  const tag = document.getElementById("chapterTag");
  const chapterImages = gsap.utils.toArray(".chapter-image");
  const chapters = gsap.utils.toArray(".chapter");

  if (visualWrap && chapters.length && !prefersReducedMotion) {
    ScrollTrigger.create({
      trigger: ".chapters-layout",
      start: "top top+=86",
      end: "bottom bottom-=80",
      pin: ".chapter-visual-wrap",
      scrub: 0.5,
    });

    chapters.forEach((chapter) => {
      const idx = Number(chapter.dataset.index || 0);
      const img = chapterImages[idx];
      const chapterTag = chapter.dataset.tag || "Capítulo";
      const chapterDesc = chapter.querySelectorAll("p")[1];

      const chapterTl = gsap.timeline({
        scrollTrigger: {
          trigger: chapter,
          start: "top 68%",
          end: "bottom 35%",
          toggleActions: "play reverse play reverse",
          onToggle: (self) => {
            if (!self.isActive) return;
            chapterImages.forEach((imageEl, imageIdx) => {
              imageEl.classList.toggle("is-active", imageIdx === idx);
            });
            if (tag) tag.textContent = chapterTag;
          },
        },
      });

      chapterTl
        .fromTo(
          chapter.querySelector(".chapter-kicker"),
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 0.58, ease: "power2.out" },
          0,
        )
        .fromTo(
          chapter.querySelector("h2"),
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.72, ease: "power3.out" },
          0.08,
        );

      if (chapterDesc) {
        chapterTl.fromTo(
          chapterDesc,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.62, ease: "power2.out" },
          0.22,
        );
      }

      chapterTl.fromTo(
        chapter.querySelectorAll("li"),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" },
        0.28,
      );

      if (img) {
        gsap.fromTo(
          img,
          { scale: 1.16, opacity: 0 },
          {
            scale: 1.02,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: chapter,
              start: "top 70%",
              end: "top 25%",
              scrub: true,
            },
          },
        );
      }
    });
  }

  // Signature strip marquee — anima solo cuando está visible en viewport
  const stripSection = document.querySelector(".signature-strip");
  if (stripSection && !prefersReducedMotion) {
    const stripObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          stripSection.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      { threshold: 0.1 },
    );
    stripObserver.observe(stripSection);
  }

  // Manifiesto cards reveal
  gsap.utils.toArray(".manifiesto-card").forEach((card) => {
    if (prefersReducedMotion) return;
    gsap.fromTo(
      card,
      { y: 26, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.75,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top 86%",
          toggleActions: "play reverse play reverse",
        },
      },
    );
  });

  // CTA panel reveal
  const ctaPanel = document.querySelector(".cta-panel");
  if (ctaPanel && !prefersReducedMotion) {
    gsap.fromTo(
      ctaPanel,
      { y: 32, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: "power2.out",
        scrollTrigger: { trigger: ctaPanel, start: "top 85%" },
      },
    );
  }
};

/* ───────────────────────────────────────────────
   Legacy SVG scrolly compatibility (if present)
   ─────────────────────────────────────────────── */
const route = document.getElementById("routePath");
const note = document.getElementById("pinNote");
if (route && !isHomeLuxe) {
  const len = route.getTotalLength();
  gsap.set(route, { strokeDasharray: len, strokeDashoffset: len });

  ScrollTrigger.create({
    trigger: ".scrolly-layout",
    start: "top top+=72",
    end: "bottom bottom-=42",
    pin: ".pin",
    scrub: true,
  });

  gsap.to(route, {
    strokeDashoffset: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".scrolly-layout",
      start: "top top+=72",
      end: "bottom bottom-=42",
      scrub: true,
    },
  });

  gsap.utils.toArray(".steps article").forEach((step) => {
    ScrollTrigger.create({
      trigger: step,
      start: "top center",
      end: "bottom center",
      onToggle: (self) => {
        if (self.isActive && note)
          note.textContent = step.dataset.note || "Narrativa";
      },
    });
  });
}

/* ───────────────────────────────────────────────
   Cards interaction (internal pages legacy)
   ─────────────────────────────────────────────── */
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("mouseenter", () => {
    gsap.to(card, { y: -6, duration: 0.25, ease: "power2.out" });
  });
  card.addEventListener("mouseleave", () => {
    gsap.to(card, { y: 0, duration: 0.35, ease: "power3.out" });
  });
});

/* ───────────────────────────────────────────────
   Page transitions (all pages)
   ─────────────────────────────────────────────── */
const initPageTransitions = () => {
  const overlay = document.querySelector(".page-transition-overlay");
  if (!overlay || prefersReducedMotion) return;

  gsap.set(overlay, { autoAlpha: 0, pointerEvents: "none" });

  document
    .querySelectorAll('a[href$=".html"], a[href*=".html#"]')
    .forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if (!href) return;
        const isExternal = link.target === "_blank" || href.startsWith("http");
        if (isExternal) return;
        event.preventDefault();
        gsap
          .timeline({
            onComplete: () => {
              window.location.href = href;
            },
          })
          .to(overlay, {
            autoAlpha: 1,
            duration: 0.42,
            ease: "power2.inOut",
            pointerEvents: "auto",
          });
      });
    });
};

/* ───────────────────────────────────────────────
   Hover link underline slide (nav links)
   ─────────────────────────────────────────────── */
const initNavHover = () => {
  const links = document.querySelectorAll(".links a:not(.nav-active)");
  links.forEach((link) => {
    link.style.position = "relative";
    link.insertAdjacentHTML(
      "beforeend",
      '<span class="nav-hover-line" aria-hidden="true" style="position:absolute;bottom:-2px;left:0;right:0;height:1px;background:currentColor;transform:scaleX(0);transform-origin:right;transition:transform 0.28s cubic-bezier(0.22,1,0.36,1);"></span>',
    );
    link.addEventListener("mouseenter", () => {
      const line = link.querySelector(".nav-hover-line");
      if (line) {
        line.style.transformOrigin = "left";
        line.style.transform = "scaleX(1)";
      }
    });
    link.addEventListener("mouseleave", () => {
      const line = link.querySelector(".nav-hover-line");
      if (line) {
        line.style.transformOrigin = "right";
        line.style.transform = "scaleX(0)";
      }
    });
  });
};

/* ───────────────────────────────────────────────
   Pill button press feedback (all pages)
   ─────────────────────────────────────────────── */
document.querySelectorAll(".pill.solid").forEach((btn) => {
  btn.addEventListener("mousedown", () => {
    gsap.to(btn, { scale: 0.97, duration: 0.1, ease: "power2.out" });
  });
  btn.addEventListener("mouseup", () => {
    gsap.to(btn, { scale: 1, duration: 0.18, ease: "back.out(2)" });
  });
  btn.addEventListener("mouseleave", () => {
    gsap.to(btn, { scale: 1, duration: 0.18, ease: "power2.out" });
  });
});

/* ───────────────────────────────────────────────
   Video luxe player — mute/unmute
   ─────────────────────────────────────────────── */
const initVideoLuxe = () => {
  const video = document.getElementById("heroVideo");
  const audioBtn = document.getElementById("videoAudioBtn");
  const playBtn = document.getElementById("videoPlayBtn");
  if (!video || !audioBtn) return;

  const iconOff = audioBtn.querySelector(".audio-icon--off");
  const iconOn = audioBtn.querySelector(".audio-icon--on");

  audioBtn.addEventListener("click", () => {
    video.muted = !video.muted;
    if (video.muted) {
      iconOff.style.display = "";
      iconOn.style.display = "none";
      audioBtn.setAttribute("aria-label", "Activar audio");
    } else {
      iconOff.style.display = "none";
      iconOn.style.display = "";
      audioBtn.setAttribute("aria-label", "Silenciar audio");
    }
    gsap.fromTo(
      audioBtn,
      { scale: 0.88 },
      { scale: 1, duration: 0.32, ease: "back.out(2.5)" },
    );
  });

  // Play / Pause
  if (playBtn) {
    const iconPause = playBtn.querySelector(".play-icon--pause");
    const iconPlay = playBtn.querySelector(".play-icon--play");

    playBtn.addEventListener("click", () => {
      if (video.paused) {
        video.play();
        if (iconPause) iconPause.style.display = "";
        if (iconPlay) iconPlay.style.display = "none";
        playBtn.setAttribute("aria-label", "Pausar video");
      } else {
        video.pause();
        if (iconPause) iconPause.style.display = "none";
        if (iconPlay) iconPlay.style.display = "";
        playBtn.setAttribute("aria-label", "Reanudar video");
      }
      gsap.fromTo(
        playBtn,
        { scale: 0.88 },
        { scale: 1, duration: 0.32, ease: "back.out(2.5)" },
      );
    });

    // Sincronizar icono si el video termina o se pausa externamente
    video.addEventListener("pause", () => {
      if (iconPause) iconPause.style.display = "none";
      if (iconPlay) iconPlay.style.display = "";
      playBtn.setAttribute("aria-label", "Reanudar video");
    });
    video.addEventListener("play", () => {
      if (iconPause) iconPause.style.display = "";
      if (iconPlay) iconPlay.style.display = "none";
      playBtn.setAttribute("aria-label", "Pausar video");
    });
  }

  // Entrada con reveal al hacer scroll
  if (!prefersReducedMotion) {
    gsap.fromTo(
      ".video-stage",
      { clipPath: "inset(0 0 100% 0)", y: 30 },
      {
        clipPath: "inset(0 0 0% 0)",
        y: 0,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".video-stage",
          start: "top 82%",
          toggleActions: "play none none none",
        },
      },
    );
  }
};

/* ───────────────────────────────────────────────
   Nav hamburguesa — menú móvil
   ─────────────────────────────────────────────── */
const initHamburger = () => {
  const btn = document.getElementById("hamburger");
  const nav = document.getElementById("mainNav");
  if (!btn || !nav) return;

  const close = () => {
    btn.classList.remove("is-open");
    nav.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    nav.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const open = () => {
    btn.classList.add("is-open");
    nav.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    nav.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const syncViewportState = () => {
    if (!window.matchMedia("(max-width: 980px)").matches) {
      close();
    }
  };

  // Cerrar al hacer clic en un enlace del menú
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", close);
  });

  btn.addEventListener("click", () => {
    btn.classList.contains("is-open") ? close() : open();
  });

  // Cerrar al presionar Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && btn.classList.contains("is-open")) close();
  });

  window.addEventListener("resize", syncViewportState, { passive: true });
  window.addEventListener("orientationchange", syncViewportState);
};

/* ───────────────────────────────────────────────
   Boot
   ─────────────────────────────────────────────── */
initGenericReveals();
initLuxeCursor();
initNavHover();
initHamburger();
initCounters();
initPageTransitions();

if (isHomeLuxe) {
  initHomeLuxe();
  initVideoLuxe();
}

if (isInnerLuxe) {
  initInnerHero();
  initPropCards();
  initSrvPanels();
  initContactForm();
}

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

const isHomeLuxe = document.querySelector(".home-luxe") !== null;

/* ───────────────────────────────────────────────
   Loader
   ─────────────────────────────────────────────── */
const loader = document.getElementById("loader");
const bar = document.getElementById("progressBar");
const loaderScenes = gsap.utils.toArray(".loader-scene");

if (loader && bar) {
  const loaderTl = gsap.timeline();

  if (loaderScenes.length) {
    loaderScenes.forEach((scene, index) => {
      loaderTl.fromTo(
        scene,
        { autoAlpha: index === 0 ? 1 : 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" },
        index === 0 ? 0 : ">-0.02",
      );
      if (index < loaderScenes.length - 1) {
        loaderTl.to(
          scene,
          {
            autoAlpha: 0,
            y: -10,
            duration: 0.3,
            ease: "power2.in",
          },
          ">+0.2",
        );
      }
    });
  }

  loaderTl.to(bar, {
    width: "100%",
    duration: 1.05,
    ease: "power2.out",
  });

  loaderTl.to(loader, {
    autoAlpha: 0,
    duration: 0.5,
    ease: "power2.inOut",
    onComplete: () => loader.classList.add("hide"),
  });
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
            start: "top 88%",
            toggleActions: "play reverse play reverse",
          },
        },
      );
    });
  }
};

/* ───────────────────────────────────────────────
   Home premium experience
   ─────────────────────────────────────────────── */
const initHomeLuxe = () => {
  const heroTitle = document.getElementById("heroTitle");
  const cursor = document.querySelector(".luxe-cursor");
  const heroImage = document.querySelector(".hero-main-media img");
  const heroLightCanvas = document.getElementById("heroLightCanvas");

  // Cursor halo
  if (cursor && !prefersReducedMotion) {
    let mx = 0;
    let my = 0;
    let cx = 0;
    let cy = 0;

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
  }

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
      { yPercent: -5, scale: 1.12 },
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

    const geometry = new THREE.BufferGeometry();
    const count = window.innerWidth < 768 ? 420 : 920;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 52;
      positions[i + 1] = (Math.random() - 0.5) * 32;
      positions[i + 2] = (Math.random() - 0.5) * 34;
    }
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

  // Counters
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
              if (imageIdx === idx) {
                imageEl.classList.add("is-active");
              } else {
                imageEl.classList.remove("is-active");
              }
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
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.07,
          ease: "power2.out",
        },
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

  // Signature strip drift
  const strip = document.querySelector(".strip-track");
  if (strip && !prefersReducedMotion) {
    gsap.to(strip, {
      xPercent: -26,
      ease: "none",
      scrollTrigger: {
        trigger: ".signature-strip",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
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
        if (self.isActive && note) {
          note.textContent = step.dataset.note || "Narrativa";
        }
      },
    });
  });
}

/* ───────────────────────────────────────────────
   Cards interaction (internal pages)
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
   Form feedback
   ─────────────────────────────────────────────── */
const form = document.getElementById("leadForm");
const feedback = document.getElementById("feedback");
if (form && feedback) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    feedback.textContent =
      "Gracias. Te contactamos en menos de 24 horas para aterrizar la propuesta premium.";
    form.reset();
  });
}

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

/* Boot */
initGenericReveals();
if (isHomeLuxe) initHomeLuxe();
initPageTransitions();

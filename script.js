const slides = [
  { image: "images/image_1.jpg", title: "Ember Nebula",     caption: "Sapphire gas clouds threaded with veins of burning orange. A celestial cradle where new worlds are born amidst cosmic fire." },
  { image: "images/image_2.jpg", title: "Andromeda Drift",  caption: "A spiral galaxy turning slowly edge-on across the void, its dust lanes catching the light of a billion suns." },
  { image: "images/image_3.jpg", title: "Cerulean Haze",    caption: "Soft blue starlight diffusing through luminous cloud, where the sky itself seems to breathe and glow." },
  { image: "images/image_4.jpg", title: "Violet Milky Way", caption: "The galactic core arching overhead in dusty rose and violet, a river of ancient starlight spanning the dark." },
  { image: "images/image_5.jpg", title: "Solar Spiral",     caption: "A barred spiral blazing gold at its molten heart, arms unfurling in sweeps of sapphire and ember." }
];

const AUTOPLAY_MS = 6000;

const el = {
  strip: document.getElementById("carousel-cards"),
  progress: document.getElementById("progress"),
  prev: document.getElementById("prev-btn"),
  next: document.getElementById("next-btn"),
  title: document.getElementById("slide-title"),
  caption: document.getElementById("slide-caption"),
  detail: document.querySelector(".hero__detail"),
  current: document.getElementById("counter-current"),
  total: document.getElementById("counter-total"),
  hero: document.querySelector(".hero")
};

const bg = [
  document.querySelector(".hero__bg--a"),
  document.querySelector(".hero__bg--b")
];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let activeIndex = 0;
let visibleBg = 0;
let autoplayTimer = null;
let paused = false;

/* Preload every image so background swaps never flash */
slides.forEach((s) => { new Image().src = s.image; });

/* ── Build static markup once ──────────────────────────── */
function buildCards() {
  el.strip.innerHTML = slides
    .map(
      (slide, i) => `
        <button class="hero__card" type="button" data-index="${i}" aria-label="Show ${slide.title}">
          <img class="hero__card-img" src="${slide.image}" alt="${slide.title}" loading="lazy">
          <span class="hero__card-meta">
            <span class="hero__card-eyebrow">CURRENT VIEW</span>
            <span class="hero__card-name">${slide.title.toUpperCase()}</span>
          </span>
        </button>`
    )
    .join("");

  el.progress.innerHTML = slides
    .map(
      (slide, i) => `
        <button class="hero__seg" type="button" role="tab" data-index="${i}"
                aria-label="Go to ${slide.title}"></button>`
    )
    .join("");
}

/* ── Background crossfade ──────────────────────────────── */
function setBackground(imagePath) {
  const nextBg = (visibleBg + 1) % bg.length;
  bg[nextBg].style.backgroundImage = `url("${imagePath}")`;
  bg[nextBg].classList.add("is-visible");
  bg[visibleBg].classList.remove("is-visible");
  visibleBg = nextBg;
}

/* ── Render active slide ───────────────────────────────── */
function render() {
  const slide = slides[activeIndex];

  setBackground(slide.image);

  // re-trigger text reveal
  el.detail.classList.add("is-entering");
  void el.detail.offsetWidth;
  el.title.textContent = slide.title.toUpperCase();
  el.caption.textContent = slide.caption;
  requestAnimationFrame(() => el.detail.classList.remove("is-entering"));

  el.current.textContent = String(activeIndex + 1).padStart(2, "0");

  el.strip.querySelectorAll(".hero__card").forEach((card, i) => {
    const isActive = i === activeIndex;
    card.classList.toggle("is-active", isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });

  el.progress.querySelectorAll(".hero__seg").forEach((seg, i) => {
    seg.classList.toggle("is-done", i < activeIndex);
    seg.classList.toggle("is-active", i === activeIndex);
    seg.setAttribute("aria-selected", String(i === activeIndex));
  });
}

/* ── Navigation ────────────────────────────────────────── */
function goTo(index, { restart = true } = {}) {
  activeIndex = (index + slides.length) % slides.length;
  render();
  if (restart) startAutoplay();
}
const next = () => goTo(activeIndex + 1);
const prev = () => goTo(activeIndex - 1);

/* ── Autoplay ──────────────────────────────────────────── */
function startAutoplay() {
  clearTimeout(autoplayTimer);
  if (prefersReducedMotion || paused) return;
  autoplayTimer = setTimeout(next, AUTOPLAY_MS);
}
function setPaused(state) {
  paused = state;
  if (state) clearTimeout(autoplayTimer);
  else startAutoplay();
}

/* ── Events ────────────────────────────────────────────── */
el.next.addEventListener("click", next);
el.prev.addEventListener("click", prev);

el.strip.addEventListener("click", (e) => {
  const card = e.target.closest(".hero__card");
  if (card) goTo(Number(card.dataset.index));
});
el.progress.addEventListener("click", (e) => {
  const seg = e.target.closest(".hero__seg");
  if (seg) goTo(Number(seg.dataset.index));
});

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") next();
  else if (e.key === "ArrowLeft") prev();
});

el.hero.addEventListener("mouseenter", () => setPaused(true));
el.hero.addEventListener("mouseleave", () => setPaused(false));
el.hero.addEventListener("focusin", () => setPaused(true));
el.hero.addEventListener("focusout", () => setPaused(false));

document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearTimeout(autoplayTimer);
  else startAutoplay();
});

/* Drag / swipe */
(function enableSwipe() {
  let startX = null;
  const threshold = 50;
  el.hero.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".hero__strip, .hero__controls")) return;
    startX = e.clientX;
  });
  el.hero.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > threshold) (dx < 0 ? next : prev)();
    startX = null;
  });
})();

/* Subtle parallax on the background (from reference) */
if (!prefersReducedMotion) {
  document.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 14;
    const y = (e.clientY / window.innerHeight - 0.5) * 14;
    const layer = bg[visibleBg];
    if (layer) layer.style.translate = `${x}px ${y}px`;
  });
}

/* ── Init ──────────────────────────────────────────────── */
el.total.textContent = String(slides.length).padStart(2, "0");
buildCards();
goTo(0);

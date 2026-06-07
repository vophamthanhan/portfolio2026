const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const sections = Array.from(document.querySelectorAll("section[id]"));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const scrollProgress = document.querySelector(".scroll-progress");

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function setActiveNav(id) {
  navLinks.forEach((link) => {
    const target = link.getAttribute("href")?.replace("#", "");
    link.classList.toggle("is-active", target === id);
  });
}

function updateActiveNav() {
  const marker = window.scrollY + window.innerHeight * 0.35;
  const current = sections.reduce((active, section) => {
    return section.offsetTop <= marker ? section : active;
  }, sections[0]);

  if (current?.id) {
    setActiveNav(current.id);
  }
}

function updateScrollProgress() {
  if (!scrollProgress) return;

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
  const progress = Math.min(Math.max(ratio, 0), 1);
  scrollProgress.style.transform = `scaleX(${progress})`;
}

function updateScrollState() {
  updateActiveNav();
  updateScrollProgress();
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const id = anchor.getAttribute("href");
    const target = id ? document.querySelector(id) : null;
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    history.pushState(null, "", id);
    setActiveNav(target.id);
  });
});

const revealGroups = [
  ".profile-band .section-heading",
  ".profile-band .lead-text",
  ".metric-card",
  "#experience .compact-heading",
  ".timeline-item",
  "#projects .compact-heading",
  ".project-card",
  "#stack .compact-heading",
  ".skill-column",
  ".contact-copy",
  ".contact-actions"
];

function setupReveal() {
  const targets = [];

  revealGroups.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.classList.add("reveal");
      element.style.setProperty("--reveal-delay", `${Math.min(index * 70, 280)}ms`);
      targets.push(element);
    });
  });

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    targets.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.14
    }
  );

  targets.forEach((element) => revealObserver.observe(element));
}

function parseCounterValue(text) {
  const match = text.trim().match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;

  return {
    number: Number(match[1]),
    suffix: match[2],
    decimals: match[1].includes(".") ? match[1].split(".")[1].length : 0
  };
}

function animateCounter(element) {
  if (element.dataset.counted === "true") return;

  const finalText = element.dataset.finalValue || element.textContent.trim();
  const parsed = parseCounterValue(finalText);
  if (!parsed) return;

  element.dataset.counted = "true";
  element.dataset.finalValue = finalText;

  if (reducedMotion.matches) {
    element.textContent = finalText;
    return;
  }

  const duration = 900;
  const startTime = performance.now();
  const format = (value) => {
    const number = parsed.decimals > 0 ? value.toFixed(parsed.decimals) : Math.round(value).toString();
    return `${number}${parsed.suffix}`;
  };

  function frame(now) {
    const elapsed = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - elapsed, 3);
    element.textContent = format(parsed.number * eased);

    if (elapsed < 1) {
      requestAnimationFrame(frame);
      return;
    }

    element.textContent = finalText;
  }

  element.textContent = format(0);
  requestAnimationFrame(frame);
}

function setupCounters() {
  const targets = Array.from(document.querySelectorAll(".metric-card strong, .floating-note span")).filter((element) => {
    return parseCounterValue(element.textContent);
  });

  if (!targets.length || reducedMotion.matches || !("IntersectionObserver" in window)) return;

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.45
    }
  );

  targets.forEach((element) => counterObserver.observe(element));
}

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);

setupReveal();
setupCounters();
refreshIcons();
updateScrollState();

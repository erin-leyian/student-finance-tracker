// animations.js
// === Scroll & Fade-in Animations ===

document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.2 }
  );

  // Target all main sections and cards
  document.querySelectorAll("section, .card").forEach((el) => {
    observer.observe(el);
  });
});

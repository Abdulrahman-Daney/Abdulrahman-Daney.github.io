// Motion only. The page is complete without this file: nothing starts hidden.
(function () {
  // Keep the visitor's place when they switch language.
  function carryHash() {
    document.querySelectorAll("[data-lang-switch]").forEach(function (link) {
      link.href = link.href.split("#")[0] + location.hash;
    });
  }
  carryHash();
  addEventListener("hashchange", carryHash);

  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

  var rise = [
    { opacity: 0, transform: "translateY(20px)" },
    { opacity: 1, transform: "none" }
  ];

  var entrances = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entrances.unobserve(entry.target);
      var parts = entry.target.matches("[data-rise-group]") ? entry.target.children : [entry.target];
      Array.prototype.forEach.call(parts, function (part, i) {
        part.animate(rise, { duration: 620, delay: i * 70, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)", fill: "backwards" });
      });
    });
  }, { rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll("[data-rise], [data-rise-group]").forEach(function (el) {
    entrances.observe(el);
  });

  // The pipeline figure runs its stages in order the first time it is seen.
  var pipeline = document.querySelector(".pipeline");
  if (pipeline) {
    var runs = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      runs.disconnect();
      Array.prototype.forEach.call(pipeline.children, function (stage, i) {
        stage.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 300, delay: 200 + i * 320, easing: "linear", fill: "backwards" });
      });
    }, { threshold: 0.4 });
    runs.observe(pipeline);
  }

  // The hero portrait settles slowly as the page opens.
  var portrait = document.querySelector(".hero .stage img");
  if (portrait) {
    portrait.animate([{ transform: "scale(1.05)" }, { transform: "none" }], { duration: 1600, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" });
  }
})();

// The page is complete without this file: nothing starts hidden.
(function () {
  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var arabic = root.lang === "ar";

  // Keep the visitor's place when they switch language.
  function carryHash() {
    document.querySelectorAll("[data-lang-switch]").forEach(function (link) {
      link.href = link.href.split("#")[0] + location.hash;
    });
  }
  carryHash();
  addEventListener("hashchange", carryHash);

  // Theme switch. The choice is remembered; without one the system setting decides.
  var themeButton = document.querySelector(".theme-switch");
  var systemDark = matchMedia("(prefers-color-scheme: dark)");
  function currentTheme() {
    return root.dataset.theme || (systemDark.matches ? "dark" : "light");
  }
  function labelTheme() {
    if (!themeButton) return;
    var next = currentTheme() === "dark" ? "light" : "dark";
    themeButton.textContent = themeButton.getAttribute("data-" + next);
    themeButton.setAttribute("aria-label", themeButton.getAttribute("data-" + next + "-label"));
  }
  if (themeButton) {
    themeButton.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
      labelTheme();
      paintBar(true);
    });
    systemDark.addEventListener("change", function () { labelTheme(); paintBar(true); });
    labelTheme();
  }

  // The bar takes the ground and ink of the chapter passing under it.
  var bar = document.querySelector(".bar");
  var chapters = Array.prototype.slice.call(document.querySelectorAll(".chapter"));
  var barChapter = null;
  function paintBar(force) {
    if (!bar || !chapters.length) return;
    var line = bar.offsetHeight / 2;
    var under = chapters[0];
    for (var i = 0; i < chapters.length; i++) {
      var box = chapters[i].getBoundingClientRect();
      if (box.top <= line && box.bottom > line) { under = chapters[i]; break; }
    }
    if (under === barChapter && !force) return;
    barChapter = under;
    var style = getComputedStyle(under);
    bar.style.setProperty("--bar-bg", style.backgroundColor);
    bar.style.setProperty("--bar-ink", style.color);
  }
  var ticking = false;
  addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; paintBar(false); });
  }, { passive: true });
  addEventListener("resize", function () { paintBar(true); });
  paintBar(true);

  // The pipeline: push a commit and watch the seven stages run. A failed stage stops the release.
  var pipe = document.querySelector(".pipe");
  if (pipe) {
    var stages = Array.prototype.slice.call(pipe.querySelectorAll(".pipe-stages li"));
    var push = pipe.querySelector(".pipe-push");
    var breakTests = pipe.querySelector(".pipe-break input");
    var result = pipe.querySelector(".pipe-result");
    var words = JSON.parse(pipe.getAttribute("data-words"));
    var timer = null;

    function setStage(stage, state) {
      stage.dataset.state = state;
      stage.querySelector(".state").textContent = words[state];
    }
    function run() {
      clearTimeout(timer);
      stages.forEach(function (stage) { setStage(stage, "queued"); });
      result.textContent = words.started;
      push.textContent = words.again;
      var failAt = breakTests.checked ? 2 : -1;
      var step = reduce ? 0 : 520;
      var i = 0;
      (function next() {
        if (i > 0) setStage(stages[i - 1], "passed");
        if (i === stages.length) { result.textContent = words.shipped; return; }
        setStage(stages[i], "running");
        if (i === failAt) {
          timer = setTimeout(function () {
            setStage(stages[i], "failed");
            for (var j = i + 1; j < stages.length; j++) setStage(stages[j], "skipped");
            result.textContent = words.stopped;
          }, step);
          return;
        }
        i++;
        timer = setTimeout(next, step);
      })();
    }
    push.addEventListener("click", run);

    // It runs once by itself the first time it is seen.
    if ("IntersectionObserver" in window && !reduce) {
      var seen = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        seen.disconnect();
        run();
      }, { threshold: 0.5 });
      seen.observe(pipe);
    }
  }

  if (reduce || !("IntersectionObserver" in window)) return;

  // Entrances: the parts of each section rise one after another, once.
  var rise = [
    { opacity: 0, transform: "translateY(26px)" },
    { opacity: 1, transform: "none" }
  ];
  var entrances = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entrances.unobserve(entry.target);
      var parts = entry.target.matches("[data-rise-group]") ? entry.target.children : [entry.target];
      Array.prototype.forEach.call(parts, function (part, i) {
        part.animate(rise, { duration: 700, delay: Math.min(i, 9) * 70, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)", fill: "backwards" });
      });
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll("[data-rise], [data-rise-group]").forEach(function (el) {
    entrances.observe(el);
  });

  // The big figures of Course Mark count up to their values.
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = Number(el.getAttribute("data-count"));
    var counted = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      counted.disconnect();
      var start = performance.now();
      (function tick(now) {
        var t = Math.min(1, (now - start) / 900);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased);
        if (t < 1) requestAnimationFrame(tick);
      })(start);
    }, { threshold: 0.6 });
    counted.observe(el);
  });

  // Screenshots drift a little against the scroll.
  var drifters = Array.prototype.slice.call(document.querySelectorAll("[data-drift]"));
  if (drifters.length) {
    var driftTick = false;
    function drift() {
      driftTick = false;
      var h = innerHeight;
      drifters.forEach(function (el) {
        var box = el.getBoundingClientRect();
        if (box.bottom < 0 || box.top > h) return;
        var mid = (box.top + box.height / 2 - h / 2) / h;
        el.style.transform = "translateY(" + (mid * Number(el.getAttribute("data-drift"))).toFixed(1) + "px)";
      });
    }
    addEventListener("scroll", function () {
      if (driftTick) return;
      driftTick = true;
      requestAnimationFrame(drift);
    }, { passive: true });
    drift();
  }
})();

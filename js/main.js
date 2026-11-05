// Shared page behavior: mobile menu drawer, Google review totals and the footer year.
(function () {
  var profile = (window.SITE_CONFIG || {}).google || {};

  // Keep the star rating, review count and Google links on every page in step
  // with site-config.js, so they only need changing in one place.
  if (profile.rating) {
    document.querySelectorAll("[data-google-rating]").forEach(function (el) {
      el.textContent = Number(profile.rating).toFixed(1);
    });
  }
  if (profile.reviewCount) {
    document.querySelectorAll("[data-google-count]").forEach(function (el) {
      el.textContent = Number(profile.reviewCount).toLocaleString("en-US");
    });
  }
  if (profile.reviewsUrl) {
    document.querySelectorAll("[data-google-reviews-link]").forEach(function (el) {
      el.href = profile.reviewsUrl;
    });
  }
  if (profile.writeReviewUrl) {
    document.querySelectorAll("[data-google-write-review]").forEach(function (el) {
      el.href = profile.writeReviewUrl;
    });
  }

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });

    // Close the drawer when a link is chosen or the dimmed backdrop is tapped.
    document.addEventListener("click", function (event) {
      if (!document.body.classList.contains("nav-open")) return;
      if (event.target.closest("#site-nav a") || !event.target.closest("#site-nav, .nav-toggle")) {
        setOpen(false);
      }
    });
  }

  // Google hides the rating card on embedded maps narrower than 400px, so on
  // small screens draw the map 420px wide and shrink it to fit instead.
  var maps = document.querySelectorAll("iframe[data-fit-map]");
  var fitMaps = function () {
    maps.forEach(function (map) {
      var scale = Math.min(1, map.parentNode.clientWidth / 420);
      map.style.width = scale < 1 ? "420px" : "";
      map.style.zoom = scale < 1 ? String(scale) : "";
    });
  };
  if (maps.length) {
    fitMaps();
    window.addEventListener("resize", fitMaps);
  }

  document.querySelectorAll("[data-current-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();

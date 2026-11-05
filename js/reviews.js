// Reviews: the Reviews page list is split into numbered pages, and the homepage
// reviews box flips through the reviews written into the page. If a
// Google API key is set in site-config.js, it swaps in the newest reviews
// straight from the shop's Google Business Profile (shown word for word) and
// refreshes the rating and review count. Without a key, or if Google can't be
// reached, the reviews already in the page stay.
(function () {
  var profile = (window.SITE_CONFIG || {}).google || {};
  var boxes = document.querySelectorAll("[data-reviews]");
  var sliders = [];

  boxes.forEach(function (box) {
    sliders.push(setupSlider(box));
  });

  document.querySelectorAll("[data-paginate]").forEach(setupPages);

  if (!boxes.length || !profile.apiKey || !profile.placeId) return;

  loadMapsApi(profile.apiKey)
    .then(function () {
      return google.maps.importLibrary("places");
    })
    .then(function (places) {
      var place = new places.Place({ id: profile.placeId });
      return place.fetchFields({ fields: ["rating", "userRatingCount", "reviews"] }).then(function () {
        return place;
      });
    })
    .then(function (place) {
      showTotals(place.rating, place.userRatingCount);

      // Google returns up to five reviews. Skip star-only reviews with no written comment.
      var reviews = (place.reviews || []).filter(function (review) {
        return review.text && review.rating >= (profile.minRating || 1);
      });
      if (!reviews.length) return;

      boxes.forEach(function (box, i) {
        var slides = box.querySelector(".review-slides");
        slides.replaceChildren.apply(slides, reviews.map(buildReview));
        var source = box.querySelector("[data-review-source]");
        if (source) source.hidden = false;
        sliders[i](0);
      });
    })
    .catch(function (error) {
      console.warn("Google reviews could not be loaded, so the saved reviews are shown.", error);
    });

  // Shows one review at a time with previous/next buttons. Returns show(index).
  function setupSlider(box) {
    var nav = box.querySelector(".review-nav");
    var position = box.querySelector("[data-review-position]");
    var current = 0;

    function show(index) {
      var figures = box.querySelectorAll(".review-slides .review");
      if (!figures.length) return;
      current = (index + figures.length) % figures.length;
      figures.forEach(function (figure, i) {
        figure.hidden = i !== current;
      });
      if (position) position.textContent = current + 1 + " of " + figures.length;
      if (nav) nav.hidden = figures.length < 2;
      addReadMore(figures[current]);
    }

    if (nav) {
      nav.querySelector("[data-review-prev]").addEventListener("click", function () {
        show(current - 1);
      });
      nav.querySelector("[data-review-next]").addEventListener("click", function () {
        show(current + 1);
      });
    }

    show(0);
    return show;
  }

  // Splits a long review list into pages (ten per page by default) with
  // numbered buttons in the .pager right after it. Without JavaScript every
  // review simply shows in one long list.
  function setupPages(list) {
    var perPage = Number(list.getAttribute("data-paginate")) || 10;
    var items = list.children;
    var pageCount = Math.ceil(items.length / perPage);
    var pager = list.nextElementSibling;
    if (pageCount < 2 || !pager || !pager.classList.contains("pager")) return;

    var current = 1;
    var prev = pagerButton("‹ Prev", "Previous page");
    var next = pagerButton("Next ›", "Next page");
    var numbers = [];

    pager.appendChild(prev);
    for (var n = 1; n <= pageCount; n++) {
      var number = pagerButton(String(n), "Page " + n);
      number.setAttribute("data-page", n);
      numbers.push(number);
      pager.appendChild(number);
    }
    pager.appendChild(next);
    pager.hidden = false;

    pager.addEventListener("click", function (event) {
      var button = event.target.closest("button");
      if (!button || button.disabled) return;
      var page = button === prev ? current - 1 : button === next ? current + 1 : Number(button.getAttribute("data-page"));
      show(page);
      list.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    function show(page) {
      current = Math.min(Math.max(page, 1), pageCount);
      for (var i = 0; i < items.length; i++) {
        items[i].hidden = Math.floor(i / perPage) + 1 !== current;
      }
      numbers.forEach(function (button, i) {
        if (i + 1 === current) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      });
      prev.disabled = current === 1;
      next.disabled = current === pageCount;
    }

    show(1);
  }

  function pagerButton(text, label) {
    var button = el("button", "", text);
    button.type = "button";
    button.setAttribute("aria-label", label);
    return button;
  }

  // Long reviews are trimmed to a few lines with a button to read the rest.
  function addReadMore(figure) {
    var text = figure.querySelector(".review__text");
    if (!text || figure.querySelector(".review-more")) return;
    if (text.scrollHeight <= text.clientHeight + 1) return;

    var more = el("button", "review-more", "Read more");
    more.type = "button";
    more.setAttribute("aria-expanded", "false");
    more.addEventListener("click", function () {
      var expanded = text.classList.toggle("is-expanded");
      more.textContent = expanded ? "Show less" : "Read more";
      more.setAttribute("aria-expanded", String(expanded));
    });
    figure.insertBefore(more, figure.querySelector("figcaption"));
  }

  function loadMapsApi(key) {
    if (window.google && google.maps && google.maps.importLibrary) return Promise.resolve();

    return new Promise(function (resolve, reject) {
      window.__nysMapsReady = resolve;
      var script = document.createElement("script");
      script.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(key) +
        "&v=weekly&loading=async&callback=__nysMapsReady";
      script.async = true;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function showTotals(rating, count) {
    if (rating) {
      document.querySelectorAll("[data-google-rating]").forEach(function (node) {
        node.textContent = rating.toFixed(1);
      });
    }
    if (count) {
      document.querySelectorAll("[data-google-count]").forEach(function (node) {
        node.textContent = count.toLocaleString("en-US");
      });
    }
  }

  function buildReview(review) {
    var figure = el("figure", "review");

    var quote = el("blockquote");
    quote.appendChild(el("p", "review__text", "“" + review.text + "”"));
    figure.appendChild(quote);

    var caption = el("figcaption");
    var cite = el("cite");
    var author = review.authorAttribution || {};
    var name = author.displayName || "Google user";
    if (author.uri) {
      var link = el("a", "", name);
      link.href = author.uri;
      link.target = "_blank";
      link.rel = "noopener";
      cite.appendChild(link);
    } else {
      cite.textContent = name;
    }
    caption.appendChild(cite);
    caption.appendChild(buildStars(review.rating));
    if (review.relativePublishTimeDescription) {
      caption.appendChild(el("span", "review__time", review.relativePublishTimeDescription));
    }
    figure.appendChild(caption);

    return figure;
  }

  function buildStars(rating) {
    var filled = Math.round(rating || 0);
    var stars = el("span", "stars");
    stars.setAttribute("role", "img");
    stars.setAttribute("aria-label", filled + " out of 5 stars");
    stars.appendChild(document.createTextNode("★".repeat(filled)));
    if (filled < 5) stars.appendChild(el("span", "stars__empty", "★".repeat(5 - filled)));
    return stars;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
})();

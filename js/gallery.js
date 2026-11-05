// Photo gallery: clicking a photo in [data-gallery] opens it larger in the
// lightbox dialog, with previous/next buttons and the arrow keys to move
// between photos. Without JavaScript each photo link simply opens the image.
(function () {
  var gallery = document.querySelector("[data-gallery]");
  var dialog = document.querySelector(".lightbox");
  if (!gallery || !dialog || typeof dialog.showModal !== "function") return;

  var image = dialog.querySelector(".lightbox__image");
  var caption = dialog.querySelector(".lightbox__caption");
  var current = 0;

  function links() {
    return gallery.querySelectorAll("a");
  }

  function show(index) {
    var all = links();
    current = (index + all.length) % all.length;
    var link = all[current];
    var thumb = link.querySelector("img");
    var text = thumb ? thumb.alt : "";
    image.src = link.href;
    image.alt = text;
    caption.textContent = text;
    dialog.classList.toggle("lightbox--single", all.length < 2);
  }

  gallery.addEventListener("click", function (event) {
    var link = event.target.closest("a");
    if (!link) return;
    event.preventDefault();
    show(Array.prototype.indexOf.call(links(), link));
    dialog.showModal();
  });

  dialog.querySelector(".lightbox__close").addEventListener("click", function () {
    dialog.close();
  });
  dialog.querySelector(".lightbox__prev").addEventListener("click", function () {
    show(current - 1);
  });
  dialog.querySelector(".lightbox__next").addEventListener("click", function () {
    show(current + 1);
  });

  dialog.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });

  // Clicking the dark area around the photo closes the viewer.
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", function () {
    image.removeAttribute("src");
  });
})();

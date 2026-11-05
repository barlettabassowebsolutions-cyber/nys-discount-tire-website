// Writes the saved reviews in data/reviews.json into the site:
//  - index.html:   featured reviews for the homepage slider
//                  (between the testimonials:start / testimonials:end markers)
//  - reviews.html: every review, newest first
//                  (between the reviews:start / reviews:end markers)
// Usage: node tools/build-reviews.js [how many on the homepage, default 12]
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const reviews = require(path.join(root, "data", "reviews.json"));
const howMany = Number(process.argv[2]) || 12;

const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const indentBy = (spaces, lines) => lines.map((line) => " ".repeat(spaces) + line).join("\n");

function stars(rating) {
  const empty = 5 - rating;
  return (
    `<span class="stars" role="img" aria-label="${rating} out of 5 stars">${"★".repeat(rating)}` +
    (empty ? `<span class="stars__empty">${"★".repeat(empty)}</span>` : "") +
    `</span>`
  );
}

// "2/8/2018" -> { iso: "2018-02-08", label: "February 8, 2018" }
function formatDate(text) {
  const [m, d, y] = text.split("/").map(Number);
  if (!y) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  return {
    iso: date.toISOString().slice(0, 10),
    label: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }),
  };
}

function replaceBetween(file, name, html) {
  const full = path.join(root, file);
  const page = fs.readFileSync(full, "utf8");
  const pattern = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(\\n\\s*<!-- ${name}:end -->)`);
  if (!pattern.test(page)) throw new Error(`Markers "${name}" not found in ${file}`);
  fs.writeFileSync(full, page.replace(pattern, (_, start, end) => `${start}\n${html}${end}`));
}

// ---------- Homepage slider ----------
// Newest first, skipping reviews with no written comment, very long ones that
// don't fit the homepage box, reviewers listed only by initials, and a second
// review from the same customer.
const surnames = new Set();
const featured = reviews
  .filter((r) => {
    if (!r.text || r.text.length < 60 || r.text.length > 450) return false;
    if (!/[a-z]{3}/i.test(r.author)) return false;
    const surname = r.author.trim().split(/\s+/).pop().toLowerCase();
    if (surnames.has(surname)) return false;
    surnames.add(surname);
    return true;
  })
  .slice(0, howMany);

replaceBetween(
  "index.html",
  "testimonials",
  featured
    .map((r) =>
      indentBy(12, [
        `<figure class="review" hidden>`,
        `  <blockquote>`,
        `    <p class="review__text">&ldquo;${escape(r.text).replace(/\n/g, "<br>")}&rdquo;</p>`,
        `  </blockquote>`,
        `  <figcaption>`,
        `    <cite>${escape(r.author)}</cite>`,
        `    ${stars(r.rating)}`,
        `  </figcaption>`,
        `</figure>`,
      ])
    )
    .join("\n")
);

// ---------- Reviews page ----------
replaceBetween(
  "reviews.html",
  "reviews",
  reviews
    .map((r) => {
      const date = formatDate(r.date);
      return indentBy(10, [
        `<li class="review-item">`,
        `  <div class="review-item__info">`,
        `    <p class="review-item__author">${escape(r.author)}</p>`,
        date ? `    <p class="review-item__date"><time datetime="${date.iso}">${date.label}</time></p>` : null,
        `    ${stars(r.rating)}`,
        `  </div>`,
        `  <div class="review-item__body">`,
        `    <p class="review-item__place">NYS Discount Tire &amp; Auto</p>`,
        r.text
          ? `    <p class="review-item__text">${escape(r.text).replace(/\n/g, "<br>")}</p>`
          : `    <p class="review-item__text review-item__text--empty">Rated ${r.rating} stars (no written comment).</p>`,
        `  </div>`,
        `</li>`,
      ].filter((line) => line !== null));
    })
    .join("\n")
);

console.log(`Homepage: ${featured.length} featured reviews. Reviews page: ${reviews.length} reviews.`);

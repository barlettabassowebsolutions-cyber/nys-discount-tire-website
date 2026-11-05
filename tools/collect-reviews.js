// Collects the reviews listed on the old site's Reviews pages into one JSON file.
// Usage: node collect-reviews.js <output.json>
const fs = require("fs");

const BASE = "https://www.nysdiscounttire.com/";
const PAGES = ["reviews"].concat(Array.from({ length: 11 }, (_, i) => "reviews-" + (i + 2)));

// The old site stored some punctuation double-encoded (e.g. "вЂ™" for an apostrophe).
// Rebuild the windows-1251 byte table so those runs can be decoded back to UTF-8.
const cp1251 = new TextDecoder("windows-1251");
const toByte = new Map();
for (let b = 0x80; b <= 0xff; b++) toByte.set(cp1251.decode(Uint8Array.of(b)), b);

// Same idea for text mis-read as Windows-1252 (e.g. "â€™" for an apostrophe)
// or as Latin-1 (e.g. "Ã¨" for "è").
const cp1252 = new TextDecoder("windows-1252");
const toByte1252 = new Map();
for (let b = 0x80; b <= 0xff; b++) toByte1252.set(cp1252.decode(Uint8Array.of(b)), b);
const latin1Byte = (ch) => (ch.charCodeAt(0) <= 0xff ? ch.charCodeAt(0) : undefined);

function redecode(run, byteOf) {
  const bytes = [];
  for (const ch of run) {
    const b = byteOf(ch);
    if (b === undefined) return null;
    bytes.push(b);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
  } catch {
    return null;
  }
}

// Some text was garbled more than once, so repeat until nothing changes.
function fixMojibake(text) {
  for (let i = 0; i < 4; i++) {
    const fixed = fixOnce(text);
    if (fixed === text) break;
    text = fixed;
  }
  return text;
}

function fixOnce(text) {
  return text.replace(/[Ѐ-ӿ\u0080-ÿ‘-›№™€Œ-ƒˆ-˜]{2,}/g, (run) =>
    redecode(run, (ch) => toByte.get(ch)) ||
    redecode(run, (ch) => toByte1252.get(ch)) ||
    redecode(run, latin1Byte) ||
    run
  );
}

function decodeEntities(s) {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

const clean = (s) => fixMojibake(decodeEntities(s)).replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();

function parse(html) {
  const blocks = html.split(/<div class="row review">/).slice(1);
  return blocks.map((block) => {
    const pick = (re) => { const m = block.match(re); return m ? clean(m[1]) : ""; };
    return {
      author: pick(/itemprop="author"[\s\S]*?itemprop="name">([\s\S]*?)<\/span>/),
      date: pick(/itemprop="datePublished">([\s\S]*?)<\/span>/),
      rating: Number(pick(/itemprop="ratingValue">([\s\S]*?)<\/span>/)) || null,
      text: pick(/itemprop="reviewBody">([\s\S]*?)<\/p>/),
    };
  });
}

(async () => {
  const all = [];
  for (const page of PAGES) {
    const res = await fetch(BASE + page);
    if (!res.ok) { console.error(page, res.status); continue; }
    const found = parse(await res.text());
    console.error(page, found.length);
    all.push(...found);
  }

  // Drop repeats. Google allows one review per customer, so several entries
  // under one name are earlier versions of a review they later edited; the same
  // long review under two names is one customer listed twice. Pages run newest
  // first, so the copy kept is the latest one.
  const seen = new Set();
  const kept = [];
  const norm = (s) => s.toLowerCase().replace(/\W+/g, "");
  // Two long reviews sharing most of their words are the same review, lightly edited.
  const words = (s) => new Set(s.toLowerCase().match(/[a-z']+/g) || []);
  const similar = (a, b) => {
    if (b.length <= 100) return false;
    const wa = words(a), wb = words(b);
    let shared = 0;
    wa.forEach((w) => wb.has(w) && shared++);
    return shared / Math.max(wa.size, wb.size) > 0.7;
  };
  const unique = all.filter((r) => {
    const keys = ["author:" + norm(r.author)];
    if (r.text) keys.push("text:" + norm(r.text));
    if (r.text.length > 100) keys.push("start:" + norm(r.text).slice(0, 60));
    const repeat = keys.some((k) => seen.has(k)) || kept.some((k) => similar(k, r.text));
    keys.forEach((k) => seen.add(k));
    if (r.text.length > 100) kept.push(r.text);
    return !repeat;
  });

  fs.writeFileSync(process.argv[2], JSON.stringify(unique, null, 2) + "\n");
  console.error("total", all.length, "unique", unique.length);
})();

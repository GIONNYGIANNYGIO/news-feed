import fs from "fs";

if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

// 🔵 FEED STABILI
const FEEDS = [
  { url: "https://www.carscoops.com/feed/", source: "Carscoops" },
  { url: "https://feeds.feedburner.com/Speedhunters", source: "Speedhunters" },
  { url: "https://www.motorsport.com/rss/all/news/", source: "Motorsport" },
  { url: "https://www.autoexpress.co.uk/feeds/all", source: "AutoExpress" }
];

// -----------------------------
// FETCH SAFE
// -----------------------------
async function fetchXML(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!res.ok) return null;

    const text = await res.text();

    // evita HTML invece di RSS
    if (!text || text.includes("<html")) return null;

    return text;

  } catch (e) {
    console.log("❌ fetch error:", url);
    return null;
  }
}

// -----------------------------
// IMAGE EXTRACTION
// -----------------------------
function extractImage(block) {
  return (
    block.match(/<media:content[^>]*url="(.*?)"/)?.[1] ||
    block.match(/<enclosure[^>]*url="(.*?)"/)?.[1] ||
    block.match(/<img[^>]+src="(.*?)"/)?.[1] ||
    ""
  );
}

// -----------------------------
// PARSER RSS
// -----------------------------
function parse(xml, source) {
  if (!xml) return [];

  const items = xml.split("<item>");
  if (items.length < 2) return [];

  return items.slice(1).map(block => {
    const title = block.match(/<title>(.*?)<\/title>/)?.[1] || "";
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] || "";
    const date = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();

    return {
      title,
      link,
      img: extractImage(block),
      date,
      source
    };
  });
}

// -----------------------------
// SAFE IMAGE FALLBACK
// -----------------------------
function safeImage(item) {
  return item.img || "https://via.placeholder.com/800x500?text=No+Image";
}

// -----------------------------
// DEDUPLICA
// -----------------------------
function dedupe(items) {
  const seen = new Set();

  return items.filter(item => {
    const key = (item.title || "").toLowerCase().trim();

    if (seen.has(key)) return false;
    seen.add(key);

    return true;
  });
}

// -----------------------------
// SCORE (ranking intelligente)
// -----------------------------
function score(item) {
  const t = (item.title || "").toLowerCase();

  let s = 0;

  if (t.includes("breaking")) s += 100;
  if (t.includes("f1")) s += 60;
  if (t.includes("formula")) s += 50;
  if (t.includes("race")) s += 40;
  if (t.includes("motorsport")) s += 30;
  if (t.includes("tuning")) s += 10;

  return s;
}

// -----------------------------
// RUN
// -----------------------------
async function run() {

  let all = [];

  for (const feed of FEEDS) {

    const xml = await fetchXML(feed.url);

    if (!xml) {
      console.log("❌ error:", feed.source);
      continue;
    }

    const items = parse(xml, feed.source);

    console.log(`✔ ${feed.source}:`, items.length);

    all.push(...items);
  }

  // fallback immagini
  all = all.map(i => ({
    ...i,
    img: safeImage(i)
  }));

  // deduplica
  all = dedupe(all);

  // ranking + data
  all.sort((a, b) => {
    return (score(b) + new Date(b.date)) - (score(a) + new Date(a.date));
  });

  const output = all.slice(0, 40);

  fs.writeFileSync(
    "data/feed.json",
    JSON.stringify(output, null, 2)
  );

  console.log("✅ FEED BUILT:", output.length);
}

run();

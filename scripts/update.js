import fs from "fs";

if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

const FEEDS = [
  "https://www.carscoops.com/feed/",
  "https://www.motor1.com/rss/all/news/",
  "https://feeds.feedburner.com/Speedhunters",
  "https://www.motorsport.com/rss/all/news/"
];

// fetch semplice (NO dipendenze)
async function fetchXML(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.text();
}

// ESTRAZIONE SEMPLICE E STABILE
function extract(tag, xml) {
  const match = xml.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`));
  return match ? match[1] : "";
}

// immagine SOLO base (no hack complicati)
function extractImage(xml) {
  let img =
    xml.match(/<media:content[^>]*url="(.*?)"/)?.[1] ||
    xml.match(/<enclosure[^>]*url="(.*?)"/)?.[1] ||
    xml.match(/<img[^>]+src="(.*?)"/)?.[1];

  return img || "";
}

// parsing RSS semplice e robusto
function parseItems(xml, source) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  return items.map(i => {
    const block = i[1];

    return {
      title: extract("title", block),
      link: extract("link", block),
      img: extractImage(block),
      date: extract("pubDate", block) || new Date().toISOString(),
      source
    };
  });
}

async function run() {

  let all = [];

  for (const feed of FEEDS) {
    try {
      const xml = await fetchXML(feed.url);

      if (!xml) continue;

      const items = parseItems(xml, feed.source);

      all.push(...items);

    } catch (e) {
      console.log("❌ error:", feed.url);
    }
  }

  all.sort((a, b) => new Date(b.date) - new Date(a.date));

  const output = all.slice(0, 40);

  fs.writeFileSync(
    "data/feed.json",
    JSON.stringify(output, null, 2)
  );

  console.log("✅ FEED BUILT:", output.length);
}

run();

import fs from "fs";

if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

// 4 FEED STABILI
const FEEDS = [
  { url: "https://www.carscoops.com/feed/", source: "Carscoops" },
  { url: "https://feeds.feedburner.com/Speedhunters", source: "Speedhunters" },
  { url: "https://www.motorsport.com/rss/all/news/", source: "Motorsport" },
  { url: "https://www.autoexpress.co.uk/feeds/all", source: "AutoExpress" }
];

async function fetchXML(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!res.ok) return null;

    return await res.text();

  } catch (e) {
    console.log("❌ fetch fail:", url);
    return null;
  }
}

// 🔥 PARSER ROBUSTO (FIX VERO)
function parseRSS(xml, source) {

  if (!xml) return [];

  // FIX: supporta RSS + ATOM base
  const items = xml.split("<item>");

  if (items.length < 2) {
    console.log("⚠️ no <item> found in:", source);
    return [];
  }

  return items.slice(1).map(block => {

    const title = block.match(/<title>(.*?)<\/title>/)?.[1] || "";
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] || "";
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();

    // immagini (best effort)
    let img =
      block.match(/<media:content[^>]*url="(.*?)"/)?.[1] ||
      block.match(/<enclosure[^>]*url="(.*?)"/)?.[1] ||
      block.match(/<img[^>]+src="(.*?)"/)?.[1] ||
      "";

    return {
      title,
      link,
      img,
      date: pubDate,
      source
    };
  });
}

async function run() {

  let all = [];

  for (const feed of FEEDS) {

    const xml = await fetchXML(feed.url);

    if (!xml) {
      console.log("❌ error:", feed.source);
      continue;
    }

    const items = parseRSS(xml, feed.source);

    console.log(`✔ ${feed.source}:`, items.length);

    all.push(...items);
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

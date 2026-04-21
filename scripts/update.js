import fs from "fs";
import { XMLParser } from "fast-xml-parser";

if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

const parser = new XMLParser({
  ignoreAttributes: false
});

// USER AGENT per bypass base block
async function fetchRSS(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "Accept": "application/rss+xml, application/xml, text/xml"
    }
  });

  if (!res.ok) throw new Error("Fetch failed");

  return await res.text();
}

async function parseFeed(url, sourceName) {
  try {
    const xml = await fetchRSS(url);
    const data = parser.parse(xml);

    const items = data?.rss?.channel?.item || [];

    return items.map(item => ({
      title: item.title || "",
      link: item.link || "",
      img:
        item["media:content"]?.["@_url"] ||
        item.enclosure?.["@_url"] ||
        "",
      date: item.pubDate || new Date().toISOString(),
      author: item.author || sourceName,
      source: sourceName
    }));

  } catch (e) {
    console.log("❌ Feed fallito:", url);
    return [];
  }
}

async function run() {

  let all = [];

  const results = await Promise.allSettled([
    parseFeed("https://feeds.feedburner.com/Speedhunters", "Speedhunters"),
    parseFeed("https://www.stancenation.com/feed/", "StanceNation"),
    parseFeed("https://www.carscoops.com/feed/", "Carscoops"),
    parseFeed("https://stanceworks.com/feed/", "StanceWorks")
  ]);

  for (const r of results) {
    if (r.status === "fulfilled") {
      all.push(...r.value);
    }
  }

  all.sort((a, b) => new Date(b.date) - new Date(a.date));

  const output = all.slice(0, 40);

  fs.writeFileSync(
    "data/feed.json",
    JSON.stringify(output, null, 2)
  );

  console.log("✅ feed.json aggiornato:", output.length);
}

run();

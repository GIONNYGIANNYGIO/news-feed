import fs from "fs";

if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

// 🔵 GITHUB (stabili)
const GITHUB_FEEDS = [
  "https://feeds.feedburner.com/Speedhunters",
  "https://www.carscoops.com/feed/"
];

// 🟡 FOURTHWALL (instabili ma li proviamo comunque)
const FOURTHWALL_FEEDS = [
  "https://www.stancenation.com/feed/",
  "https://stanceworks.com/feed/"
];

async function fetchXML(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch fail");
  return await res.text();
}

// parsing semplice RSS
function parse(xml, source) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  return items.map(m => {
    const b = m[1];

    return {
      title: b.match(/<title>(.*?)<\/title>/)?.[1] || "",
      link: b.match(/<link>(.*?)<\/link>/)?.[1] || "",
      img: b.match(/<media:content.*?url="(.*?)"/)?.[1] || "",
      date: b.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString(),
      source
    };
  });
}

// retry semplice per feed difficili
async function safeFetch(url, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchXML(url);
    } catch (e) {
      if (i === retries - 1) return null;
    }
  }
  return null;
}

async function run() {

  let all = [];

  // 🔵 GITHUB FEEDS (sempre affidabili)
  for (const url of GITHUB_FEEDS) {
    try {
      const xml = await fetchXML(url);
      const source = url.includes("speedhunters") ? "Speedhunters" : "Carscoops";
      all.push(...parse(xml, source));
    } catch (e) {
      console.log("❌ GitHub feed error:", url);
    }
  }

  // 🟡 FOURTHWALL FEEDS (con fallback)
  for (const url of FOURTHWALL_FEEDS) {
    const xml = await safeFetch(url, 2);

    if (!xml) {
      console.log("⚠️ Fourthwall skipped:", url);
      continue;
    }

    const source =
      url.includes("stancenation") ? "StanceNation" : "StanceWorks";

    all.push(...parse(xml, source));
  }

  // sort globale
  all.sort((a, b) => new Date(b.date) - new Date(a.date));

  const output = all.slice(0, 40);

  fs.writeFileSync(
    "data/feed.json",
    JSON.stringify(output, null, 2)
  );

  console.log("✅ UNIFIED FEED READY:", output.length);
}

run();

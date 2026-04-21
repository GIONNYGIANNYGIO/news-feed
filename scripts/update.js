import fs from "fs";

// 📁 crea cartella se non esiste
if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

// 🔵 FEED
const FEEDS = [
  "https://feeds.feedburner.com/Speedhunters",
  "https://www.carscoops.com/feed/",
  "https://www.motor1.com/rss/",
  "https://www.autoevolution.com/rss/",
  "https://www.motorsport.com/rss/all/news/"
];

// 🔥 FETCH
async function fetchXML(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch fail");
  return await res.text();
}

// 🔥 IMMAGINE ROBUSTA (FIX VERO)
function extractImage(item) {
  let img =
    item.thumbnail ||
    item.enclosure?.link ||
    (item.content || "").match(/<img[^>]+src="([^">]+)"/)?.[1] ||
    (item.description || "").match(/<img[^>]+src="([^">]+)"/)?.[1] ||
    "";

  if (!img || img === "") {
    img = "https://via.placeholder.com/800x500";
  }

  return img;
}

// 🧠 PARSER RSS
function parse(xml, source) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  return items.map(m => {
    const b = m[1];

    const img = extractImage({
      thumbnail: b.match(/<media:thumbnail.*url="(.*?)"/)?.[1],
      enclosure: { link: b.match(/<enclosure.*url="(.*?)"/)?.[1] },
      content: b,
      description: b
    });

    return {
      title: b.match(/<title>(.*?)<\/title>/)?.[1] || "",
      link: b.match(/<link>(.*?)<\/link>/)?.[1] || "",
      img,
      date: b.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString(),
      source
    };
  });
}

// 🚀 RUN
async function run() {

  let all = [];

  for (const url of FEEDS) {
    try {
      const xml = await fetchXML(url);

      let source = "NEWS";
      if (url.includes("speedhunters")) source = "Speedhunters";
      if (url.includes("carscoops")) source = "Carscoops";
      if (url.includes("motor1")) source = "Motor1";
      if (url.includes("autoevolution")) source = "AutoEvolution";
      if (url.includes("motorsport")) source = "Motorsport";

      all.push(...parse(xml, source));

    } catch (e) {
      console.log("❌ error:", url);
    }
  }

  // sort
  all.sort((a, b) => new Date(b.date) - new Date(a.date));

  const output = all.slice(0, 50);

  fs.writeFileSync(
    "data/feed.json",
    JSON.stringify(output, null, 2)
  );

  console.log("✅ FEED BUILT:", output.length);
}

run();

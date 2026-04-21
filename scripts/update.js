const fs = require("fs");

const Parser = require("rss-parser");
const parser = new Parser();

const FEEDS = [
  "https://feeds.feedburner.com/Speedhunters",
  "https://www.stancenation.com/feed/",
  "https://www.carscoops.com/feed/",
  "https://stanceworks.com/feed/"
];

async function run() {
  let all = [];

  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url);

      feed.items.forEach(item => {
        all.push({
          title: item.title || "",
          link: item.link || "",
          img:
            item.enclosure?.url ||
            item.content?.match(/<img[^>]+src="([^">]+)"/i)?.[1] ||
            "",
          date: item.pubDate || new Date().toISOString(),
          author: item.creator || feed.title,
          source: feed.title
        });
      });

    } catch (e) {
      console.log("Feed error:", url);
    }
  }

  // ordina per data
  all.sort((a, b) => new Date(b.date) - new Date(a.date));

  // limita output
  const output = all.slice(0, 30);

  fs.writeFileSync(
    "data/feed.json",
    JSON.stringify(output, null, 2)
  );

  console.log("✅ feed.json aggiornato:", output.length);
}

run();

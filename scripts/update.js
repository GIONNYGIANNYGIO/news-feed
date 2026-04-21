async function fetchXML(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      clearTimeout(timeout);

      if (!res.ok) throw new Error("HTTP " + res.status);

      return await res.text();

    } catch (e) {
      if (i === retries - 1) {
        console.log("❌ feed failed permanently:", url);
        return null;
      }
    }
  }
}

export default async function handler(req, res) {
  try {
    const { username } = req.query;
    if (!username) {
      res.status(400).json({ error: "username required" });
      return;
    }

    const handle = String(username).trim().replace(/^@/, "");
    const url = `https://www.tiktok.com/@${handle}`;

    // User-Agent para que TikTok devuelva HTML normal
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });

    const html = await resp.text();

    // 1) Intenta extraer del JSON embebido: "avatarLarger":"..."
    let match = html.match(/"avatarLarger":"([^"]+)"/);
    // 2) Fallback: meta og:image
    if (!match) match = html.match(/property="og:image"\s+content="([^"]+)"/i);

    let avatar = match ? match[1] : null;
    if (avatar) avatar = avatar.replace(/\\u0026/g, "&");

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({ avatar });
  } catch (e) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({ avatar: null });
  }
}

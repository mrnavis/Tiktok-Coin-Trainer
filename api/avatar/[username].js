// /api/avatar/[username].js
// Devuelve el avatar de un usuario de TikTok proxyeado desde tu dominio
// Uso:
//   JSON:  /api/avatar/<usuario>
//   IMG :  /api/avatar/<usuario>?raw=1

export default async function handler(req, res) {
  try {
    const { username, raw } = req.query;
    const handle = String(username || "").trim().replace(/^@/, "");
    if (!handle) return res.status(400).json({ error: "username required" });

    if (raw === "1") {
      const avatar = await getAvatarUrl(handle);
      if (!avatar) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        return res.status(200).send(""); // vacío si no hay avatar
      }
      const imgResp = await fetch(avatar, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "Referer": "https://www.tiktok.com/",
          "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        },
      });
      const buf = Buffer.from(await imgResp.arrayBuffer());
      res.setHeader("Content-Type", imgResp.headers.get("content-type") || "image/jpeg");
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(200).send(buf);
    }

    const avatar = await getAvatarUrl(handle);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({ avatar });
  } catch (e) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ avatar: null });
  }
}

async function getAvatarUrl(handle) {
  const url = `https://www.tiktok.com/@${handle}`;
  const resp = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      "Referer": "https://www.tiktok.com/",
    },
  });
  const html = await resp.text();

  // Prueba varias rutas comunes dentro del HTML/JSON embebido
  const patterns = [
    /"avatarLarger":"([^"]+)"/,
    /"avatarMedium":"([^"]+)"/,
    /"avatarThumb":"([^"]+)"/,
    /property="og:image"\s+content="([^"]+)"/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) {
      return m[1].replace(/\\u0026/g, "&");
    }
  }
  return null;
}

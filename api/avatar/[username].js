// /api/avatar/[username].js
export default async function handler(req, res) {
  try {
    const { username, raw } = req.query;
    const handle = String(username || "").trim().replace(/^@/, "");
    if (!handle) return res.status(400).json({ error: "username required" });

    // Si piden la imagen cruda (proxy), devolvemos bytes de imagen
    if (raw === "1") {
      const avatar = await getAvatarUrl(handle);
      if (!avatar) return tinyTransparent(res);

      const imgResp = await fetch(avatar, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "Referer": "https://www.tiktok.com/",
          "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        },
        redirect: "follow",
      });

      const buf = Buffer.from(await imgResp.arrayBuffer());
      res.setHeader("Content-Type", imgResp.headers.get("content-type") || "image/jpeg");
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(200).send(buf);
    }

    // Modo JSON (opcional)
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

  const patterns = [
    /"avatarLarger":"([^"]+)"/,
    /"avatarMedium":"([^"]+)"/,
    /"avatarThumb":"([^"]+)"/,
    /property="og:image"\s+content="([^"]+)"/i,
  ];

  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return m[1].replace(/\\u0026/g, "&");
  }
  return null;
}

function tinyTransparent(res) {
  // 1x1 PNG transparente
  const b64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1pC8sAAAAASUVORK5CYII=";
  const buf = Buffer.from(b64, "base64");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=86400");
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).send(buf);
}

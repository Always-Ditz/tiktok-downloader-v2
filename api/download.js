export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url, action, downloadUrl } = req.query;

  if (action === 'proxy' && downloadUrl) {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to fetch video');

      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');

      // Membuat angka acak 4 digit
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const fileName = `tikdown_${randomId}.mp4`;

      res.setHeader('Content-Type', contentType || 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      if (contentLength) res.setHeader('Content-Length', contentLength);

      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      return res.end();
    } catch (e) {
      return res.status(500).send("Error streaming file");
    }
  }

  if (!url) return res.status(400).json({ error: "URL wajib diisi" });

  try {
    const params = new URLSearchParams({ url, hd: "1" });
    const response = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const json = await response.json();
    if (json.code !== 0) return res.status(500).json({ error: "Gagal ambil data" });

    return res.status(200).json(json.data);
  } catch (error) {
    return res.status(500).json({ error: "Server Error", details: error.message });
  }
}

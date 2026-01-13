export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url, action, downloadUrl, type } = req.query;

  // --- LOGIC PROXY STREAMING KAMU ---
  if (action === 'proxy' && downloadUrl) {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to fetch file');

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const contentLength = response.headers.get('content-length');
      
      // Penamaan file otomatis
      const ext = type === 'image' ? 'jpg' : 'mp4';
      const fileName = `tikdown_${Math.floor(1000 + Math.random() * 9000)}.${ext}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');
      if (contentLength) res.setHeader('Content-Length', contentLength);

      // STREAMING LANGSUNG (Tanpa nunggu buffer)
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value); // Kirim potongan data langsung ke user
      }
      return res.end();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // --- LOGIC METADATA TIKWM ---
  if (!url) return res.status(400).json({ error: 'URL is required' });
  try {
    const params = new URLSearchParams({ url, hd: "1" });
    const tikRes = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    const json = await tikRes.json();
    return res.status(200).json(json.data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
      }

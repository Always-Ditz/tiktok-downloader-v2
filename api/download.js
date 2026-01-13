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
      const contentType = response.headers.get('content-type');
      const buffer = await response.arrayBuffer();

      res.setHeader('Content-Type', contentType || 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="tiktok_video.mp4"');
      return res.send(Buffer.from(buffer));
    } catch (e) {
      return res.status(500).send("Error downloading file");
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

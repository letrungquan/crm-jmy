export default async function handler(req: any, res: any) {
  // Chỉ cho phép method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const accessToken = req.headers['access-token'];
    if (!accessToken) {
      return res.status(401).json({ error: "Missing access token" });
    }

    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Access-Token': accessToken as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error: any) {
    console.error("TikTok API Proxy Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}

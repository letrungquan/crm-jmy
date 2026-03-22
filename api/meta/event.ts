export default async function handler(req: any, res: any) {
  // Chỉ cho phép method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { pixelId, ...eventData } = req.body;
    if (!pixelId) {
      return res.status(400).json({ error: "Missing pixelId" });
    }

    const url = `https://graph.facebook.com/v19.0/${pixelId}/events`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error: any) {
    console.error("Meta API Proxy Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}

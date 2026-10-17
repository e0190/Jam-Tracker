export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { code, redirect_uri, refresh_token } = req.body || {};

  // Either the first sign-in (code) or getting a fresh token later (refresh_token)
  let params;
  if (refresh_token) {
    params = { grant_type: 'refresh_token', refresh_token };
  } else if (code && redirect_uri) {
    params = { grant_type: 'authorization_code', code, redirect_uri };
  } else {
    return res.status(400).json({ error: 'missing_code_or_refresh_token' });
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: new URLSearchParams(params)
    });

    const data = await response.json();
    // Pass Spotify's real status through so the page can tell when sign-in failed
    res.status(response.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'spotify_unreachable' });
  }
}

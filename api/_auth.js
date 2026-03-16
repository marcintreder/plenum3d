export async function getUserId(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
    const info = await res.json();
    if (info.error || !info.sub) return null;
    return info.sub;
  } catch {
    return null;
  }
}

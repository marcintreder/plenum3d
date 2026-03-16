import { getUserId } from './_auth.js';
import { ensureTable, getData, setData } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  await ensureTable();

  if (req.method === 'GET') {
    const value = await getData(userId, 'settings');
    return res.status(200).json(value ?? {});
  }

  if (req.method === 'PUT') {
    await setData(userId, 'settings', req.body);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

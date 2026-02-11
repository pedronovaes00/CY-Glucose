// Endpoint para listar códigos (Vercel)
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const codigos = (await kv.get('glicemia:codes')) || [];
      return res.status(200).json(codigos);
    }
    return res.status(405).json({ erro: 'Método não permitido' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno', detalhes: error.message });
  }
}

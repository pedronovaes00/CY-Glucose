// Vercel Serverless Function - Medições com Vercel KV (Persistente e GRATUITO!)
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - Listar medições
        if (req.method === 'GET') {
            const codigo = req.query.codigo;
            if (!codigo) {
                return res.status(400).json({ erro: 'Código não fornecido' });
            }

            // Verificar se o código foi registrado (suporta strings e objetos)
            const codigos = await kv.get('glicemia:codes') || [];
            const found = codigos.some(c => (typeof c === 'string') ? c === codigo : c.codigo === codigo);
            if (!found) {
                return res.status(404).json({ erro: 'Código não encontrado' });
            }

            const medicoes = await kv.get(`glicemia:${codigo}`) || [];
            return res.status(200).json(medicoes);
        }

        // POST - Salvar medição
        if (req.method === 'POST') {
            const { codigo, registrarNovo, ...medicao } = req.body;
            
            if (!codigo) {
                return res.status(400).json({ erro: 'Código não fornecido' });
            }

            // Se for código novo, registrar na lista de códigos
            if (registrarNovo) {
                const codigos = await kv.get('glicemia:codes') || [];
                const exists = codigos.some(c => (typeof c === 'string') ? c === codigo : c.codigo === codigo);
                if (!exists) {
                    codigos.push({ codigo, criadoEm: Date.now() });
                    await kv.set('glicemia:codes', codigos);
                }
            }

            // Carregar dados existentes
            const dados = await kv.get(`glicemia:${codigo}`) || [];

            if (medicao.id) {
                // Editar existente
                const index = dados.findIndex(m => m.id === medicao.id);
                if (index >= 0) {
                    dados[index] = medicao;
                } else {
                    dados.unshift(medicao);
                }
            } else {
                // Novo registro
                medicao.id = Date.now().toString();
                dados.unshift(medicao);
            }

            // Salvar no KV
            await kv.set(`glicemia:${codigo}`, dados);

            return res.status(200).json(medicao);
        }

        // DELETE - Deletar medição
        if (req.method === 'DELETE') {
            const codigo = req.query.codigo;
            const medicaoId = req.url.split('/').pop().split('?')[0];
            
            if (!codigo) {
                return res.status(404).json({ erro: 'Código não encontrado' });
            }

            // Verificar se o código existe
            const codigos = await kv.get('glicemia:codes') || [];
            if (!codigos.includes(codigo)) {
                return res.status(404).json({ erro: 'Código não encontrado' });
            }

            // Carregar e filtrar
            const dados = await kv.get(`glicemia:${codigo}`) || [];
            const dadosFiltrados = dados.filter(m => m.id !== medicaoId);
            
            // Salvar de volta
            await kv.set(`glicemia:${codigo}`, dadosFiltrados);
            
            return res.status(200).json({ sucesso: true });
        }

        return res.status(405).json({ erro: 'Método não permitido' });

    } catch (error) {
        console.error('Erro:', error);
        return res.status(500).json({ erro: 'Erro interno', detalhes: error.message });
    }
}

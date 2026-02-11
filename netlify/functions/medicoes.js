// Vercel Serverless Function - Medições com Vercel Blob (Persistente e GRATUITO!)
import { put, get, list, del } from '@vercel/blob';

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

            try {
                const blob = await get(`glicemia-${codigo}.json`);
                if (blob) {
                    const data = await blob.json();
                    return res.status(200).json(data);
                }
                return res.status(200).json([]);
            } catch (error) {
                // Arquivo não existe ainda
                return res.status(200).json([]);
            }
        }

        // POST - Salvar medição
        if (req.method === 'POST') {
            const { codigo, ...medicao } = req.body;
            
            if (!codigo) {
                return res.status(400).json({ erro: 'Código não fornecido' });
            }

            // Carregar dados existentes
            let dados = [];
            try {
                const blob = await get(`glicemia-${codigo}.json`);
                if (blob) {
                    dados = await blob.json();
                }
            } catch (error) {
                // Arquivo não existe, começar array vazio
            }

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

            // Salvar no Blob
            await put(`glicemia-${codigo}.json`, JSON.stringify(dados), {
                access: 'public',
                contentType: 'application/json',
            });

            return res.status(200).json(medicao);
        }

        // DELETE - Deletar medição
        if (req.method === 'DELETE') {
            const codigo = req.query.codigo;
            const medicaoId = req.url.split('/').pop().split('?')[0];
            
            if (!codigo) {
                return res.status(404).json({ erro: 'Código não encontrado' });
            }

            // Carregar dados
            let dados = [];
            try {
                const blob = await get(`glicemia-${codigo}.json`);
                if (blob) {
                    dados = await blob.json();
                }
            } catch (error) {
                return res.status(404).json({ erro: 'Dados não encontrados' });
            }

            // Filtrar
            const dadosFiltrados = dados.filter(m => m.id !== medicaoId);
            
            // Salvar de volta
            await put(`glicemia-${codigo}.json`, JSON.stringify(dadosFiltrados), {
                access: 'public',
                contentType: 'application/json',
            });
            
            return res.status(200).json({ sucesso: true });
        }

        return res.status(405).json({ erro: 'Método não permitido' });

    } catch (error) {
        console.error('Erro:', error);
        return res.status(500).json({ erro: 'Erro interno', detalhes: error.message });
    }
}

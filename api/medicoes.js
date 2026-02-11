// Vercel Serverless Function - Medições (KV com fallback para Blob)
import { kv } from '@vercel/kv';
import { put, get } from '@vercel/blob';

let useBlob = false;

// Tentar inicializar KV; se falhar, usar Blob como fallback
async function initStorage() {
    try {
        await kv.ping();
    } catch (e) {
        console.log('KV não disponível, usando Blob Storage como fallback');
        useBlob = true;
    }
}

async function getCodes() {
    try {
        if (useBlob) {
            try {
                const blob = await get('glicemia-codes.json');
                return blob ? await blob.json() : [];
            } catch (e) {
                return [];
            }
        }
        return await kv.get('glicemia:codes') || [];
    } catch (e) {
        useBlob = true;
        try {
            const blob = await get('glicemia-codes.json');
            return blob ? await blob.json() : [];
        } catch (e2) {
            return [];
        }
    }
}

async function setCodes(codes) {
    try {
        if (useBlob) {
            await put('glicemia-codes.json', JSON.stringify(codes), { contentType: 'application/json' });
        } else {
            await kv.set('glicemia:codes', codes);
        }
    } catch (e) {
        useBlob = true;
        await put('glicemia-codes.json', JSON.stringify(codes), { contentType: 'application/json' });
    }
}

async function getMedicoes(codigo) {
    try {
        if (useBlob) {
            try {
                const blob = await get(`glicemia-${codigo}.json`);
                return blob ? await blob.json() : [];
            } catch (e) {
                return [];
            }
        }
        return await kv.get(`glicemia:${codigo}`) || [];
    } catch (e) {
        useBlob = true;
        try {
            const blob = await get(`glicemia-${codigo}.json`);
            return blob ? await blob.json() : [];
        } catch (e2) {
            return [];
        }
    }
}

async function setMedicoes(codigo, dados) {
    try {
        if (useBlob) {
            await put(`glicemia-${codigo}.json`, JSON.stringify(dados), { contentType: 'application/json' });
        } else {
            await kv.set(`glicemia:${codigo}`, dados);
        }
    } catch (e) {
        useBlob = true;
        await put(`glicemia-${codigo}.json`, JSON.stringify(dados), { contentType: 'application/json' });
    }
}

export default async function handler(req, res) {
    await initStorage();

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
            const codigos = await getCodes();
            const found = codigos.some(c => (typeof c === 'string') ? c === codigo : c.codigo === codigo);
            if (!found) {
                return res.status(404).json({ erro: 'Código não encontrado' });
            }

            const medicoes = await getMedicoes(codigo);
            return res.status(200).json(medicoes);
        }

        // POST - Salvar medição
        if (req.method === 'POST') {
            const { codigo, registrarNovo, ...medicao } = req.body;
            
            if (!codigo) {
                return res.status(400).json({ erro: 'Código não fornecido' });
            }

            if (registrarNovo) {
                const codigos = await getCodes();
                const exists = codigos.some(c => (typeof c === 'string') ? c === codigo : c.codigo === codigo);
                if (!exists) {
                    codigos.push({ codigo, criadoEm: Date.now() });
                    await setCodes(codigos);
                }
            }

            // Carregar dados existentes
            const dados = await getMedicoes(codigo);

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

            // Salvar no storage
            await setMedicoes(codigo, dados);

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
            const codigos = await getCodes();
            const found = codigos.some(c => (typeof c === 'string') ? c === codigo : c.codigo === codigo);
            if (!found) {
                return res.status(404).json({ erro: 'Código não encontrado' });
            }

            // Carregar e filtrar
            const dados = await getMedicoes(codigo);
            const dadosFiltrados = dados.filter(m => m.id !== medicaoId);
            
            // Salvar de volta
            await setMedicoes(codigo, dadosFiltrados);
            
            return res.status(200).json({ sucesso: true });
        }

        return res.status(405).json({ erro: 'Método não permitido' });

    } catch (error) {
        console.error('Erro:', error);
        return res.status(500).json({ erro: 'Erro interno', detalhes: error.message });
    }
}

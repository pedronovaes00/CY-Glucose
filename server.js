import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import bodyParser from 'body-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const dataDir = path.join(__dirname, 'data');
async function ensureDataDir() {
  try { await fs.mkdir(dataDir); } catch (e) { }
}

async function readJSON(file) {
  try {
    const txt = await fs.readFile(path.join(dataDir, file), 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    return null;
  }
}

async function writeJSON(file, obj) {
  await fs.writeFile(path.join(dataDir, file), JSON.stringify(obj, null, 2), 'utf8');
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// GET /api/medicoes?codigo=...
app.get('/api/medicoes', async (req, res) => {
  const codigo = req.query.codigo;
  if (!codigo) return res.status(400).json({ erro: 'Código não fornecido' });

  await ensureDataDir();
  const codes = (await readJSON('glicemia-codes.json')) || [];
  const found = codes.some(c => (typeof c === 'string') ? c === codigo : c.codigo === codigo);
  if (!found) return res.status(404).json({ erro: 'Código não encontrado' });

  const dados = (await readJSON(`glicemia-${codigo}.json`)) || [];
  return res.status(200).json(dados);
});

// GET /api/codigos - listar códigos registrados
app.get('/api/codigos', async (req, res) => {
  await ensureDataDir();
  const codes = (await readJSON('glicemia-codes.json')) || [];
  return res.status(200).json(codes);
});

// POST /api/medicoes
app.post('/api/medicoes', async (req, res) => {
  const { codigo, registrarNovo, ...medicao } = req.body;
  if (!codigo) return res.status(400).json({ erro: 'Código não fornecido' });

  await ensureDataDir();
  let codes = (await readJSON('glicemia-codes.json')) || [];
  if (registrarNovo) {
    const exists = codes.some(c => (typeof c === 'string') ? c === codigo : c.codigo === codigo);
    if (!exists) {
      codes.push({ codigo, criadoEm: Date.now() });
      await writeJSON('glicemia-codes.json', codes);
    }
  }

  let dados = (await readJSON(`glicemia-${codigo}.json`)) || [];
  if (medicao.id) {
    const idx = dados.findIndex(m => m.id === medicao.id);
    if (idx >= 0) dados[idx] = medicao;
    else dados.unshift(medicao);
  } else {
    medicao.id = Date.now().toString();
    dados.unshift(medicao);
  }

  await writeJSON(`glicemia-${codigo}.json`, dados);
  return res.status(200).json(medicao);
});

// DELETE /api/medicoes/:id?codigo=...
app.delete('/api/medicoes/:id', async (req, res) => {
  const codigo = req.query.codigo;
  const medicaoId = req.params.id;
  if (!codigo) return res.status(400).json({ erro: 'Código não fornecido' });

  await ensureDataDir();
  const codes = (await readJSON('glicemia-codes.json')) || [];
  if (!codes.includes(codigo)) return res.status(404).json({ erro: 'Código não encontrado' });

  let dados = (await readJSON(`glicemia-${codigo}.json`)) || [];
  dados = dados.filter(m => m.id !== medicaoId);
  await writeJSON(`glicemia-${codigo}.json`, dados);

  return res.status(200).json({ sucesso: true });
});

app.listen(PORT, async () => {
  await ensureDataDir();
  console.log(`Servidor local rodando em http://localhost:${PORT}`);
});

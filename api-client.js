// 🔥 Cliente API - Sistema de Código Simples (SEM LOGIN!)

// ===== CONFIGURAÇÃO DA API - ESCOLHA UMA =====

// OPÇÃO 1: VERCEL (Ativo)
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// OPÇÃO 2: NETLIFY (Comentado - descomente para usar)
// const API_URL = window.location.hostname === 'localhost' 
//     ? 'http://localhost:8888/.netlify/functions' 
//     : '/.netlify/functions';

// ============================================

// ========== MEDIÇÕES ==========

async function carregarMedicoesAPI(codigo) {
    try {
        const response = await fetch(`${API_URL}/medicoes?codigo=${encodeURIComponent(codigo)}`);
        
        if (!response.ok) {
            // tentar ler corpo de erro (pode não ser JSON)
            let textoErro = 'Erro ao carregar medições';
            try {
                const t = await response.text();
                if (t) textoErro = t;
            } catch (e) {
                /* fallback */
            }
            throw new Error(textoErro);
        }

        try {
            return await response.json();
        } catch (e) {
            // resposta não é JSON
            console.error('Resposta inválida (não-JSON) ao carregar medições:', await response.text());
            return [];
        }
    } catch (error) {
        console.error('Erro ao carregar medições:', error);
        return [];
    }
}

// Validar se um código existe no backend (retorna true/false)
async function validarCodigoAPI(codigo) {
    try {
        const response = await fetch(`${API_URL}/medicoes?codigo=${encodeURIComponent(codigo)}`);
        if (response.status === 404) return false;
        if (!response.ok) {
            let textoErro = 'Erro ao validar código';
            try { textoErro = await response.text(); } catch (e) {}
            throw new Error(textoErro);
        }
        return true;
    } catch (error) {
        console.error('Erro ao validar código:', error);
        throw error;
    }
}

async function salvarMedicaoAPI(medicao, codigo, registrarNovo = false) {
    try {
        const response = await fetch(`${API_URL}/medicoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...medicao, codigo, registrarNovo })
        });
        
        if (!response.ok) {
            // tentar decodificar JSON de erro, cair para texto se necessário
            let erroObj = null;
            try {
                erroObj = await response.json();
            } catch (e) {
                const txt = await response.text();
                erroObj = { erro: txt };
            }
            throw new Error(erroObj.erro || 'Erro ao salvar medição');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro ao salvar medição:', error);
        throw error;
    }
}

async function deletarMedicaoAPI(id, codigo) {
    try {
        const response = await fetch(`${API_URL}/medicoes/${id}?codigo=${encodeURIComponent(codigo)}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Erro ao deletar medição');
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao deletar medição:', error);
        throw error;
    }
}

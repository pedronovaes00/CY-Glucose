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
        const bodyText = await response.text();
        
        if (!response.ok) {
            throw new Error(bodyText || 'Erro ao carregar medições');
        }

        try {
            return JSON.parse(bodyText);
        } catch (e) {
            console.error('Resposta inválida (não-JSON) ao carregar medições:', bodyText);
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
        const bodyText = await response.text();
        if (!response.ok) {
            throw new Error(bodyText || 'Erro ao validar código');
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
        
        const bodyText = await response.text();
        
        if (!response.ok) {
            let errorMsg = bodyText || 'Erro ao salvar medição';
            try {
                const erroObj = JSON.parse(bodyText);
                errorMsg = erroObj.erro || errorMsg;
            } catch (e) {
                // bodyText não é JSON
            }
            throw new Error(errorMsg);
        }
        
        try {
            return JSON.parse(bodyText);
        } catch (e) {
            throw new Error('Resposta inválida ao salvar medição');
        }
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

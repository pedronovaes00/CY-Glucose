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
            throw new Error('Erro ao carregar medições');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro ao carregar medições:', error);
        return [];
    }
}

async function salvarMedicaoAPI(medicao, codigo) {
    try {
        const response = await fetch(`${API_URL}/medicoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...medicao, codigo })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao salvar medição');
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

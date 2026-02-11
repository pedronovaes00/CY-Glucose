// Netlify Function - Autenticação
const crypto = require('crypto');

// Simulação simples de banco (para demonstração)
// Na produção, use FaunaDB ou outro banco
let usuarios = {};

function hashSenha(senha) {
    return crypto.createHash('sha256').update(senha).digest('hex');
}

function gerarToken() {
    return crypto.randomBytes(32).toString('hex');
}

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ erro: 'Método não permitido' })
        };
    }

    try {
        const { action, email, senha } = JSON.parse(event.body);
        const userId = email.toLowerCase();

        // REGISTRAR
        if (action === 'registrar') {
            if (usuarios[userId]) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ erro: 'Usuário já existe' })
                };
            }

            const token = gerarToken();
            usuarios[userId] = {
                email,
                senhaHash: hashSenha(senha),
                token,
                medicoes: []
            };

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ token, email })
            };
        }

        // LOGIN
        if (action === 'login') {
            const user = usuarios[userId];
            if (!user || user.senhaHash !== hashSenha(senha)) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ erro: 'Email ou senha incorretos' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ token: user.token, email: user.email })
            };
        }

        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ erro: 'Ação inválida' })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ erro: 'Erro interno' })
        };
    }
};

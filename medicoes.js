// Netlify Function - Medições com Código Simples
let dadosPorCodigo = {}; // { 'GLICE-1234': [medicoes] }

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // GET - Listar medições
        if (event.httpMethod === 'GET') {
            const codigo = event.queryStringParameters?.codigo;
            if (!codigo) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ erro: 'Código não fornecido' })
                };
            }

            const medicoes = dadosPorCodigo[codigo] || [];
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(medicoes)
            };
        }

        // POST - Salvar medição
        if (event.httpMethod === 'POST') {
            const { codigo, ...medicao } = JSON.parse(event.body);
            
            if (!codigo) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ erro: 'Código não fornecido' })
                };
            }

            if (!dadosPorCodigo[codigo]) {
                dadosPorCodigo[codigo] = [];
            }

            if (medicao.id) {
                const index = dadosPorCodigo[codigo].findIndex(m => m.id === medicao.id);
                if (index >= 0) {
                    dadosPorCodigo[codigo][index] = medicao;
                } else {
                    dadosPorCodigo[codigo].unshift(medicao);
                }
            } else {
                medicao.id = Date.now().toString();
                dadosPorCodigo[codigo].unshift(medicao);
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(medicao)
            };
        }

        // DELETE - Deletar medição
        if (event.httpMethod === 'DELETE') {
            const codigo = event.queryStringParameters?.codigo;
            const medicaoId = event.path.split('/').pop();
            
            if (!codigo || !dadosPorCodigo[codigo]) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ erro: 'Código não encontrado' })
                };
            }

            dadosPorCodigo[codigo] = dadosPorCodigo[codigo].filter(m => m.id !== medicaoId);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ sucesso: true })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ erro: 'Método não permitido' })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ erro: 'Erro interno' })
        };
    }
};

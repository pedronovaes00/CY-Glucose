const { get, put } = require('@vercel/blob');

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };

  try {
    if (event.httpMethod === 'GET') {
      let codigos = [];
      try {
        const codesBlob = await get('glicemia-codes.json');
        if (codesBlob) codigos = await codesBlob.json();
      } catch (e) {
        codigos = [];
      }
      return { statusCode: 200, headers, body: JSON.stringify(codigos) };
    }
    return { statusCode: 405, headers, body: JSON.stringify({ erro: 'Método não permitido' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ erro: 'Erro interno', detalhes: error.message }) };
  }
};

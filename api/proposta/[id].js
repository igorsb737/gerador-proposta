const { storage } = require('../../lib/storage');

module.exports = async (req, res) => {
  const {
    query: { id },
    method,
  } = req;

  // CORS simples
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') return res.status(200).end();

  try {
    if (method === 'GET') {
      const proposta = await storage.getProposta(id);
      if (!proposta) return res.status(404).json({ error: 'Proposta não encontrada' });
      return res.status(200).json(proposta);
    }

    if (method === 'PUT') {
      // Leitura robusta do corpo
      const body = await readJsonBody(req);
      const propostaAtualizada = { ...body, id };
      
      await storage.saveProposta(propostaAtualizada);
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Error in proposta API:', e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Utilitário para ler JSON do corpo
async function readJsonBody(req) {
  try {
    if (req.body && typeof req.body === 'object') return req.body;
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8') || '{}';
    return JSON.parse(raw);
  } catch (_e) {
    return {};
  }
}

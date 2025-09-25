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
      const atual = await storage.getProposta(id);
      if (!atual) return res.status(404).json({ error: 'Proposta não encontrada' });

      const body = req.body || {};
      const propostaAtualizada = { ...atual, ...body };
      await storage.saveProposta(propostaAtualizada);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Erro na rota proposta/[id]:', e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

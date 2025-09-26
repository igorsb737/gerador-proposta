const { list } = require('@vercel/blob');

module.exports = async (req, res) => {
  // CORS e headers padrão
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Lista todos os blobs sob a pasta propostas/
    const result = await list({ prefix: 'propostas/' });
    const blobs = result.blobs || [];

    // Busca e parseia cada JSON (todos são públicos)
    const proposals = [];
    for (const b of blobs) {
      try {
        const resp = await fetch(b.url);
        if (!resp.ok) continue;
        const data = await resp.json();
        proposals.push({
          id: data.id,
          cliente: data.cliente,
          data: data.data,
          plano: data.plano,
          // metadados úteis para ordenação
          _uploadedAt: b.uploadedAt || null,
          _pathname: b.pathname,
        });
      } catch (_e) {
        // ignora blobs inválidos/inesperados
      }
    }

    // Ordena por uploadedAt (desc) quando disponível
    proposals.sort((a, b) => {
      const ta = a._uploadedAt ? new Date(a._uploadedAt).getTime() : 0;
      const tb = b._uploadedAt ? new Date(b._uploadedAt).getTime() : 0;
      return tb - ta;
    });

    // Limita a 10 itens e remove campos privados
    const out = proposals.slice(0, 10).map(({ _uploadedAt, _pathname, ...rest }) => rest);

    return res.status(200).json(out);
  } catch (error) {
    console.error('Erro em /api/propostas:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

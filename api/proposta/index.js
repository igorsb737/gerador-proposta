const { v4: uuidv4 } = require('uuid');
const { storage } = require('../../lib/storage');

module.exports = async (req, res) => {
  // CORS e headers padrão
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const propostaId = uuidv4();

    // Leitura robusta do corpo (Vercel @vercel/node pode não popular req.body)
    const body = await readJsonBody(req);

    const templateProposta = {
      id: '',
      cliente: 'TREZE INCORPORADORA',
      data: new Date().toLocaleDateString('pt-BR'),
      plano: 'Prime',
      negociacoes: '2.000',
      usuarios: '5',
      whatsapp: '1',
      roi: 'R$ 50.000',
      pacoteAdicional: 'R$ 200',
      whatsappAdicional: 'R$ 350',
      garantiaMinimo: '50',
      garantiaVolume: 'R$ 1 milhões',
      garantiaRoi: '5 vezes',
      garantiaTempo: '60',
      ofertaValidade: '30/09/2025',
      implantacao: 'R$ 10.000',
      implantacaoDesconto: 'R$ 5.000',
      precoInicial: 'R$ 2.000',
      precoPlano: 'R$ 4.000',
      integracoes: 'SIENGE',
      mostrarOfertaFeira: true,
      mostrarDesconto: true,
      mostrarDescontoImplantacao: true,
      mostrarIntegracoes: true,
      semFidelidade: true,
      textoFidelidade: 'Após a implantação, não há período de fidelidade.',
      validade: '30/09/2025',
      contato: 'rodrigo@dgenny.com.br'
    };

    const novaProposta = { ...templateProposta, id: propostaId, ...body };
    await storage.saveProposta(novaProposta);
    return res.status(200).json({ success: true, id: propostaId, link: `/proposta/${propostaId}` });
  } catch (e) {
    console.error('Error creating proposta', e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Utilitário para ler JSON do corpo em funções serverless do Vercel
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

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { storage } = require('./lib/storage');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Diretório local (apenas para assets estáticos). Dados são geridos pela camada storage.

// Template padrão da proposta
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

// Rota principal - Editor
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'editor.html'));
});

// Rota para visualizar proposta específica
app.get('/proposta/:id', async (req, res) => {
    const propostaId = req.params.id;
    const exist = await storage.getProposta(propostaId);
    if (!exist) {
        return res.status(404).send('Proposta não encontrada');
    }
    res.sendFile(path.join(__dirname, 'visualizar.html'));
});

// API para criar nova proposta
app.post('/api/proposta', async (req, res) => {
    const propostaId = uuidv4();
    const novaProposta = {
        ...templateProposta,
        id: propostaId,
        ...req.body
    };
    await storage.saveProposta(novaProposta);
    res.json({ success: true, id: propostaId, link: `/proposta/${propostaId}` });
});

// API para obter proposta
app.get('/api/proposta/:id', async (req, res) => {
    const propostaId = req.params.id;
    const proposta = await storage.getProposta(propostaId);
    if (!proposta) return res.status(404).json({ error: 'Proposta não encontrada' });
    res.json(proposta);
});

// API para atualizar proposta
app.put('/api/proposta/:id', async (req, res) => {
    const propostaId = req.params.id;
    const atual = await storage.getProposta(propostaId);
    if (!atual) return res.status(404).json({ error: 'Proposta não encontrada' });
    const propostaAtualizada = { ...atual, ...req.body };
    await storage.saveProposta(propostaAtualizada);
    res.json({ success: true });
});

// API para listar todas as propostas
app.get('/api/propostas', async (req, res) => {
    const propostas = await storage.listPropostas();
    res.json(propostas);
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});

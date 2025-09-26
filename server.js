const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
console.log('=== SERVIDOR INICIANDO ===');
console.log('Importando storage...');
const { storage } = require('./lib/storage');
console.log('Storage importado com sucesso');

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

// Endpoint de teste
app.get('/api/test', (req, res) => {
    console.log('=== TESTE ENDPOINT CHAMADO ===');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        env: {
            VERCEL: process.env.VERCEL,
            NODE_ENV: process.env.NODE_ENV
        }
    });
});

// Endpoint para inicializar índice com propostas existentes
app.post('/api/init-index', async (req, res) => {
    try {
        console.log('Inicializando índice...');
        const { put, list } = require('@vercel/blob');
        
        // Buscar todas as propostas existentes
        const result = await list({ prefix: 'propostas/' });
        const blobs = result.blobs || [];
        
        console.log('Encontradas', blobs.length, 'propostas para indexar');
        
        const index = [];
        for (const blob of blobs) {
            try {
                const resp = await fetch(blob.url);
                if (resp.ok) {
                    const data = await resp.json();
                    index.push({
                        id: data.id,
                        cliente: data.cliente,
                        data: data.data,
                        plano: data.plano,
                        updatedAt: new Date().toISOString()
                    });
                }
            } catch (e) {
                console.warn('Erro ao processar blob:', blob.pathname);
            }
        }
        
        // Salvar índice
        await put('index/propostas.json', JSON.stringify(index), {
            contentType: 'application/json',
            access: 'public'
        });
        
        console.log('Índice criado com', index.length, 'propostas');
        res.json({ success: true, indexed: index.length });
        
    } catch (error) {
        console.error('Erro ao inicializar índice:', error);
        res.status(500).json({ error: error.message });
    }
});

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
    try {
        console.log('GET /api/propostas - Listando propostas...');
        const propostas = await storage.listPropostas();
        console.log('Propostas retornadas:', propostas.length, 'itens');
        res.json(propostas);
    } catch (error) {
        console.error('Erro ao listar propostas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Endpoint de debug para testar Vercel Blob diretamente
app.get('/api/debug/blobs', async (req, res) => {
    try {
        const { storage: storageModule, useBlob } = require('./lib/storage');
        
        if (!useBlob) {
            return res.json({ error: 'Blob não está ativo', useBlob, isVercel: !!process.env.VERCEL });
        }

        // Testar list() diretamente
        const { list } = require('@vercel/blob');
        const result = await list({ prefix: 'propostas/' });
        
        console.log('Debug: Raw list result:', JSON.stringify(result, null, 2));
        
        const debug = {
            useBlob,
            isVercel: !!process.env.VERCEL,
            totalBlobs: result.blobs?.length || 0,
            blobs: result.blobs?.map(b => ({
                pathname: b.pathname,
                url: b.url,
                size: b.size,
                uploadedAt: b.uploadedAt
            })) || []
        };
        
        res.json(debug);
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});

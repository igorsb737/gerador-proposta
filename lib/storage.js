const fs = require('fs');
const path = require('path');

// Detecta ambiente Vercel
const isVercel = !!process.env.VERCEL;

// Diretórios locais para dev
const DATA_DIR = path.join(process.cwd(), 'data');
const PROPOSTAS_DIR = path.join(DATA_DIR, 'propostas');

function ensureLocalDirs() {
  if (!fs.existsSync(PROPOSTAS_DIR)) {
    fs.mkdirSync(PROPOSTAS_DIR, { recursive: true });
  }
}

// Driver Filesystem (dev)
const fsDriver = {
  async saveProposta(data) {
    ensureLocalDirs();
    const p = path.join(PROPOSTAS_DIR, `${data.id}.json`);
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
    return { ok: true };
  },
  async getProposta(id) {
    ensureLocalDirs();
    const p = path.join(PROPOSTAS_DIR, `${id}.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  },
  async listPropostas() {
    ensureLocalDirs();
    const files = fs.readdirSync(PROPOSTAS_DIR).filter(f => f.endsWith('.json'));
    const items = files.map(f => JSON.parse(fs.readFileSync(path.join(PROPOSTAS_DIR, f), 'utf8')));
    return items.map(({ id, cliente, data, plano }) => ({ id, cliente, data, plano }));
  }
};

// Driver Vercel Blob (prod)
let blobDriver = null;
if (isVercel) {
  try {
    const { put, list } = require('@vercel/blob');
    blobDriver = {
      async saveProposta(data) {
        const key = `propostas/${data.id}.json`;
        console.log('Salvando no Vercel Blob:', key);
        
        try {
          const result = await put(key, JSON.stringify(data), {
            contentType: 'application/json',
            access: 'public'
          });
          console.log('Blob salvo com sucesso:', result.url);
          return { ok: true, url: result.url };
        } catch (error) {
          console.error('Erro ao salvar no Blob:', error);
          throw error;
        }
      },
      async getProposta(id) {
        const prefix = `propostas/${id}.json`;
        const result = await list({ prefix });
        const blob = result.blobs?.find(b => b.pathname === prefix);
        if (!blob) return null;
        const resp = await fetch(blob.url);
        if (!resp.ok) return null;
        return await resp.json();
      },
      async listPropostas() {
        const result = await list({ prefix: 'propostas/' });
        const blobs = result.blobs || [];
        const out = [];
        for (const b of blobs) {
          const resp = await fetch(b.url);
          if (!resp.ok) continue;
          const d = await resp.json();
          out.push({ id: d.id, cliente: d.cliente, data: d.data, plano: d.plano });
        }
        return out;
      }
    };
  } catch (e) {
    // fallback se pacote não estiver disponível (ex.: dev sem instalar)
    blobDriver = null;
  }
}

const storage = isVercel && blobDriver ? blobDriver : fsDriver;

module.exports = { storage, isVercel };

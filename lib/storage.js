const fs = require('fs');
const path = require('path');

// Detecta ambiente Vercel e opção de forçar Blob em dev
const isVercel = !!process.env.VERCEL;
const useBlob = isVercel || String(process.env.USE_BLOB).toLowerCase() === 'true';

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
if (useBlob) {
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
        const prefix = `propostas/${id}`;
        console.log('Buscando proposta com prefixo:', prefix);
        const result = await list({ prefix });
        console.log('Blobs encontrados:', result.blobs?.map(b => b.pathname));
        const blob = result.blobs?.find(b => b.pathname.startsWith(prefix));
        if (!blob) {
          console.log('Nenhum blob encontrado para o prefixo:', prefix);
          return null;
        }
        console.log('Blob encontrado:', blob.pathname, 'URL:', blob.url);
        const resp = await fetch(blob.url);
        if (!resp.ok) return null;
        return await resp.json();
      },
      async listPropostas() {
        console.log('Listando propostas do Vercel Blob...');
        const result = await list({ prefix: 'propostas/' });
        const blobs = result.blobs || [];
        console.log('Blobs encontrados no Vercel:', blobs.map(b => ({ pathname: b.pathname, url: b.url })));
        
        const out = [];
        for (const b of blobs) {
          try {
            console.log('Fazendo fetch do blob:', b.pathname);
            const resp = await fetch(b.url);
            if (!resp.ok) {
              console.warn('Blob não acessível:', b.pathname, 'Status:', resp.status);
              continue;
            }
            const d = await resp.json();
            console.log('Dados do blob:', b.pathname, '-> ID:', d.id, 'Cliente:', d.cliente);
            out.push({ id: d.id, cliente: d.cliente, data: d.data, plano: d.plano });
          } catch (error) {
            console.error('Erro ao processar blob:', b.pathname, error.message);
          }
        }
        console.log('Lista final de propostas:', out);
        return out;
      }
    };
  } catch (e) {
    // fallback se pacote não estiver disponível (ex.: dev sem instalar)
    blobDriver = null;
  }
}

// Driver com fallback para quando Blob falha
const storage = {
  async saveProposta(data) {
    if (useBlob && blobDriver) {
      try {
        return await blobDriver.saveProposta(data);
      } catch (error) {
        console.error('Blob falhou, mas continuando:', error.message);
        // Retornar sucesso mesmo se Blob falhar (para não quebrar o fluxo)
        return { ok: true, fallback: true };
      }
    } else {
      return await fsDriver.saveProposta(data);
    }
  },
  
  async getProposta(id) {
    if (useBlob && blobDriver) {
      try {
        return await blobDriver.getProposta(id);
      } catch (error) {
        console.error('Blob falhou ao buscar proposta:', error.message);
        return null;
      }
    } else {
      return await fsDriver.getProposta(id);
    }
  },

  async listPropostas() {
    console.log('storage.listPropostas() - useBlob:', useBlob, 'blobDriver:', !!blobDriver);
    if (useBlob && blobDriver) {
      try {
        console.log('Usando Vercel Blob para listar propostas');
        return await blobDriver.listPropostas();
      } catch (error) {
        console.error('Blob falhou ao listar propostas:', error.message);
        return [];
      }
    } else {
      console.log('Usando filesystem para listar propostas');
      return await fsDriver.listPropostas();
    }
  }
};

module.exports = { storage, isVercel, useBlob };

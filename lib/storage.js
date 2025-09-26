const fs = require('fs');
const path = require('path');

// Detecta ambiente Vercel e opção de forçar Blob em dev
const isVercel = !!process.env.VERCEL;
const useBlob = isVercel || String(process.env.USE_BLOB).toLowerCase() === 'true';

console.log('=== INICIALIZAÇÃO STORAGE ===');
console.log('process.env.VERCEL:', process.env.VERCEL);
console.log('process.env.USE_BLOB:', process.env.USE_BLOB);
console.log('isVercel:', isVercel);
console.log('useBlob:', useBlob);

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
console.log('Tentando inicializar blobDriver, useBlob:', useBlob);
if (useBlob) {
  try {
    console.log('Importando @vercel/blob...');
    const { put, list } = require('@vercel/blob');
    console.log('@vercel/blob importado com sucesso');
    blobDriver = {
      async saveProposta(data) {
        const key = `propostas/${data.id}.json`;
        console.log('Salvando no Vercel Blob:', key);
        
        try {
          // Salvar a proposta
          const result = await put(key, JSON.stringify(data), {
            contentType: 'application/json',
            access: 'public'
          });
          console.log('Blob salvo com sucesso:', result.url);
          
          // Atualizar índice de propostas
          await this.updatePropostasIndex(data);
          
          return { ok: true, url: result.url };
        } catch (error) {
          console.error('Erro ao salvar no Blob:', error);
          throw error;
        }
      },
      
      async updatePropostasIndex(proposta) {
        try {
          // Buscar índice atual
          let index = [];
          try {
            const indexResult = await list({ prefix: 'index/propostas.json' });
            if (indexResult.blobs && indexResult.blobs.length > 0) {
              const resp = await fetch(indexResult.blobs[0].url);
              if (resp.ok) {
                index = await resp.json();
              }
            }
          } catch (e) {
            console.log('Índice não existe ainda, criando novo');
          }
          
          // Atualizar índice
          const existingIndex = index.findIndex(p => p.id === proposta.id);
          const indexItem = {
            id: proposta.id,
            cliente: proposta.cliente,
            data: proposta.data,
            plano: proposta.plano,
            updatedAt: new Date().toISOString()
          };
          
          if (existingIndex >= 0) {
            index[existingIndex] = indexItem;
          } else {
            index.unshift(indexItem); // Adiciona no início
          }
          
          // Manter apenas os 50 mais recentes
          index = index.slice(0, 50);
          
          // Salvar índice atualizado
          await put('index/propostas.json', JSON.stringify(index), {
            contentType: 'application/json',
            access: 'public'
          });
          
          console.log('Índice de propostas atualizado');
        } catch (error) {
          console.error('Erro ao atualizar índice:', error);
          // Não falhar se o índice não puder ser atualizado
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
        try {
          console.log('=== LISTANDO PROPOSTAS VIA ÍNDICE ===');
          
          // Buscar o índice de propostas
          const indexResult = await list({ prefix: 'index/propostas.json' });
          
          if (!indexResult.blobs || indexResult.blobs.length === 0) {
            console.log('Índice não encontrado, retornando lista vazia');
            return [];
          }
          
          const indexBlob = indexResult.blobs[0];
          console.log('Índice encontrado:', indexBlob.pathname);
          
          const resp = await fetch(indexBlob.url);
          if (!resp.ok) {
            console.error('Erro ao buscar índice:', resp.status);
            return [];
          }
          
          const index = await resp.json();
          console.log('Índice carregado com', index.length, 'propostas');
          
          return index;
          
        } catch (error) {
          console.error('ERRO ao listar propostas via índice:', error.message);
          return [];
        }
      }
    };
    console.log('blobDriver criado com sucesso');
  } catch (e) {
    // fallback se pacote não estiver disponível (ex.: dev sem instalar)
    console.error('ERRO ao inicializar blobDriver:', e.message);
    blobDriver = null;
  }
} else {
  console.log('useBlob é false, não inicializando blobDriver');
}

console.log('Estado final: blobDriver =', !!blobDriver);

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

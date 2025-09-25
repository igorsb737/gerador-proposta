# Sistema de Edição de Propostas - DGenny

Sistema para criar e editar propostas comerciais com interface dividida entre painel de edição (esquerda) e visualização em tempo real (direita).

## Funcionalidades

- ✅ Interface dividida: comandos de edição à esquerda, visualização à direita
- ✅ Edição em tempo real com preview instantâneo
- ✅ Links únicos para cada proposta
- ✅ Persistência de dados em arquivos JSON
- ✅ Tooltips explicativos para cada campo
- ✅ Página de visualização otimizada para leads
- ✅ Botões de ação (imprimir, contato, compartilhar)
- ✅ Design responsivo e profissional

## Estrutura do Projeto

```
sistema-proposta/
├── server.js              # Servidor Node.js/Express
├── package.json           # Dependências do projeto
├── data/                  # Diretório para armazenar propostas
│   └── propostas/         # Arquivos JSON das propostas
├── public/                # Arquivos estáticos
│   ├── editor.html        # Interface de edição
│   ├── editor.js          # JavaScript do editor
│   └── visualizar.html    # Página de visualização para leads
└── README.md             # Este arquivo
```

## Instalação e Uso

### 1. Instalar Dependências

```bash
npm install
```

### 2. Iniciar o Servidor

```bash
npm start
```

Ou para desenvolvimento com auto-reload:

```bash
npm run dev
```

### 3. Acessar o Sistema

- **Editor**: http://localhost:3000
- **Proposta específica**: http://localhost:3000/proposta/{ID}

## Como Usar

### Criando uma Nova Proposta

1. Acesse o editor em http://localhost:3000
2. Preencha os campos no painel esquerdo
3. Visualize as mudanças em tempo real no painel direito
4. Clique em "Nova Proposta" para gerar um ID único
5. Copie o link gerado para compartilhar com o lead

### Editando uma Proposta Existente

1. Carregue uma proposta existente (via ID)
2. Modifique os campos desejados
3. Clique em "Salvar Alterações"
4. As mudanças são aplicadas imediatamente

### Campos Editáveis

**Informações Básicas:**
- Cliente
- Data da proposta

**Plano Prime:**
- Volume de negociações/mês
- Número de usuários
- Números WhatsApp
- ROI projetado
- Pacote adicional
- WhatsApp adicional

**Garantia de ROI:**
- Mínimo de compras/mês
- Volume total negociado
- ROI garantido

**Investimento:**
- Preço inicial (2 meses)
- Preço do plano (a partir 3º mês)
- Implantação original
- Implantação com desconto

**Outros Detalhes:**
- Integrações
- Validade da oferta
- Contato

## API Endpoints

- `GET /` - Interface do editor
- `GET /proposta/:id` - Visualização da proposta
- `POST /api/proposta` - Criar nova proposta
- `GET /api/proposta/:id` - Obter dados da proposta
- `PUT /api/proposta/:id` - Atualizar proposta
- `GET /api/propostas` - Listar todas as propostas

## Tecnologias Utilizadas

- **Backend**: Node.js, Express
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Tailwind CSS
- **Persistência**: Arquivos JSON
- **Fontes**: Google Fonts (Saira)

## Características Técnicas

### Design System
- **Cores principais**: 
  - Azul-celeste escuro: #07325b
  - Laranja clara: #ffbf48
  - Amarelo esbranquiçado: #f6f6e9
  - Preto fonte: #030303

### Responsividade
- Interface adaptável para desktop, tablet e mobile
- Botões de ação otimizados para dispositivos móveis
- Layout flexível com grid system

### UX/UI Features
- Tooltips explicativos em todos os campos
- Preview em tempo real
- Feedback visual para ações do usuário
- Botões de ação flutuantes na visualização
- Funcionalidade de impressão/PDF otimizada

## Próximas Melhorias

- [ ] Banco de dados (SQLite/PostgreSQL)
- [ ] Sistema de autenticação
- [ ] Templates de proposta personalizáveis
- [ ] Analytics de visualização
- [ ] Integração com CRM
- [ ] Assinatura digital
- [ ] Versionamento de propostas
- [ ] Notificações por email

## Suporte

Para dúvidas ou sugestões, entre em contato através do email configurado na proposta.

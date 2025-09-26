class EditorProposta {
    constructor() {
        this.propostaAtual = null;
        this.initEventListeners();
        this.carregarTemplate();
        // Garantir que a lista venha exclusivamente do backend
        try { localStorage.removeItem('propostas'); } catch (_) { /* ignore */ }
        
        // Aguardar DOM estar pronto para carregar lista
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.carregarListaPropostas());
        } else {
            this.carregarListaPropostas();
        }
    }

    initEventListeners() {
        // Botões principais
        document.getElementById('novaProposta').addEventListener('click', () => this.mostrarTelaEdicao());
        document.getElementById('salvarProposta').addEventListener('click', () => this.salvarProposta());
        document.getElementById('copiarLink').addEventListener('click', () => this.copiarLink());
        document.getElementById('voltarInicial').addEventListener('click', () => this.voltarTelaInicial());

        // Formulário - atualizar preview em tempo real
        const form = document.getElementById('formProposta');
        const inputs = form.querySelectorAll('input');
        
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.addEventListener('change', () => this.atualizarPreview());
            } else {
                input.addEventListener('input', () => this.atualizarPreview());
            }
        });
    }

    async carregarTemplate() {
        // Verificar se há ID na URL para carregar proposta existente
        const urlParams = new URLSearchParams(window.location.search);
        const propostaId = urlParams.get('id');
        
        if (propostaId && propostaId.length > 10) { // Validar se parece com um UUID
            await this.carregarProposta(propostaId);
            return;
        }
        
        // Se não há ID válido, limpar URL e mostrar tela inicial
        if (propostaId) {
            window.history.replaceState({}, '', '/');
        }
        
        this.voltarTelaInicial();
    }

    mostrarTelaEdicao() {
        document.getElementById('telaInicial').classList.add('hidden');
        document.getElementById('telaEdicao').classList.remove('hidden');
        
        // Se não há proposta atual, carregar dados padrão
        if (!this.propostaAtual) {
            this.carregarDadosPadrao();
        }
        
        this.atualizarPreview();
    }

    voltarTelaInicial() {
        document.getElementById('telaInicial').classList.remove('hidden');
        document.getElementById('telaEdicao').classList.add('hidden');
        document.getElementById('linkProposta').classList.add('hidden');
        
        // Limpar proposta atual e URL
        this.propostaAtual = null;
        document.getElementById('propostaId').textContent = '-';
        window.history.replaceState({}, '', '/');
        
        // Limpar preview
        const iframe = document.getElementById('previewFrame');
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write('');
        doc.close();
    }

    carregarDadosPadrao() {
        // Carregar dados padrão
        const dadosPadrao = {
            cliente: 'TREZE INCORPORADORA',
            data: new Date().toLocaleDateString('pt-BR'),
            plano: 'Prime',
            negociacoes: '2.000',
            usuarios: '5',
            whatsapp: '1',
            roi: 'R$ 50.000 / mês',
            pacoteAdicional: 'R$ 200 para 100 negociações',
            whatsappAdicional: 'R$ 350 por número',
            garantiaTempo: '60',
            garantiaMinimo: '50',
            garantiaVolume: 'R$ 1 milhões',
            garantiaRoi: '5 vezes',
            precoInicial: 'R$ 2.000',
            precoPlano: 'R$ 4.000',
            implantacao: 'R$ 10.000',
            implantacaoDesconto: 'R$ 5.000',
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

        this.preencherFormulario(dadosPadrao);
        this.atualizarPreview();
    }

    async carregarProposta(id) {
        try {
            const response = await fetch(`/api/proposta/${id}`);
            if (response.ok) {
                const proposta = await response.json();
                this.propostaAtual = proposta;
                document.getElementById('propostaId').textContent = `${proposta.cliente} - ${id}`;
                this.mostrarLinkProposta(id);
                this.preencherFormulario(proposta);
                
                // Mostrar tela de edição com a proposta carregada
                this.mostrarTelaEdicao();
            } else {
                console.warn(`Proposta ${id} não encontrada no servidor`);
                // Limpar URL inválida e voltar à tela inicial
                window.history.replaceState({}, '', '/');
                this.voltarTelaInicial();
            }
        } catch (error) {
            console.warn(`Erro ao carregar proposta ${id}:`, error.message);
            // Limpar URL inválida e voltar à tela inicial
            window.history.replaceState({}, '', '/');
            this.voltarTelaInicial();
        }
    }

    preencherFormulario(dados) {
        const form = document.getElementById('formProposta');
        Object.keys(dados).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = dados[key];
                } else {
                    input.value = dados[key];
                }
            }
        });
    }

    obterDadosFormulario() {
        const form = document.getElementById('formProposta');
        const dados = {};
        
        // Obter todos os inputs
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                dados[input.name] = input.checked;
            } else {
                dados[input.name] = input.value;
            }
        });
        
        return dados;
    }

    async salvarProposta() {
        try {
            const dados = this.obterDadosFormulario();
            
            if (!this.propostaAtual) {
                // Criar nova proposta
                const response = await fetch('/api/proposta', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dados)
                });

                const resultado = await response.json();
                
                if (resultado.success) {
                    this.propostaAtual = { ...dados, id: resultado.id };
                    document.getElementById('propostaId').textContent = `${dados.cliente} - ${resultado.id}`;
                    this.mostrarLinkProposta(resultado.id);
                    alert('Proposta criada com sucesso!');
                    this.atualizarPreview();
                    // Recarrega lista exclusivamente do backend (Blob em prod)
                    this.carregarListaPropostas();
                }
            } else {
                // Atualizar proposta existente
                const response = await fetch(`/api/proposta/${this.propostaAtual.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dados)
                });

                const resultado = await response.json();
                
                if (resultado.success) {
                    this.propostaAtual = { ...dados, id: this.propostaAtual.id };
                    alert('Proposta atualizada com sucesso!');
                    this.atualizarPreview();
                    // Recarrega lista exclusivamente do backend (Blob em prod)
                    this.carregarListaPropostas();
                }
            }
        } catch (error) {
            console.error('Erro ao salvar proposta:', error);
            alert('Erro ao salvar proposta');
        }
    }


    mostrarLinkProposta(id) {
        const linkDiv = document.getElementById('linkProposta');
        const linkInput = document.getElementById('linkInput');
        
        const link = `${window.location.origin}/proposta/${id}`;
        linkInput.value = link;
        linkDiv.classList.remove('hidden');
        
        // Atualizar URL do editor para incluir ID (para manter após refresh)
        const editorUrl = `${window.location.origin}/?id=${id}`;
        window.history.replaceState({}, '', editorUrl);
    }

    copiarLink() {
        const linkInput = document.getElementById('linkInput');
        linkInput.select();
        document.execCommand('copy');
        alert('Link copiado para a área de transferência!');
    }

    async carregarListaPropostas() {
        try {
            console.log('Frontend: Buscando propostas em /api/propostas...');
            const resp = await fetch('/api/propostas', { cache: 'no-store' });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const propostas = await resp.json();
            console.log('Frontend: Recebidas', propostas.length, 'propostas do servidor:', propostas);
            this.renderizarListaPropostas(propostas);
        } catch (error) {
            console.warn('Frontend: Erro ao buscar propostas do servidor:', error.message);
            this.renderizarListaPropostas([]);
        }
    }

    // Métodos de localStorage removidos - usando exclusivamente backend/Blob

    renderizarListaPropostas(propostas) {
        const container = document.getElementById('listaPropostas');
        
        if (!container) {
            // Tentar novamente após um tempo se o elemento não foi encontrado
            setTimeout(() => {
                const containerRetry = document.getElementById('listaPropostas');
                if (containerRetry) {
                    this.renderizarListaPropostas(propostas);
                } else {
                    console.warn('Elemento listaPropostas não encontrado após retry');
                }
            }, 500);
            return;
        }
        
        if (propostas.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-500">Nenhuma proposta encontrada</p>';
            return;
        }

        const html = propostas.map(proposta => `
            <div class="proposta-item p-2 border rounded cursor-pointer hover:bg-gray-50" data-id="${proposta.id}">
                <div class="text-sm font-medium">${proposta.cliente}</div>
                <div class="text-xs text-gray-500">${proposta.data} - ${proposta.id.substring(0, 8)}...</div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        
        // Adicionar event listeners
        container.querySelectorAll('.proposta-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                this.carregarProposta(id);
            });
        });
    }

    atualizarPreview() {
        const dados = this.obterDadosFormulario();
        const htmlProposta = this.gerarHTMLProposta(dados);
        
        const iframe = document.getElementById('previewFrame');
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(htmlProposta);
        doc.close();
    }

    gerarHTMLProposta(dados) {
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposta DGenny para ${dados.cliente}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Saira:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Saira', sans-serif;
            background-color: #f6f6e9;
            color: #030303;
        }
        .proposal-container {
            max-width: 800px;
            margin: 2rem auto;
            background-color: #ffffff;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border-radius: 8px;
            border-top: 8px solid #07325b;
        }
        .dgenny-header h1 {
            color: #07325b;
            font-weight: 700;
            font-size: 2.5rem;
        }
        .dgenny-header span {
            color: #ffbf48;
        }
        .section-title {
            color: #07325b;
            border-bottom: 2px solid #ffbf48;
            padding-bottom: 0.5rem;
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
            font-weight: 600;
        }
        .feature-item {
            display: flex;
            align-items: center;
            background-color: #f8f9fa;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            border: 1px solid #e1e1e1;
        }
        .feature-item svg {
            color: #07325b;
            margin-right: 1rem;
            flex-shrink: 0;
        }
        .price-card {
            background-color: #e1e1e1;
            border: 2px solid #07325b;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 1.5rem;
            border-radius: 0.5rem;
            text-align: center;
        }
        .price-card .strikethrough {
            text-decoration: line-through;
            color: #777;
        }
        .price-card .bonificado {
            color: #07325b;
            font-weight: 600;
        }
        .special-offer {
            background-color: rgba(255, 191, 72, 0.2);
            border: 2px solid #ffbf48;
            color: #030303;
            padding: 1.5rem;
            border-radius: 0.5rem;
        }
        .special-offer ul {
            list-style-position: inside;
        }
        .guarantee-box {
            background-color: rgba(7, 50, 91, 0.05);
            border-left: 5px solid #07325b;
            padding: 1.5rem;
        }
        @media print {
            body { background-color: #ffffff; }
            .proposal-container { box-shadow: none; margin: 0; max-width: 100%; border-top: none; }
            .no-print { display: none; }
        }
        @media (max-width: 480px) {
            .dgenny-header h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="proposal-container p-6 md:p-10">
        <header class="dgenny-header text-center mb-10">
            <h1>DGenny&nbsp;Compre<span>.AI</span></h1>
            <p class="text-gray-500">Compras Geniais</p>
        </header>
        <main>
            <section id="intro" class="mb-8">
                <p class="text-right mb-2">Florianópolis, ${dados.data}</p>
                <h2 class="text-2xl font-semibold">Proposta Comercial</h2>
                <p class="text-lg">Para: <strong>${dados.cliente}</strong></p>
            </section>
            
            <section id="body" class="mb-8">
                <p>Prezada equipe da ${dados.cliente},</p>
                <p class="mt-4">A DGenny tem como propósito revolucionar as negociações da área de suprimentos através da tecnologia, e estamos convictos de que podemos gerar um valor expressivo para a sua operação, otimizando processos e gerando economia real.</p>
                <p class="mt-4">Nossa solução foi desenhada para trazer mais eficiência, governança e inteligência para o seu processo de compras, permitindo que sua equipe foque no que realmente importa: o resultado do negócio.</p>
            </section>

            <section id="plan_details" class="mb-8">
                <h3 class="section-title">Plano ${dados.plano}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="feature-item">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3" /></svg>
                        <span>Volume de <strong>${dados.negociacoes} negociações/mês</strong></span>
                    </div>
                     <div class="feature-item">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        <span>Até <strong>${dados.usuarios} usuários</strong> incluídos</span>
                    </div>
                    <div class="feature-item">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span>Até <strong>${dados.whatsapp} número de WhatsApp</strong> para negociação</span>
                    </div>
                    <div class="feature-item">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        <span>ROI projetado de <strong>${dados.roi}</strong></span>
                    </div>
                    <div class="feature-item">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span><strong>Pacote Adicional:</strong> ${dados.pacoteAdicional}</span>
                    </div>
                    <div class="feature-item">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span><strong>WhatsApp Adicional:</strong> ${dados.whatsappAdicional}</span>
                    </div>
                </div>
            </section>

            <section id="guarantee" class="mb-8">
                <h3 class="section-title">Garantia de Retorno (ROI)</h3>
                <div class="guarantee-box rounded-lg">
                    <p class="text-lg font-semibold mb-2">Nosso compromisso com o seu resultado.</p>
                    <p>Compreendemos a importância de validar a eficácia da nossa solução. Por isso, oferecemos uma garantia de performance: se, no período de ${dados.garantiaTempo} dias de uso, a ${dados.cliente} realizar no mínimo ${dados.garantiaMinimo} compras/mês (com um volume total negociado de ${dados.garantiaVolume} no período) e não atingir um retorno de no mínimo <strong>${dados.garantiaRoi} o valor investido</strong>, abateremos o pagamento da mensalidade nos meses seguintes para compensar proporcionalmente o investimento até alcançar o ROI de ${dados.garantiaRoi}.</p>
                </div>
            </section>

            ${dados.mostrarOfertaFeira ? `
            <section id="special_offer" class="mb-8">
                <h3 class="section-title">Oferta Exclusiva: Feira Construir.Aí</h3>
                <div class="special-offer">
                    <div class="flex flex-col sm:flex-row items-center text-center sm:text-left">
                        <img 
src="https://onboarding.dgenny.com.br/wp-content/uploads/2025/09/LOGO-FEIRA-construir.ai_.png" 
class="w-[70px] h-[70px] mb-4 sm:mb-0 sm:mr-6 rounded">
                        <div>
                            <p class="font-semibold text-lg">Condições especiais para fechamento até ${dados.validade}:</p>
                        </div>
                    </div>
                    <ul class="list-disc space-y-2 mt-4 pl-4">
                        <li><strong>Implantação:</strong> O valor de ${dados.implantacao} da implantação inclui o processo de integração com o ${dados.integracoes} e treinamento do time de até ${dados.usuarios} pessoas.</li>
                        ${dados.mostrarDesconto ? `<li><strong>50% de Desconto nas 2 Primeiras Mensalidades:</strong> O investimento inicial será de apenas ${dados.precoInicial}/mês.</li>` : ''}
                        ${dados.semFidelidade ? `<li><strong>Sem Fidelidade Contratual:</strong> ${dados.textoFidelidade}</li>` : ''}
                    </ul>
                </div>
            </section>
            ` : ''}
            
            <section id="investment" class="mb-8">
                <h3 class="section-title">${dados.mostrarDesconto ? 'Investimento com Oferta Exclusiva' : 'Investimento'}</h3>
                <div class="grid grid-cols-1 ${dados.mostrarDesconto ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6">
                    ${dados.mostrarDesconto ? `
                    <div class="price-card p-6 rounded-lg text-center">
                        <h4 class="text-xl font-semibold mb-2">Inicial</h4>
                        <p class="text-3xl font-bold mb-2">${dados.precoInicial}<span class="text-lg font-normal">/mês</span></p>
                        <p class="text-gray-600 mt-auto pt-2">2 meses (50% OFF)</p>
                    </div>
                    ` : ''}
                    <div class="price-card p-6 rounded-lg text-center">
                        <h4 class="text-xl font-semibold mb-2">Plano ${dados.plano}</h4>
                        <p class="text-3xl font-bold mb-2">${dados.precoPlano}<span class="text-lg font-normal">/mês</span></p>
                        ${dados.mostrarDesconto ? 
                            `<p class="text-gray-600 mt-auto pt-2">A partir do 3º mês</p>` : 
                            `<p class="text-gray-600 mt-auto pt-2">Mensalidade</p>`
                        }
                    </div>
                    <div class="price-card p-6 rounded-lg text-center">
                        <h4 class="text-xl font-semibold mb-2">Implantação</h4>
                        ${dados.mostrarDescontoImplantacao ? 
                            `<p class="text-3xl font-bold mb-2"><span class="strikethrough">${dados.implantacao}</span> <span class="bonificado">${dados.implantacaoDesconto}</span></p>
                             <p class="text-gray-600 mt-auto pt-2">Pagamento em 2x (50% na contratação)</p>` :
                            `<p class="text-3xl font-bold mb-2">${dados.implantacao}</p>
                             <p class="text-gray-600 mt-auto pt-2">Pagamento único</p>`
                        }
                    </div>
                </div>
            </section>
            
            ${dados.semFidelidade ? `
            <section id="fidelidade" class="mb-8">
                <div class="guarantee-box rounded-lg" style="background-color: rgba(255, 191, 72, 0.1); border-left: 5px solid #ffbf48;">
                    <div class="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" style="color: #ffbf48;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 class="text-lg font-semibold" style="color: #07325b;">Sem Fidelidade Contratual</h3>
                    </div>
                    <p class="text-gray-700">${dados.textoFidelidade}</p>
                </div>
            </section>
            ` : ''}
            
            ${dados.mostrarIntegracoes ? `
            <section id="integrations" class="mb-8">
                <h3 class="section-title">Integrações</h3>
                <p>A DGenny fará a integração com o ${dados.integracoes}, garantindo um fluxo de dados contínuo e automatizado sem custos adicionais de desenvolvimento para esta conexão.</p>
            </section>
            ` : ''}

            <section id="other_plans" class="mb-8">
                <h3 class="section-title">Outras Opções de Planos</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="price-card p-6 rounded-lg text-left">
                        <h4 class="text-xl font-semibold mb-4 text-center">Plano Advanced</h4>
                        <ul class="space-y-2 text-sm mb-4 flex-grow">
                            <li><strong>Usuários:</strong> Até 10</li>
                            <li><strong>Negociações:</strong> 10.000/mês incluídas</li>
                            <li><strong>WhatsApp:</strong> 1 número incluído</li>
                            <li class="pt-2"><strong>Negociações Adicionais:</strong> R$ 200 / 100 negociações</li>
                            <li><strong>WhatsApp Adicional:</strong> R$ 350 / número</li>
                        </ul>
                        <p class="text-2xl font-bold text-center mt-auto">R$ 10.000<span class="text-lg font-normal">/mês</span></p>
                    </div>
                    <div class="price-card p-6 rounded-lg text-left">
                        <h4 class="text-xl font-semibold mb-4 text-center">Plano Premium</h4>
                        <ul class="space-y-2 text-sm mb-4 flex-grow">
                            <li><strong>Usuários:</strong> Até 20</li>
                            <li><strong>Negociações:</strong> 15.000/mês incluídas</li>
                            <li><strong>WhatsApp:</strong> 1 número incluído</li>
                            <li class="pt-2"><strong>Negociações Adicionais:</strong> R$ 200 / 100 negociações</li>
                            <li><strong>WhatsApp Adicional:</strong> R$ 350 / número</li>
                        </ul>
                        <p class="text-2xl font-bold text-center mt-auto">R$ 15.000<span class="text-lg font-normal">/mês</span></p>
                    </div>
                </div>
            </section>
            
            <section id="next-steps" class="mb-8">
                 <h3 class="section-title">Próximos Passos</h3>
                 <ol class="list-decimal list-inside space-y-3">
                    <li>Aprovação da Proposta Comercial</li>
                    <li>Análise e assinatura do Contrato (Termos de Uso)</li>
                    <li>Agendamento da kick-off de implantação</li>
                 </ol>
            </section>

            <section id="validity" class="mb-8">
                <h3 class="section-title">Validade</h3>
                <p>Esta proposta comercial, com suas condições especiais, é válida até dia ${dados.validade}.</p>
            </section>
        </main>
        
        <footer class="text-center mt-10 pt-6 border-t border-gray-200 text-sm text-gray-500">
            <p><strong>DGenny Genial Deals</strong></p>
            <p>${dados.contato} | dgenny.com.br</p>
        </footer>
    </div>
</body>
</html>`;
    }
}

// Inicializar o editor quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.editorInstance = new EditorProposta();
});

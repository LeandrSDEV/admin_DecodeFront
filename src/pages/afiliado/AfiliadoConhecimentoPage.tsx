import { useState } from "react";

type SectionId =
  | "overview"
  | "publico"
  | "modos"
  | "modulos"
  | "diferenciais"
  | "personas"
  | "faq"
  | "recursos";

const SECTIONS: { id: SectionId; label: string; icon: string }[] = [
  { id: "overview",     icon: "🧭", label: "Visão geral" },
  { id: "publico",      icon: "👥", label: "Para quem é" },
  { id: "modos",        icon: "⚙️", label: "Modos de operação" },
  { id: "modulos",      icon: "🧩", label: "Módulos do sistema" },
  { id: "diferenciais", icon: "✨", label: "Diferenciais" },
  { id: "personas",     icon: "🎯", label: "Como abordar" },
  { id: "faq",          icon: "💬", label: "Objeções comuns" },
  { id: "recursos",     icon: "🔗", label: "Recursos & links" },
];

export default function AfiliadoConhecimentoPage() {
  const [active, setActive] = useState<SectionId>("overview");

  function goTo(id: SectionId) {
    setActive(id);
    const el = document.getElementById(`sec-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="kc-page">
      <style>{KNOWLEDGE_CSS}</style>

      <header className="kc-header">
        <div>
          <div className="kc-eyebrow">📚 Central de Conhecimento</div>
          <h1>Manual do produto Decode para afiliados</h1>
          <p>
            Resumo executivo do sistema de gestão — use como referência rápida
            para apresentar o produto, tirar dúvidas e fechar vendas.
          </p>
        </div>
        <button className="kc-btn" onClick={() => window.print()}>
          🖨️ Imprimir / Salvar PDF
        </button>
      </header>

      <div className="kc-layout">
        <aside className="kc-sidebar">
          <div className="kc-sidebar-title">Sumário</div>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(s.id)}
              className={`kc-nav-item ${active === s.id ? "active" : ""}`}
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </aside>

        <div className="kc-content">
          <Section id="overview" title="O que é o Decode">
            <p>
              O <strong>Decode</strong> é um sistema de gestão completo para
              estabelecimentos de alimentação — do pequeno quiosque de açaí ao
              restaurante com mesas e delivery. Unifica <strong>PDV</strong>,{" "}
              <strong>cardápio digital</strong>, <strong>gestão de mesas</strong>,{" "}
              <strong>delivery</strong>, <strong>estoque</strong>,{" "}
              <strong>CRM de clientes</strong> e <strong>bot de WhatsApp</strong>{" "}
              num só painel, acessível pelo navegador, sem instalação.
            </p>
            <p className="kc-muted">
              Você vende o sistema e recebe comissão recorrente sobre cada
              cliente ativo. Este manual resume o que cada módulo faz, para quem
              vender e como responder às principais objeções.
            </p>
          </Section>

          <Section id="publico" title="Para quem é o Decode">
            <p>
              O sistema atende <strong>9 tipos de estabelecimento</strong>. A
              interface e as validações mudam conforme o tipo:
            </p>
            <div className="kc-grid-4">
              <EstabCard emoji="🍽️" name="Restaurante" hint="Mesa + delivery completo" />
              <EstabCard emoji="🍕" name="Pizzaria" hint="Meia-a-meia, sabores" />
              <EstabCard emoji="🍔" name="Lanchonete" hint="Balcão + delivery rápido" />
              <EstabCard emoji="🍨" name="Açaíteria" hint="Venda por peso (g/kg)" />
              <EstabCard emoji="🫓" name="Tapiocaria" hint="Recheios e variantes" />
              <EstabCard emoji="🎂" name="Confeitaria" hint="Encomendas com sinal" />
              <EstabCard emoji="🍦" name="Sorveteria" hint="Peso + bolas/casquinha" />
              <EstabCard emoji="☕" name="Cafeteria" hint="Balcão + mesa" />
              <EstabCard emoji="🏪" name="Genérico" hint="Todas as features" />
            </div>
          </Section>

          <Section id="modos" title="Modos de operação">
            <p>
              No cadastro, o estabelecimento escolhe um dos três modos. O
              painel se reorganiza automaticamente para esconder o que não é
              usado.
            </p>
            <div className="kc-grid-3">
              <ModeCard
                icon="🪑"
                title="Somente Mesa"
                desc="Atendimento presencial: garçom abre comanda, cozinha recebe na KDS, fechamento por mesa."
                fits="Restaurantes, cafeterias, pizzarias com salão"
              />
              <ModeCard
                icon="🛵"
                title="Somente Delivery"
                desc="Pedidos via WhatsApp bot, cardápio público ou PDV. Entregadores e rotas gerenciados com rastreio para o cliente."
                fits="Dark kitchens, açaí, lanchonetes delivery-first"
              />
              <ModeCard
                icon="🔁"
                title="Mesa + Delivery"
                desc="Operação híbrida. Mesmo painel trata salão e entregas em paralelo, com tickets separados por setor."
                fits="Pizzarias, restaurantes, lanchonetes completas"
              />
            </div>
          </Section>

          <Section id="modulos" title="Módulos do sistema">
            <p className="kc-muted">
              Os módulos ficam disponíveis conforme o tipo e o modo. Nem todo
              estabelecimento vê todos — o painel se adapta.
            </p>

            <ModuleGroup title="Operação do dia-a-dia">
              <Module name="PDV (Ponto de Venda)" desc="Terminal com carrinho em tempo real, variantes, modificadores, meia-a-meia e venda por peso. Integra com TEF e impressora térmica." />
              <Module name="Cozinha (KDS)" desc="Tela da cozinha. Pedidos chegam em tempo real, agrupados por setor, com impressão automática de comanda." />
              <Module name="Pedidos & Histórico" desc="Timeline de todos os pedidos com filtros por status, cliente, método de pagamento. Base dos relatórios operacionais." />
            </ModuleGroup>

            <ModuleGroup title="Mesas (dine-in)">
              <Module name="Mesas" desc="Status em tempo real (livre, em preparo, consumindo, pagamento solicitado). Suporta fusão de mesas e comandas individuais por cliente." />
            </ModuleGroup>

            <ModuleGroup title="Delivery">
              <Module name="Rotas de entrega" desc="Atribuição de entregadores, cálculo de ETA, acompanhamento da rota. Cada entrega gera link público de rastreio via WhatsApp." />
              <Module name="Áreas de entrega" desc="Mapa interativo onde o dono desenha polígonos das regiões atendidas, cada uma com taxa própria. O sistema valida endereços antes de aceitar o pedido." />
              <Module name="Rastreio público" desc="Link curto para o cliente acompanhar o entregador em tempo real — elimina ligações de 'meu pedido chegou?'." />
            </ModuleGroup>

            <ModuleGroup title="Cardápio & Catálogo">
              <Module name="Config. Cardápio" desc="CRUD de categorias, produtos, fotos, preços, disponibilidade. Ativar/desativar item sem apagar." />
              <Module name="Variantes" desc="Tamanhos/versões do mesmo produto (pizza P/M/G, açaí 300g/500g/700g). Em pizzarias, controla o número máximo de sabores." />
              <Module name="Modificadores" desc="Grupos de adicionais/opcionais com regras (mínimo, máximo, preço por item). Ex: 'escolha até 3 coberturas'." />
              <Module name="Importação de cardápio" desc="Importa menu inteiro de .txt ou .xlsx. Essencial na migração de outro sistema — argumento forte na venda." />
            </ModuleGroup>

            <ModuleGroup title="Estoque">
              <Module name="Estoque" desc="Controle de insumos, alertas de baixa, consumo automático a cada venda. Integra com variantes para debitar quantidades corretas." />
            </ModuleGroup>

            <ModuleGroup title="CRM & Relacionamento">
              <Module name="Clientes" desc="Base única de clientes com telefone, endereços, histórico de pedidos, total gasto e saldo de cashback." />
              <Module name="Broadcast" desc="Envio em massa pelo bot de WhatsApp. Segmentação por clientes inativos, ativos ou todos — ideal para promoções e reativação." />
              <Module name="Cashback / Fidelidade" desc="% configurável (padrão 5%) com prazo de validade. Acúmulo automático e abatimento no próximo pedido." />
              <Module name="Cupons & Descontos" desc="Cupons nominais ou promocionais, regras de uso e prazo. Distribuíveis por broadcast." />
              <Module name="Feedbacks" desc="Avaliações pós-pedido que ajudam o dono a identificar problemas rápido." />
            </ModuleGroup>

            <ModuleGroup title="WhatsApp Bot (diferencial)">
              <Module name="Robô / Gateway" desc="Bot oficial do WhatsApp Business. Conecta por QR code, mostra status em tempo real, reinicia sessão sem perder histórico." />
              <Module name="Atendimento automatizado" desc="Cliente faz pedido conversando com o bot: cardápio, carrinho, variantes, pagamento e rastreio — tudo sem sair do WhatsApp." />
              <Module name="Broadcast & Engajamento" desc="Campanhas para listas segmentadas, com métricas de quem abriu, quem pediu, quem sumiu." />
            </ModuleGroup>

            <ModuleGroup title="Fiscal & Pagamentos (opcional)">
              <Module name="NFC-e (Fiscal)" desc="Nota fiscal de consumidor. Opcional, ativa por configuração. Suporta regime tributário, NCM, CEST." />
              <Module name="TEF / Maquininhas" desc="Integração com maquininhas de cartão. Múltiplos provedores, sem digitar valor duas vezes." />
              <Module name="Impressoras térmicas" desc="ESC/POS serial ou rede. Roteia pedidos por setor (cozinha, sobremesa, bar)." />
            </ModuleGroup>

            <ModuleGroup title="Encomendas / Pré-pedidos">
              <Module name="Encomendas" desc="Fluxo para bolos, kits, festas: orçamento → confirmado → em produção → pronto → entregue. Com sinal e kanban. Essencial para confeitarias." />
            </ModuleGroup>

            <ModuleGroup title="Administração">
              <Module name="Usuários & Permissões" desc="Usuários com papéis distintos (caixa, garçom, cozinha, gerente). Controle granular." />
              <Module name="Configurações" desc="Dados cadastrais, horários, modo de operação, taxa de serviço, integrações." />
              <Module name="Relatórios & Dashboard" desc="Vendas por período, ticket médio, pagamentos, produtos mais vendidos. Negócio em 30 segundos." />
            </ModuleGroup>
          </Section>

          <Section id="diferenciais" title="Diferenciais para a venda">
            <ul className="kc-list-check">
              <li><strong>Bot de WhatsApp nativo</strong> — cliente faz todo o pedido dentro do WhatsApp, sem apps terceiros. Principal gerador de conversão.</li>
              <li><strong>Meia-a-meia de pizza</strong> com regras de preço corretas — funciona de verdade, diferente de sistemas que só anotam.</li>
              <li><strong>Venda por peso</strong> (g/kg, ml/L) — atende açaíterias e sorveterias sem gambiarra.</li>
              <li><strong>Áreas de entrega com mapa</strong> — o dono desenha o polígono e define a taxa. O bot cobra automaticamente.</li>
              <li><strong>Importação de cardápio</strong> — migra de outro sistema importando Excel. Tira a objeção de "dá trabalho mudar".</li>
              <li><strong>Multi-tenant nativo</strong> — cada cliente tem ambiente isolado, subdomínio próprio.</li>
              <li><strong>Acesso pelo navegador</strong> — PC, Mac, tablet ou celular. Sem instalar nada.</li>
            </ul>
          </Section>

          <Section id="personas" title="Como abordar cada tipo de cliente">
            <div className="kc-grid-2">
              <PersonaCard icon="🍕" title="Pizzaria" mode="Mesa + Delivery"
                pitch="Meia-a-meia funcional, variantes de tamanho, bot WhatsApp que recebe pedidos sem funcionário no telefone, rotas de entrega integradas." />
              <PersonaCard icon="🍨" title="Açaíteria / Sorveteria" mode="Delivery ou Mesa + Delivery"
                pitch="Venda por peso (g/kg) com balança, modificadores de cobertura, promoções por broadcast para clientes inativos." />
              <PersonaCard icon="🍽️" title="Restaurante" mode="Mesa ou Mesa + Delivery"
                pitch="Gestão de mesas em tempo real, KDS na cozinha, fechamento de comanda individual, delivery opcional." />
              <PersonaCard icon="🍔" title="Lanchonete / Hamburgueria" mode="Mesa + Delivery"
                pitch="Bot tira pedidos do caderninho, rotas de entrega, cashback para fidelizar, impressão automática." />
              <PersonaCard icon="🎂" title="Confeitaria" mode="Delivery"
                pitch="Encomendas com kanban completo e pagamento de sinal. Orçamento pelo WhatsApp e produção no painel." />
              <PersonaCard icon="☕" title="Cafeteria" mode="Mesa + Delivery"
                pitch="Balcão rápido no PDV, mesas para quem senta, cashback, broadcast de promoções matinais." />
            </div>
          </Section>

          <Section id="faq" title="Objeções comuns e respostas">
            <Faq q="Já uso outro sistema, dá trabalho trocar?"
              a="Não. O Decode importa o cardápio de um Excel pronto, a gente manda o modelo. Em meia hora o painel está no ar." />
            <Faq q="Preciso de equipamento novo?"
              a="Não. Roda no navegador — o mesmo PC ou tablet que você usa hoje serve. Maquininha, impressora e balança são opcionais e funcionam com marcas comuns." />
            <Faq q="E o WhatsApp, meu número vai ser banido?"
              a="Não. O bot usa a API oficial do WhatsApp Business. É o mesmo que grandes empresas usam." />
            <Faq q="Tem suporte?"
              a="Suporte humano no próprio WhatsApp, base de conhecimento e atualizações automáticas. Você nunca fica parado." />
            <Faq q="Quanto custa?"
              a="Depende do plano e do modo (só mesa, só delivery, ambos). A tabela está no menu 'Material de venda'." />
            <Faq q="Funciona offline?"
              a="Operação em mesa segue localmente por alguns minutos se cair internet, sincroniza quando volta. Delivery e bot precisam de internet (WhatsApp)." />
            <Faq q="Os dados do meu restaurante ficam seguros?"
              a="Sim. Cada cliente tem ambiente isolado (multi-tenant real), backup automático, criptografia em trânsito e em repouso." />
          </Section>

          <Section id="recursos" title="Recursos complementares">
            <p>Use os links abaixo em demonstrações ao vivo:</p>
            <div className="kc-grid-2">
              <LinkCard
                title="Painel Decode (produção)"
                url="https://decodeapp.portaledtech.com/?login=1"
                desc="Ambiente real para mostrar o sistema funcionando. Credenciais de demonstração no grupo de afiliados."
              />
              <LinkCard
                title="Gestão Decode (landing)"
                url="https://gestao-decode.lovable.app/"
                desc="Landing pública com preços e cadastro. Ideal para prints e apresentação."
              />
            </div>
            <div className="kc-tip">
              <strong>💡 Dica de apresentação:</strong> abra o painel em uma guia,
              o WhatsApp do bot em outra, e faça o cliente enviar uma mensagem
              para o bot enquanto acompanha o pedido chegando no painel ao vivo.
              É a demonstração que mais converte.
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: SectionId; title: string; children: React.ReactNode }) {
  return (
    <section id={`sec-${id}`} className="kc-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function EstabCard({ emoji, name, hint }: { emoji: string; name: string; hint: string }) {
  return (
    <div className="kc-estab">
      <div className="kc-estab-emoji">{emoji}</div>
      <div className="kc-estab-name">{name}</div>
      <div className="kc-estab-hint">{hint}</div>
    </div>
  );
}

function ModeCard({ icon, title, desc, fits }: { icon: string; title: string; desc: string; fits: string }) {
  return (
    <div className="kc-mode">
      <div className="kc-mode-icon">{icon}</div>
      <div className="kc-mode-title">{title}</div>
      <div className="kc-mode-desc">{desc}</div>
      <div className="kc-mode-fits"><strong>Ideal para:</strong> {fits}</div>
    </div>
  );
}

function ModuleGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="kc-module-group">
      <div className="kc-module-group-title">{title}</div>
      <div className="kc-module-list">{children}</div>
    </div>
  );
}

function Module({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="kc-module">
      <div className="kc-module-name">{name}</div>
      <div className="kc-module-desc">{desc}</div>
    </div>
  );
}

function PersonaCard({ icon, title, pitch, mode }: { icon: string; title: string; pitch: string; mode: string }) {
  return (
    <div className="kc-persona">
      <div className="kc-persona-head">
        <div className="kc-persona-icon">{icon}</div>
        <div className="kc-persona-title">{title}</div>
      </div>
      <div className="kc-persona-pitch">{pitch}</div>
      <span className="kc-persona-mode">Modo recomendado: {mode}</span>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="kc-faq">
      <summary>{q}</summary>
      <div>{a}</div>
    </details>
  );
}

function LinkCard({ title, url, desc }: { title: string; url: string; desc: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="kc-link-card">
      <div className="kc-link-title">{title} ↗</div>
      <div className="kc-link-url">{url}</div>
      <div className="kc-link-desc">{desc}</div>
    </a>
  );
}

const KNOWLEDGE_CSS = `
  .kc-page {
    color: #f1f5f9;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .kc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    flex-wrap: wrap;
    background: radial-gradient(800px 300px at 20% 0%, rgba(255,107,26,0.12), transparent 60%),
                linear-gradient(135deg, #111827, #1e293b);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    padding: 28px 30px;
  }
  .kc-eyebrow {
    display: inline-block;
    background: rgba(255,107,26,0.15);
    color: #ffb37a;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border: 1px solid rgba(255,107,26,0.25);
    margin-bottom: 10px;
  }
  .kc-header h1 {
    margin: 0 0 6px;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  .kc-header p {
    margin: 0;
    color: rgba(255,255,255,0.65);
    font-size: 14px;
    max-width: 620px;
    line-height: 1.5;
  }
  .kc-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.15);
    color: #f1f5f9;
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }
  .kc-btn:hover {
    background: rgba(255,107,26,0.14);
    border-color: rgba(255,107,26,0.35);
    color: #ffb37a;
  }

  .kc-layout {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 22px;
    align-items: start;
  }
  @media (max-width: 900px) {
    .kc-layout { grid-template-columns: 1fr; }
  }

  .kc-sidebar {
    position: sticky;
    top: 90px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .kc-sidebar-title {
    padding: 8px 12px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
  }
  .kc-nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: transparent;
    border: none;
    color: #cbd5e1;
    text-align: left;
    font-size: 13px;
    font-weight: 600;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .kc-nav-item:hover {
    background: rgba(255,255,255,0.05);
    color: #fff;
  }
  .kc-nav-item.active {
    background: rgba(255,107,26,0.14);
    color: #ffb37a;
  }

  .kc-content {
    display: grid;
    gap: 16px;
  }
  .kc-section {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 24px 26px;
  }
  .kc-section h2 {
    margin: 0 0 14px;
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  .kc-section p {
    margin: 0 0 10px;
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255,255,255,0.85);
  }
  .kc-muted { color: rgba(255,255,255,0.55) !important; }
  .kc-section strong { color: #fff; font-weight: 700; }

  .kc-grid-4, .kc-grid-3, .kc-grid-2 {
    display: grid;
    gap: 12px;
    margin-top: 14px;
  }
  .kc-grid-4 { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  .kc-grid-3 { grid-template-columns: repeat(3, 1fr); }
  .kc-grid-2 { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 760px) {
    .kc-grid-3, .kc-grid-2 { grid-template-columns: 1fr; }
  }

  .kc-estab {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 14px;
    text-align: center;
  }
  .kc-estab-emoji { font-size: 28px; }
  .kc-estab-name { font-weight: 800; margin-top: 4px; font-size: 14px; }
  .kc-estab-hint { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 2px; }

  .kc-mode {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 18px;
  }
  .kc-mode-icon { font-size: 28px; margin-bottom: 6px; }
  .kc-mode-title { font-weight: 800; font-size: 15px; margin-bottom: 8px; }
  .kc-mode-desc { font-size: 13px; line-height: 1.55; color: rgba(255,255,255,0.8); margin-bottom: 10px; }
  .kc-mode-fits { font-size: 12px; color: rgba(255,255,255,0.55); }
  .kc-mode-fits strong { color: rgba(255,255,255,0.8); }

  .kc-module-group { margin-top: 20px; }
  .kc-module-group-title {
    font-weight: 800;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #ffb37a;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255,179,122,0.2);
  }
  .kc-module-list { display: grid; gap: 10px; }
  .kc-module {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 12px 14px;
  }
  .kc-module-name { font-weight: 700; margin-bottom: 4px; font-size: 14px; }
  .kc-module-desc { font-size: 13px; line-height: 1.55; color: rgba(255,255,255,0.7); }

  .kc-list-check {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
  }
  .kc-list-check li {
    position: relative;
    padding: 10px 14px 10px 38px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    font-size: 13.5px;
    line-height: 1.55;
  }
  .kc-list-check li::before {
    content: "✓";
    position: absolute;
    left: 14px;
    top: 10px;
    color: #4ade80;
    font-weight: 900;
    font-size: 15px;
  }

  .kc-persona {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 16px;
  }
  .kc-persona-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .kc-persona-icon { font-size: 26px; }
  .kc-persona-title { font-weight: 800; font-size: 15px; }
  .kc-persona-pitch { font-size: 13px; line-height: 1.55; color: rgba(255,255,255,0.8); margin-bottom: 10px; }
  .kc-persona-mode {
    display: inline-block;
    padding: 3px 10px;
    background: rgba(255,107,26,0.12);
    color: #ffb37a;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
  }

  .kc-faq {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 10px;
  }
  .kc-faq summary {
    cursor: pointer;
    font-weight: 700;
    font-size: 14px;
    color: #fff;
    padding: 2px 0;
  }
  .kc-faq[open] summary { color: #ffb37a; }
  .kc-faq > div {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(255,255,255,0.08);
    font-size: 13px;
    line-height: 1.6;
    color: rgba(255,255,255,0.78);
  }

  .kc-link-card {
    display: block;
    text-decoration: none;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 16px;
    transition: all 0.15s;
  }
  .kc-link-card:hover {
    border-color: rgba(255,107,26,0.4);
    background: rgba(255,107,26,0.05);
    transform: translateY(-2px);
  }
  .kc-link-title { font-weight: 800; color: #ffb37a; font-size: 14px; margin-bottom: 4px; }
  .kc-link-url { font-size: 11px; color: rgba(255,255,255,0.45); word-break: break-all; margin-bottom: 8px; }
  .kc-link-desc { font-size: 13px; line-height: 1.5; color: rgba(255,255,255,0.75); }

  .kc-tip {
    margin-top: 14px;
    background: linear-gradient(135deg, rgba(255,107,26,0.1), rgba(74,222,128,0.06));
    border: 1px solid rgba(255,179,122,0.25);
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 13.5px;
    line-height: 1.6;
    color: rgba(255,255,255,0.9);
  }
  .kc-tip strong { color: #ffb37a; }
`;

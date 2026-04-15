import { useState } from "react";

// =============================================================================
// Conhecimento — Manual do Produto Decode para Afiliados
// =============================================================================
// Página de referência rápida para afiliados apresentarem o sistema de gestão
// Decode. O conteúdo reflete os módulos reais do produto (RestaurantFrontend +
// lanchonetev14.0). Para cada bloco há um espaço de screenshot — substitua pelo
// print real colocando o arquivo em `public/knowledge/<nome>.png` e ajustando
// o `src` nos componentes <Screenshot />.
// =============================================================================

type SectionId =
  | "overview"
  | "publico"
  | "modos"
  | "modulos"
  | "diferenciais"
  | "personas"
  | "faq"
  | "recursos";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "overview", label: "Visão geral" },
  { id: "publico", label: "Para quem é" },
  { id: "modos", label: "Modos de operação" },
  { id: "modulos", label: "Módulos do sistema" },
  { id: "diferenciais", label: "Diferenciais" },
  { id: "personas", label: "Como abordar" },
  { id: "faq", label: "Objeções comuns" },
  { id: "recursos", label: "Recursos & links" },
];

export default function ConhecimentoPage() {
  const [active, setActive] = useState<SectionId>("overview");

  function goTo(id: SectionId) {
    setActive(id);
    const el = document.getElementById(`sec-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Central de Conhecimento</h1>
          <div className="muted">
            Material de apoio para afiliados · resumo executivo do sistema de gestão Decode
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button className="btn-ghost" onClick={() => window.print()}>
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Nav lateral sticky */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 20,
          alignItems: "start",
        }}
        className="knowledge-layout"
      >
        <aside
          className="card"
          style={{
            position: "sticky",
            top: 80,
            padding: 12,
            display: "grid",
            gap: 4,
          }}
        >
          <div
            className="muted"
            style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", textTransform: "uppercase" }}
          >
            Sumário
          </div>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(s.id)}
              className="btn-ghost"
              style={{
                justifyContent: "flex-start",
                fontWeight: active === s.id ? 700 : 500,
                background:
                  active === s.id ? "rgba(37, 99, 235, 0.08)" : "transparent",
                color: active === s.id ? "#1f6feb" : undefined,
                padding: "8px 10px",
              }}
            >
              {s.label}
            </button>
          ))}
        </aside>

        <div style={{ display: "grid", gap: 16 }}>
          {/* ============ Visão geral ============ */}
          <Section id="overview" title="O que é o Decode">
            <p>
              O <strong>Decode</strong> é um sistema de gestão completo para
              estabelecimentos de alimentação — do pequeno quiosque de açaí ao
              restaurante com mesas e delivery. Unifica <strong>PDV</strong>,{" "}
              <strong>cardápio digital</strong>, <strong>gestão de mesas</strong>,{" "}
              <strong>delivery</strong>, <strong>estoque</strong>,{" "}
              <strong>CRM de clientes</strong> e <strong>bot de WhatsApp</strong> num
              só painel, acessível pelo navegador, sem instalação.
            </p>
            <p className="muted">
              O afiliado vende o sistema e recebe comissão recorrente sobre cada
              cliente ativo. Este manual resume o que cada módulo faz, para quem
              vender e como responder às principais dúvidas.
            </p>
            <Screenshot
              src="/knowledge/visao-geral.png"
              caption="Dashboard principal — visão executiva com vendas, status de pedidos e métodos de pagamento"
            />
          </Section>

          {/* ============ Público-alvo ============ */}
          <Section id="publico" title="Para quem é o Decode">
            <p>
              O sistema atende <strong>9 tipos de estabelecimento</strong>. A
              interface e as validações mudam conforme o tipo escolhido:
            </p>
            <div className="kpi-grid" style={{ gap: 10 }}>
              <EstabCard emoji="🍽️" name="Restaurante" hint="Completo, mesa + delivery" />
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

          {/* ============ Modos de operação ============ */}
          <Section id="modos" title="Modos de operação">
            <p>
              No momento do cadastro, o estabelecimento escolhe um dos três modos.
              O painel se reorganiza automaticamente para esconder o que não é
              usado.
            </p>
            <div className="grid-2" style={{ gap: 12 }}>
              <ModeCard
                title="Somente Mesa"
                icon="🪑"
                desc="Atendimento presencial. Garçom abre a comanda, marca o pedido, e a cozinha recebe na KDS. Fechamento por mesa, pagamento no balcão ou via TEF."
                fits="Restaurantes, cafeterias, pizzarias com salão"
              />
              <ModeCard
                title="Somente Delivery"
                icon="🛵"
                desc="Pedidos entram via WhatsApp bot, cardápio público ou PDV. Entregadores e rotas gerenciados no sistema, com link de rastreio para o cliente final."
                fits="Dark kitchens, açaí, lanchonetes delivery-first"
              />
              <ModeCard
                title="Mesa + Delivery"
                icon="🔁"
                desc="Operação híbrida. Mesmo painel trata salão e entregas em paralelo. Cozinha separa automaticamente os tickets por setor de produção."
                fits="Pizzarias completas, restaurantes, lanchonetes"
              />
            </div>
          </Section>

          {/* ============ Módulos ============ */}
          <Section id="modulos" title="Módulos do sistema">
            <p className="muted" style={{ marginBottom: 12 }}>
              Os módulos abaixo ficam disponíveis conforme o tipo e o modo de
              operação. Nem todo estabelecimento vê todos — o painel se adapta.
            </p>

            <ModuleGroup title="Operação do dia-a-dia">
              <Module
                name="PDV (Ponto de Venda)"
                desc="Terminal de venda com carrinho em tempo real, variantes, modificadores, meia-a-meia e venda por peso. Integra com TEF e impressora térmica."
                shotSrc="/knowledge/pdv.png"
                shotCaption="PDV com seleção de variantes e modificadores"
              />
              <Module
                name="Cozinha (KDS)"
                desc="Tela que a cozinha usa. Pedidos chegam em tempo real, agrupados por setor de produção, com impressão automática de comanda térmica."
                shotSrc="/knowledge/cozinha.png"
                shotCaption="Kitchen Display System com filas por setor"
              />
              <Module
                name="Pedidos & Histórico"
                desc="Todos os pedidos em uma timeline, com filtros por status, cliente, método de pagamento. Base para relatórios operacionais."
              />
            </ModuleGroup>

            <ModuleGroup title="Mesas (dine-in)">
              <Module
                name="Mesas"
                desc="Status em tempo real (livre, em preparo, consumindo, pedido pronto, pagamento solicitado). Suporta agrupamento/fusão de mesas, comandas por cliente na mesa."
                shotSrc="/knowledge/mesas.png"
                shotCaption="Mapa de mesas com status em tempo real"
              />
            </ModuleGroup>

            <ModuleGroup title="Delivery">
              <Module
                name="Rotas de entrega"
                desc="Atribuição de entregadores, cálculo de ETA, acompanhamento da rota. Cada entrega gera um link público de rastreio que o cliente recebe pelo WhatsApp."
                shotSrc="/knowledge/rotas.png"
                shotCaption="Painel de rotas com entregadores em andamento"
              />
              <Module
                name="Áreas de entrega"
                desc="Mapa interativo (Leaflet) onde o dono desenha polígonos das regiões que atende, cada um com taxa própria. O sistema valida o endereço do cliente antes de aceitar o pedido."
                shotSrc="/knowledge/areas.png"
                shotCaption="Desenho de áreas de cobertura com taxas diferenciadas"
              />
              <Module
                name="Rastreio público"
                desc="Link curto enviado ao cliente final para acompanhar o entregador em tempo real — reduz ligações de 'meu pedido chegou?'."
              />
            </ModuleGroup>

            <ModuleGroup title="Cardápio & Catálogo">
              <Module
                name="Config. Cardápio"
                desc="CRUD de categorias, produtos, fotos, preços, disponibilidade. Suporta ativar/desativar item sem apagar."
                shotSrc="/knowledge/cardapio.png"
                shotCaption="Editor de cardápio com categorias e produtos"
              />
              <Module
                name="Variantes"
                desc="Tamanhos/versões do mesmo produto com preços distintos (ex: pizza P/M/G, açaí 300g/500g/700g). Para pizzarias, controla a quantidade máxima de sabores."
              />
              <Module
                name="Modificadores"
                desc="Grupos de adicionais/opcionais com regras (obrigatório ou opcional, mínimo, máximo, preço por item). Ex: 'escolha até 3 coberturas'."
              />
              <Module
                name="Importação de cardápio"
                desc="Importa o menu inteiro de um arquivo .txt ou .xlsx. Evita o trabalho manual na migração de outro sistema — argumento forte na venda."
              />
            </ModuleGroup>

            <ModuleGroup title="Estoque">
              <Module
                name="Estoque"
                desc="Controle de insumos, alertas de estoque baixo, consumo automático a cada venda. Integra com variantes para debitar quantidades certas."
                shotSrc="/knowledge/estoque.png"
                shotCaption="Controle de estoque com alerta de baixa"
              />
            </ModuleGroup>

            <ModuleGroup title="CRM & Relacionamento">
              <Module
                name="Clientes"
                desc="Base única de clientes com telefone, endereços, histórico de pedidos, total gasto e saldo de cashback."
              />
              <Module
                name="Broadcast"
                desc="Envio em massa de mensagens pelo bot de WhatsApp. Segmenta por clientes inativos, ativos ou todos — ideal para promoções e reativação."
                shotSrc="/knowledge/broadcast.png"
                shotCaption="Disparo de broadcast segmentado pelo bot"
              />
              <Module
                name="Cashback / Fidelidade"
                desc="Porcentagem configurável (padrão 5%) com prazo de validade. O cliente acumula saldo a cada compra e abate no próximo pedido automaticamente."
              />
              <Module
                name="Descontos & Cupons"
                desc="Cupons nominais ou promocionais, com regras de uso e prazo. Distribuíveis por broadcast."
              />
              <Module
                name="Feedbacks"
                desc="Avaliações dos clientes coletadas após o pedido. Ajuda o dono a identificar problemas rápido."
              />
            </ModuleGroup>

            <ModuleGroup title="WhatsApp Bot (diferencial)">
              <Module
                name="Robô / Gateway"
                desc="Bot oficial do WhatsApp Business integrado. Conecta por QR code, mostra status em tempo real, reinicia a sessão sem perder histórico."
                shotSrc="/knowledge/robo.png"
                shotCaption="Gerenciamento do gateway WhatsApp com QR code"
              />
              <Module
                name="Atendimento automatizado"
                desc="Cliente faz pedido conversando com o bot: cardápio interativo, carrinho, escolha de variantes, pagamento e rastreio — sem sair do WhatsApp."
              />
              <Module
                name="Broadcast & Engajamento"
                desc="Dispara campanhas para listas segmentadas. Mensurável: veja quem abriu, quem pediu, quem sumiu."
              />
            </ModuleGroup>

            <ModuleGroup title="Fiscal & Pagamentos (opcional)">
              <Module
                name="NFC-e (Fiscal)"
                desc="Emissão de nota fiscal eletrônica de consumidor. Opcional — ativa por configuração. Suporta regime tributário, NCM, CEST por produto."
              />
              <Module
                name="TEF / Maquininhas"
                desc="Integração com maquininhas de cartão. Múltiplos provedores. Evita digitar valor duas vezes e erros de operação."
              />
              <Module
                name="Impressoras térmicas"
                desc="ESC/POS serial ou rede. Roteia pedidos para impressoras por setor (cozinha, sobremesa, bar)."
              />
            </ModuleGroup>

            <ModuleGroup title="Encomendas / Pré-pedidos">
              <Module
                name="Encomendas"
                desc="Fluxo completo para bolos, kits, festas: orçamento → confirmado → em produção → pronto → entregue. Suporta pagamento de sinal. Essencial para confeitarias."
                shotSrc="/knowledge/encomendas.png"
                shotCaption="Kanban de encomendas com fluxo de produção"
              />
            </ModuleGroup>

            <ModuleGroup title="Administração">
              <Module
                name="Usuários & Permissões"
                desc="Cria usuários com papéis distintos (caixa, garçom, cozinha, gerente). Controle granular de quem pode fazer o quê."
              />
              <Module
                name="Configurações do estabelecimento"
                desc="Dados cadastrais, horários, modo de operação, taxa de serviço, integrações. Toda a operação parte daqui."
              />
              <Module
                name="Relatórios & Dashboard"
                desc="Vendas por período, ticket médio, pagamentos, produtos mais vendidos. O dono vê o negócio em 30 segundos ao abrir o painel."
              />
            </ModuleGroup>
          </Section>

          {/* ============ Diferenciais ============ */}
          <Section id="diferenciais" title="Diferenciais para a venda">
            <ul className="list-check">
              <li>
                <strong>Bot de WhatsApp nativo</strong> — o cliente faz todo o
                pedido dentro do WhatsApp, sem apps terceiros. É o principal
                gerador de conversão.
              </li>
              <li>
                <strong>Meia-a-meia de pizza</strong> com regras de preço corretas
                (maior sabor, média dos sabores etc.) — funciona de verdade,
                diferente de sistemas que só anotam.
              </li>
              <li>
                <strong>Venda por peso</strong> (g/kg, ml/L) — atende açaíterias e
                sorveterias sem gambiarra.
              </li>
              <li>
                <strong>Áreas de entrega com mapa</strong> — o dono desenha o
                polígono e define a taxa. O bot cobra automaticamente.
              </li>
              <li>
                <strong>Importação de cardápio</strong> — migra de outro sistema
                importando um Excel. Tira a objeção de "dá trabalho mudar".
              </li>
              <li>
                <strong>Multi-tenant nativo</strong> — cada cliente tem ambiente
                isolado, sem compartilhamento de dados. Subdomínio próprio.
              </li>
              <li>
                <strong>Acesso pelo navegador</strong> — funciona em PC, Mac,
                tablet ou celular. Sem instalar nada.
              </li>
            </ul>
          </Section>

          {/* ============ Personas ============ */}
          <Section id="personas" title="Como abordar cada tipo de cliente">
            <div className="grid-2" style={{ gap: 12 }}>
              <PersonaCard
                title="Pizzaria"
                icon="🍕"
                pitch="Meia-a-meia funcional, variantes de tamanho, bot WhatsApp que recebe pedidos sem funcionário parado no telefone, rotas de entrega integradas."
                mode="Mesa + Delivery"
              />
              <PersonaCard
                title="Açaíteria / Sorveteria"
                icon="🍨"
                pitch="Venda por peso (g/kg) com balança integrada, modificadores de cobertura/adicional, promoções por broadcast para clientes inativos."
                mode="Delivery ou Mesa + Delivery"
              />
              <PersonaCard
                title="Restaurante"
                icon="🍽️"
                pitch="Gestão de mesas com status em tempo real, KDS na cozinha, fechamento de comanda individual por cliente, opcional de delivery quando quiser."
                mode="Mesa ou Mesa + Delivery"
              />
              <PersonaCard
                title="Lanchonete / Hamburgueria"
                icon="🍔"
                pitch="Bot de WhatsApp tira os pedidos do caderninho, rotas de entrega, cashback para fidelizar, impressão automática na cozinha."
                mode="Mesa + Delivery"
              />
              <PersonaCard
                title="Confeitaria"
                icon="🎂"
                pitch="Módulo de encomendas com kanban completo e pagamento de sinal. Cliente faz orçamento pelo WhatsApp, a produção acompanha no painel."
                mode="Delivery"
              />
              <PersonaCard
                title="Cafeteria"
                icon="☕"
                pitch="Balcão rápido no PDV, mesas para quem senta, base de clientes frequentes com cashback, broadcast de promoções matinais."
                mode="Mesa + Delivery"
              />
            </div>
          </Section>

          {/* ============ FAQ / Objeções ============ */}
          <Section id="faq" title="Objeções comuns e respostas">
            <Faq
              q="Já uso outro sistema, dá trabalho trocar?"
              a="Não. O Decode importa o cardápio de um Excel pronto, a gente manda o modelo. Em meia hora o painel está no ar."
            />
            <Faq
              q="Preciso de equipamento novo?"
              a="Não. Roda no navegador — o mesmo PC ou tablet que você usa hoje serve. Maquininha, impressora térmica e balança são opcionais e funcionam com marcas comuns do mercado."
            />
            <Faq
              q="E o WhatsApp, meu número vai ser banido?"
              a="Não. O bot usa a API oficial do WhatsApp Business. É o mesmo que grandes empresas usam."
            />
            <Faq
              q="Tem suporte?"
              a="Tem. Suporte humano no próprio WhatsApp, base de conhecimento e atualizações automáticas. Você nunca fica parado."
            />
            <Faq
              q="Quanto custa?"
              a="Depende do plano e do modo de operação (só mesa, só delivery, ambos). O afiliado tem a tabela comercial na área do afiliado."
            />
            <Faq
              q="Funciona offline?"
              a="Operação em mesa segue funcionando localmente se a internet cair por alguns minutos, sincroniza quando volta. Delivery e bot precisam de internet (dependem do WhatsApp)."
            />
            <Faq
              q="Os dados do meu restaurante ficam seguros?"
              a="Sim. Cada cliente tem ambiente isolado (multi-tenant real), backup automático, criptografia em trânsito e em repouso."
            />
          </Section>

          {/* ============ Recursos ============ */}
          <Section id="recursos" title="Recursos complementares">
            <p>
              Para aprofundar o conhecimento e fazer demonstrações ao vivo, use
              os links abaixo:
            </p>
            <div className="grid-2" style={{ gap: 12 }}>
              <LinkCard
                title="Painel Decode (produção)"
                url="https://decodeapp.portaledtech.com/?login=1"
                desc="Ambiente real para você mostrar o sistema funcionando. Peça credenciais de demonstração no grupo de afiliados."
              />
              <LinkCard
                title="Gestão Decode (demo interativa)"
                url="https://gestao-decode.lovable.app/"
                desc="Demo pública para explorar a interface sem login. Ideal para print e apresentação em PDF."
              />
            </div>
            <div
              className="card"
              style={{
                marginTop: 12,
                padding: 14,
                background: "rgba(31, 111, 235, 0.05)",
                borderLeft: "3px solid #1f6feb",
              }}
            >
              <strong>Dica de apresentação:</strong> abra o painel em uma guia, o
              WhatsApp do bot em outra, e faça o cliente enviar uma mensagem para
              o bot enquanto acompanha o pedido chegando no painel ao vivo. É a
              demonstração que mais converte.
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Subcomponentes
// =============================================================================

function Section({
  id,
  title,
  children,
}: {
  id: SectionId;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`sec-${id}`} className="card" style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 20, fontWeight: 900 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Screenshot({ src, caption }: { src: string; caption: string }) {
  return (
    <figure
      style={{
        margin: "14px 0 4px",
        border: "1px dashed rgba(0,0,0,0.18)",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fafafa",
      }}
    >
      <div
        style={{
          aspectRatio: "16 / 9",
          display: "grid",
          placeItems: "center",
          background:
            "repeating-linear-gradient(45deg, #f4f4f5, #f4f4f5 10px, #fafafa 10px, #fafafa 20px)",
          color: "#94a3b8",
          fontSize: 12,
          fontWeight: 600,
          position: "relative",
        }}
      >
        <img
          src={src}
          alt={caption}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <span style={{ position: "absolute" }}>
          📷 Substitua por <code>{src}</code>
        </span>
      </div>
      <figcaption
        style={{
          padding: "8px 12px",
          fontSize: 12,
          color: "#667085",
          background: "#fff",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {caption}
      </figcaption>
    </figure>
  );
}

function EstabCard({ emoji, name, hint }: { emoji: string; name: string; hint: string }) {
  return (
    <div className="kpi" style={{ padding: 14 }}>
      <div style={{ fontSize: 28 }}>{emoji}</div>
      <div style={{ fontWeight: 800, marginTop: 4 }}>{name}</div>
      <div className="muted" style={{ fontSize: 12 }}>
        {hint}
      </div>
    </div>
  );
}

function ModeCard({
  title,
  icon,
  desc,
  fits,
}: {
  title: string;
  icon: string;
  desc: string;
  fits: string;
}) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>{desc}</div>
      <div className="muted" style={{ fontSize: 12 }}>
        <strong>Ideal para:</strong> {fits}
      </div>
    </div>
  );
}

function ModuleGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          fontWeight: 800,
          fontSize: 14,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          color: "#1f6feb",
          marginBottom: 10,
          paddingBottom: 6,
          borderBottom: "1px solid rgba(31, 111, 235, 0.18)",
        }}
      >
        {title}
      </div>
      <div style={{ display: "grid", gap: 12 }}>{children}</div>
    </div>
  );
}

function Module({
  name,
  desc,
  shotSrc,
  shotCaption,
}: {
  name: string;
  desc: string;
  shotSrc?: string;
  shotCaption?: string;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 8,
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: "#344054" }}>{desc}</div>
      {shotSrc && shotCaption && <Screenshot src={shotSrc} caption={shotCaption} />}
    </div>
  );
}

function PersonaCard({
  title,
  icon,
  pitch,
  mode,
}: {
  title: string;
  icon: string;
  pitch: string;
  mode: string;
}) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 28 }}>{icon}</div>
        <div style={{ fontWeight: 800, fontSize: 15 }}>{title}</div>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 10 }}>{pitch}</div>
      <span className="badge blue" style={{ fontSize: 11 }}>
        Modo recomendado: {mode}
      </span>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details
      style={{
        padding: "10px 14px",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 8,
        marginBottom: 8,
        background: "#fff",
      }}
    >
      <summary style={{ fontWeight: 700, cursor: "pointer", fontSize: 14 }}>{q}</summary>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#344054" }}>{a}</div>
    </details>
  );
}

function LinkCard({ title, url, desc }: { title: string; url: string; desc: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="card"
      style={{
        padding: 14,
        textDecoration: "none",
        color: "inherit",
        display: "block",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 4, color: "#1f6feb" }}>{title} ↗</div>
      <div className="muted" style={{ fontSize: 11, marginBottom: 6, wordBreak: "break-all" }}>
        {url}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{desc}</div>
    </a>
  );
}
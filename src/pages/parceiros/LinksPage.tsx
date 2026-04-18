import { useEffect, useMemo, useState } from "react";
import { listAffiliates, type Affiliate } from "../../services/affiliateService";

/**
 * URL publica da landing onde visitantes se inscrevem como afiliado.
 * Configuravel via Vite env VITE_AFFILIATE_LANDING_URL; fallback para a Lovable.
 */
const LANDING_URL =
  (import.meta.env.VITE_AFFILIATE_LANDING_URL as string | undefined) ||
  "https://gestao-decode.lovable.app";

function onlyDigits(s: string | null | undefined) {
  return (s || "").replace(/\D+/g, "");
}

function buildWhatsAppLink(phone: string, text: string) {
  const digits = onlyDigits(phone);
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export default function LinksPage() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const portalLoginUrl = `${origin}/afiliado/entrar`;

  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [initialPassword, setInitialPassword] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    listAffiliates({ size: 200 })
      .then((r) => setAffiliates(r.content || []))
      .catch(() => setAffiliates([]));
  }, []);

  const selected = useMemo(
    () => affiliates.find((a) => a.id === selectedId) || null,
    [affiliates, selectedId],
  );

  const referralLink = useMemo(() => {
    if (!selected) return "";
    return `${LANDING_URL}/?ref=${selected.refCode}`;
  }, [selected]);

  const whatsappMessage = useMemo(() => {
    if (!selected) return "";
    const pwLine = initialPassword
      ? `\n🔑 Senha inicial: *${initialPassword}* (troque no primeiro acesso)`
      : "";
    return (
      `Olá, ${selected.name}! Bem-vindo(a) ao programa de afiliados Decode 🎉\n\n` +
      `Seu acesso já está liberado.\n\n` +
      `🌐 Portal do afiliado: ${portalLoginUrl}\n` +
      `📧 E-mail de login: ${selected.email}${pwLine}\n\n` +
      `Seu código de indicação: *${selected.refCode}*\n` +
      `Link pra compartilhar: ${referralLink}\n\n` +
      `Qualquer dúvida, é só responder aqui.`
    );
  }, [selected, initialPassword, portalLoginUrl, referralLink]);

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 18 }}>
        <div className="h2">Links úteis</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Centralize e compartilhe os links que seus afiliados precisam — portal
          de login, landing de cadastro e mensagem pronta para WhatsApp.
        </div>
      </div>

      {/* ============ LINKS GLOBAIS ============ */}
      <LinkCard
        title="🔐 Portal do Afiliado (login)"
        description="Onde o afiliado aprovado faz login para ver seu painel, comissões e leads."
        url={portalLoginUrl}
        copied={copiedKey === "login"}
        onCopy={() => copy("login", portalLoginUrl)}
      />

      <LinkCard
        title="🌐 Landing pública de cadastro"
        description="Página pública onde novos interessados se inscrevem como afiliado. Encaminhe para a admin aprovar."
        url={LANDING_URL}
        copied={copiedKey === "landing"}
        onCopy={() => copy("landing", LANDING_URL)}
      />

      {/* ============ MENSAGEM WHATSAPP ============ */}
      <div
        className="card"
        style={{
          padding: 18,
          marginBottom: 14,
          border: "1px solid rgba(37, 99, 235, 0.25)",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>
            💬 Enviar acesso por WhatsApp
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Selecione o afiliado aprovado, confirme a senha inicial e mande a
            mensagem pronta pelo WhatsApp.
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Afiliado</label>
            <select
              className="input"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">— selecione —</option>
              {affiliates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.refCode} · {a.status}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Senha inicial (opcional)</label>
            <input
              className="input"
              type="text"
              value={initialPassword}
              placeholder="Ex.: troque-agora"
              onChange={(e) => setInitialPassword(e.target.value)}
            />
            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
              Só inclua aqui se você acabou de aprovar e definiu senha. Não
              guardamos a senha — é só pra montar a mensagem.
            </div>
          </div>
        </div>

        {!selected ? (
          <div
            className="muted"
            style={{
              marginTop: 14,
              fontSize: 13,
              padding: 14,
              border: "1px dashed rgba(0,0,0,0.1)",
              borderRadius: 10,
            }}
          >
            Escolha um afiliado para gerar a mensagem.
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            <div
              className="muted"
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 6,
                fontWeight: 700,
              }}
            >
              Preview da mensagem
            </div>
            <textarea
              className="input"
              readOnly
              value={whatsappMessage}
              rows={10}
              style={{
                width: "100%",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 12.5,
                background: "rgba(0,0,0,0.02)",
              }}
            />

            <div
              className="row"
              style={{
                gap: 8,
                marginTop: 10,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="btn-ghost"
                onClick={() => copy("message", whatsappMessage)}
              >
                {copiedKey === "message" ? "✓ Copiado" : "Copiar mensagem"}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => copy("referral", referralLink)}
                title={referralLink}
              >
                {copiedKey === "referral" ? "✓ Copiado" : "Copiar link de indicação"}
              </button>
              <a
                className="btn-primary"
                href={buildWhatsAppLink(selected.whatsapp, whatsappMessage)}
                target="_blank"
                rel="noreferrer"
              >
                Abrir no WhatsApp ({selected.whatsapp || "sem telefone"})
              </a>
            </div>

            {!selected.whatsapp && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#b45309",
                  background: "rgba(251,191,36,0.12)",
                  border: "1px solid rgba(251,191,36,0.3)",
                  padding: "8px 12px",
                  borderRadius: 8,
                }}
              >
                ⚠️ Este afiliado não tem WhatsApp cadastrado. Edite o cadastro em
                Parceiros • Afiliados antes de enviar.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Card reaproveitavel para links globais
// ============================================================================
function LinkCard({
  title,
  description,
  url,
  copied,
  onCopy,
}: {
  title: string;
  description: string;
  url: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="card" style={{ padding: 18, marginBottom: 14 }}>
      <div
        className="row"
        style={{
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 280px" }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{title}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {description}
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexShrink: 0 }}>
          <button type="button" className="btn-ghost" onClick={onCopy}>
            {copied ? "✓ Copiado" : "Copiar link"}
          </button>
          <a className="btn-primary" href={url} target="_blank" rel="noreferrer">
            Abrir
          </a>
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          padding: "10px 14px",
          background: "rgba(0,0,0,0.03)",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 8,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 12.5,
          wordBreak: "break-all",
        }}
      >
        {url}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectBridge,
  disconnectBridge,
  fetchBridgeStatus,
  logoutBridge,
  newBridgeQr,
  restartBridge,
  type BridgeStatus,
} from "../../services/bridgeService";

const CONNECTED_STATUSES = new Set(["CONNECTED", "OPEN", "MAIN", "IS_LOGGED"]);
const POLL_INTERVAL_MS = 3000;

function isConnected(s?: string | null) {
  return !!s && CONNECTED_STATUSES.has(String(s).toUpperCase());
}

function connectionLabel(s?: string | null) {
  if (!s) return "—";
  const up = String(s).toUpperCase();
  if (CONNECTED_STATUSES.has(up)) return "Conectado";
  if (up === "QRCODE") return "Aguardando QR";
  if (up === "PAIRING_CODE") return "Aguardando código de pareamento";
  if (up === "CONNECTING" || up === "STARTING") return "Conectando…";
  if (up === "RESTARTING") return "Reiniciando";
  if (up === "DISCONNECTED") return "Desconectado";
  if (up === "LOGGED_OUT") return "Sessão encerrada";
  if (up === "FAILED") return "Falha";
  return String(s);
}

function connectionClass(s?: string | null) {
  if (!s) return "badge";
  const up = String(s).toUpperCase();
  if (CONNECTED_STATUSES.has(up)) return "badge ok";
  if (up === "QRCODE" || up === "PAIRING_CODE" || up === "CONNECTING" || up === "STARTING" || up === "RESTARTING") {
    return "badge amber";
  }
  return "badge bad";
}

function fmtDateTime(v: string | null | undefined) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("pt-BR");
  } catch {
    return String(v);
  }
}

export default function WhatsAppBridgePage() {
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const pollingRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchBridgeStatus();
      setStatus(data);
      setError(null);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message
        || (e as { message?: string })?.message
        || "Falha ao carregar status do bridge.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Polling: ativa quando não está conectado, pausa quando conecta.
  useEffect(() => {
    const needsPoll = !isConnected(status?.connectionStatus);
    if (!needsPoll) {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }
    if (pollingRef.current) return;
    pollingRef.current = window.setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [status?.connectionStatus, load]);

  function showInfo(msg: string) {
    setInfo(msg);
    setError(null);
    setTimeout(() => setInfo(null), 3500);
  }

  async function run(action: string, fn: () => Promise<unknown>, okMessage: string) {
    setActionBusy(action);
    setError(null);
    try {
      await fn();
      showInfo(okMessage);
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message
        || (e as { message?: string })?.message
        || "Falha na operação.";
      setError(msg);
    } finally {
      setActionBusy(null);
    }
  }

  async function onLogout() {
    if (!window.confirm(
      "Logout remove a sessão atual do WhatsApp. Para voltar a enviar mensagens, um novo QR Code precisará ser escaneado. Continuar?"
    )) {
      return;
    }
    await run("logout", logoutBridge, "Sessão encerrada. Gere um novo QR para reconectar.");
  }

  const connected = isConnected(status?.connectionStatus);
  const showQr = Boolean(status?.qrCodeDataUrl) && !connected;

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 18 }}>
        <div className="h2">WhatsApp · Número do DECODE</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Número dedicado que envia automaticamente as mensagens de aprovação e
          recusa aos afiliados. Separado das sessões dos restaurantes (tenants).
          Instance Baileys: <code>{status?.instance || "decode-admin"}</code>.
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}
      {info && (
        <div
          style={{
            background: "rgba(74,222,128,0.12)",
            border: "1px solid rgba(74,222,128,0.3)",
            color: "#4ade80",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {info}
        </div>
      )}

      {/* STATUS + AÇÕES */}
      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <div className="row" style={{ gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>
                Status da conexão
              </div>
              <div style={{ marginTop: 6 }}>
                <span className={connectionClass(status?.connectionStatus)}>
                  {loading ? "Carregando…" : connectionLabel(status?.connectionStatus)}
                </span>
              </div>
            </div>

            {status?.connectedPhone && (
              <div>
                <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>
                  Número conectado
                </div>
                <div style={{ marginTop: 6, fontWeight: 700 }}>{status.connectedPhone}</div>
              </div>
            )}

            {status?.connectedName && (
              <div>
                <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>
                  Nome
                </div>
                <div style={{ marginTop: 6 }}>{status.connectedName}</div>
              </div>
            )}
          </div>

          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => load()}
              disabled={actionBusy !== null}
            >
              Atualizar
            </button>
            {!connected && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => run("connect", connectBridge, "Bridge conectando… gere o QR se necessário.")}
                disabled={actionBusy !== null}
              >
                {actionBusy === "connect" ? "Conectando…" : "Conectar"}
              </button>
            )}
            <button
              type="button"
              className="btn-ghost"
              onClick={() => run("new-qr", newBridgeQr, "Novo QR solicitado.")}
              disabled={actionBusy !== null}
            >
              {actionBusy === "new-qr" ? "Gerando QR…" : "Gerar novo QR"}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => run("restart", restartBridge, "Sessão reiniciada.")}
              disabled={actionBusy !== null}
            >
              {actionBusy === "restart" ? "Reiniciando…" : "Reiniciar"}
            </button>
            {connected && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => run("disconnect", disconnectBridge, "Sessão desconectada (preservada).")}
                disabled={actionBusy !== null}
              >
                {actionBusy === "disconnect" ? "Desconectando…" : "Desconectar"}
              </button>
            )}
            <button
              type="button"
              className="btn-ghost"
              onClick={onLogout}
              disabled={actionBusy !== null}
              style={{ color: "#ef4444" }}
            >
              {actionBusy === "logout" ? "Saindo…" : "Logout"}
            </button>
          </div>
        </div>
      </div>

      {/* QR CODE */}
      {showQr && (
        <div className="card" style={{ padding: 18, marginBottom: 14 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>📱 Escaneie o QR com o celular</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              No celular, abra o WhatsApp → <strong>Configurações</strong> →{" "}
              <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong> e aponte a câmera para o QR abaixo.
              Expira em ~60 segundos — se passar, clique em <em>Gerar novo QR</em>.
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
            <img
              src={status!.qrCodeDataUrl!}
              alt="QR Code do WhatsApp"
              style={{
                width: 300,
                height: 300,
                background: "#fff",
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            />
          </div>
          {status?.qrExpiresAt && (
            <div className="muted" style={{ fontSize: 12, textAlign: "center" }}>
              Expira em {fmtDateTime(status.qrExpiresAt)}
            </div>
          )}
        </div>
      )}

      {/* INFO BRIDGE */}
      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>ℹ️ Detalhes do bridge</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          <Info label="Bridge" value={status?.enabled ? "Habilitado" : "Desabilitado"} />
          <Info label="Alcançável" value={status?.reachable ? "Sim" : "Não"} />
          <Info label="Instance" value={status?.instance || "—"} />
          <Info label="Bridge status" value={status?.bridgeStatus || "—"} />
          <Info label="Último evento" value={status?.lastEvent || "—"} />
          <Info label="Último evento em" value={fmtDateTime(status?.lastEventAt)} />
          <Info label="Último envio OK" value={fmtDateTime(status?.lastSuccessfulSendAt)} />
          <Info label="Falhas recentes" value={String(status?.lastSendFailureCount ?? 0)} />
        </div>
        {status?.message && (
          <div className="muted" style={{ marginTop: 12, fontSize: 12 }}>{status.message}</div>
        )}
      </div>

      {/* EXPLICAÇÃO DO USO */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
          💬 Quando este número é usado
        </div>
        <ul className="muted" style={{ fontSize: 13, lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
          <li>
            Ao <strong>aprovar um afiliado</strong> na página <em>Parceiros → Afiliados</em>, o afiliado recebe
            automaticamente uma mensagem com portal, email, senha inicial e link de indicação.
          </li>
          <li>
            Ao <strong>recusar uma solicitação de estabelecimento</strong> (<em>Parceiros → Solicitações</em>),
            o afiliado responsável recebe a mensagem com o motivo informado.
          </li>
          <li>
            As mensagens saem do número escaneado acima — <strong>não</strong> do número do restaurante
            (tenants do sistema de mesas e delivery usam sessões próprias).
          </li>
        </ul>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ marginTop: 4, fontSize: 13 }}>{value}</div>
    </div>
  );
}

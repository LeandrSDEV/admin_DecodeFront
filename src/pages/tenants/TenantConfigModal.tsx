import { useEffect, useState } from "react";
import api from "../../lib/api";
import Modal from "../../components/Modal";

type EstablishmentType =
  | "RESTAURANT"
  | "PIZZERIA"
  | "LANCHONETE"
  | "ACAITERIA"
  | "TAPIOCARIA"
  | "CONFEITARIA"
  | "SORVETERIA"
  | "CAFETERIA"
  | "GENERIC";

type OperationMode = "MESA" | "DELIVERY" | "BOTH";

type EstablishmentConfig = {
  type: EstablishmentType;
  enableWeightSale: boolean;
  enableVariants: boolean;
  enablePreOrders: boolean;
  enableDeposits: boolean;
  enableHalfHalf: boolean;
  enableModifierGroups: boolean;
  featureFlagsJson: string;
  displayName?: string;
  emoji?: string;
  shortDescription?: string;
  operationMode?: OperationMode;
  allowsMesa?: boolean;
  allowsDelivery?: boolean;
  headline?: string;
};

const TYPE_OPTIONS: { value: EstablishmentType; label: string; emoji: string }[] = [
  { value: "RESTAURANT", label: "Restaurante", emoji: "🍽️" },
  { value: "PIZZERIA", label: "Pizzaria", emoji: "🍕" },
  { value: "LANCHONETE", label: "Lanchonete", emoji: "🍔" },
  { value: "ACAITERIA", label: "Açaíteria", emoji: "🍨" },
  { value: "TAPIOCARIA", label: "Tapiocaria", emoji: "🫓" },
  { value: "CONFEITARIA", label: "Confeitaria", emoji: "🎂" },
  { value: "SORVETERIA", label: "Sorveteria", emoji: "🍦" },
  { value: "CAFETERIA", label: "Cafeteria", emoji: "☕" },
  { value: "GENERIC", label: "Genérico", emoji: "🏪" },
];

const MODE_OPTIONS: { value: OperationMode; label: string; description: string }[] = [
  { value: "MESA", label: "Somente Mesa", description: "Atendimento presencial, sem delivery" },
  { value: "DELIVERY", label: "Somente Delivery", description: "Pedidos online, sem atendimento presencial" },
  { value: "BOTH", label: "Mesa + Delivery", description: "Ambos os modos habilitados" },
];

export type SavedPlanInfo = {
  type: EstablishmentType;
  operationMode: OperationMode;
  headline?: string;
};

type Props = {
  open: boolean;
  tenantId: number | null;
  tenantName: string;
  onClose: () => void;
  onSaved?: (tenantId: number, info: SavedPlanInfo) => void;
};

export default function TenantConfigModal({ open, tenantId, tenantName, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<EstablishmentConfig | null>(null);
  const [form, setForm] = useState<{ type: EstablishmentType; mode: OperationMode }>({
    type: "GENERIC",
    mode: "BOTH",
  });

  useEffect(() => {
    if (!open || !tenantId) {
      setConfig(null);
      setError(null);
      return;
    }
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tenantId]);

  async function loadConfig() {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<EstablishmentConfig>(`/api/admin/tenants/${tenantId}/config`);
      setConfig(res.data);
      setForm({
        type: res.data.type,
        mode: res.data.operationMode || "BOTH",
      });
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (e as any)?.response?.data?.message || "Falha ao carregar configuração do tenant.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.put<EstablishmentConfig>(`/api/admin/tenants/${tenantId}/config`, {
        establishmentType: form.type,
        operationMode: form.mode,
      });
      setConfig(res.data);
      if (onSaved) {
        onSaved(tenantId, {
          type: res.data.type,
          operationMode: (res.data.operationMode as OperationMode) || form.mode,
          headline: res.data.headline,
        });
      }
      onClose();
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (e as any)?.response?.data?.message || "Falha ao salvar configuração.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const previewType = TYPE_OPTIONS.find((t) => t.value === form.type);

  // Preview das features ligadas pelo nicho selecionado. Só mostra se config
  // já carregou — as features vêm do NicheProfile no backend.
  const features = config
    ? [
        { key: "enableVariants", label: "Variantes", on: config.enableVariants },
        { key: "enableHalfHalf", label: "Meio-a-meio", on: config.enableHalfHalf },
        { key: "enableModifierGroups", label: "Modificadores", on: config.enableModifierGroups },
        { key: "enableWeightSale", label: "Venda por peso", on: config.enableWeightSale },
        { key: "enablePreOrders", label: "Pré-pedidos / Encomendas", on: config.enablePreOrders },
        { key: "enableDeposits", label: "Sinal / Depósito", on: config.enableDeposits },
      ]
    : [];

  return (
    <Modal
      open={open}
      title={`Configurar ${tenantName}`}
      subtitle="Define o nicho e o modo de operação — afeta o que o operador vê e como o bot conversa"
      onClose={() => {
        if (!saving) onClose();
      }}
      wide
      footer={
        <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
          <button className="btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={onSave} disabled={saving || loading}>
            {saving ? "Salvando..." : "Salvar configuração"}
          </button>
        </div>
      }
    >
      {loading && <div className="muted" style={{ padding: 20 }}>Carregando configuração do tenant...</div>}

      {error && <div className="alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

      {!loading && config && (
        <div className="form-grid">
          {/* Headline atual */}
          {config.headline && (
            <div
              style={{
                background: "rgba(31, 111, 235, 0.08)",
                borderLeft: "3px solid #1f6feb",
                padding: 12,
                borderRadius: 6,
                fontSize: 13,
                marginBottom: 8,
              }}
            >
              <strong>Configuração atual:</strong> {config.headline}
            </div>
          )}

          {/* Nicho */}
          <div className="form-field">
            <span className="form-label">Nicho do estabelecimento</span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 8,
              }}
            >
              {TYPE_OPTIONS.map((opt) => {
                const active = form.type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, type: opt.value }))}
                    style={{
                      padding: "12px 14px",
                      border: active ? "2px solid #1f6feb" : "1px solid #d0d5dd",
                      background: active ? "rgba(31, 111, 235, 0.05)" : "#fff",
                      borderRadius: 8,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                      fontWeight: active ? 600 : 500,
                      color: active ? "#0b1728" : "#344054",
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <span className="form-hint">
              Define vocabulário do bot, features recomendadas e validações de produtos.
            </span>
          </div>

          {/* Modo de operação */}
          <div className="form-field">
            <span className="form-label">Modo de operação</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {MODE_OPTIONS.map((opt) => {
                const active = form.mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, mode: opt.value }))}
                    style={{
                      padding: "14px 12px",
                      border: active ? "2px solid #1f6feb" : "1px solid #d0d5dd",
                      background: active ? "rgba(31, 111, 235, 0.05)" : "#fff",
                      borderRadius: 8,
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 13,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4, color: active ? "#0b1728" : "#344054" }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 11, color: "#667085" }}>{opt.description}</div>
                  </button>
                );
              })}
            </div>
            <span className="form-hint">
              Controla quais páginas aparecem no painel do operador (Mesas, Delivery, Rotas, Áreas de entrega).
            </span>
          </div>

          {/* Preview de features */}
          {features.length > 0 && (
            <div className="form-field">
              <span className="form-label">Features ativadas (automáticas pelo nicho)</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {features.map((f) => (
                  <span
                    key={f.key}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontSize: 11,
                      background: f.on ? "#d4f5d4" : "#eee",
                      color: f.on ? "#1a6b1a" : "#667085",
                      fontWeight: 600,
                    }}
                  >
                    {f.on ? "✓" : "○"} {f.label}
                  </span>
                ))}
              </div>
              <span className="form-hint">
                Derivado automaticamente do nicho escolhido — não é editável manualmente.
                {previewType && (
                  <>
                    {" "}
                    <strong>Visualizando:</strong> {previewType.emoji} {previewType.label}
                    {". "}
                    <em>As features acima refletem o nicho atualmente salvo; clicar em outro nicho atualiza depois de salvar.</em>
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

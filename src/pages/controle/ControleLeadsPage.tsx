import CrudPage from "../../components/CrudPage";

type Lead = {
  id: number | string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  source?: string;
  score?: number;
  stage?: string;
  createdAt?: string;
};

const statusBadge: Record<string, { cls: string; label: string }> = {
  NEW: { cls: "badge blue", label: "Novo" },
  CONTACTED: { cls: "badge amber", label: "Em contato" },
  QUALIFIED: { cls: "badge purple", label: "Qualificado" },
  CONVERTED: { cls: "badge ok", label: "Convertido" },
  LOST: { cls: "badge bad", label: "Perdido" },
};

const sourceBadge: Record<string, { cls: string; label: string }> = {
  WHATSAPP: { cls: "badge green", label: "WhatsApp" },
  INSTAGRAM: { cls: "badge amber", label: "Instagram" },
  REFERRAL: { cls: "badge purple", label: "Indicação" },
};

const stageBadge: Record<string, { cls: string; label: string }> = {
  WAITING: { cls: "badge", label: "Aguardando" },
  MEETING: { cls: "badge blue", label: "Reunião" },
  PROPOSAL: { cls: "badge purple", label: "Proposta" },
};

export default function ControleLeadsPage() {
  return (
    <CrudPage<Lead>
      title="Leads"
      subtitle="Gerencie os leads captados — acompanhe status, origem e score"
      endpoint="/api/leads"
      columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Nome" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Telefone" },
        {
          key: "status",
          label: "Status",
          render: (r) => {
            const b = statusBadge[r.status || ""] || { cls: "badge", label: r.status || "-" };
            return <span className={b.cls}>{b.label}</span>;
          },
        },
        {
          key: "source",
          label: "Origem",
          render: (r) => {
            const b = sourceBadge[r.source || ""] || { cls: "badge", label: r.source || "-" };
            return <span className={b.cls}>{b.label}</span>;
          },
        },
        {
          key: "stage",
          label: "Etapa",
          render: (r) => {
            const b = stageBadge[r.stage || ""] || { cls: "badge", label: r.stage || "-" };
            return <span className={b.cls}>{b.label}</span>;
          },
        },
        {
          key: "score",
          label: "Score",
          render: (r) => {
            const s = r.score ?? 0;
            const cls = s >= 70 ? "badge ok" : s >= 40 ? "badge amber" : "badge";
            return <span className={cls}>{s}</span>;
          },
        },
        { key: "createdAt", label: "Criado em" },
      ]}
      fields={[
        { name: "name", label: "Nome", required: true, minLength: 2, maxLength: 150 },
        { name: "email", label: "Email", type: "email", maxLength: 150 },
        { name: "phone", label: "Telefone", type: "tel", maxLength: 30, placeholder: "(11) 99999-9999" },
        {
          name: "source",
          label: "Origem",
          type: "select",
          options: [
            { label: "WhatsApp", value: "WHATSAPP" },
            { label: "Instagram", value: "INSTAGRAM" },
            { label: "Indicação", value: "REFERRAL" },
          ],
        },
        {
          name: "stage",
          label: "Etapa",
          type: "select",
          options: [
            { label: "Aguardando", value: "WAITING" },
            { label: "Reunião", value: "MEETING" },
            { label: "Proposta", value: "PROPOSAL" },
          ],
        },
        { name: "score", label: "Score (0-100)", type: "number", min: 0, max: 100, placeholder: "0" },
      ]}
    />
  );
}

import CrudPage from "../../components/CrudPage";

type Interaction = {
  id: number | string;
  contactName?: string;
  channel?: string;
  city?: string;
  status?: string;
  leadId?: number | string;
  createdAt?: string;
};

const channelBadge: Record<string, { cls: string; label: string }> = {
  WHATSAPP: { cls: "badge green", label: "WhatsApp" },
  INSTAGRAM: { cls: "badge amber", label: "Instagram" },
  EMAIL: { cls: "badge blue", label: "Email" },
};

const statusBadge: Record<string, { cls: string; label: string }> = {
  WAITING: { cls: "badge amber", label: "Aguardando" },
  ANSWERED: { cls: "badge ok", label: "Respondido" },
  NO_RESPONSE: { cls: "badge bad", label: "Sem resposta" },
};

export default function ControleInteracoesPage() {
  return (
    <CrudPage<Interaction>
      title="Interações"
      subtitle="Histórico de interações com contatos por canal"
      endpoint="/api/interactions"
      columns={[
        { key: "id", label: "ID" },
        { key: "contactName", label: "Contato" },
        {
          key: "channel",
          label: "Canal",
          render: (r) => {
            const b = channelBadge[r.channel || ""] || { cls: "badge", label: r.channel || "-" };
            return <span className={b.cls}>{b.label}</span>;
          },
        },
        { key: "city", label: "Cidade" },
        {
          key: "status",
          label: "Status",
          render: (r) => {
            const b = statusBadge[r.status || ""] || { cls: "badge", label: r.status || "-" };
            return <span className={b.cls}>{b.label}</span>;
          },
        },
        { key: "leadId", label: "Lead ID" },
        { key: "createdAt", label: "Criado em" },
      ]}
      fields={[
        { name: "contactName", label: "Nome do contato", required: true, minLength: 2, maxLength: 150 },
        {
          name: "channel",
          label: "Canal",
          type: "select",
          options: [
            { label: "WhatsApp", value: "WHATSAPP" },
            { label: "Instagram", value: "INSTAGRAM" },
            { label: "Email", value: "EMAIL" },
          ],
        },
        { name: "city", label: "Cidade", required: true, minLength: 2, maxLength: 120 },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Aguardando", value: "WAITING" },
            { label: "Respondido", value: "ANSWERED" },
            { label: "Sem resposta", value: "NO_RESPONSE" },
          ],
        },
        { name: "leadId", label: "ID do Lead", type: "text", placeholder: "UUID do lead (opcional)" },
      ]}
    />
  );
}

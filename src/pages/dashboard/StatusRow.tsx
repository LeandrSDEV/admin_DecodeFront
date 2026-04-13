type DashboardSummary = {
  applicationStatus: string;
  monitoredSiteStatus: string;
  incidentsOpen: number;
  lastCheckAt: string;
  message: string;
};

type Props = {
  summary: DashboardSummary | null;
};

export default function StatusRow({ summary }: Props) {
  return (
    <div className="status-row">
      <div className="status">
        <div className="status-label">Aplicação</div>
        <div className="status-value ok">{summary?.applicationStatus ?? "-"}</div>
      </div>
      <div className="status">
        <div className="status-label">Sites parceiros</div>
        <div className="status-value warn">{summary?.monitoredSiteStatus ?? "-"}</div>
      </div>
      <div className="status">
        <div className="status-label">Incidentes</div>
        <div className="status-value danger">{summary?.incidentsOpen ?? 0}</div>
      </div>
      <div className="status">
        <div className="status-label">Última checagem</div>
        <div className="status-value">
          {summary?.lastCheckAt
            ? new Date(summary.lastCheckAt).toLocaleString("pt-BR")
            : "-"}
        </div>
      </div>
    </div>
  );
}

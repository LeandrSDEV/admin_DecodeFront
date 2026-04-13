import { useEffect, useMemo, useState, useRef } from "react";
import api from "../../lib/api";
import Modal from "../../components/Modal";
import LineAreaChart, { type LinePoint } from "../../components/charts/LineAreaChart";
import BarChart from "../../components/charts/BarChart";
import {
  IconRefresh,
  IconTrash,
  IconPencil,
  IconPower,
  IconGlobe,
  IconClock,
  IconPlus,
} from "../../components/ui/Icons";

type SiteStatus = "OK" | "SLOW" | "DOWN";

type MonitoredSite = {
  id: string;
  code: string;
  name: string;
  url: string;
  enabled: boolean;
  status: SiteStatus;
  uptime30d: number;
  lastCheckAt?: string | null;
  rttMs?: number | null;
  slowThresholdMs?: number | null;
  timeoutMs?: number | null;
};

type SiteCheck = {
  id: string;
  checkedAt: string;
  status: SiteStatus;
  rttMs: number;
  httpStatus?: number | null;
  dnsMs?: number | null;
  tlsMs?: number | null;
  ttfbMs?: number | null;
  bytesRead?: number | null;
  resolvedIp?: string | null;
  finalUrl?: string | null;
  redirectsCount?: number | null;
  sslValidTo?: string | null;
  sslDaysLeft?: number | null;
  metricsEndpoint?: string | null;
  metricsJson?: string | null;
  errorMessage?: string | null;
};

type Incident = {
  id: string;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt?: string | null;
  message?: string | null;
  lastCheckId?: string | null;
};

type SystemOverview = {
  cpuLoad: number;
  memUsedBytes: number;
  memTotalBytes: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  uptimeSeconds: number;
  sampledAt: string;
};

type SystemSample = {
  id: string;
  sampledAt: string;
  cpuLoad: number;
  memUsedBytes: number;
  memTotalBytes: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  uptimeSeconds: number;
};

function fmtDT(v?: string | null) {
  if (!v) return "-";
  return new Date(v).toLocaleString("pt-BR");
}

function bytes(n?: number | null) {
  if (!n && n !== 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let x = n;
  let i = 0;
  while (x >= 1024 && i < units.length - 1) { x /= 1024; i++; }
  return `${x.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function pct(n?: number | null) {
  if (n == null || Number.isNaN(n)) return "-";
  return `${n.toFixed(1)}%`;
}

function badgeClass(status: SiteStatus) {
  if (status === "OK") return "badge ok";
  if (status === "SLOW") return "badge warn";
  return "badge bad";
}

function ms(v?: number | null) {
  if (v == null) return "-";
  return `${v} ms`;
}

function toTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function safeParseMetricsJson(raw?: string | null): any | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export default function MonitoramentoPage() {
  const [sites, setSites] = useState<MonitoredSite[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checks, setChecks] = useState<SiteCheck[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [system, setSystem] = useState<SystemOverview | null>(null);
  const [systemSamples, setSystemSamples] = useState<SystemSample[]>([]);

  const [q, setQ] = useState("");
  const [quickUrl, setQuickUrl] = useState("");
  const [quickName, setQuickName] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const refreshRef = useRef<number | null>(null);

  // Edit site modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", url: "", slowThresholdMs: "500", timeoutMs: "10000" });

  const selected = useMemo(
    () => sites.find((s) => s.id === selectedId) ?? null,
    [sites, selectedId]
  );

  function showSuccess(msg: string) {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 3000);
  }

  async function loadSites() {
    const res = await api.get<MonitoredSite[]>("/api/monitoring/sites", {
      params: q ? { q } : undefined,
    });
    setSites(res.data || []);
    if (!selectedId && res.data?.length) setSelectedId(res.data[0].id);
  }

  async function loadSystem() {
    const [ov, smp] = await Promise.all([
      api.get<SystemOverview>("/api/monitoring/system/overview"),
      api.get<SystemSample[]>("/api/monitoring/system/samples", { params: { hours: 24 } }),
    ]);
    setSystem(ov.data);
    setSystemSamples(smp.data || []);
  }

  async function loadDetails(siteId: string) {
    setLoadingDetails(true);
    try {
      const [c, i] = await Promise.all([
        api.get<SiteCheck[]>(`/api/monitoring/sites/${siteId}/checks`, { params: { hours: 24 } }),
        api.get<Incident[]>(`/api/monitoring/sites/${siteId}/incidents`, { params: { days: 30 } }),
      ]);
      setChecks(c.data || []);
      setIncidents(i.data || []);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function quickAdd() {
    if (!quickUrl.trim()) return;
    setError(null);
    try {
      await api.post("/api/monitoring/sites/quick", {
        url: quickUrl.trim(),
        name: quickName.trim() || undefined,
      });
      setQuickUrl("");
      setQuickName("");
      showSuccess("Site adicionado com sucesso.");
      await loadSites();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Erro ao cadastrar.");
    }
  }

  async function runCheckNow() {
    if (!selected) return;
    await api.post(`/api/monitoring/sites/${selected.id}/check`);
    showSuccess("Check executado.");
    await loadSites();
    await loadDetails(selected.id);
  }

  async function deleteSite() {
    if (!selected) return;
    const ok = window.confirm(`Remover "${selected.name}" do monitoramento?`);
    if (!ok) return;
    try {
      await api.delete(`/api/monitoring/sites/${selected.id}`);
      showSuccess("Site removido.");
      setSelectedId(null);
      setChecks([]);
      setIncidents([]);
      await loadSites();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Erro ao deletar site.");
    }
  }

  async function toggleEnabled() {
    if (!selected) return;
    try {
      await api.put(`/api/monitoring/sites/${selected.id}`, {
        enabled: !selected.enabled,
      });
      showSuccess(selected.enabled ? "Monitoramento pausado." : "Monitoramento ativado.");
      await loadSites();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Erro ao alterar status.");
    }
  }

  function openEdit() {
    if (!selected) return;
    setEditForm({
      name: selected.name || "",
      url: selected.url || "",
      slowThresholdMs: String(selected.slowThresholdMs ?? 500),
      timeoutMs: String(selected.timeoutMs ?? 10000),
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!selected) return;
    try {
      await api.put(`/api/monitoring/sites/${selected.id}`, {
        name: editForm.name.trim(),
        url: editForm.url.trim(),
        slowThresholdMs: Number(editForm.slowThresholdMs) || 500,
        timeoutMs: Number(editForm.timeoutMs) || 10000,
      });
      setEditOpen(false);
      showSuccess("Configuração atualizada.");
      await loadSites();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Erro ao salvar.");
    }
  }

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadSites(), loadSystem()]);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Erro ao carregar.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load details when selecting site
  useEffect(() => {
    if (!selectedId) return;
    loadDetails(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Auto-refresh
  useEffect(() => {
    if (refreshRef.current) clearInterval(refreshRef.current);
    if (!autoRefresh) return;
    refreshRef.current = window.setInterval(async () => {
      try {
        await loadSites();
        await loadSystem();
        if (selectedId) await loadDetails(selectedId);
      } catch { /* silent */ }
    }, refreshInterval * 1000);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshInterval, selectedId]);

  const rttSeries: LinePoint[] = useMemo(() => {
    const pts = checks.map((c) => ({ label: toTimeLabel(c.checkedAt), value: c.rttMs }));
    return pts.length ? pts : [{ label: "-", value: 0 }];
  }, [checks]);

  const ttfbSeries: LinePoint[] = useMemo(() => {
    const pts = checks.filter((c) => typeof c.ttfbMs === "number").map((c) => ({ label: toTimeLabel(c.checkedAt), value: c.ttfbMs || 0 }));
    return pts.length ? pts : [{ label: "-", value: 0 }];
  }, [checks]);

  const statusCounts = useMemo(() => {
    let ok = 0, slow = 0, down = 0;
    for (const c of checks) {
      if (c.status === "OK") ok++;
      else if (c.status === "SLOW") slow++;
      else down++;
    }
    return [
      { label: "OK", value: ok },
      { label: "SLOW", value: slow },
      { label: "DOWN", value: down },
    ];
  }, [checks]);

  const sysCpuSeries: LinePoint[] = useMemo(() => {
    const pts = systemSamples.map((s) => ({ label: toTimeLabel(s.sampledAt), value: s.cpuLoad }));
    return pts.length ? pts : [{ label: "-", value: 0 }];
  }, [systemSamples]);

  const sysMemSeries: LinePoint[] = useMemo(() => {
    const pts = systemSamples.map((s) => ({
      label: toTimeLabel(s.sampledAt),
      value: Math.round((s.memUsedBytes / Math.max(1, s.memTotalBytes)) * 100),
    }));
    return pts.length ? pts : [{ label: "-", value: 0 }];
  }, [systemSamples]);

  const latestCheck = checks.length ? checks[checks.length - 1] : null;
  const metricsObj = safeParseMetricsJson(latestCheck?.metricsJson);
  const openIncidents = incidents.filter((i) => i.status === "OPEN").length;

  if (loading) {
    return <div className="page"><div className="card muted">Carregando...</div></div>;
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <h1>Monitoramento</h1>
          <p className="muted">
            Uptime, latência, SSL e métricas — {sites.length} site{sites.length !== 1 ? "s" : ""} monitorado{sites.length !== 1 ? "s" : ""}
            {openIncidents > 0 && <span style={{ color: "var(--red)", fontWeight: 700 }}> — {openIncidents} incidente{openIncidents !== 1 ? "s" : ""} aberto{openIncidents !== 1 ? "s" : ""}</span>}
          </p>
        </div>

        <div className="row gap" style={{ flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <label className="toggle">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              <div className="toggle-track"><div className="toggle-thumb" /></div>
            </label>
            <span className="muted">Auto</span>
            <select
              className="input"
              style={{ width: 70, padding: "4px 6px", fontSize: 12 }}
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
            </select>
          </div>
          <button className="btn-ghost" onClick={() => { loadSites(); loadSystem(); if (selectedId) loadDetails(selectedId); }}>
            <IconRefresh size={15} /> Atualizar
          </button>
          <button className="btn-primary" onClick={runCheckNow} disabled={!selected}>
            Checar agora
          </button>
        </div>
      </div>

      {error && <div className="alert-danger">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="grid2">
        {/* Left */}
        <div className="stack">
          {/* Quick add */}
          <div className="card">
            <div className="cardTitle"><IconPlus size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Adicionar site</div>
            <div className="form-grid">
              <div className="form-field">
                <input
                  className="input"
                  placeholder="https://seusite.com"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") quickAdd(); }}
                />
              </div>
              <div className="row gap">
                <input
                  className="input"
                  placeholder="Nome (opcional)"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                />
                <button className="btn-primary" onClick={quickAdd} style={{ whiteSpace: "nowrap" }}>
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Sites list */}
          <div className="card">
            <div className="cardTitle">
              <IconGlobe size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Sites ({sites.length})
            </div>
            <div style={{ marginBottom: 10 }}>
              <input
                className="input"
                placeholder="Filtrar sites..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") loadSites(); }}
              />
            </div>
            <div className="list">
              {sites.map((s) => (
                <button
                  key={s.id}
                  className={"listItem " + (selectedId === s.id ? "active" : "")}
                  onClick={() => setSelectedId(s.id)}
                >
                  <div className="listTop">
                    <span className="listName">
                      {!s.enabled && <span style={{ color: "var(--muted)", marginRight: 6 }} title="Pausado">⏸</span>}
                      {s.name}
                    </span>
                    <span className={badgeClass(s.status)}>{s.status}</span>
                  </div>
                  <div className="listSub">
                    <span className="muted" style={{ fontSize: 12 }}>{s.url}</span>
                  </div>
                  <div className="listMeta">
                    <span>Uptime: <b>{pct(s.uptime30d)}</b></span>
                    <span>RTT: <b>{s.rttMs ?? "-"} ms</b></span>
                    <span><IconClock size={12} style={{ verticalAlign: "middle" }} /> {s.lastCheckAt ? toTimeLabel(s.lastCheckAt) : "-"}</span>
                  </div>
                </button>
              ))}
              {!sites.length && <div className="muted">Nenhum site cadastrado.</div>}
            </div>
          </div>

          {/* System */}
          <div className="card">
            <div className="cardTitle">Servidor (Decode API)</div>
            {system ? (
              <div className="kpiGrid">
                <div className="kpi">
                  <div className="kpiLabel">CPU</div>
                  <div className="kpiValue">{system.cpuLoad.toFixed(1)}%</div>
                  <div className="kpiSub">{fmtDT(system.sampledAt)}</div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">Memória</div>
                  <div className="kpiValue">{bytes(system.memUsedBytes)}</div>
                  <div className="kpiSub">{pct((system.memUsedBytes / Math.max(1, system.memTotalBytes)) * 100)} de {bytes(system.memTotalBytes)}</div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">Disco</div>
                  <div className="kpiValue">{bytes(system.diskUsedBytes)}</div>
                  <div className="kpiSub">{pct((system.diskUsedBytes / Math.max(1, system.diskTotalBytes)) * 100)} de {bytes(system.diskTotalBytes)}</div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">Uptime</div>
                  <div className="kpiValue">{Math.floor(system.uptimeSeconds / 3600)}h {Math.floor((system.uptimeSeconds % 3600) / 60)}m</div>
                </div>
              </div>
            ) : (
              <div className="muted">Sem dados.</div>
            )}
            <div className="chartsGrid" style={{ marginTop: 12 }}>
              <LineAreaChart title="CPU (24h)" subtitle="Carga %" data={sysCpuSeries} valueSuffix="%" height={150} />
              <LineAreaChart title="Memória (24h)" subtitle="% usada" data={sysMemSeries} valueSuffix="%" height={150} />
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="stack">
          <div className="card">
            {!selected ? (
              <div className="empty-state">
                <div className="empty-state-icon"><IconGlobe size={22} /></div>
                <div className="empty-state-title">Selecione um site</div>
                <div className="empty-state-text">Escolha um site na lista ao lado para ver detalhes</div>
              </div>
            ) : (
              <>
                <div className="detailHeader">
                  <div>
                    <div className="detailTitle">
                      {selected.name}
                      <span className={badgeClass(selected.status)}>{selected.status}</span>
                      {!selected.enabled && <span className="badge">Pausado</span>}
                    </div>
                    <div className="muted" style={{ marginTop: 4 }}>{selected.url}</div>
                    <div className="row gap" style={{ marginTop: 8, fontSize: 13 }}>
                      <span>Uptime 30d: <b>{pct(selected.uptime30d)}</b></span>
                      <span>Último check: <b>{fmtDT(selected.lastCheckAt || null)}</b></span>
                      <span>RTT: <b>{selected.rttMs ?? "-"} ms</b></span>
                    </div>
                  </div>
                  <div className="row gap">
                    <button className="btn-ghost" onClick={openEdit} title="Editar" style={{ padding: "6px 8px" }}>
                      <IconPencil size={15} />
                    </button>
                    <button className="btn-ghost" onClick={toggleEnabled} title={selected.enabled ? "Pausar" : "Ativar"} style={{ padding: "6px 8px" }}>
                      <IconPower size={15} />
                    </button>
                    <button className="btn-danger" onClick={deleteSite} title="Remover" style={{ padding: "6px 8px" }}>
                      <IconTrash size={15} />
                    </button>
                  </div>
                </div>

                {loadingDetails && <div className="muted" style={{ marginTop: 10 }}>Carregando detalhes...</div>}

                {!loadingDetails && (
                  <>
                    <div className="chartsGrid" style={{ marginTop: 14 }}>
                      <LineAreaChart title="RTT (24h)" subtitle="Tempo total até headers" data={rttSeries} valueSuffix="ms" height={170} />
                      <LineAreaChart title="TTFB (24h)" subtitle="Tempo até 1o byte" data={ttfbSeries} valueSuffix="ms" height={170} />
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <BarChart title="Status (24h)" subtitle="Distribuição de checks" data={statusCounts} height={140} />
                    </div>

                    <div className="split">
                      <div className="card soft">
                        <div className="cardTitle">Último check</div>
                        {latestCheck ? (
                          <div className="kv">
                            <div><span>Status</span><b><span className={badgeClass(latestCheck.status)}>{latestCheck.status}</span></b></div>
                            <div><span>Quando</span><b>{fmtDT(latestCheck.checkedAt)}</b></div>
                            <div><span>HTTP</span><b>{latestCheck.httpStatus ?? "-"}</b></div>
                            <div><span>DNS</span><b>{ms(latestCheck.dnsMs)}</b></div>
                            <div><span>TLS</span><b>{ms(latestCheck.tlsMs)}</b></div>
                            <div><span>RTT</span><b>{ms(latestCheck.rttMs)}</b></div>
                            <div><span>TTFB</span><b>{ms(latestCheck.ttfbMs)}</b></div>
                            <div><span>Bytes</span><b>{bytes(latestCheck.bytesRead)}</b></div>
                            <div><span>IP</span><b>{latestCheck.resolvedIp ?? "-"}</b></div>
                            <div><span>Redirects</span><b>{latestCheck.redirectsCount ?? "-"}</b></div>
                            <div><span>SSL expira</span><b>{latestCheck.sslValidTo ? fmtDT(latestCheck.sslValidTo) : "-"}</b></div>
                            <div><span>Dias SSL</span><b style={{ color: (latestCheck.sslDaysLeft ?? 999) < 30 ? "var(--red)" : undefined }}>{latestCheck.sslDaysLeft ?? "-"}</b></div>
                            {latestCheck.errorMessage && <div><span>Erro</span><b style={{ color: "var(--red)" }}>{latestCheck.errorMessage}</b></div>}
                          </div>
                        ) : (
                          <div className="muted">Sem checks ainda.</div>
                        )}
                      </div>

                      <div className="card soft">
                        <div className="cardTitle">Métricas do servidor remoto</div>
                        {latestCheck?.metricsEndpoint && metricsObj ? (
                          <>
                            <div className="muted" style={{ fontSize: 11, marginBottom: 10 }}>Fonte: {latestCheck.metricsEndpoint}</div>
                            {/* Visual KPIs when prometheus data is available */}
                            <div className="kpiGrid">
                              {metricsObj.system_cpu_usage != null && (
                                <div className="kpi">
                                  <div className="kpiLabel">CPU (sistema)</div>
                                  <div className="kpiValue" style={{ color: metricsObj.system_cpu_usage > 0.8 ? "var(--red)" : metricsObj.system_cpu_usage > 0.5 ? "var(--amber)" : "var(--green)" }}>
                                    {(metricsObj.system_cpu_usage * 100).toFixed(1)}%
                                  </div>
                                </div>
                              )}
                              {metricsObj.process_cpu_usage != null && (
                                <div className="kpi">
                                  <div className="kpiLabel">CPU (processo)</div>
                                  <div className="kpiValue">{(metricsObj.process_cpu_usage * 100).toFixed(1)}%</div>
                                </div>
                              )}
                              {metricsObj.jvm_memory_used_bytes != null && (
                                <div className="kpi">
                                  <div className="kpiLabel">Memória JVM usada</div>
                                  <div className="kpiValue">{bytes(metricsObj.jvm_memory_used_bytes)}</div>
                                  {metricsObj.jvm_memory_max_bytes != null && (
                                    <div className="kpiSub">de {bytes(metricsObj.jvm_memory_max_bytes)} ({((metricsObj.jvm_memory_used_bytes / metricsObj.jvm_memory_max_bytes) * 100).toFixed(0)}%)</div>
                                  )}
                                </div>
                              )}
                              {metricsObj.process_resident_memory_bytes != null && (
                                <div className="kpi">
                                  <div className="kpiLabel">RAM (processo)</div>
                                  <div className="kpiValue">{bytes(metricsObj.process_resident_memory_bytes)}</div>
                                </div>
                              )}
                              {metricsObj.nodejs_heap_size_used_bytes != null && (
                                <div className="kpi">
                                  <div className="kpiLabel">Heap Node.js</div>
                                  <div className="kpiValue">{bytes(metricsObj.nodejs_heap_size_used_bytes)}</div>
                                  {metricsObj.nodejs_heap_size_total_bytes != null && (
                                    <div className="kpiSub">de {bytes(metricsObj.nodejs_heap_size_total_bytes)}</div>
                                  )}
                                </div>
                              )}
                              {metricsObj.process_uptime_seconds != null && (
                                <div className="kpi">
                                  <div className="kpiLabel">Uptime processo</div>
                                  <div className="kpiValue">{Math.floor(metricsObj.process_uptime_seconds / 3600)}h {Math.floor((metricsObj.process_uptime_seconds % 3600) / 60)}m</div>
                                </div>
                              )}
                              {metricsObj.http_server_requests_seconds_count != null && (
                                <div className="kpi">
                                  <div className="kpiLabel">Requests total</div>
                                  <div className="kpiValue">{Math.round(metricsObj.http_server_requests_seconds_count).toLocaleString("pt-BR")}</div>
                                </div>
                              )}
                            </div>
                            {/* Raw JSON toggle */}
                            <details style={{ marginTop: 10 }}>
                              <summary className="muted" style={{ cursor: "pointer", fontSize: 12 }}>Ver dados brutos</summary>
                              <pre className="code" style={{ marginTop: 6 }}>{JSON.stringify(metricsObj, null, 2)}</pre>
                            </details>
                          </>
                        ) : latestCheck?.metricsEndpoint ? (
                          <>
                            <div className="muted" style={{ fontSize: 12 }}>Fonte: {latestCheck.metricsEndpoint}</div>
                            <pre className="code">{latestCheck.metricsJson}</pre>
                          </>
                        ) : (
                          <div style={{ fontSize: 13 }}>
                            <div className="muted" style={{ marginBottom: 8 }}>Nenhuma métrica detectada automaticamente.</div>
                            <div className="alert-info" style={{ margin: 0, fontSize: 12 }}>
                              <b>Como ativar?</b> No backend do sistema monitorado, exponha métricas Prometheus:
                              <ul style={{ margin: "6px 0 0", paddingLeft: 16, lineHeight: 1.8 }}>
                                <li>Spring Boot: adicione <code>management.endpoints.web.exposure.include=health,prometheus</code></li>
                                <li>Node.js: use <code>prom-client</code> e exponha <code>/metrics</code></li>
                                <li>O Decode detecta automaticamente: <code>/actuator/prometheus</code>, <code>/metrics</code>, <code>/prometheus</code></li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Incidents */}
                    <div className="card" style={{ marginTop: 12 }}>
                      <div className="cardTitle">
                        Incidentes (30d)
                        {openIncidents > 0 && <span className="badge bad" style={{ marginLeft: 8 }}>{openIncidents} aberto{openIncidents !== 1 ? "s" : ""}</span>}
                      </div>
                      {!incidents.length ? (
                        <div className="muted">Nenhum incidente registrado.</div>
                      ) : (
                        <div className="tableWrap">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Status</th>
                                <th>Início</th>
                                <th>Fim</th>
                                <th>Duração</th>
                                <th>Mensagem</th>
                              </tr>
                            </thead>
                            <tbody>
                              {incidents.map((inc) => {
                                const start = new Date(inc.openedAt);
                                const end = inc.closedAt ? new Date(inc.closedAt) : new Date();
                                const durMin = Math.round((end.getTime() - start.getTime()) / 60000);
                                return (
                                  <tr key={inc.id}>
                                    <td><span className={"badge " + (inc.status === "OPEN" ? "bad" : "ok")}>{inc.status}</span></td>
                                    <td>{fmtDT(inc.openedAt)}</td>
                                    <td>{fmtDT(inc.closedAt || null)}</td>
                                    <td>{durMin < 60 ? `${durMin}m` : `${Math.floor(durMin / 60)}h ${durMin % 60}m`}</td>
                                    <td className="truncate" title={inc.message || ""}>{inc.message || "-"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Checks table */}
                    <div className="card" style={{ marginTop: 12 }}>
                      <div className="cardTitle">Últimos checks — {checks.length} nas 24h</div>
                      {!checks.length ? (
                        <div className="muted">Sem dados.</div>
                      ) : (
                        <div className="tableWrap" style={{ maxHeight: 260, overflowY: "auto" }}>
                          <table className="table">
                            <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                              <tr>
                                <th>Quando</th>
                                <th>Status</th>
                                <th>HTTP</th>
                                <th>DNS</th>
                                <th>TLS</th>
                                <th>RTT</th>
                                <th>TTFB</th>
                                <th>Bytes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {checks.slice(-60).reverse().map((c) => (
                                <tr key={c.id}>
                                  <td>{fmtDT(c.checkedAt)}</td>
                                  <td><span className={badgeClass(c.status)}>{c.status}</span></td>
                                  <td>{c.httpStatus ?? "-"}</td>
                                  <td>{ms(c.dnsMs)}</td>
                                  <td>{ms(c.tlsMs)}</td>
                                  <td>{ms(c.rttMs)}</td>
                                  <td>{ms(c.ttfbMs)}</td>
                                  <td>{bytes(c.bytesRead)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit site modal */}
      <Modal
        open={editOpen}
        title="Editar site"
        subtitle={selected?.url}
        onClose={() => setEditOpen(false)}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => setEditOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={saveEdit}>Salvar</button>
          </div>
        }
      >
        <div className="form-grid">
          <div className="form-field">
            <span className="form-label">Nome</span>
            <input className="input" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-field">
            <span className="form-label">URL</span>
            <input className="input" value={editForm.url} onChange={(e) => setEditForm((p) => ({ ...p, url: e.target.value }))} />
          </div>
          <div className="form-grid cols-2">
            <div className="form-field">
              <span className="form-label">Limite Slow (ms)</span>
              <input
                className="input"
                type="number"
                value={editForm.slowThresholdMs}
                onChange={(e) => setEditForm((p) => ({ ...p, slowThresholdMs: e.target.value }))}
              />
              <span className="form-hint">RTT acima deste valor é marcado como SLOW</span>
            </div>
            <div className="form-field">
              <span className="form-label">Timeout (ms)</span>
              <input
                className="input"
                type="number"
                value={editForm.timeoutMs}
                onChange={(e) => setEditForm((p) => ({ ...p, timeoutMs: e.target.value }))}
              />
              <span className="form-hint">Tempo máximo de espera antes de marcar DOWN</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

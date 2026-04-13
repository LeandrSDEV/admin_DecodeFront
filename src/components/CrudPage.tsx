import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import api from "../lib/api";
import Modal from "./Modal";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconDownload,
  IconRefresh,
  IconSearch,
  IconEye,
  IconChevronLeft,
  IconChevronRight,
} from "./ui/Icons";

export type CrudField = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "textarea" | "select" | "date";
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
};

type Props<T extends Record<string, any>> = {
  title: string;
  subtitle?: string;
  endpoint: string;
  idKey?: string;
  columns: Array<{ key: keyof T | string; label: string; render?: (row: T) => ReactNode }>;
  fields: CrudField[];
  defaultValues?: Partial<T>;
};

function safeId(value: any) {
  return value ?? "";
}

function fmtDate(v: any) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString("pt-BR");
  } catch {
    return String(v);
  }
}

export default function CrudPage<T extends Record<string, any>>({
  title,
  subtitle,
  endpoint,
  idKey = "id",
  columns,
  fields,
  defaultValues,
}: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<T | null>(null);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 3000);
  }

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page: p, size: pageSize };
      if (q.trim()) params.q = q.trim();
      const res = await api.get(endpoint, { params });

      if (res.data?.content) {
        setItems(res.data.content);
        setTotalPages(res.data.totalPages ?? 1);
        setTotalElements(res.data.totalElements ?? 0);
      } else {
        const data = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
        setItems(data);
        setTotalPages(1);
        setTotalElements(data.length);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao carregar.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0);
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, q]);

  const filtered = useMemo(() => items, [items]);

  function openCreate() {
    setEditing(null);
    setForm({ ...(defaultValues || {}) });
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(row: T) {
    setEditing(row);
    const base: Record<string, any> = { ...(defaultValues || {}) };
    for (const f of fields) base[f.name] = row?.[f.name];
    setForm(base);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openDetail(row: T) {
    setDetailItem(row);
    setDetailOpen(true);
  }

  async function onDelete(row: T) {
    const id = safeId(row?.[idKey]);
    if (!id) return;
    const ok = window.confirm(`Tem certeza que deseja deletar o registro #${id}?`);
    if (!ok) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      showSuccess("Registro deletado com sucesso.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao deletar.");
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    for (const f of fields) {
      const v = form[f.name];
      const strVal = v === undefined || v === null ? "" : String(v).trim();

      if (f.required && strVal === "") {
        errors[f.name] = `${f.label} é obrigatório`;
        continue;
      }

      if (strVal && f.minLength && strVal.length < f.minLength) {
        errors[f.name] = `Mínimo ${f.minLength} caracteres`;
      }

      if (strVal && f.maxLength && strVal.length > f.maxLength) {
        errors[f.name] = `Máximo ${f.maxLength} caracteres`;
      }

      if (f.type === "email" && strVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
        errors[f.name] = "E-mail inválido";
      }

      if (f.pattern && strVal && !new RegExp(f.pattern).test(strVal)) {
        errors[f.name] = f.patternMessage || "Formato inválido";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSave() {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      for (const f of fields) {
        payload[f.name] = form[f.name];
      }

      if (editing) {
        const id = safeId(editing?.[idKey]);
        await api.put(`${endpoint}/${id}`, payload);
        showSuccess("Registro atualizado com sucesso.");
      } else {
        await api.post(endpoint, payload);
        showSuccess("Registro criado com sucesso.");
      }
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Falha ao salvar.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function goPage(p: number) {
    setPage(p);
    load(p);
  }

  function exportCSV() {
    if (!filtered.length) return;
    const keys = columns.map((c) => String(c.key));
    const header = columns.map((c) => c.label).join(",");
    const rows = filtered.map((row) =>
      keys.map((k) => {
        const v = (row as any)?.[k];
        const s = v === null || v === undefined ? "" : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(0, page - 2);
    const end = Math.min(totalPages - 1, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <div className="muted">
            {subtitle || `${totalElements} registro${totalElements !== 1 ? "s" : ""} encontrado${totalElements !== 1 ? "s" : ""}`}
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <IconSearch size={15} style={{ position: "absolute", left: 10, color: "var(--muted)", pointerEvents: "none" }} />
            <input
              className="input"
              placeholder="Buscar..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 220, paddingLeft: 34 }}
            />
          </div>
          <button className="btn-primary" onClick={openCreate}>
            <IconPlus size={15} /> Novo
          </button>
          <button className="btn-ghost" onClick={exportCSV} disabled={!filtered.length} title="Exportar CSV">
            <IconDownload size={15} /> CSV
          </button>
          <button className="btn-ghost" onClick={() => load()} disabled={loading} title="Atualizar">
            <IconRefresh size={15} />
          </button>
        </div>
      </div>

      {error && <div className="alert-danger">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="muted" style={{ padding: 20 }}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><IconSearch size={22} /></div>
            <div className="empty-state-title">Nenhum registro encontrado</div>
            <div className="empty-state-text">
              {q ? `Nenhum resultado para "${q}". Tente outro termo.` : `Clique em "Novo" para criar o primeiro ${title.toLowerCase()}.`}
            </div>
          </div>
        ) : (
          <>
            <div className="table-wrap" style={{ border: "none" }}>
              <table className="table">
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th key={String(c.key)}>{c.label}</th>
                    ))}
                    <th style={{ width: 140, textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, idx) => (
                    <tr key={String(row?.[idKey] ?? idx)}>
                      {columns.map((c) => (
                        <td key={String(c.key)}>
                          {c.render
                            ? c.render(row)
                            : String(c.key) === "createdAt" || String(c.key) === "updatedAt"
                            ? fmtDate((row as any)?.[c.key])
                            : String((row as any)?.[c.key] ?? "-")}
                        </td>
                      ))}
                      <td>
                        <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                          <button
                            className="btn-ghost"
                            onClick={() => openDetail(row)}
                            title="Detalhes"
                            style={{ padding: "6px 8px" }}
                          >
                            <IconEye size={15} />
                          </button>
                          <button
                            className="btn-ghost"
                            onClick={() => openEdit(row)}
                            title="Editar"
                            style={{ padding: "6px 8px" }}
                          >
                            <IconPencil size={15} />
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => onDelete(row)}
                            title="Deletar"
                            style={{ padding: "6px 8px" }}
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination" style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
                <button className="page-btn" disabled={page === 0} onClick={() => goPage(page - 1)}>
                  <IconChevronLeft size={15} />
                </button>
                {pageNumbers[0] > 0 && (
                  <>
                    <button className="page-btn" onClick={() => goPage(0)}>1</button>
                    {pageNumbers[0] > 1 && <span className="muted">...</span>}
                  </>
                )}
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    className={`page-btn${n === page ? " active" : ""}`}
                    onClick={() => goPage(n)}
                  >
                    {n + 1}
                  </button>
                ))}
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 2 && <span className="muted">...</span>}
                    <button className="page-btn" onClick={() => goPage(totalPages - 1)}>{totalPages}</button>
                  </>
                )}
                <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => goPage(page + 1)}>
                  <IconChevronRight size={15} />
                </button>
                <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>
                  {totalElements} registro{totalElements !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      <Modal
        open={detailOpen}
        title={`${title} #${detailItem?.[idKey] ?? ""}`}
        subtitle="Detalhes do registro"
        onClose={() => setDetailOpen(false)}
        wide
      >
        {detailItem && (
          <div className="form-grid cols-2">
            {Object.entries(detailItem).map(([key, val]) => (
              <div className="form-field" key={key}>
                <span className="form-label">{key}</span>
                <div
                  className="input"
                  style={{
                    background: "#f9fafb",
                    cursor: "default",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    minHeight: 40,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {val === null || val === undefined
                    ? "-"
                    : typeof val === "object"
                    ? JSON.stringify(val, null, 2)
                    : String(val)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        title={editing ? `Editar ${title}` : `Novo ${title}`}
        subtitle={editing ? `Editando registro #${editing?.[idKey]}` : `Preencha os dados para criar um novo ${title.toLowerCase()}`}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={onSave} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Atualizar" : "Criar"}
            </button>
          </div>
        }
      >
        <div className="form-grid">
          {fields.map((f) => {
            const value = form?.[f.name] ?? "";
            const fieldError = fieldErrors[f.name];
            const common = {
              className: `input${fieldError ? " input-error" : ""}`,
              value: value,
              placeholder: f.placeholder || `Digite ${f.label.toLowerCase()}...`,
              onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                setForm((p) => ({ ...p, [f.name]: e.target.value }));
                if (fieldError) setFieldErrors((prev) => ({ ...prev, [f.name]: "" }));
              },
            } as any;

            return (
              <div className="form-field" key={f.name}>
                <span className="form-label">
                  {f.label} {f.required && <span style={{ color: "var(--red)" }}>*</span>}
                </span>
                {f.type === "textarea" ? (
                  <textarea {...common} rows={4} maxLength={f.maxLength} />
                ) : f.type === "select" ? (
                  <select {...common}>
                    <option value="">Selecione...</option>
                    {(f.options || []).map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...common}
                    type={f.type || "text"}
                    minLength={f.minLength}
                    maxLength={f.maxLength}
                    min={f.min}
                    max={f.max}
                  />
                )}
                {fieldError && <span className="form-error">{fieldError}</span>}
                {f.maxLength && (
                  <span className="form-hint">{String(value).length}/{f.maxLength} caracteres</span>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}

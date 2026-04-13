import { useEffect, useState } from "react";
import api from "../../lib/api";

type TopDecode = {
  id: string;
  code: string;
  name: string;
  usersCount: number;
  monthlyRevenue: number;
};

export default function TopDecodesTable() {
  const [items, setItems] = useState<TopDecode[]>([]);

  useEffect(() => {
    let alive = true;
    api
      .get("/api/decodes?size=5&sort=monthlyRevenue,desc")
      .then((res) => {
        if (!alive) return;
        const data = res.data?.content ?? res.data ?? [];
        setItems(Array.isArray(data) ? data.slice(0, 5) : []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Top decodes</h2>
          <p className="panel-sub">Por faturamento mensal</p>
        </div>
      </div>

      <div className="table">
        <div className="tr th">
          <div>Decode</div>
          <div className="right">Usuários</div>
          <div className="right">Receita</div>
        </div>
        {items.map((d) => (
          <div key={d.id} className="tr">
            <div>
              <div className="strong">{d.name}</div>
              <div className="muted">{d.code}</div>
            </div>
            <div className="right">{d.usersCount ?? 0}</div>
            <div className="right">
              {(d.monthlyRevenue ?? 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="tr">
            <div className="muted">Nenhum decode cadastrado</div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CircleHelp,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Utensils,
  Users,
} from "lucide-react";

type Region = {
  name: string;
  moderate: number;
  severe: number;
  households: number;
};
type SortKey = "name" | "moderate" | "severe" | "households" | "need";
type SortState = { key: SortKey; direction: "asc" | "desc" };
type Home = {
  id: string;
  department: string;
  level: "Grave" | "Moderado" | "Sin clasificación";
  prevalence: number;
};
type Row = {
  iteration: number;
  id: string;
  department: string;
  need: string;
  stockBefore: number;
  action: string;
  stockAfter: number;
};
const INITIAL: Region[] = [
  { name: "Amazonas", moderate: 19.3, severe: 4.2, households: 1000 },
  { name: "Antioquia", moderate: 20.1, severe: 3.7, households: 1000 },
  { name: "Arauca", moderate: 11.0, severe: 1.1, households: 1000 },
  { name: "Atlántico", moderate: 33.0, severe: 6.2, households: 1000 },
  { name: "Bogotá D.C.", moderate: 9.6, severe: 1.4, households: 1000 },
  { name: "Bolívar", moderate: 33.4, severe: 5.8, households: 1000 },
  { name: "Boyacá", moderate: 16.4, severe: 1.1, households: 1000 },
  { name: "Caldas", moderate: 9.2, severe: 1.3, households: 1000 },
  { name: "Caquetá", moderate: 20.1, severe: 1.5, households: 1000 },
  { name: "Casanare", moderate: 17.5, severe: 1.2, households: 1000 },
  { name: "Cauca", moderate: 31.2, severe: 4.4, households: 1000 },
  { name: "Cesar", moderate: 31.3, severe: 6.6, households: 1000 },
  { name: "Chocó", moderate: 56.8, severe: 17.9, households: 1000 },
  { name: "Córdoba", moderate: 40.2, severe: 5.9, households: 1000 },
  { name: "Cundinamarca", moderate: 13.1, severe: 1.7, households: 1000 },
  { name: "Guainía", moderate: 22.6, severe: 3.3, households: 1000 },
  { name: "Guaviare", moderate: 27.1, severe: 5.0, households: 1000 },
  { name: "Huila", moderate: 22.1, severe: 2.0, households: 1000 },
  { name: "La Guajira", moderate: 47.8, severe: 16.4, households: 1000 },
  { name: "Magdalena", moderate: 36.1, severe: 7.4, households: 1000 },
  { name: "Meta", moderate: 19.0, severe: 2.6, households: 1000 },
  { name: "Nariño", moderate: 31.1, severe: 3.9, households: 1000 },
  { name: "Norte de Santander", moderate: 21.5, severe: 2.6, households: 1000 },
  { name: "Putumayo", moderate: 27.8, severe: 1.9, households: 1000 },
  { name: "Quindío", moderate: 17.5, severe: 2.3, households: 1000 },
  { name: "Risaralda", moderate: 10.3, severe: 1.5, households: 1000 },
  { name: "San Andrés", moderate: 5.2, severe: 0.6, households: 1000 },
  { name: "Santander", moderate: 12.5, severe: 0.8, households: 1000 },
  { name: "Sucre", moderate: 50.1, severe: 11.3, households: 1000 },
  { name: "Tolima", moderate: 20.1, severe: 1.7, households: 1000 },
  { name: "Valle del Cauca", moderate: 15.0, severe: 1.6, households: 1000 },
  { name: "Vaupés", moderate: 22.3, severe: 1.9, households: 1000 },
  { name: "Vichada", moderate: 41.8, severe: 9.7, households: 1000 },
];
function makeHomes(regions: Region[]) {
  const homes: Home[] = [];
  for (const [regionIndex, r] of regions.entries()) {
    const n = Math.max(0, Math.floor(r.households));
    const grave = Math.min(n, Math.round((n * r.severe) / 100));
    const mod = Math.min(
      n - grave,
      Math.round((n * Math.max(0, r.moderate - r.severe)) / 100),
    );
    for (let i = 0; i < n; i++)
      homes.push({
        id: `D${String(regionIndex + 1).padStart(2, "0")}-${String(i + 1).padStart(4, "0")}`,
        department: r.name,
        level:
          i < grave
            ? "Grave"
            : i < grave + mod
              ? "Moderado"
              : "Sin clasificación",
        prevalence: r.moderate,
      });
  }
  return homes;
}
function sequential(homes: Home[], stock: number) {
  let left = stock,
    rows: Row[] = [];
  const order = [...homes].sort(
    (a, b) =>
      a.department.localeCompare(b.department, "es") ||
      a.id.localeCompare(b.id),
  );
  for (let i = 0; i < order.length; i++) {
    const h = order[i];
    if (h.level === "Sin clasificación") continue;
    const before = left;
    const assigned = left > 0;
    if (assigned) left--;
    rows.push({
      iteration: rows.length + 1,
      id: h.id,
      department: h.department,
      need: h.level,
      stockBefore: before,
      action: assigned ? "Asignado" : "Sin existencias",
      stockAfter: left,
    });
  }
  return { rows, assigned: stock - left, left };
}
function corrected(homes: Home[], stock: number) {
  let left = stock,
    rows: Row[] = [];
  const order = [...homes]
    .filter((h) => h.level !== "Sin clasificación")
    .sort(
      (a, b) =>
        ({ Grave: 0, Moderado: 1 })[a.level as "Grave" | "Moderado"] -
          { Grave: 0, Moderado: 1 }[b.level as "Grave" | "Moderado"] ||
        b.prevalence - a.prevalence ||
        a.id.localeCompare(b.id),
    );
  for (const h of order) {
    const before = left,
      assigned = left > 0;
    if (assigned) left--;
    rows.push({
      iteration: rows.length + 1,
      id: h.id,
      department: h.department,
      need: h.level,
      stockBefore: before,
      action: assigned ? "Asignado" : "Sin existencias",
      stockAfter: left,
    });
  }
  return { rows, assigned: stock - left, left };
}
function number(v: number) {
  return new Intl.NumberFormat("es-CO").format(v);
}
function App() {
  const [regions, setRegions] = useState(INITIAL);
  const [sort, setSort] = useState<SortState>({
    key: "moderate",
    direction: "desc",
  });
  const [markets, setMarkets] = useState(500);
  const [active, setActive] = useState<"overview" | "trace" | "method">(
    "overview",
  );
  const [error, setError] = useState("");
  const homes = useMemo(() => makeHomes(regions), [regions]);
  const original = useMemo(() => sequential(homes, markets), [homes, markets]);
  const fixed = useMemo(() => corrected(homes, markets), [homes, markets]);
  const severe = homes.filter((h) => h.level === "Grave").length,
    total = homes.length;
  const fixedSevere = fixed.rows.filter(
    (x) => x.need === "Grave" && x.action === "Asignado",
  ).length;
  const originalByDepartment = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of original.rows) {
      if (row.action === "Asignado")
        counts.set(row.department, (counts.get(row.department) ?? 0) + 1);
    }
    return counts;
  }, [original]);
  const fixedByDepartment = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of fixed.rows) {
      if (row.action === "Asignado")
        counts.set(row.department, (counts.get(row.department) ?? 0) + 1);
    }
    return counts;
  }, [fixed]);
  const chartMax = Math.max(
    1,
    ...regions.flatMap((region) => [
      originalByDepartment.get(region.name) ?? 0,
      fixedByDepartment.get(region.name) ?? 0,
    ]),
  );
  const sortedRegions = useMemo(() => {
    const need = (r: Region) => {
      const count = Math.max(0, Math.floor(r.households));
      const grave = Math.round((count * r.severe) / 100);
      const moderate = Math.round(
        (count * Math.max(0, r.moderate - r.severe)) / 100,
      );
      return grave + moderate;
    };
    return regions
      .map((region, index) => ({ region, index }))
      .sort((a, b) => {
        const left = a.region;
        const right = b.region;
        const comparison =
          sort.key === "name"
            ? left.name.localeCompare(right.name, "es")
            : sort.key === "need"
              ? need(left) - need(right)
              : left[sort.key] - right[sort.key];
        return (sort.direction === "asc" ? 1 : -1) * comparison ||
          left.name.localeCompare(right.name, "es");
      });
  }, [regions, sort]);
  const changeSort = (key: SortKey) =>
    setSort((current) => ({
      key,
      direction:
        current.key === key
          ? current.direction === "desc"
            ? "asc"
            : "desc"
          : key === "name"
            ? "asc"
            : "desc",
    }));
  const update = (idx: number, key: keyof Region, value: number) => {
    if (!Number.isFinite(value) || value < 0) {
      setError("Usa valores numéricos iguales o mayores que cero.");
      return;
    }
    if (
      (key === "moderate" && value > 100) ||
      (key === "severe" && value > 100) ||
      (key === "households" && value > 100000)
    ) {
      setError(
        "Porcentajes: máximo 100 %. Hogares: máximo 100.000 por departamento.",
      );
      return;
    }
    setError("");
    setRegions((rs) =>
      rs.map((r, i) => {
        if (i !== idx) return r;
        const next = { ...r, [key]: value };
        if (next.severe > next.moderate) {
          setError(
            "La prevalencia grave no puede superar la prevalencia moderada o grave.",
          );
          return r;
        }
        return next;
      }),
    );
  };
  const reset = () => {
    setRegions(INITIAL);
    setMarkets(10000);
    setError("");
  };
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Utensils size={20} />
          </div>
          <div>
            <b>Hambre Cero</b>
            <span>SIMULADOR</span>
          </div>
        </div>
        <div className="nav-label">ESPACIO DE TRABAJO</div>
        <button
          className={active === "overview" ? "nav active" : "nav"}
          onClick={() => setActive("overview")}
        >
          <Activity size={17} />
          Resumen
        </button>
        <button
          className={active === "trace" ? "nav active" : "nav"}
          onClick={() => setActive("trace")}
        >
          <SlidersHorizontal size={17} />
          Trazado de variables
        </button>
        <button
          className={active === "method" ? "nav active" : "nav"}
          onClick={() => setActive("method")}
        >
          <CircleHelp size={17} />
          Cómo funciona
        </button>
        
      </aside>
      <main className="main">
        <header>
          <div className="crumb">
            SIMULADOR <span>/</span> DISTRIBUCIÓN ALIMENTARIA
          </div>
          <button className="reset" onClick={reset}>
            <RotateCcw size={15} /> Restablecer
          </button>
        </header>
        <section className="hero">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> MODELO DE ASIGNACIÓN · COLOMBIA
            </div>
            <h1>
              Distribuir mejor,
              <br />
              <em>priorizar primero.</em>
            </h1>
            <p>
              Explora cómo cambian las ayudas cuando modificas la necesidad de
              cada departamento y el inventario disponible.
            </p>
          </div>
          <div className="hero-mark">
            <Utensils size={46} />
            <span>
              HOGARES
              <br />
              SIMULADOS
            </span>
          </div>
        </section>
        <section className="stats">
          <article className="stat">
            <div className="stat-top">
              HOGARES EN EL ESCENARIO <Users size={16} />
            </div>
            <strong>{number(total)}</strong>
            <small>En {regions.length - 1} departamentos y Bogotá D. C.</small>
          </article>
          <article className="stat">
            <div className="stat-top">
              AYUDAS DISPONIBLES <span className="pill">EDITABLE</span>
            </div>
            <strong>{number(markets)}</strong>
            <small>Mercados alimentarios</small>
          </article>
          <article className="stat">
            <div className="stat-top">
              NECESIDAD GRAVE <span className="dot red" />
            </div>
            <strong>{number(severe)}</strong>
            <small>
              {total ? ((severe / total) * 100).toFixed(1) : "0.0"}% de hogares
              simulados
            </small>
          </article>
          <article className="stat">
            <div className="stat-top">
              COBERTURA CORREGIDA <span className="dot green" />
            </div>
            <strong>
              {severe
                ? Math.min(100, (fixedSevere / severe) * 100).toFixed(1)
                : "0.0"}
              %
            </strong>
            <small>Mercados asignados / casos graves</small>
          </article>
        </section>
        {error && <div className="alert">{error}</div>}
        <div className="section-head">
          <div>
            <div className="eyebrow muted">PARÁMETROS DEL ESCENARIO</div>
            <h2>Ajusta el contexto</h2>
          </div>
          <span className="subtle">Cambios aplicados en tiempo real</span>
        </div>
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Prevalencia por departamento</h3>
              <p>
                Porcentaje de hogares con inseguridad alimentaria moderada o
                grave y grave.
              </p>
            </div>
           
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th aria-sort={sort.key === "name" ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-button" onClick={() => changeSort("name")}>DEPARTAMENTO <span>{sort.key === "name" ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</span></button></th>
                  <th aria-sort={sort.key === "moderate" ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-button" onClick={() => changeSort("moderate")}>MODERADA O GRAVE <span>{sort.key === "moderate" ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</span></button></th>
                  <th aria-sort={sort.key === "severe" ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-button" onClick={() => changeSort("severe")}>GRAVE <span>{sort.key === "severe" ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</span></button></th>
                  <th aria-sort={sort.key === "households" ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-button" onClick={() => changeSort("households")}>HOGARES SIMULADOS <span>{sort.key === "households" ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</span></button></th>
                  <th aria-sort={sort.key === "need" ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-button" onClick={() => changeSort("need")}>HOGARES CON NECESIDAD <span>{sort.key === "need" ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</span></button></th>
                </tr>
              </thead>
              <tbody>
                {sortedRegions.map(({ region: r, index: i }) => {
                  const n = Math.max(0, Math.floor(r.households)),
                    sev = Math.round((n * r.severe) / 100),
                    mod = Math.round(
                      (n * Math.max(0, r.moderate - r.severe)) / 100,
                    );
                  return (
                    <tr key={r.name}>
                      <td>
                        <b>{r.name}</b>
                      </td>
                      <td>
                        <div className="input-wrap">
                          <input
                            aria-label={`${r.name} moderada o grave`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={r.moderate}
                            onChange={(e) =>
                              update(i, "moderate", Number(e.target.value))
                            }
                          />
                          <span>%</span>
                        </div>
                      </td>
                      <td>
                        <div className="input-wrap">
                          <input
                            aria-label={`${r.name} grave`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={r.severe}
                            onChange={(e) =>
                              update(i, "severe", Number(e.target.value))
                            }
                          />
                          <span>%</span>
                        </div>
                      </td>
                      <td>
                        <input
                          className="house-input"
                          aria-label={`${r.name} hogares simulados`}
                          type="number"
                          min="0"
                          max="100000"
                          value={r.households}
                          onChange={(e) =>
                            update(i, "households", Number(e.target.value))
                          }
                        />
                      </td>
                      <td>
                        <b>{number(sev + mod)}</b>
                        <div className="micro-bar">
                          <i
                            style={{ width: `${Math.min(r.moderate, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="market-control">
            <div>
              <b>Mercados alimentarios disponibles</b>
              <small>Inventario total para la simulación</small>
            </div>
            <div className="input-wrap market-input">
              <input
                type="number"
                min="0"
                max="1000000"
                value={markets}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 0 && v <= 1000000) {
                    setMarkets(Math.floor(v));
                    setError("");
                  } else
                    setError("El inventario debe estar entre 0 y 1.000.000.");
                }}
              />
              <span>unidades</span>
            </div>
          </div>
          <p className="fineprint">
            * Cifras de referencia indicadas para el ejercicio. Los tamaños de
            muestra y resultados son simulados; los porcentajes departamentales
            no se extrapolan a una asignación oficial.
          </p>
        </section>
        <div className="tabs">
          <button
            className={active === "overview" ? "tab selected" : "tab"}
            onClick={() => setActive("overview")}
          >
            Comparación de algoritmos
          </button>
          <button
            className={active === "trace" ? "tab selected" : "tab"}
            onClick={() => setActive("trace")}
          >
            Prueba de escritorio
          </button>
          <button
            className={active === "method" ? "tab selected" : "tab"}
            onClick={() => setActive("method")}
          >
            Reglas y supuestos
          </button>
        </div>
        {active === "overview" && (
          <>
            <div className="section-head comparison-head">
              <div>
                <div className="eyebrow muted">RESULTADO DE LA SIMULACIÓN</div>
                <h2>Dos reglas, dos resultados</h2>
              </div>
              <span className="subtle">
                Prioridad corregida: grave → moderado
              </span>
            </div>
            <div className="comparison">
              <article className="algo">
                <div className="algo-heading">
                  <span className="algo-number">01</span>
                  <div>
                    <h3>Secuencial</h3>
                    <p>
                      Recorre departamentos en orden alfabético; agota el
                      inventario siguiendo ese recorrido.
                    </p>
                  </div>
                </div>
                <div className="algo-metric">
                  <div>
                    <small>HOGARES ATENDIDOS</small>
                    <b>{number(original.assigned)}</b>
                  </div>
                  <div className="trend down">
                    <ArrowDownRight size={17} />
                    Recorrido fijo
                  </div>
                </div>
                <div className="progress">
                  <i
                    style={{
                      width: `${total ? (original.assigned / total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="algo-foot">
                  <span>Necesidad grave atendida</span>
                  <b>
                    {severe
                      ? Math.min(
                          100,
                          (original.rows.filter(
                            (x) =>
                              x.need === "Grave" && x.action === "Asignado",
                          ).length /
                            severe) *
                            100,
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </b>
                </div>
                <div className="algorithm-note">
                  La disponibilidad remanente depende del orden de recorrido.
                </div>
              </article>
              <article className="algo corrected">
                <div className="algo-heading">
                  <span className="algo-number">02</span>
                  <div>
                    <div className="label-correct">
                      LÓGICA CORREGIDA <Check size={13} />
                    </div>
                    <h3>Prioridad por necesidad</h3>
                    <p>
                      Ordena por gravedad, prevalencia descendente y desempata
                      por ID.
                    </p>
                  </div>
                </div>
                <div className="algo-metric">
                  <div>
                    <small>HOGARES ATENDIDOS</small>
                    <b>{number(fixed.assigned)}</b>
                  </div>
                  <div className="trend up">
                    <ArrowUpRight size={17} />
                    Priorizado
                  </div>
                </div>
                <div className="progress green-progress">
                  <i
                    style={{
                      width: `${total ? (fixed.assigned / total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="algo-foot">
                  <span>Necesidad grave atendida</span>
                  <b>
                    {severe
                      ? Math.min(100, (fixedSevere / severe) * 100).toFixed(1)
                      : "0.0"}
                    %
                  </b>
                </div>
                <div className="algorithm-note">
                  Atiende primero grave; después, hogares exclusivamente
                  moderados.
                </div>
              </article>
            </div>
            <div className="chart-panel">
              <div>
                <h3>Hogares atendidos por departamento</h3>
                <p>
                  Comparación del número de mercados asignados en cada
                  escenario.
                </p>
              </div>
              <div className="legend">
                <span>
                  <i className="lg-gray" />
                  Secuencial
                </span>
                <span>
                  <i className="lg-green" />
                  Corregido
                </span>
              </div>
              <div className="bars">
                {regions.map((r) => {
                  const a = originalByDepartment.get(r.name) ?? 0;
                  const b = fixedByDepartment.get(r.name) ?? 0;
                  return (
                    <div className="bar-group" key={r.name}>
                      <div className="bar-pair">
                        <i
                          className="bar gray"
                          style={{ height: `${(a / chartMax) * 100}%` }}
                          title={`Secuencial: ${a}`}
                        />
                        <i
                          className="bar green"
                          style={{ height: `${(b / chartMax) * 100}%` }}
                          title={`Corregido: ${b}`}
                        />
                      </div>
                      <span>{r.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="notice">
              <ShieldCheck size={18} />
              <p>
                <b>Lectura del resultado</b>
                <br />
                El algoritmo corregido es una regla de priorización para el
                ejercicio. El algoritmo secuencial representa un escenario
                hipotético con orden fijo; no es un algoritmo publicado ni
                atribuido al DANE.
              </p>
            </div>
          </>
        )}
        {active === "trace" && (
          <>
            <div className="section-head comparison-head">
              <div>
                <div className="eyebrow muted">
                  ESTADOS ITERACIÓN POR ITERACIÓN
                </div>
                <h2>Prueba de escritorio</h2>
              </div>
              <span className="subtle">
                Se muestra el inicio y el agotamiento del inventario (hasta 40
                filas)
              </span>
            </div>
            <Trace
              title="Algoritmo secuencial"
              rows={traceWindow(original.rows)}
            />
            <Trace title="Algoritmo corregido" rows={traceWindow(fixed.rows)} />
            <p className="fineprint">
              Las filas siguen el orden exacto de ejecución. El inventario
              disminuye en una unidad por asignación hasta agotarse.
            </p>
          </>
        )}
        {active === "method" && (
          <>
            <div className="section-head comparison-head">
              <div>
                <div className="eyebrow muted">REGLAS REPRODUCIBLES</div>
                <h2>Cómo se calcula</h2>
              </div>
            </div>
            <section className="panel method">
              <h3>Algoritmo secuencial hipotético</h3>
              <ol>
                <li>
                  Genera hogares simulados con identificadores estables por
                  departamento.
                </li>
                <li>
                  Recorre departamentos en orden alfabético e identifica hogares
                  graves y moderados.
                </li>
                <li>
                  Asigna un mercado a cada hogar elegible mientras quede
                  inventario.
                </li>
              </ol>
              <h3>Algoritmo corregido</h3>
              <ol>
                <li>Ordena hogares graves primero.</li>
                <li>
                  Continúa exclusivamente con hogares moderados (sin duplicar
                  los clasificados como graves).
                </li>
                <li>
                  Dentro de cada nivel, ordena por prevalencia departamental
                  descendente y desempata por identificador ascendente.
                </li>
                <li>Asigna hasta agotar inventario o cubrir la demanda.</li>
              </ol>
              <h3>Casos límite para probar</h3>
              <p>
                Inventario 0: no se asigna ningún mercado. Inventario 1: se
                atiende un hogar grave, si existe. Inventario mayor que la
                demanda: cada hogar elegible recibe como máximo un mercado y el
                remanente queda sin usar. Departamento con 0 hogares: no genera
                filas. Grave mayor que moderada o grave: el valor se rechaza.
              </p>
              <h3>Supuestos y límites</h3>
              <p>
                Se incluyen los 32 departamentos y Bogotá D. C., con las
                prevalencias 2025 del boletín DANE (moderada o grave/grave).
                Esto conserva los valores del ejercicio para Risaralda 10,3/1,5;
                Caldas 9,2/1,3; Córdoba 40,2/5,9; La Guajira 47,8/16,4 y Chocó
                56,8/17,9. Se crean 1.000 hogares simulados por ubicación y 500 mercados como
                punto de partida. Para evitar contar dos veces a hogares graves,
                la proporción exclusivamente moderada se calcula como diferencia
                entre prevalencia moderada o grave y prevalencia grave. Los
                conteos se redondean al entero más cercano.
              </p>
              <p>
                Las prevalencias departamentales corresponden al boletín técnico
                DANE FIES 2025; los hogares y mercados del escenario, la
                secuencia original y todos los resultados son simulaciones
                didácticas. No describen un sistema de distribución oficial del
                DANE ni de una entidad pública.
              </p>
            </section>
          </>
        )}
        <footer>
          <span>
            {" "}
            <i>·</i>{" "}
          </span>
          <span></span>
        </footer>
      </main>
    </div>
  );
}
function traceWindow(rows: Row[]) {
  if (rows.length <= 40) return rows;
  const depleted = rows.findIndex(
    (r) => r.stockBefore > 0 && r.stockAfter === 0,
  );
  if (depleted < 20) return rows.slice(0, 40);
  return [
    ...rows.slice(0, 20),
    ...rows.slice(
      Math.max(20, depleted - 9),
      Math.min(rows.length, depleted + 11),
    ),
  ];
}
function Trace({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="panel trace-panel">
      <div className="panel-title">
        <div>
          <h3>{title}</h3>
          <p>Registro de stock antes y después de cada decisión.</p>
        </div>
        <span className="source-badge">{rows.length} ITERACIONES</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>ID HOGAR</th>
              <th>DEPARTAMENTO</th>
              <th>NECESIDAD</th>
              <th>INVENTARIO INICIAL</th>
              <th>DECISIÓN</th>
              <th>INVENTARIO FINAL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${title}-${r.iteration}`}>
                <td>{r.iteration}</td>
                <td>
                  <b>{r.id}</b>
                </td>
                <td>{r.department}</td>
                <td>
                  <span className={r.need === "Grave" ? "need severe" : "need"}>
                    {r.need}
                  </span>
                </td>
                <td>{r.stockBefore}</td>
                <td>{r.action}</td>
                <td>{r.stockAfter}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="empty">
            No hay hogares con necesidad en este escenario.
          </div>
        )}
      </div>
    </section>
  );
}

export default App;

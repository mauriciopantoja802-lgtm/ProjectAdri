"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CanalVenta } from "@prisma/client";
import { CANAL_VENTA, ORDEN_CANALES } from "@/lib/etiquetas";
import { formatoCOP } from "@/lib/formato";

const compacto = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });
const etiquetaDia = (dia: string) => {
  const [, m, d] = dia.split("-");
  return `${Number(d)}/${Number(m)}`;
};
const diaLargo = (dia: string) =>
  new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Bogota" }).format(new Date(`${dia}T12:00:00-05:00`));

function TablaAlternativa({ titulo, filas }: { titulo: string; filas: [string, string][] }) {
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-primary">Ver como tabla</summary>
      <table className="mt-2 w-full text-xs">
        <caption className="sr-only">{titulo}</caption>
        <tbody>
          {filas.map(([a, b]) => (
            <tr key={a} className="border-b border-border/60">
              <th scope="row" className="py-1 text-left font-normal">{a}</th>
              <td className="py-1 text-right tabular-nums">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Ventas por día: una sola serie (la marca), barras delgadas con extremos redondeados. */
export function GraficaVentasDia({ datos }: { datos: { dia: string; ventas: number; pedidos: number }[] }) {
  return (
    <div>
      <div className="h-64 w-full" role="img" aria-label={`Ventas por día de los últimos ${datos.length} días`}>
        <ResponsiveContainer>
          <BarChart data={datos} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="dia"
              tickFormatter={etiquetaDia}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              interval="preserveStartEnd"
              minTickGap={18}
            />
            <YAxis
              tickFormatter={(v: number) => `$${compacto.format(v)}`}
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              content={({ active, payload }) => {
                const d = payload?.[0]?.payload as { dia: string; ventas: number; pedidos: number } | undefined;
                if (!active || !d) return null;
                return (
                  <div className="rounded-xl border border-border bg-white px-3 py-2 text-xs shadow-lg">
                    <p className="font-semibold capitalize">{diaLargo(d.dia)}</p>
                    <p className="text-sm font-bold text-berry">{formatoCOP(d.ventas)}</p>
                    <p className="text-muted-foreground">{d.pedidos} venta(s)</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="ventas" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TablaAlternativa titulo="Ventas por día" filas={datos.filter((d) => d.ventas > 0).map((d) => [diaLargo(d.dia), formatoCOP(d.ventas)])} />
    </div>
  );
}

/** Ventas por canal: dona con orden y colores fijos por canal, leyenda con valores (nunca solo color). */
export function GraficaCanales({ datos }: { datos: { canal: CanalVenta; ventas: number; pedidos: number }[] }) {
  const ordenados = ORDEN_CANALES.map((c) => datos.find((d) => d.canal === c)).filter((d): d is NonNullable<typeof d> => Boolean(d && d.ventas > 0));
  const total = ordenados.reduce((t, d) => t + d.ventas, 0);
  if (!total) return <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay ventas este mes.</p>;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="size-48 shrink-0" role="img" aria-label="Ventas del mes por canal">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={ordenados} dataKey="ventas" nameKey="canal" innerRadius="60%" outerRadius="95%" stroke="var(--card)" strokeWidth={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
              {ordenados.map((d) => (
                <Cell key={d.canal} fill={CANAL_VENTA[d.canal].color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                const d = payload?.[0]?.payload as { canal: CanalVenta; ventas: number; pedidos: number } | undefined;
                if (!active || !d) return null;
                return (
                  <div className="rounded-xl border border-border bg-white px-3 py-2 text-xs shadow-lg">
                    <p className="font-semibold">{CANAL_VENTA[d.canal].etiqueta}</p>
                    <p className="text-sm font-bold text-berry">{formatoCOP(d.ventas)}</p>
                    <p className="text-muted-foreground">{d.pedidos} venta(s) · {Math.round((d.ventas / total) * 100)}%</p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2 text-sm" aria-label="Leyenda">
        {ordenados.map((d) => (
          <li key={d.canal} className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: CANAL_VENTA[d.canal].color }} aria-hidden />
            <span className="flex-1">{CANAL_VENTA[d.canal].etiqueta}</span>
            <span className="font-semibold tabular-nums">{formatoCOP(d.ventas)}</span>
            <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{Math.round((d.ventas / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

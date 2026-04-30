import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  Scissors,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
} from "lucide-react";

const getWeekNumber = (d) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

export default function Informes() {
  const [ventas, setVentas] = useState([]);
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [todosLosBarberos, setTodosLosBarberos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modo, setModo] = useState("dia");
  const [fechaBase, setFechaBase] = useState(new Date());
  const [filtroBarbero, setFiltroBarbero] = useState("todos");

  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: p } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setPerfilUsuario(p);

      if (p.rol === "admin") {
        const { data: barberos } = await supabase
          .from("perfiles")
          .select("id, nombre");

        setTodosLosBarberos(barberos || []);
      }

      const { data: v } = await supabase.from("ventas").select("*");
      setVentas(v || []);
    }

    setLoading(false);
  };

  // 🔎 FILTRADO
  const misVentasPeriodo = ventas.filter((v) => {
    const fVenta = new Date(v.created_at);
    let coincideTiempo = false;

    if (modo === "dia") {
      coincideTiempo = fVenta.toDateString() === fechaBase.toDateString();
    } else if (modo === "mes") {
      coincideTiempo =
        fVenta.getMonth() === fechaBase.getMonth() &&
        fVenta.getFullYear() === fechaBase.getFullYear();
    } else {
      coincideTiempo =
        getWeekNumber(fVenta) === getWeekNumber(fechaBase) &&
        fVenta.getFullYear() === fechaBase.getFullYear();
    }

    if (perfilUsuario?.rol === "admin") {
      return (
        coincideTiempo &&
        (filtroBarbero === "todos"
          ? true
          : v.id_empleado === filtroBarbero)
      );
    } else {
      return coincideTiempo && v.id_empleado === perfilUsuario?.id;
    }
  });

  // 💰 RESUMEN PAGOS
  const resumenPagos = misVentasPeriodo.reduce(
    (acc, v) => {
      if (v.metodo_pago === "efectivo") {
        acc.efectivo.total += Number(v.total);
        acc.efectivo.count += v.servicios_id?.length || 1;
      }

      if (v.metodo_pago === "tarjeta") {
        acc.tarjeta.total += Number(v.total);
        acc.tarjeta.count += v.servicios_id?.length || 1;
      }

      return acc;
    },
    {
      efectivo: { total: 0, count: 0 },
      tarjeta: { total: 0, count: 0 },
    }
  );

  const cambiarPeriodo = (offset) => {
    const nueva = new Date(fechaBase);

    if (modo === "dia") nueva.setDate(nueva.getDate() + offset);
    else if (modo === "mes") nueva.setMonth(nueva.getMonth() + offset);
    else nueva.setDate(nueva.getDate() + offset * 7);

    setFechaBase(nueva);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#FFCC00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-20 px-4">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between mb-10 gap-6">
        <h2 className="text-3xl font-black">
          Informes
        </h2>

        <div className="flex bg-[#121212] rounded-xl p-1">
          {["dia","semana","mes"].map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`px-4 py-2 rounded-lg text-xs uppercase font-bold ${
                modo === m
                  ? "bg-[#FFCC00] text-black"
                  : "text-neutral-400"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* FILTRO BARBERO */}
      {perfilUsuario?.rol === "admin" && (
        <div className="mb-8 flex gap-3 items-center bg-[#121212] p-4 rounded-xl">
          <Filter size={18} className="text-[#FFCC00]" />

          <select
            value={filtroBarbero}
            onChange={(e) => setFiltroBarbero(e.target.value)}
            className="bg-transparent text-white w-full outline-none"
          >
            <option value="todos">Todos</option>
            {todosLosBarberos.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* NAVEGACIÓN */}
      <div className="flex justify-between items-center mb-10 bg-[#121212] p-4 rounded-xl max-w-xl mx-auto">
        <button onClick={() => cambiarPeriodo(-1)}>
          <ChevronLeft />
        </button>

        <span className="font-bold">
          {modo === "dia" && fechaBase.toLocaleDateString()}
          {modo === "mes" && `${meses[fechaBase.getMonth()]} ${fechaBase.getFullYear()}`}
          {modo === "semana" && `Semana ${getWeekNumber(fechaBase)}`}
        </span>

        <button onClick={() => cambiarPeriodo(1)}>
          <ChevronRight />
        </button>
      </div>

      {/* RESUMEN PAGOS */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">

        <div className="bg-[#121212] p-6 rounded-2xl border border-green-500/20">
          <p className="text-green-400 text-xs uppercase mb-2">Efectivo</p>
          <h3 className="text-3xl font-bold text-green-400">
            €{resumenPagos.efectivo.total.toFixed(2)}
          </h3>
          <p className="text-xs text-neutral-400">
            {resumenPagos.efectivo.count} servicios
          </p>
        </div>

        <div className="bg-[#121212] p-6 rounded-2xl border border-blue-500/20">
          <p className="text-blue-400 text-xs uppercase mb-2">Tarjeta</p>
          <h3 className="text-3xl font-bold text-blue-400">
            €{resumenPagos.tarjeta.total.toFixed(2)}
          </h3>
          <p className="text-xs text-neutral-400">
            {resumenPagos.tarjeta.count} servicios
          </p>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-[#121212] rounded-2xl p-5">
        <h3 className="mb-4 text-sm text-neutral-400">
          Últimas ventas
        </h3>

        <div className="space-y-2">
          {misVentasPeriodo.map((v) => (
            <div
              key={v.id}
              className="flex justify-between bg-black/40 p-3 rounded-lg"
            >
              <span>{v.cliente || "Cliente"}</span>
              <span>{v.metodo_pago}</span>
              <span className="text-[#FFCC00]">
                €{v.total}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
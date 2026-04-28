import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  Scissors,
  Euro,
  CreditCard,
  TrendingUp,
  Users,
  Clock,
  ArrowUpRight,
  Activity,
  Award,
  ChevronRight
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const [ventas, setVentas] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [filtro, setFiltro] = useState("hoy");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("ventas-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ventas" },
        (payload) => {
          setVentas((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: v } = await supabase.from("ventas").select("*").order("created_at", { ascending: false });
    const { data: p } = await supabase.from("perfiles").select("*");
    setVentas(v || []);
    setPerfiles(p || []);
    setLoading(false);
  };

  const now = new Date();
  const ventasFiltradas = ventas.filter((v) => {
    const fecha = new Date(v.created_at);
    if (filtro === "hoy") return fecha.toDateString() === now.toDateString();
    if (filtro === "semana") {
      const semana = new Date();
      semana.setDate(now.getDate() - 7);
      return fecha >= semana;
    }
    if (filtro === "mes") {
      return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // --- CÁLCULOS DE NEGOCIO ---
  const totalVentas = ventasFiltradas.reduce((acc, v) => acc + Number(v.total), 0);
  const totalServicios = ventasFiltradas.reduce((acc, v) => acc + (v.servicios_id?.length || 0), 0);
  const ticketMedio = ventasFiltradas.length > 0 ? totalVentas / ventasFiltradas.length : 0;

  // Lógica de Ranking de Barberos
  const rankingBarberos = perfiles.map(emp => {
    const totalEmp = ventasFiltradas
      .filter(v => v.id_empleado === emp.id)
      .reduce((acc, v) => acc + Number(v.total), 0);
    return { ...emp, totalVentas: totalEmp };
  }).sort((a, b) => b.totalVentas - a.totalVentas);

  const barberoEstrella = rankingBarberos[0];

  const dataGrafico = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const total = ventas
      .filter((v) => new Date(v.created_at).toDateString() === d.toDateString())
      .reduce((acc, v) => acc + Number(v.total), 0);
    return {
      dia: d.toLocaleDateString("es-ES", { weekday: "short" }),
      total,
    };
  }).reverse();

  const getEmpleadoNombre = (id) => {
    const emp = perfiles.find((p) => p.id === id);
    return emp?.nombre || "Sistema";
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* 🟢 HEADER DINÁMICO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Live Control Panel</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
            Visión <span className="text-[#FFCC00]">General</span>
          </h2>
        </div>

        <div className="flex p-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl w-full lg:w-auto">
          {['hoy', 'semana', 'mes'].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${filtro === f ? "bg-[#FFCC00] text-black shadow-xl" : "text-neutral-500 hover:text-white"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* 🟢 BENTO GRID - KPIs ACTUALIZADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* FACTURACIÓN */}
        <div className="bg-[#0D0D0D] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 text-[#FFCC00]/5 group-hover:scale-110 transition-transform">
            <Euro size={100} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-6">Recaudación Periodo</p>
          <h3 className="text-4xl font-black italic">€{totalVentas.toLocaleString('es-ES')}</h3>
        </div>

        {/* BARBERO ESTRELLA */}
        <div className="bg-[#FFCC00] p-8 rounded-[2.5rem] border border-transparent relative overflow-hidden group shadow-[0_20px_40px_rgba(255,204,0,0.15)]">
          <Award size={24} className="text-black mb-6" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50 mb-1">Top Profesional</p>
          <h3 className="text-2xl font-black text-black uppercase truncate italic">
            {barberoEstrella?.totalVentas > 0 ? barberoEstrella.nombre : "Sin Datos"}
          </h3>
          <p className="text-[10px] font-bold text-black/60 uppercase mt-2 italic">
            Líder en ventas {filtro}
          </p>
        </div>

        {/* TICKET MEDIO */}
        <div className="bg-[#0D0D0D] p-8 rounded-[2.5rem] border border-white/5">
          <CreditCard size={24} className="text-blue-400 mb-6" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1">Ticket Medio</p>
          <h3 className="text-4xl font-black italic">€{ticketMedio.toFixed(2)}</h3>
        </div>

        {/* TOTAL SERVICIOS */}
        <div className="bg-[#0D0D0D] p-8 rounded-[2.5rem] border border-white/5">
          <Scissors size={24} className="text-white mb-6" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1">Total Servicios</p>
          <h3 className="text-4xl font-black italic">{totalServicios}</h3>
        </div>
      </div>

      {/* 🟢 SECCIÓN RENDIMIENTO Y GRÁFICO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* GRÁFICO */}
        <div className="lg:col-span-2 bg-black border border-white/5 p-8 rounded-[3rem]">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400 mb-10">Ingresos Semanales</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataGrafico}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFCC00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FFCC00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="dia" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D0D0D', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#FFCC00', fontWeight: '900' }}
                />
                <Area type="monotone" dataKey="total" stroke="#FFCC00" strokeWidth={4} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RENDIMIENTO POR EQUIPO */}
        <div className="bg-[#0D0D0D] border border-white/5 p-8 rounded-[3rem]">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400 mb-8">Productividad Equipo</h3>
          <div className="space-y-6">
            {rankingBarberos.map((emp) => {
              const porcentaje = totalVentas > 0 ? (emp.totalVentas / totalVentas) * 100 : 0;
              return (
                <div key={emp.id} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase text-white tracking-widest">{emp.nombre}</span>
                    <span className="text-[10px] font-black text-[#FFCC00]">€{emp.totalVentas.toFixed(0)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#FFCC00] rounded-full transition-all duration-1000"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🟢 LISTA DE ÚLTIMAS VENTAS (ESTILO FEED) */}
      <div className="bg-black border border-white/5 p-8 rounded-[3rem]">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400 mb-8">Feed de Actividad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ventasFiltradas.slice(0, 8).map((v) => (
            <div key={v.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.04] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center font-black text-[#FFCC00] text-xs">
                  {v.cliente?.[0] || 'C'}
                </div>
                <div className="text-right">
                  <span className="block text-xs font-black italic">€{v.total}</span>
                  <span className="text-[8px] font-black uppercase text-neutral-600 tracking-widest">{v.metodo_pago}</span>
                </div>
              </div>
              <p className="text-[10px] font-black uppercase text-white mb-1 truncate">{v.cliente || "Cliente General"}</p>
              <p className="text-[9px] font-bold text-[#FFCC00] uppercase italic">{getEmpleadoNombre(v.id_empleado)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
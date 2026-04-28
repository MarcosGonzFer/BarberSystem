import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { 
  Scissors, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  User,
  ShieldCheck,
  ClipboardList,
  Filter
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
  const [todosLosBarberos, setTodosLosBarberos] = useState([]); // Para el filtro de admin
  const [loading, setLoading] = useState(true);
  
  // FILTROS
  const [modo, setModo] = useState("dia"); 
  const [fechaBase, setFechaBase] = useState(new Date());
  const [filtroBarbero, setFiltroBarbero] = useState("todos"); // "todos" o ID del barbero

  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: p } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
      setPerfilUsuario(p);

      // Si es admin, cargamos la lista de todos los barberos para el filtro
      if (p.rol === "admin") {
        const { data: barberos } = await supabase.from("perfiles").select("id, nombre");
        setTodosLosBarberos(barberos || []);
      }

      const { data: v } = await supabase.from("ventas").select("*");
      setVentas(v || []);
    }
    setLoading(false);
  };

  const misVentasPeriodo = ventas.filter(v => {
    const fVenta = new Date(v.created_at);
    let coincideTiempo = false;
    
    if (modo === "dia") coincideTiempo = fVenta.toDateString() === fechaBase.toDateString();
    else if (modo === "mes") coincideTiempo = fVenta.getMonth() === fechaBase.getMonth() && fVenta.getFullYear() === fechaBase.getFullYear();
    else coincideTiempo = getWeekNumber(fVenta) === getWeekNumber(fechaBase) && fVenta.getFullYear() === fechaBase.getFullYear();

    // Lógica de filtrado por persona
    if (perfilUsuario?.rol === "admin") {
      // Si el admin elige un barbero específico, filtramos. Si no, todos.
      return coincideTiempo && (filtroBarbero === "todos" ? true : v.id_empleado === filtroBarbero);
    } else {
      // El empleado solo ve lo suyo
      return coincideTiempo && v.id_empleado === perfilUsuario?.id;
    }
  });

  const cambiarPeriodo = (offset) => {
    const nuevaFecha = new Date(fechaBase);
    if (modo === "dia") nuevaFecha.setDate(fechaBase.getDate() + offset);
    else if (modo === "mes") nuevaFecha.setMonth(fechaBase.getMonth() + offset);
    else nuevaFecha.setDate(fechaBase.getDate() + (offset * 7));
    setFechaBase(nuevaFecha);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-[#FFCC00] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="animate-in fade-in duration-700 pb-20 px-4">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">
            Panel de <span className="text-[#FFCC00]">Actividad</span>
          </h2>
          <p className="text-neutral-500 text-[10px] font-bold uppercase mt-1 tracking-widest italic">
            Visualizando registros de {perfilUsuario?.nombre}
          </p>
        </div>

        {/* SELECTOR DE MODO */}
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl">
          {['dia', 'semana', 'mes'].map((m) => (
            <button key={m} onClick={() => setModo(m)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${modo === m ? "bg-[#FFCC00] text-black" : "text-neutral-500 hover:text-white"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* --- SOLO ADMIN: FILTRO DE BARBEROS --- */}
      {perfilUsuario?.rol === "admin" && (
        <div className="mb-8 flex items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/10 max-w-2xl mx-auto">
          <div className="bg-[#FFCC00] p-2 rounded-lg text-black">
            <Filter size={18} />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black uppercase text-neutral-500 mb-1 tracking-widest">Filtrar por Barbero</p>
            <select 
              value={filtroBarbero}
              onChange={(e) => setFiltroBarbero(e.target.value)}
              className="bg-transparent text-white font-black uppercase italic text-sm w-full outline-none appearance-none cursor-pointer"
            >
              <option value="todos" className="bg-[#0D0D0D]">Todos los barberos</option>
              {todosLosBarberos.map(b => (
                <option key={b.id} value={b.id} className="bg-[#0D0D0D]">{b.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN TEMPORAL */}
      <div className="flex items-center justify-between mb-8 bg-[#0D0D0D] border border-white/5 p-4 rounded-[2rem] max-w-xl mx-auto">
        <button onClick={() => cambiarPeriodo(-1)} className="p-2 text-[#FFCC00] hover:bg-white/5 rounded-full"><ChevronLeft size={24} /></button>
        <div className="text-center font-black uppercase text-white">
            {modo === "dia" && fechaBase.toLocaleDateString()}
            {modo === "mes" && `${meses[fechaBase.getMonth()]} ${fechaBase.getFullYear()}`}
            {modo === "semana" && `Semana ${getWeekNumber(fechaBase)}`}
        </div>
        <button onClick={() => cambiarPeriodo(1)} className="p-2 text-[#FFCC00] hover:bg-white/5 rounded-full"><ChevronRight size={24} /></button>
      </div>

      {/* CONTADOR */}
      <div className="max-w-md mx-auto mb-12">
        <div className="bg-[#FFCC00] p-10 rounded-[3rem] text-black relative overflow-hidden text-center shadow-2xl shadow-[#FFCC00]/10">
          <Scissors className="absolute -right-6 -top-6 text-black/10 w-40 h-40 rotate-12" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] mb-2 opacity-70 italic">Total Servicios</span>
          <h3 className="text-8xl font-black italic tracking-tighter">{misVentasPeriodo.length}</h3>
        </div>
      </div>

      {/* TABLA MEJORADA */}
      <div className="bg-[#0D0D0D] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 italic">Desglose Detallado</h3>
          <ClipboardList size={18} className="text-[#FFCC00]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[9px] font-black uppercase tracking-widest text-neutral-600 border-b border-white/5">
                <th className="px-10 py-6">Hora</th>
                <th className="px-10 py-6">Cliente</th>
                <th className="px-10 py-6">Servicio</th>
                {perfilUsuario?.rol === 'admin' && <th className="px-10 py-6">Barbero</th>}
                {perfilUsuario?.rol === 'admin' && <th className="px-10 py-6 text-[#FFCC00]">Importe</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {misVentasPeriodo.map((v) => {
                const barbero = todosLosBarberos.find(b => b.id === v.id_empleado);
                return (
                  <tr key={v.id} className="hover:bg-white/[0.02] transition-all">
                    <td className="px-10 py-6 text-xs text-neutral-500 font-bold">
                      {new Date(v.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black uppercase text-white italic">{v.nombre_cliente || "Cliente"}</span>
                        <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-tighter">Fidelizado</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-xs font-black uppercase text-[#FFCC00] italic bg-[#FFCC00]/5 px-3 py-1 rounded-full border border-[#FFCC00]/10">
                        {v.servicio || "Corte Estándar"}
                      </span>
                    </td>
                    {perfilUsuario?.rol === 'admin' && (
                      <td className="px-10 py-6 text-xs font-black uppercase text-neutral-400 italic">
                        {barbero?.nombre || "N/A"}
                      </td>
                    )}
                    {perfilUsuario?.rol === 'admin' && (
                      <td className="px-10 py-6 text-sm font-black text-[#FFCC00] font-mono italic">
                        €{Number(v.total).toFixed(2)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {misVentasPeriodo.length === 0 && (
            <div className="py-20 text-center opacity-30">
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">Sin registros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { 
  Users, TrendingUp, Download, Banknote, Wallet, 
  CalendarDays, ChevronLeft, ChevronRight, Calendar
} from "lucide-react";

// Función auxiliar para obtener el número de semana
const getWeekNumber = (d) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Función para obtener el rango de fechas de una semana
const getWeekRange = (weekNo, year) => {
  const firstDayOfYear = new Date(year, 0, 1);
  const days = (weekNo - 1) * 7;
  const start = new Date(year, 0, firstDayOfYear.getDay() <= 4 ? firstDayOfYear.getDate() - firstDayOfYear.getDay() + 1 + days : firstDayOfYear.getDate() + 8 - firstDayOfYear.getDay() + days);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.getDate()}/${start.getMonth() + 1} al ${end.getDate()}/${end.getMonth() + 1}`;
};

export default function Liquidaciones() {
  const [ventas, setVentas] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE FILTRO ---
  const [modo, setModo] = useState("mes"); // "mes" o "semana"
  const [fechaBase, setFechaBase] = useState(new Date());

  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: v } = await supabase.from("ventas").select("*");
    const { data: p } = await supabase.from("perfiles").select("*");
    setVentas(v || []);
    setPerfiles(p || []);
    setLoading(false);
  };

  // --- FILTRADO INTELIGENTE ---
  const ventasPeriodo = ventas.filter(v => {
    const fVenta = new Date(v.created_at);
    if (modo === "mes") {
      return fVenta.getMonth() === fechaBase.getMonth() && fVenta.getFullYear() === fechaBase.getFullYear();
    } else {
      return getWeekNumber(fVenta) === getWeekNumber(fechaBase) && fVenta.getFullYear() === fechaBase.getFullYear();
    }
  });

  const adminProfile = perfiles.find(p => p.rol === "admin");
  const nombreAdmin = adminProfile ? adminProfile.nombre : "Admin";

  const reporteEmpleados = perfiles.map(emp => {
    const totalGenerado = ventasPeriodo.filter(v => v.id_empleado === emp.id).reduce((acc, v) => acc + Number(v.total), 0);
    const esAdmin = emp.rol === "admin";
    const ganadoPorBarbero = esAdmin ? totalGenerado : totalGenerado * 0.50;
    const ganadoParaAdmin = esAdmin ? 0 : totalGenerado - ganadoPorBarbero;
    return { ...emp, totalGenerado, ganadoPorBarbero, ganadoParaAdmin };
  });

  const totalFinalAdmin = reporteEmpleados.reduce((acc, item) => acc + (item.rol === "admin" ? item.totalGenerado : item.ganadoParaAdmin), 0);
  const totalPagosEmpleados = reporteEmpleados.filter(emp => emp.rol !== "admin").reduce((acc, item) => acc + item.ganadoPorBarbero, 0);

  const cambiarPeriodo = (offset) => {
    const nuevaFecha = new Date(fechaBase);
    if (modo === "mes") nuevaFecha.setMonth(fechaBase.getMonth() + offset);
    else nuevaFecha.setDate(fechaBase.getDate() + (offset * 7));
    setFechaBase(nuevaFecha);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-[#FFCC00] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      
      {/* HEADER Y SELECTORES */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
        <div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">
            Corte de <span className="text-[#FFCC00]">Ganancias</span>
          </h2>
          <div className="flex items-center gap-3 mt-3 bg-white/5 p-2 rounded-xl w-fit">
            <button onClick={() => setModo("mes")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${modo === "mes" ? "bg-[#FFCC00] text-black" : "text-neutral-500"}`}>Vista Mensual</button>
            <button onClick={() => setModo("semana")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${modo === "semana" ? "bg-[#FFCC00] text-black" : "text-neutral-500"}`}>Vista Semanal</button>
          </div>
        </div>

        {/* NAVEGADOR DE TIEMPO */}
        <div className="flex items-center bg-black border border-white/10 rounded-[2rem] p-2 gap-4 shadow-2xl">
          <button onClick={() => cambiarPeriodo(-1)} className="p-3 hover:bg-white/5 rounded-full text-[#FFCC00] transition-all"><ChevronLeft size={24} /></button>
          <div className="text-center min-w-[200px]">
            <p className="text-[10px] font-black text-[#FFCC00] uppercase tracking-[0.2em] mb-1">
              {modo === "mes" ? "Liquidación Mensual" : `Semana ${getWeekNumber(fechaBase)}`}
            </p>
            <h4 className="text-sm font-black text-white uppercase italic">
              {modo === "mes" ? `${meses[fechaBase.getMonth()]} ${fechaBase.getFullYear()}` : getWeekRange(getWeekNumber(fechaBase), fechaBase.getFullYear())}
            </h4>
          </div>
          <button onClick={() => cambiarPeriodo(1)} className="p-3 hover:bg-white/5 rounded-full text-[#FFCC00] transition-all"><ChevronRight size={24} /></button>
        </div>
      </div>

      {/* CARDS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-[#FFCC00] p-8 rounded-[3rem] text-black relative overflow-hidden group">
          <Banknote className="absolute -right-6 -top-6 text-black/10 w-40 h-40" />
          <p className="text-[11px] font-black uppercase tracking-widest mb-2 opacity-70 italic">Total Neto {nombreAdmin}</p>
          <h3 className="text-6xl font-black italic tracking-tighter">€{totalFinalAdmin.toFixed(2)}</h3>
        </div>
        <div className="bg-[#0D0D0D] border border-white/5 p-8 rounded-[3rem] relative overflow-hidden">
          <p className="text-[11px] font-black uppercase tracking-widest mb-2 text-neutral-500 italic">Pagos a Barberos</p>
          <h3 className="text-6xl font-black italic tracking-tighter text-white">€{totalPagosEmpleados.toFixed(2)}</h3>
        </div>
      </div>

      {/* SECCIÓN "PAGAR A..." */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-8 bg-[#FFCC00] rounded-full shadow-[0_0_20px_#FFCC00]" />
          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white">Sueldos a Liquidar</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reporteEmpleados.filter(emp => emp.rol !== "admin").map((emp) => (
            <div key={emp.id} className="bg-gradient-to-br from-[#0D0D0D] to-[#151515] border border-white/5 p-8 rounded-[2.5rem] hover:border-[#FFCC00]/40 transition-all group">
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-[#FFCC00]/10 rounded-2xl flex items-center justify-center text-[#FFCC00]"><Wallet size={24} /></div>
                <span className="text-[9px] font-black text-neutral-600 uppercase border border-white/5 px-3 py-1 rounded-full">Recibo #{getWeekNumber(fechaBase)}{emp.id.slice(0,2)}</span>
              </div>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Total a pagar a <span className="text-white">{emp.nombre}</span></p>
              <h4 className="text-4xl font-black text-[#FFCC00] italic tracking-tighter">€{emp.ganadoPorBarbero.toFixed(2)}</h4>
              <div className="mt-6 pt-6 border-t border-white/5 text-[9px] font-bold text-neutral-500 uppercase flex justify-between">
                <span>Ventas: €{emp.totalGenerado.toFixed(2)}</span>
                <span>Comisión: 50%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TABLA DE HISTORIAL */}
      <div className="bg-[#0D0D0D] border border-white/5 rounded-[3rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Detalle del Periodo</h3>
          <Calendar size={20} className="text-[#FFCC00]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-white/5 bg-white/[0.02]">
                <th className="px-10 py-6">Barbero</th>
                <th className="px-10 py-6">Bruto</th>
                <th className="px-10 py-6">Comisión</th>
                <th className="px-10 py-6 text-[#FFCC00]">Para {nombreAdmin}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reporteEmpleados.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-10 py-6 font-black text-xs uppercase text-white italic">{item.nombre}</td>
                  <td className="px-10 py-6 text-xs font-bold text-neutral-400">€{item.totalGenerado.toFixed(2)}</td>
                  <td className="px-10 py-6 text-xs font-black text-white">€{item.ganadoPorBarbero.toFixed(2)}</td>
                  <td className="px-10 py-6 text-xs font-black text-[#FFCC00]">
                    {item.rol === 'admin' ? "---" : `€${item.ganadoParaAdmin.toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
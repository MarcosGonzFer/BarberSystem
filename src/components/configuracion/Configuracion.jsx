import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { 
  Users, Scissors, Plus, Trash2, Loader2, 
  X, Check, ShieldCheck, Briefcase, ChevronRight 
} from "lucide-react";

export default function Configuracion() {
  const [tab, setTab] = useState("servicios");
  const [servicios, setServicios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nuevoServicio, setNuevoServicio] = useState({ nombre: "", precio: "", icono: "scissors" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: s } = await supabase.from("servicios").select("*").order("nombre");
    const { data: e } = await supabase.from("perfiles").select("*").order("nombre");
    setServicios(s || []);
    setEmpleados(e || []);
  };

  const guardarServicio = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("servicios").insert([
      { 
        nombre: nuevoServicio.nombre, 
        precio: parseFloat(nuevoServicio.precio), 
        icono: nuevoServicio.icono 
      }
    ]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setNuevoServicio({ nombre: "", precio: "", icono: "scissors" });
      setShowModal(false);
      fetchData();
    }
    setLoading(false);
  };

  const deleteItem = async (table, id) => {
    if (!confirm("¿Estás seguro de eliminar este elemento?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) fetchData();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 🟢 HEADER DE CONFIGURACIÓN */}
      <div className="mb-10">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-2">
          Ajustes del <span className="text-[#FFCC00]">Local</span>
        </h2>
        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Gestiona tu equipo y catálogo de servicios</p>
      </div>

      {/* 🟢 TABS NAV (ESTILO LUXURY) */}
      <div className="flex p-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl w-full max-w-md mb-10">
        <button 
          onClick={() => setTab("servicios")}
          className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300
            ${tab === 'servicios' ? "bg-[#FFCC00] text-black shadow-lg" : "text-neutral-500 hover:text-white"}`}
        >
          <Scissors size={14} /> Servicios
        </button>
        <button 
          onClick={() => setTab("empleados")}
          className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300
            ${tab === 'empleados' ? "bg-[#FFCC00] text-black shadow-lg" : "text-neutral-500 hover:text-white"}`}
        >
          <Users size={14} /> Empleados
        </button>
      </div>

      {/* 🟢 CONTENIDO DINÁMICO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* BOTÓN AÑADIR (SIEMPRE PRIMERO) */}
        {tab === "servicios" && (
          <button 
            onClick={() => setShowModal(true)}
            className="group relative h-48 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-[#FFCC00]/50 hover:bg-[#FFCC00]/5 transition-all duration-500"
          >
            <div className="p-4 bg-white/5 rounded-full group-hover:bg-[#FFCC00] group-hover:text-black transition-all duration-500">
              <Plus size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 group-hover:text-white">Nuevo Servicio</span>
          </button>
        )}

        {/* LISTADO DE SERVICIOS */}
        {tab === "servicios" && servicios.map((s) => (
          <div key={s.id} className="bg-[#0D0D0D] border border-white/5 p-8 rounded-[2.5rem] hover:border-white/20 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
               <Scissors size={60} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-1">Corte & Estilo</p>
            <h4 className="text-lg font-black uppercase italic mb-4">{s.nombre}</h4>
            <div className="flex justify-between items-end">
              <span className="text-3xl font-black text-[#FFCC00]">€{s.precio}</span>
              <button 
                onClick={() => deleteItem('servicios', s.id)}
                className="p-3 bg-white/5 rounded-2xl text-neutral-600 hover:text-red-500 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {/* LISTADO DE EMPLEADOS */}
        {tab === "empleados" && empleados.map((e) => (
          <div key={e.id} className="bg-[#0D0D0D] border border-white/5 p-6 rounded-[2.5rem] flex items-center justify-between group hover:bg-[#121212] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-neutral-800 to-neutral-700 rounded-2xl flex items-center justify-center font-black text-[#FFCC00] text-xl border border-white/10 shadow-xl">
                {e.nombre[0]}
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight">{e.nombre}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {e.rol === 'admin' ? <ShieldCheck size={12} className="text-[#FFCC00]" /> : <Briefcase size={12} className="text-neutral-500" />}
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{e.rol}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => deleteItem('perfiles', e.id)}
              className="p-3 text-neutral-700 hover:text-red-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* 🟢 MODAL LUXURY PARA NUEVO SERVICIO */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-[#050505] border border-white/10 w-full max-w-md rounded-[3rem] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="absolute top-0 right-0 p-10 text-white/5 -z-10">
              <Scissors size={150} />
            </div>

            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Crear <span className="text-[#FFCC00]">Servicio</span></h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-neutral-500 hover:text-white transition-all">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={guardarServicio} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#FFCC00] tracking-[0.2em] ml-1">Nombre del Servicio</label>
                <input 
                  required
                  className="w-full bg-white/5 border border-white/5 rounded-[1.5rem] px-6 py-5 outline-none focus:border-[#FFCC00]/50 focus:bg-white/[0.08] transition-all text-sm font-bold uppercase"
                  placeholder="Ej: AFEITADO TRADICIONAL"
                  value={nuevoServicio.nombre}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, nombre: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#FFCC00] tracking-[0.2em] ml-1">Precio de Venta (€)</label>
                <div className="relative">
                  <input 
                    required
                    type="number"
                    step="0.01"
                    className="w-full bg-white/5 border border-white/5 rounded-[1.5rem] px-6 py-5 outline-none focus:border-[#FFCC00]/50 focus:bg-white/[0.08] transition-all text-2xl font-black"
                    placeholder="00.00"
                    value={nuevoServicio.precio}
                    onChange={(e) => setNuevoServicio({...nuevoServicio, precio: e.target.value})}
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-neutral-700">EUR</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFCC00] text-black font-black py-6 rounded-[1.5rem] flex items-center justify-center gap-3 hover:shadow-[0_15px_30px_rgba(255,204,0,0.3)] hover:-translate-y-1 active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Check size={20} strokeWidth={3}/> GUARDAR CAMBIOS</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
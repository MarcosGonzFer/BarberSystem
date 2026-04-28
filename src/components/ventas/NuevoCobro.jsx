import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { 
  Scissors, Sparkles, Zap, CreditCard, Banknote, 
  User, Trash2, Loader2, CheckCircle2, ShoppingBag, Lock 
} from "lucide-react";

const iconMap = { scissors: Scissors, sparkles: Sparkles, zap: Zap };

export default function NuevoCobro() {
  const [servicios, setServicios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState("");
  const [cliente, setCliente] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 1. Obtener usuario y su perfil
    const { data: { user } } = await supabase.auth.getUser();
    const { data: p } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
    setPerfilUsuario(p);

    // 2. Si es empleado, fijamos su ID automáticamente
    if (p?.rol === "empleado") {
      setEmpleadoSeleccionado(p.id);
    }

    // 3. Cargar servicios y lista de empleados (perfiles)
    const { data: s } = await supabase.from("servicios").select("*").order("nombre");
    const { data: e } = await supabase.from("perfiles").select("*").order("nombre");
    setServicios(s || []);
    setEmpleados(e || []);
  };

  const toggleServicio = (servicio) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.id === servicio.id);
      if (existe) return prev.filter((item) => item.id !== servicio.id);
      return [...prev, servicio];
    });
  };

  const total = carrito.reduce((acc, s) => acc + Number(s.precio), 0);

  const finalizarCobro = async () => {
    if (!empleadoSeleccionado || carrito.length === 0 || !metodoPago) return;
    setIsSaving(true);
    
    const { error } = await supabase.from("ventas").insert([{
      id_empleado: empleadoSeleccionado,
      cliente: cliente || "Cliente General",
      total,
      metodo_pago: metodoPago,
      servicios_id: carrito.map((s) => s.id),
    }]);

    setIsSaving(false);
    if (error) return alert("Error: " + error.message);
    
    // Resetear formulario
    setCarrito([]);
    setCliente("");
    setMetodoPago("");
    if (perfilUsuario?.rol === "admin") setEmpleadoSeleccionado("");
  };

  return (
    <div className="animate-in fade-in duration-700 pb-20 lg:pb-0">
      
      {/* 🟢 TOP BAR: DATOS DE LA VENTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        {/* INPUT CLIENTE */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-4">
            Identificación Cliente
          </label>
          <div className="group flex items-center gap-4 bg-[#0D0D0D] border border-white/5 p-2 pl-6 rounded-[2rem] focus-within:border-[#FFCC00]/50 transition-all">
            <User size={18} className="text-neutral-500 group-focus-within:text-[#FFCC00]" />
            <input
              placeholder="NOMBRE O TELÉFONO..."
              className="bg-transparent outline-none w-full py-4 text-xs font-black uppercase tracking-widest placeholder:text-neutral-700 text-white"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
          </div>
        </div>

        {/* SELECTOR DE BARBERO (ADMIN VISUAL / EMPLEADO FIJO) */}
        <div className="relative">
          {perfilUsuario?.rol === "admin" ? (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-4">
                Asignar Barbero Profesional
              </label>
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {empleados.map((emp) => {
                  const estaSeleccionado = empleadoSeleccionado === emp.id;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => setEmpleadoSeleccionado(emp.id)}
                      className={`flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-full border transition-all duration-300 ${
                        estaSeleccionado
                          ? "bg-[#FFCC00] border-[#FFCC00] shadow-[0_10px_20px_rgba(255,204,0,0.2)]"
                          : "bg-[#0D0D0D] border-white/5 hover:border-white/20 text-neutral-400"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${
                        estaSeleccionado ? "bg-black text-[#FFCC00]" : "bg-white/5 text-white"
                      }`}>
                        {emp.nombre[0].toUpperCase()}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        estaSeleccionado ? "text-black" : "text-white"
                      }`}>
                        {emp.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-4">
                Personal Atendiendo
              </label>
              <div className="bg-[#0D0D0D]/50 border border-white/5 p-4 rounded-[2rem] flex justify-between items-center opacity-80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFCC00] flex items-center justify-center font-black text-[10px] text-black">
                    {perfilUsuario?.nombre?.[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-black uppercase text-[#FFCC00] tracking-tighter">
                    {perfilUsuario?.nombre}
                  </span>
                </div>
                <Lock size={14} className="text-neutral-700" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* 🟢 IZQUIERDA: CATÁLOGO */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Menú de Servicios</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {servicios.map((servicio) => {
              const Icon = iconMap[servicio.icono] || Scissors;
              const estaEnCarrito = carrito.find(s => s.id === servicio.id);

              return (
                <button
                  key={servicio.id}
                  onClick={() => toggleServicio(servicio)}
                  className={`relative group p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col items-center gap-4
                  ${estaEnCarrito 
                    ? "bg-[#FFCC00] border-transparent shadow-[0_20px_40px_rgba(255,204,0,0.2)] scale-[0.98]" 
                    : "bg-[#0D0D0D] border-white/5 hover:border-[#FFCC00]/40 hover:bg-[#121212]"
                  }`}
                >
                  {estaEnCarrito && (
                    <CheckCircle2 size={20} className="absolute top-6 right-6 text-black animate-in zoom-in" fill="currentColor" />
                  )}
                  
                  <Icon size={32} className={estaEnCarrito ? "text-black" : "text-[#FFCC00] group-hover:scale-110 transition-transform"} />
                  
                  <div className="text-center">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${estaEnCarrito ? "text-black/60" : "text-neutral-500"}`}>Servicio</p>
                    <p className={`text-sm font-black uppercase italic tracking-tighter ${estaEnCarrito ? "text-black" : "text-white"}`}>{servicio.nombre}</p>
                    <p className={`text-xl font-black mt-2 ${estaEnCarrito ? "text-black" : "text-[#FFCC00]"}`}>€{servicio.precio}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 🟢 DERECHA: TICKET */}
        <div className="lg:w-[400px]">
          <div className="bg-[#0D0D0D] border border-white/5 rounded-[3rem] p-8 sticky top-24 shadow-2xl">
            <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-6">
              <ShoppingBag size={18} className="text-[#FFCC00]" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Resumen</h3>
            </div>

            <div className="space-y-6 mb-10 min-h-[100px] max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {carrito.length === 0 ? (
                <p className="text-[10px] text-center text-neutral-700 font-black uppercase py-10 border border-dashed border-white/5 rounded-3xl">Venta vacía</p>
              ) : (
                carrito.map((item) => (
                  <div key={item.id} className="flex justify-between items-center group animate-in slide-in-from-right-4">
                    <span className="text-xs font-black uppercase text-white">{item.nombre}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-sm text-[#FFCC00]">€{item.precio}</span>
                      <button onClick={() => toggleServicio(item)} className="text-neutral-600 hover:text-red-500 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-6 pt-6 border-t border-white/5">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase text-neutral-500">Total</span>
                <span className="text-5xl font-black text-white tracking-tighter">
                  <span className="text-[#FFCC00] text-2xl mr-1">€</span>{total.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[{ id: 'efectivo', icon: Banknote, label: 'Efectivo' }, { id: 'tarjeta', icon: CreditCard, label: 'Tarjeta' }].map((pago) => (
                  <button
                    key={pago.id}
                    onClick={() => setMetodoPago(pago.id)}
                    className={`flex items-center justify-center gap-3 py-4 rounded-2xl border transition-all duration-300
                    ${metodoPago === pago.id ? "bg-white text-black border-white" : "bg-[#121212] border-white/5 text-neutral-500"}`}
                  >
                    <pago.icon size={16} />
                    <span className="text-[10px] font-black uppercase">{pago.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={finalizarCobro}
                disabled={isSaving || !empleadoSeleccionado || carrito.length === 0 || !metodoPago}
                className="w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all bg-[#FFCC00] text-black hover:shadow-xl active:scale-95 disabled:opacity-20"
              >
                {isSaving ? <Loader2 className="animate-spin mx-auto" /> : "Finalizar Venta"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
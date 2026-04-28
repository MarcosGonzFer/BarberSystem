import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";
import {
  Scissors,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Wallet,
  Settings,
  User,
  Menu,
  X,
  Banknote,
  ClipboardList,
} from "lucide-react";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [perfil, setPerfil] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: perfilData } = await supabase
      .from("perfiles")
      .select("*")
      .eq("id", data.user.id)
      .single();
    setPerfil(perfilData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["admin"] },
    { label: "Cobros", path: "/nuevo-cobro", icon: Wallet, roles: ["admin", "empleado"] },
    { label: "Liquidaciones", path: "/liquidaciones", icon: Banknote, roles: ["admin"] },
    { label: "Informes", path: "/informes", icon: ClipboardList, roles: ["admin", "empleado"] },
  ];

  const NavButton = ({ item, isCollapsed = false }) => {
    if (perfil && !item.roles.includes(perfil.rol)) return null;
    const active = location.pathname === item.path;

    return (
      <button
        onClick={() => navigate(item.path)}
        className={`relative flex items-center gap-4 transition-all duration-500 group
          ${isCollapsed ? "justify-center p-4" : "px-6 py-4"}
          ${active 
            ? "text-black bg-[#FFCC00] rounded-2xl shadow-[0_10px_20px_rgba(255,204,0,0.2)]" 
            : "text-neutral-500 hover:text-white hover:bg-white/5 rounded-2xl"}
        `}
      >
        <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
        {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>}
        {active && !isCollapsed && (
          <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
        )}
      </button>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FFCC00] selection:text-black">
      
      {/* 🖥️ DESKTOP SIDEBAR (w-72) & 📱 TABLET SIDEBAR (w-20) */}
      <aside className="hidden md:flex flex-col border-r border-white/5 bg-black/50 backdrop-blur-2xl sticky top-0 h-screen transition-all duration-500 lg:w-72 md:w-24 p-4">
        <div className="flex items-center gap-3 mb-12 lg:px-4 justify-center lg:justify-start pt-4">
          <div className="min-w-[40px] h-10 bg-[#FFCC00] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,204,0,0.3)]">
            <Scissors className="text-black" size={22} />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic hidden lg:block">
            Barber<span className="text-[#FFCC00]">Pro</span>
          </h1>
        </div>

        <nav className="flex-grow space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-700 mb-6 px-4 hidden lg:block">Navegación</p>
          {navItems.map((item) => (
            <div key={item.path}>
               <div className="lg:hidden"><NavButton item={item} isCollapsed={true} /></div>
               <div className="hidden lg:block"><NavButton item={item} isCollapsed={false} /></div>
            </div>
          ))}
        </nav>

        {/* LOGOUT EN DESKTOP (Abajo) */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-6 py-4 text-neutral-600 hover:text-red-500 transition-colors mt-auto group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Desconectar</span>
        </button>
      </aside>

      {/* 📱 MOBILE BOTTOM NAV (Visible solo en móvil) */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex items-center justify-around px-6 z-[100] shadow-2xl">
        {navItems.map((item) => {
          if (perfil && !item.roles.includes(perfil.rol)) return null;
          const active = location.pathname === item.path;
          return (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`p-4 rounded-full transition-all duration-300 ${active ? "bg-[#FFCC00] text-black scale-110 shadow-lg" : "text-neutral-500"}`}
            >
              <item.icon size={24} />
            </button>
          );
        })}
        <button onClick={() => setOpenMenu(!openMenu)} className="p-4 text-neutral-500">
          <User size={24} />
        </button>
      </nav>

      {/* 🟢 ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* TOPBAR ADAPTADO */}
        <header className="h-20 bg-[#050505]/80 backdrop-blur-md flex items-center justify-between px-6 md:px-12 sticky top-0 z-40 border-b border-white/5">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFCC00] mb-0.5">
              Premium System
            </h2>
            <h3 className="text-lg font-bold capitalize tracking-tight">
              {location.pathname.replace("/", "").replace("-", " ") || "Inicio"}
            </h3>
          </div>

          <div className="relative">
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="flex items-center gap-3 p-1.5 pl-1.5 pr-4 rounded-full bg-white/5 border border-white/10 hover:border-[#FFCC00]/50 transition-all"
            >
              <div className="w-8 h-8 bg-gradient-to-tr from-neutral-800 to-neutral-700 rounded-full flex items-center justify-center border border-white/10 shadow-inner">
                {perfil?.nombre ? <span className="text-xs font-black text-[#FFCC00]">{perfil.nombre[0]}</span> : <User size={16} />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{perfil?.nombre?.split(' ')[0]}</span>
              <ChevronDown size={12} className={`text-neutral-500 transition-transform ${openMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* DROPDOWN LUXURY */}
            {openMenu && (
              <div className="absolute right-0 mt-4 w-64 bg-[#0D0D0D] border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 animate-in slide-in-from-top-2 duration-300">
                <div className="p-6 bg-white/5 border-b border-white/5">
                  <p className="text-[10px] font-black text-[#FFCC00] uppercase tracking-[0.2em] mb-2">Cuenta Personal</p>
                  <p className="font-bold text-white">{perfil?.nombre}</p>
                  <p className="text-xs text-neutral-500 uppercase font-bold">{perfil?.rol}</p>
                </div>
                
                <div className="p-2">
                  {perfil?.rol === "admin" && (
                    <button
                      onClick={() => { navigate("/configuracion"); setOpenMenu(false); }}
                      className="w-full flex items-center gap-4 px-5 py-4 text-xs font-black text-neutral-300 hover:bg-[#FFCC00] hover:text-black rounded-2xl transition-all"
                    >
                      <Settings size={18} /> AJUSTES DEL LOCAL
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-5 py-4 text-xs font-black text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                  >
                    <LogOut size={18} /> CERRAR SESIÓN
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* CONTENIDO CON PADDING ADAPTADO */}
        <section className="flex-1 p-6 md:p-10 pb-32 md:pb-10">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}
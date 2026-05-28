import { createBrowserRouter, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Importaciones de componentes
import Login from "../components/auth/Login";
import Dashboard from "../components/dashboard/Dashboard";
import NuevoCobro from "../components/ventas/NuevoCobro";
import Configuracion from "../components/configuracion/Configuracion";
import AppLayout from "../layouts/AppLayout";
import Liquidaciones from "../components/liquidaciones/Liquidaciones"; 
import Informes from "../components/informes/Informes";

// 🔐 COMPONENTE DE PROTECCIÓN DE RUTAS ORIGINAL (SUPABASE)
function ProtectedRoute({ children, allowedRoles }) {
  const [session, setSession] = useState(null);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", user.id)
        .single();

      setSession(user);
      setRol(perfil?.rol);
      setLoading(false);
    };

    getSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FFCC00] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#FFCC00] font-black uppercase tracking-widest text-xs">Verificando Credenciales...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/" />;

  if (!allowedRoles.includes(rol)) {
    return <Navigate to={rol === "empleado" ? "/nuevo-cobro" : "/"} />;
  }

  return children;
}

// ⌨️ KEYPAD / CONTROL DE ACCESO POR PIN DE DUEÑO
function AdminPinGate({ children }) {
  // Pon aquí el PIN o contraseña que el dueño usará para desbloquear las páginas sensibles
  const ADMIN_PIN = "cuco"; 

  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  // Guardamos en el estado si ya puso el PIN en esta sesión de navegador
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem("admin_unlocked") === "true";
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem("admin_unlocked", "true");
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  };

  // Si ya metió el PIN con éxito, le mostramos la página (Dashboard, Informes, etc.)
  if (isUnlocked) {
    return children;
  }

  // Si no está desbloqueado, le pintamos la pantalla del PIN (estilo Barbería)
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-[#FFCC00]/10 text-[#FFCC00] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FFCC00]/20">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-black uppercase tracking-wider text-white mb-2">Área Restringida</h2>
        <p className="text-zinc-400 text-sm mb-6">Introduce la contraseña de encargado para continuar</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            maxLength={10}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-black border-2 border-zinc-800 text-white text-center text-2xl py-3 rounded-lg focus:outline-none focus:border-[#FFCC00] tracking-widest transition-colors"
            autoFocus
          />
          
          {error && (
            <p className="text-red-500 font-bold text-xs uppercase tracking-wider animate-shake">
              ❌ Contraseña incorrecta
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-[#FFCC00] hover:bg-[#e6b800] text-black font-black uppercase tracking-widest text-sm py-3 rounded-lg transition-colors shadow-lg"
          >
            Acceder
          </button>
        </form>
      </div>
    </div>
  );
}

// 🌐 CONFIGURACIÓN DEL ROUTER
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    element: (
      <ProtectedRoute allowedRoles={["admin", "empleado"]}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/nuevo-cobro",
        element: <NuevoCobro />, // Abierto para todos los que estén logueados
      },
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute allowedRoles={["admin", "empleado"]}>
            <AdminPinGate>
              <Dashboard />
            </AdminPinGate>
          </ProtectedRoute>
        ),
      },
      {
        path: "/liquidaciones",
        element: (
          <ProtectedRoute allowedRoles={["admin", "empleado"]}>
            <AdminPinGate>
              <Liquidaciones />
            </AdminPinGate>
          </ProtectedRoute>
        ),
      },
      {
        path: "/informes",
        element: (
          <ProtectedRoute allowedRoles={["admin", "empleado"]}>
            <AdminPinGate>
              <Informes />
            </AdminPinGate>
          </ProtectedRoute>
        ),
      },
      {
        path: "/configuracion",
        element: (
          <ProtectedRoute allowedRoles={["admin", "empleado"]}>
            <AdminPinGate>
              <Configuracion />
            </AdminPinGate>
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" />,
  }
]);
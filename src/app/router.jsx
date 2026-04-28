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

// 🔐 COMPONENTE DE PROTECCIÓN DE RUTAS
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

      // Obtenemos el rol desde la tabla perfiles
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

  // Pantalla de carga con estilo barbería
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

  // Si no hay sesión, al login
  if (!session) return <Navigate to="/" />;

  // Si el rol no está permitido, redirigimos (puedes mandarlo al dashboard o al login)
  if (!allowedRoles.includes(rol)) {
    return <Navigate to={rol === "empleado" ? "/nuevo-cobro" : "/"} />;
  }

  return children;
}

// 🌐 CONFIGURACIÓN DEL ROUTER
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    element: (
      // Nivel 1: Protección general para entrar al Layout
      <ProtectedRoute allowedRoles={["admin", "empleado"]}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/liquidaciones", // <-- NUEVA RUTA
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Liquidaciones />
          </ProtectedRoute>
        ),
      },
      {
        path: "/informes", // <-- NUEVA RUTA DE INFORMES
        element: (
          <ProtectedRoute allowedRoles={["admin", "empleado"]}>
            <Informes />
          </ProtectedRoute>
        ),
      },
      {
        path: "/nuevo-cobro",
        element: <NuevoCobro />, // Hereda la protección del Layout (admin y empleado)
      },
      {
        path: "/configuracion",
        element: (
          // Nivel 2: Solo Admin gestiona el local
          <ProtectedRoute allowedRoles={["admin"]}>
            <Configuracion />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Ruta por defecto para 404 o errores
  {
    path: "*",
    element: <Navigate to="/" />,
  }
]);
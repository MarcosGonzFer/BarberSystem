import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2, Scissors } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Credenciales incorrectas");
      setLoading(false);
      return;
    }

    const { data: perfil, error: perfilError } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", data.user.id)
      .single();

    if (perfilError) {
      setErrorMsg("Error de perfil");
      setLoading(false);
      return;
    }

    if (perfil.rol === "admin") {
      navigate("/dashboard");
    } else {
      navigate("/nuevo-cobro");
    }
  };

  return (
    <div 
      className="h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: `url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop')` 
      }}
    >
      {/* CAPA OSCURA (Overlay) para que el formulario resalte */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"></div>

      <div className="w-full max-w-md relative z-10 p-4">
        {/* LOGO */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#FFCC00] mb-4 shadow-[0_0_30px_rgba(255,204,0,0.4)]">
            <Scissors className="text-black" size={40} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
            Barber <span className="text-[#FFCC00]">System</span>
          </h1>
        </div>

        {/* CARD */}
        <div className="bg-black/60 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-md">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {errorMsg && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 text-xs py-3 px-4 rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase ml-1 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  type="email"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#FFCC00] transition-all"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase ml-1 mb-2 block">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  type="password"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#FFCC00] transition-all"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFCC00] hover:bg-[#FFD700] text-black font-black py-4 rounded-xl transition-all shadow-lg shadow-yellow-600/20 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "ENTRAR AL LOCAL"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
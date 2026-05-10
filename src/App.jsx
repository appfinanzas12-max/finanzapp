import { useEffect, useMemo, useState } from "react";

import {
  Wallet,
  Users,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  LogOut,
  MessageCircle,
  X,
  ChevronLeft,
  Rocket,
  CheckCircle2,
  Clock,
  Check,
  TrendingUp,
  TrendingDown,
  Target,
  Pencil
} from "lucide-react";

import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

import { auth, db, googleProvider as provider } from "./firebase/config";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [debts, setDebts] = useState([]);

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const [selectedDebt, setSelectedDebt] = useState(null);

  const [activeTab, setActiveTab] = useState("wallet");

  const [isRegister, setIsRegister] = useState(false);

  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // "login" muestra animación de bienvenida, "logout" muestra animación de cierre
  const [splashMode, setSplashMode] = useState(null);
  const [splashStep, setSplashStep] = useState(0);
  const [splashDone, setSplashDone] = useState(false);

  // Estado para filtro activo en wallet
  const [filtro, setFiltro] = useState("all");

  // Perfil del usuario
  const [perfil, setPerfil] = useState({ nombre: "", moneda: "$", meta: "" });
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ nombre: "", moneda: "$", meta: "" });

  const [formData, setFormData] = useState({
    type: "income",
    amount: "",
    category: "",
    description: ""
  });

  const [debtData, setDebtData] = useState({
    name: "",
    amount: "",
    phone: "",
    type: "they_owe"
  });

  const SPLASH_LOGIN = [
    "Identidad confirmada",
    "Sesión iniciada",
    "Conectando con la nube",
    "Sincronizando tu información",
    "Cargando transacciones y deudas",
    "Preparando tu balance",
    "FinanzApp lista",
  ];

  const SPLASH_LOGOUT = [
    "Cerrando tu sesión",
    "Guardando tu información",
    "Sincronizando",
    "Todo se guardó exitosamente",
  ];

  // Cierre automático por inactividad de 1 hora
  useEffect(() => {
    if (!user) return;
    const INACTIVIDAD_MS = 60 * 60 * 1000; // 1 hora
    let timer = setTimeout(() => handleLogout(), INACTIVIDAD_MS);

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => handleLogout(), INACTIVIDAD_MS);
    };

    const eventos = ["mousemove", "keydown", "touchstart", "click", "scroll"];
    eventos.forEach((e) => window.addEventListener(e, resetTimer));

    return () => {
      clearTimeout(timer);
      eventos.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user]);

  // Avanza los pasos de la animación uno por uno
  useEffect(() => {
    if (!splashMode) return;
    const pasos = splashMode === "login" ? SPLASH_LOGIN : SPLASH_LOGOUT;
    const intervalo = splashMode === "login" ? 320 : 260;

    if (splashStep < pasos.length) {
      const t = setTimeout(() => setSplashStep((s) => s + 1), intervalo);
      return () => clearTimeout(t);
    } else {
      // Todos los pasos completados — espera un momento y cierra el splash
      const t = setTimeout(() => {
        setSplashDone(true);
        setTimeout(() => {
          setSplashMode(null);
          setSplashStep(0);
          setSplashDone(false);
          if (splashMode === "logout") signOut(auth);
        }, 900);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [splashMode, splashStep]);

  useEffect(() => {
    let unsubTx = null;
    let unsubDebts = null;

    const unsub = onAuthStateChanged(auth, (u) => {
      setLoading(false);

      if (!u) {
        if (unsubTx) unsubTx();
        if (unsubDebts) unsubDebts();
        setTransactions([]);
        setDebts([]);
        setUser(null);
        return;
      }

      // Dispara animación de bienvenida solo si no hay usuario previo
      setUser((prev) => {
        if (!prev) {
          setSplashStep(0);
          setSplashDone(false);
          setSplashMode("login");
        }
        return u;
      });

      const txRef = query(
        collection(db, "users", u.uid, "transactions"),
        orderBy("createdAt", "desc")
      );

      const debtRef = query(
        collection(db, "users", u.uid, "debts"),
        orderBy("createdAt", "desc")
      );

      unsubTx = onSnapshot(txRef, (snap) => {
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });

      unsubDebts = onSnapshot(debtRef, (snap) => {
        setDebts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });

      // Carga el perfil del usuario
      getDoc(doc(db, "users", u.uid, "profile", "data")).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setPerfil(data);
          setPerfilForm(data);
        }
      });
    });

    return () => {
      unsub();
      if (unsubTx) unsubTx();
      if (unsubDebts) unsubDebts();
    };
  }, []);

  const balance = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === "income") return acc + Number(tx.amount);
      return acc - Number(tx.amount);
    }, 0);
  }, [transactions]);

  const loginGoogle = async () => {
    try {
      setError("");
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.log(err);
      setError("Error iniciando sesión con Google.");
    }
  };

  const handleEmailAuth = async () => {
    try {
      setError("");

      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.log(err);
      setError("Error en autenticación.");
    }
  };

  const addTransaction = async () => {
    if (!formData.amount || !formData.category) return;
    if (Number(formData.amount) <= 0) {
      setSaveError("El monto debe ser mayor a cero.");
      return;
    }
    try {
      setSaving(true);
      setSaveError("");
      await addDoc(
        collection(db, "users", user.uid, "transactions"),
        {
          ...formData,
          amount: Number(formData.amount),
          createdAt: serverTimestamp()
        }
      );
      setFormData({ type: "income", amount: "", category: "", description: "" });
      setShowTransactionModal(false);
    } catch (err) {
      console.log(err);
      setSaveError("Error al guardar. Revisa tu conexión.");
    } finally {
      setSaving(false);
    }
  };

  const addDebt = async () => {
    if (!debtData.name || !debtData.amount) return;
    if (Number(debtData.amount) <= 0) {
      setSaveError("El monto debe ser mayor a cero.");
      return;
    }
    try {
      setSaving(true);
      setSaveError("");
      await addDoc(
        collection(db, "users", user.uid, "debts"),
        {
          ...debtData,
          amount: Number(debtData.amount),
          createdAt: serverTimestamp()
        }
      );
      setDebtData({ name: "", amount: "", phone: "", type: "they_owe" });
      setShowDebtModal(false);
    } catch (err) {
      console.log(err);
      setSaveError("Error al guardar. Revisa tu conexión.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTransaction = async (id) => {
    const confirmar = window.confirm("¿Seguro que quieres eliminar esta transacción?");
    if (!confirmar) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "transactions", id));
    } catch (err) {
      console.log(err);
      alert("Error al eliminar. Revisa tu conexión.");
    }
  };

  const deleteDebt = async (id) => {
    const confirmar = window.confirm("¿Seguro que quieres eliminar esta deuda?");
    if (!confirmar) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "debts", id));
    } catch (err) {
      console.log(err);
      alert("Error al eliminar. Revisa tu conexión.");
    }
  };

  const toggleDebtPaid = async (id, currentPaid) => {
    try {
      await updateDoc(doc(db, "users", user.uid, "debts", id), {
        paid: !currentPaid
      });
    } catch (err) {
      console.log(err);
      alert("Error al actualizar. Revisa tu conexión.");
    }
  };

  const sendWhatsApp = (mode) => {
    if (!selectedDebt) return;

    let msg = "";

    if (mode === 1) {
      msg = `Hola ${selectedDebt.name}, recuerda tu saldo pendiente de $${selectedDebt.amount}.`;
    }

    if (mode === 2) {
      msg = `Hola ${selectedDebt.name}, necesito el pago pendiente de $${selectedDebt.amount}.`;
    }

    if (mode === 3) {
      msg = `URGENTE ${selectedDebt.name}: el pago de $${selectedDebt.amount} debe realizarse hoy.`;
    }

    window.open(
      `https://wa.me/${selectedDebt.phone}?text=${encodeURIComponent(msg)}`
    );
  };

  const handleLogout = () => {
    setSplashStep(0);
    setSplashDone(false);
    setSplashMode("logout");
  };

  const guardarPerfil = async () => {
    try {
      await setDoc(doc(db, "users", user.uid, "profile", "data"), perfilForm);
      setPerfil(perfilForm);
      setEditandoPerfil(false);
    } catch (err) {
      console.log(err);
      alert("Error al guardar el perfil. Revisa tu conexión.");
    }
  };

  const formatFecha = (ts) => {
    if (!ts) return "";
    const fecha = ts.toDate ? ts.toDate() : new Date(ts);
    return fecha.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const fmt = (n) => `${perfil.moneda || "$"}${Number(n).toLocaleString("es-CO")}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center text-2xl font-black">
        Cargando FinanzApp...
      </div>
    );
  }

  // Animación de bienvenida al iniciar sesión
  if (splashMode === "login") {
    const pasos = SPLASH_LOGIN;
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-8">
        <h1 className="text-4xl font-black text-cyan-400 mb-12 tracking-tight">
          FinanzApp
        </h1>
        <div className="w-full max-w-xs space-y-4">
          {pasos.map((paso, i) => {
            const visible = i < splashStep;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
              >
                <span className={`text-lg transition-all duration-200 ${visible ? "scale-100" : "scale-0"}`}>
                  ✅
                </span>
                <span className={`font-black text-sm ${visible ? "text-white" : "text-zinc-700"}`}>
                  {paso}
                </span>
              </div>
            );
          })}
        </div>
        {splashDone && (
          <div className="mt-12 text-center animate-[fadeUp_0.5s_ease]">
            <p className="text-2xl font-black text-white">
              Bienvenido{perfil.nombre ? `, ${perfil.nombre}` : " de vuelta"} 👋
            </p>
            <p className="text-zinc-500 text-sm mt-2">{user?.email}</p>
          </div>
        )}
      </div>
    );
  }

  // Animación de cierre de sesión
  if (splashMode === "logout") {
    const pasos = SPLASH_LOGOUT;
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-8">
        <h1 className="text-4xl font-black text-cyan-400 mb-12 tracking-tight">
          FinanzApp
        </h1>
        <div className="w-full max-w-xs space-y-4">
          {pasos.map((paso, i) => {
            const visible = i < splashStep;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
              >
                <span className={`text-lg transition-all duration-200 ${visible ? "scale-100" : "scale-0"}`}>
                  ✅
                </span>
                <span className={`font-black text-sm ${visible ? "text-white" : "text-zinc-700"}`}>
                  {paso}
                </span>
              </div>
            );
          })}
        </div>
        {splashDone && (
          <div className="mt-12 text-center animate-[fadeUp_0.5s_ease]">
            <p className="text-2xl font-black text-white">Hasta luego 👋</p>
            <p className="text-zinc-500 text-sm mt-2">{user?.email}</p>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 overflow-hidden relative">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,255,0.15),transparent_40%)]" />

        <div className="w-full max-w-md bg-zinc-950 border border-cyan-500/20 rounded-3xl p-8 relative z-10 animate-[zoomIn_0.7s_ease] shadow-[0_0_60px_rgba(0,255,255,0.15)]">

          <div className="text-center mb-10">
            <h1 className="text-5xl font-black tracking-tight text-cyan-400">
              FinanzApp
            </h1>

            <p className="text-zinc-500 mt-2">
              v1.0.0.1 (beta)
            </p>

            <p className="text-xs tracking-[6px] uppercase mt-3 text-zinc-600">
              DEV Zaack
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-2xl mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4">

            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 outline-none"
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 outline-none"
            />

            <button
              onClick={handleEmailAuth}
              className="w-full bg-cyan-500 hover:bg-cyan-400 transition-all text-black py-4 rounded-2xl font-black"
            >
              {isRegister ? "Crear Cuenta" : "Iniciar Sesión"}
            </button>

            <button
              onClick={loginGoogle}
              className="w-full border border-zinc-700 hover:border-cyan-500 transition-all py-4 rounded-2xl font-black"
            >
              Continuar con Google
            </button>

            <button
              onClick={() => setIsRegister(!isRegister)}
              className="w-full text-zinc-500 text-sm mt-3"
            >
              {isRegister
                ? "Ya tengo cuenta"
                : "Crear nueva cuenta"}
            </button>

          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-28 animate-[fadeUp_0.4s_ease]">

      <header className="p-6 flex items-center justify-between border-b border-zinc-900 backdrop-blur-xl sticky top-0 bg-black/80 z-50">

        <div>
          <h1 className="text-2xl font-black text-cyan-400">
            FinanzApp
          </h1>

          <p className="text-[10px] tracking-[4px] uppercase text-zinc-600">
            DEV Zaack
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500/10 text-red-400 p-3 rounded-2xl"
        >
          <LogOut size={20} />
        </button>

      </header>

      <main className="p-5 max-w-md mx-auto space-y-6">

        {activeTab === "wallet" && (
          <div className="space-y-6 animate-[fadeUp_0.3s_ease]">

            <div className="bg-gradient-to-br from-cyan-500 to-blue-700 rounded-3xl p-6 shadow-2xl">
              <p className="text-sm opacity-80 mb-3">Balance Total</p>
              <h2 className="text-5xl font-black mb-6">${fmt(balance)}</h2>
              <button
                onClick={() => { setSaveError(""); setShowTransactionModal(true); }}
                className="bg-black/30 hover:bg-black/40 transition-all px-5 py-4 rounded-2xl font-black flex items-center gap-2"
              >
                <Plus size={20} />
                Nueva Transacción
              </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              {[
                { key: "all",     label: "Todos" },
                { key: "income",  label: "Ingresos" },
                { key: "expense", label: "Egresos" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFiltro(f.key)}
                  className={`px-4 py-2 rounded-2xl text-sm font-black transition-all ${
                    filtro === f.key
                      ? "bg-cyan-500 text-black"
                      : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {transactions.filter(tx => filtro === "all" || tx.type === filtro).length === 0 && (
                <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 text-center text-zinc-500">
                  No hay movimientos para mostrar.
                </div>
              )}

              {transactions
                .filter(tx => filtro === "all" || tx.type === filtro)
                .map((tx) => (
                <div
                  key={tx.id}
                  className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 flex items-center justify-between"
                >
                  <div>
                    <p className="font-black">{tx.category}</p>
                    {tx.description && (
                      <p className="text-xs text-zinc-400 mt-0.5">{tx.description}</p>
                    )}
                    <p className="text-xs text-zinc-500 mt-1">
                      {tx.type === "income" ? "Ingreso" : "Egreso"}
                    </p>
                    {tx.createdAt && (
                      <p className="text-xs text-zinc-600 mt-0.5">{formatFecha(tx.createdAt)}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`font-black text-xl ${tx.type === "income" ? "text-cyan-400" : "text-red-400"}`}>
                      {tx.type === "income" ? "+" : "-"}${fmt(tx.amount)}
                    </span>
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="bg-red-500/10 text-red-400 p-2 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {activeTab === "debts" && (
          <div className="space-y-4 animate-[fadeUp_0.3s_ease]">

            <div className="flex items-center justify-between">

              <h2 className="text-3xl font-black">
                Deudas
              </h2>

              <button
                onClick={() => {
                  setSaveError("");
                  setShowDebtModal(true);
                }}
                className="bg-cyan-500 text-black p-3 rounded-2xl"
              >
                <Plus />
              </button>

            </div>

            {debts.length === 0 && (
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 text-center text-zinc-500">
                No existen deudas registradas.
              </div>
            )}

            {debts.map((d) => (
              <div
                key={d.id}
                className={`bg-zinc-950 border rounded-3xl p-5 flex items-center justify-between ${d.paid ? "border-zinc-800 opacity-60" : "border-zinc-900"}`}
              >

                <div>
                  <p className={`font-black text-xl ${d.paid ? "line-through text-zinc-500" : ""}`}>
                    {d.name}
                  </p>
                  <p className="text-zinc-500 text-sm mt-1">
                    {d.type === "they_owe" ? "Te deben" : "Debes"}
                    {d.paid && <span className="ml-2 text-green-500 text-xs font-black">· PAGADO</span>}
                  </p>
                  <p className={`text-sm font-black mt-1 ${d.paid ? "text-zinc-600 line-through" : d.type === "they_owe" ? "text-cyan-400" : "text-red-400"}`}>
                    ${fmt(d.amount)}
                  </p>
                  {d.createdAt && (
                    <p className="text-xs text-zinc-600 mt-0.5">{formatFecha(d.createdAt)}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">

                  <button
                    onClick={() => toggleDebtPaid(d.id, d.paid)}
                    className={`p-3 rounded-2xl ${d.paid ? "bg-green-500/20 text-green-400" : "bg-zinc-800 text-zinc-400"}`}
                    title={d.paid ? "Marcar como pendiente" : "Marcar como pagada"}
                  >
                    <Check size={18} />
                  </button>

                  {!d.paid && (
                    <button
                      onClick={() => {
                        setSelectedDebt(d);
                        setShowReminderModal(true);
                      }}
                      className="bg-green-500/10 text-green-400 p-3 rounded-2xl"
                    >
                      <MessageCircle size={18} />
                    </button>
                  )}

                  <button
                    onClick={() => deleteDebt(d.id)}
                    className="bg-red-500/10 text-red-400 p-3 rounded-2xl"
                  >
                    <Trash2 size={18} />
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-5 animate-[fadeUp_0.3s_ease]">

            <h2 className="text-3xl font-black">Analytics</h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-4 text-center">
                <TrendingUp size={20} className="mx-auto text-cyan-400 mb-2" />
                <p className="text-zinc-500 text-xs mb-1">Ingresos</p>
                <p className="font-black text-cyan-400 text-sm">
                  ${fmt(transactions.filter(t => t.type === "income").reduce((a, t) => a + Number(t.amount), 0))}
                </p>
              </div>
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-4 text-center">
                <TrendingDown size={20} className="mx-auto text-red-400 mb-2" />
                <p className="text-zinc-500 text-xs mb-1">Egresos</p>
                <p className="font-black text-red-400 text-sm">
                  ${fmt(transactions.filter(t => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0))}
                </p>
              </div>
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-4 text-center">
                <BarChart3 size={20} className="mx-auto text-yellow-400 mb-2" />
                <p className="text-zinc-500 text-xs mb-1">Balance</p>
                <p className={`font-black text-sm ${balance >= 0 ? "text-cyan-400" : "text-red-400"}`}>
                  ${fmt(balance)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-4">
                <p className="text-zinc-500 text-xs">Transacciones</p>
                <h3 className="text-3xl font-black mt-1">{transactions.length}</h3>
              </div>
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-4">
                <p className="text-zinc-500 text-xs">Deudas activas</p>
                <h3 className="text-3xl font-black mt-1">
                  {debts.filter(d => !d.paid).length}
                </h3>
              </div>
            </div>

            {perfil.meta && Number(perfil.meta) > 0 && (
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={18} className="text-yellow-400" />
                  <h3 className="font-black text-lg">Meta de ahorro mensual</h3>
                </div>
                {(() => {
                  const meta = Number(perfil.meta);
                  const progreso = Math.min((balance / meta) * 100, 100);
                  const alcanzada = balance >= meta;
                  return (
                    <>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-zinc-400">Balance actual: <span className="font-black text-white">{fmt(balance)}</span></span>
                        <span className="text-zinc-400">Meta: <span className="font-black text-yellow-400">{fmt(meta)}</span></span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${alcanzada ? "bg-green-400" : "bg-cyan-400"}`}
                          style={{ width: `${Math.max(progreso, 0)}%` }}
                        />
                      </div>
                      <p className={`text-xs mt-2 font-black ${alcanzada ? "text-green-400" : "text-zinc-500"}`}>
                        {alcanzada ? "✅ Meta alcanzada" : `${Math.max(0, Math.round(progreso))}% completado`}
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5">
              <h3 className="font-black text-lg mb-4">Resumen por mes</h3>              {(() => {
                const porMes = {};
                transactions.forEach(tx => {
                  if (!tx.createdAt) return;
                  const fecha = tx.createdAt.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt);
                  const clave = fecha.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
                  if (!porMes[clave]) porMes[clave] = { ingresos: 0, egresos: 0 };
                  if (tx.type === "income") porMes[clave].ingresos += Number(tx.amount);
                  else porMes[clave].egresos += Number(tx.amount);
                });

                const meses = Object.entries(porMes);
                if (meses.length === 0) {
                  return (
                    <p className="text-zinc-600 text-sm text-center py-4">
                      Aún no hay datos suficientes para el resumen mensual.
                    </p>
                  );
                }

                return (
                  <div className="space-y-3">
                    {meses.map(([mes, datos]) => (
                      <div key={mes} className="bg-black rounded-2xl p-4 border border-zinc-800">
                        <p className="text-zinc-400 text-sm font-black capitalize mb-3">{mes}</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-cyan-400">↑ ${fmt(datos.ingresos)}</span>
                          <span className="text-red-400">↓ ${fmt(datos.egresos)}</span>
                          <span className={datos.ingresos - datos.egresos >= 0 ? "text-white font-black" : "text-red-400 font-black"}>
                            = ${fmt(datos.ingresos - datos.egresos)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 animate-[fadeUp_0.3s_ease]">

            <h2 className="text-3xl font-black">Configuración</h2>

            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-zinc-500 text-xs uppercase tracking-widest">Perfil</p>
                <button
                  onClick={() => { setPerfilForm(perfil); setEditandoPerfil(!editandoPerfil); }}
                  className="bg-zinc-800 text-zinc-400 p-2 rounded-xl"
                >
                  <Pencil size={14} />
                </button>
              </div>

              {editandoPerfil ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={perfilForm.nombre}
                    onChange={(e) => setPerfilForm({ ...perfilForm, nombre: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 outline-none text-sm"
                  />
                  <select
                    value={perfilForm.moneda}
                    onChange={(e) => setPerfilForm({ ...perfilForm, moneda: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 outline-none text-sm"
                  >
                    <option value="$">$ — Peso colombiano (COP)</option>
                    <option value="USD ">USD — Dólar americano</option>
                    <option value="€">€ — Euro</option>
                    <option value="£">£ — Libra esterlina</option>
                    <option value="MXN ">MXN — Peso mexicano</option>
                    <option value="S/ ">S/ — Sol peruano</option>
                    <option value="Bs ">Bs — Bolívar venezolano</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Meta de ahorro mensual"
                    value={perfilForm.meta}
                    onChange={(e) => setPerfilForm({ ...perfilForm, meta: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 outline-none text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={guardarPerfil}
                      className="flex-1 bg-cyan-500 text-black py-3 rounded-2xl font-black text-sm"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditandoPerfil(false)}
                      className="flex-1 bg-zinc-800 text-zinc-400 py-3 rounded-2xl font-black text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-black text-lg">{perfil.nombre || "Sin nombre"}</p>
                  <p className="text-zinc-500 text-sm truncate">{user.email}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1 text-xs text-zinc-400">
                      Moneda: <span className="text-white font-black">{perfil.moneda || "$"}</span>
                    </span>
                    {perfil.meta && Number(perfil.meta) > 0 && (
                      <span className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1 text-xs text-zinc-400">
                        Meta: <span className="text-yellow-400 font-black">{fmt(perfil.meta)}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="mt-4 flex items-center gap-2 bg-red-500/10 text-red-400 px-4 py-3 rounded-2xl font-black text-sm"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={20} className="text-cyan-400" />
                <h3 className="font-black text-lg">Novedades</h3>
              </div>

              {[
                {
                  version: "v1.0.0.1 (beta)",
                  fecha: "Mayo 2025",
                  cambios: [
                    "Login con Google y correo/contraseña",
                    "Registro de ingresos y egresos con categorías predefinidas",
                    "Gestión de deudas con recordatorio por WhatsApp",
                    "Marcar deudas como pagadas",
                    "Analytics con totales y resumen mensual",
                    "Perfil personalizable (nombre, moneda, meta de ahorro)",
                    "Filtros en transacciones (todos, ingresos, egresos)",
                    "Formato de moneda con separadores de miles",
                  ],
                },
              ].map((release) => (
                <div key={release.version} className="bg-black rounded-2xl p-4 border border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cyan-400 font-black">{release.version}</span>
                    <span className="text-zinc-600 text-xs">{release.fecha}</span>
                  </div>
                  <ul className="space-y-1">
                    {release.cambios.map((c, i) => (
                      <li key={i} className="text-zinc-400 text-sm flex items-start gap-2">
                        <span className="text-cyan-500 mt-0.5">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Rocket size={20} className="text-yellow-400" />
                <h3 className="font-black text-lg">Próximamente</h3>
              </div>

              {[
                { icono: "📊", texto: "Gráficas visuales de ingresos vs egresos" },
                { icono: "📄", texto: "Exportar reporte PDF o Excel" },
                { icono: "📴", texto: "Modo sin conexión (offline)" },
                { icono: "�", texto: "Plan Premium con funciones avanzadas" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-black rounded-2xl p-4 border border-zinc-800">
                  <span className="text-xl">{item.icono}</span>
                  <p className="text-zinc-400 text-sm">{item.texto}</p>
                  <Clock size={14} className="ml-auto text-zinc-600 shrink-0" />
                </div>
              ))}
            </div>

            {/* Versión */}
            <a
              href="https://wa.me/573024555562?text=Hola%2C%20tengo%20una%20sugerencia%20para%20FinanzApp%3A"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-3xl p-5 w-full"
            >
              <MessageCircle size={22} className="text-green-400 shrink-0" />
              <div>
                <p className="font-black text-green-400">Contáctanos</p>
                <p className="text-zinc-500 text-xs mt-0.5">¿Tienes sugerencias o comentarios? Escríbenos por WhatsApp</p>
              </div>
            </a>

            <p className="text-center text-zinc-700 text-xs pb-2">
              FinanzApp v1.0.0.1 (beta) · DEV Zaack
            </p>

          </div>
        )}

      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-zinc-900 p-4 flex items-center justify-around">

        <button
          onClick={() => setActiveTab("wallet")}
          className={`p-3 rounded-2xl transition-all ${
            activeTab === "wallet"
              ? "bg-cyan-500 text-black"
              : "text-zinc-500"
          }`}
        >
          <Wallet />
        </button>

        <button
          onClick={() => setActiveTab("debts")}
          className={`p-3 rounded-2xl transition-all ${
            activeTab === "debts"
              ? "bg-cyan-500 text-black"
              : "text-zinc-500"
          }`}
        >
          <Users />
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`p-3 rounded-2xl transition-all ${
            activeTab === "analytics"
              ? "bg-cyan-500 text-black"
              : "text-zinc-500"
          }`}
        >
          <BarChart3 />
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`p-3 rounded-2xl transition-all ${
            activeTab === "settings"
              ? "bg-cyan-500 text-black"
              : "text-zinc-500"
          }`}
        >
          <Settings />
        </button>

      </nav>

      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-5 animate-[fadeUp_0.3s_ease]">

          <div className="w-full max-w-md bg-zinc-950 border border-cyan-500/20 rounded-3xl p-6">

            <div className="flex items-center justify-between mb-6">

              <button
                onClick={() => setShowTransactionModal(false)}
                className="bg-zinc-900 p-2 rounded-xl"
              >
                <ChevronLeft />
              </button>

              <h2 className="font-black text-xl">
                Nueva Transacción
              </h2>

              <button
                onClick={() => setShowTransactionModal(false)}
                className="bg-red-500/10 text-red-400 p-2 rounded-xl"
              >
                <X />
              </button>

            </div>

            <div className="space-y-4">

              {saveError && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-2xl text-sm">
                  {saveError}
                </div>
              )}

              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 outline-none"
              >
                <option value="income">Ingreso</option>
                <option value="expense">Egreso</option>
              </select>

              <input
                type="number"
                placeholder="Monto"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 outline-none"
              />

              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 outline-none"
              >
                <option value="">Selecciona una categoría</option>
                <optgroup label="Ingresos">
                  <option value="Salario">Salario</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Negocio">Negocio</option>
                  <option value="Inversión">Inversión</option>
                  <option value="Regalo">Regalo</option>
                </optgroup>
                <optgroup label="Gastos">
                  <option value="Arriendo">Arriendo</option>
                  <option value="Comida">Comida</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Salud">Salud</option>
                  <option value="Educación">Educación</option>
                  <option value="Entretenimiento">Entretenimiento</option>
                  <option value="Servicios">Servicios (agua, luz, internet)</option>
                  <option value="Ropa">Ropa</option>
                  <option value="Deuda">Pago de deuda</option>
                </optgroup>
                <option value="Otro">Otro</option>
              </select>

              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 outline-none"
              />

              <button
                onClick={addTransaction}
                disabled={saving}
                className="w-full bg-cyan-500 text-black py-4 rounded-2xl font-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>

            </div>

          </div>

        </div>
      )}

      {showDebtModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-5 animate-[fadeUp_0.3s_ease]">

          <div className="w-full max-w-md bg-zinc-950 border border-cyan-500/20 rounded-3xl p-6">

            <div className="flex items-center justify-between mb-6">

              <button
                onClick={() => setShowDebtModal(false)}
                className="bg-zinc-900 p-2 rounded-xl"
              >
                <ChevronLeft />
              </button>

              <h2 className="font-black text-xl">
                Nueva Deuda
              </h2>

              <button
                onClick={() => setShowDebtModal(false)}
                className="bg-red-500/10 text-red-400 p-2 rounded-xl"
              >
                <X />
              </button>

            </div>

            <div className="space-y-4">

              {saveError && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-2xl text-sm">
                  {saveError}
                </div>
              )}

              <input
                type="text"
                placeholder="Nombre"
                value={debtData.name}
                onChange={(e) =>
                  setDebtData({ ...debtData, name: e.target.value })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 outline-none"
              />

              <input
                type="number"
                placeholder="Monto"
                value={debtData.amount}
                onChange={(e) =>
                  setDebtData({ ...debtData, amount: e.target.value })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 outline-none"
              />

              <input
                type="text"
                placeholder="WhatsApp"
                value={debtData.phone}
                onChange={(e) =>
                  setDebtData({ ...debtData, phone: e.target.value })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 outline-none"
              />

              <select
                value={debtData.type}
                onChange={(e) =>
                  setDebtData({ ...debtData, type: e.target.value })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 outline-none"
              >
                <option value="they_owe">Me Deben</option>
                <option value="i_owe">Yo Debo</option>
              </select>

              <button
                onClick={addDebt}
                disabled={saving}
                className="w-full bg-cyan-500 text-black py-4 rounded-2xl font-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>

            </div>

          </div>

        </div>
      )}

      {showReminderModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-5 animate-[fadeUp_0.3s_ease]">

          <div className="w-full max-w-md bg-zinc-950 border border-cyan-500/20 rounded-3xl p-6">

            <div className="flex items-center justify-between mb-6">

              <button
                onClick={() => setShowReminderModal(false)}
                className="bg-zinc-900 p-2 rounded-xl"
              >
                <ChevronLeft />
              </button>

              <h2 className="font-black text-xl">
                WhatsApp
              </h2>

              <button
                onClick={() => setShowReminderModal(false)}
                className="bg-red-500/10 text-red-400 p-2 rounded-xl"
              >
                <X />
              </button>

            </div>

            <div className="space-y-3">

              <button
                onClick={() => sendWhatsApp(1)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 font-black"
              >
                Recordatorio Amable
              </button>

              <button
                onClick={() => sendWhatsApp(2)}
                className="w-full bg-yellow-500/20 text-yellow-400 rounded-2xl py-4 font-black"
              >
                Recordatorio Firme
              </button>

              <button
                onClick={() => sendWhatsApp(3)}
                className="w-full bg-red-500/20 text-red-400 rounded-2xl py-4 font-black"
              >
                Recordatorio Urgente
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
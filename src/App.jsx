import React, { useEffect, useState } from "react";

import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  auth,
  provider,
} from "./firebase";

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-3xl p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function NavButton({ icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${
        active
          ? "bg-blue-600 text-white"
          : "bg-zinc-900 text-zinc-400"
      }`}
    >
      {icon}
    </button>
  );
}

export default function App() {

  const [user, setUser] = useState(null);

  const [activeTab, setActiveTab] = useState("wallet");

  const transactions = [];

  const debts = [];

  const totalIncome = 0;

  const totalExpense = 0;

  const balance = 0;

  // LOGIN GOOGLE REAL
  const loginGoogle = async () => {

    try {

      await signInWithPopup(
        auth,
        provider
      );

    } catch (error) {

      console.log(error);

      alert("Error iniciando sesión");

    }
  };

  // DETECTAR SESIÓN
  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {

        setUser(currentUser);

      }
    );

    return () => unsubscribe();

  }, []);

  // LOGOUT
  const logout = async () => {

    await signOut(auth);

  };

  // LOGIN SCREEN
  if (!user) {

    return (

      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">

        <Card className="w-full max-w-sm text-center">

          <h1 className="text-4xl font-black italic mb-2">
            FinanzApp
          </h1>

          <p className="text-xs tracking-[6px] text-zinc-500 mb-8 font-bold">
            ZAACK EDITION V2
          </p>

          <div className="space-y-4">

            <input
              type="email"
              placeholder="Correo electrónico"
              className="w-full p-4 rounded-2xl bg-zinc-800 outline-none"
            />

            <input
              type="password"
              placeholder="Contraseña"
              className="w-full p-4 rounded-2xl bg-zinc-800 outline-none"
            />

            <button
              className="w-full bg-blue-600 p-4 rounded-2xl font-black"
            >
              Iniciar Sesión
            </button>

            <button
              onClick={loginGoogle}
              className="w-full border border-zinc-700 p-4 rounded-2xl font-black"
            >
              Continuar con Google
            </button>

          </div>

        </Card>

      </div>
    );
  }

  // DASHBOARD
  return (

    <div className="min-h-screen bg-black text-white pb-28">

      <header className="max-w-md mx-auto p-6 flex justify-between items-center">

        <div>

          <h1 className="text-4xl font-black italic">
            FinanzApp
          </h1>

          <p className="text-xs tracking-[6px] text-zinc-500 font-bold">
            ZAACK EDITION V2
          </p>

        </div>

        <div className="text-right">

          <p className="text-sm font-bold">
            {user.displayName}
          </p>

          <p className="text-xs text-zinc-500">
            {user.email}
          </p>

        </div>

      </header>

      <main className="max-w-md mx-auto px-6 space-y-6">

        {activeTab === "wallet" && (

          <>

            <Card>

              <p className="text-zinc-500 font-bold text-sm uppercase mb-3">
                Balance Total
              </p>

              <h2 className="text-5xl font-black mb-8">
                ${balance.toLocaleString("es-CO")}
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">

                <div className="bg-zinc-950 rounded-2xl p-4">

                  <p className="text-zinc-500 text-sm mb-2">
                    Ingresos
                  </p>

                  <h3 className="text-2xl font-black text-blue-500">
                    ${totalIncome.toLocaleString("es-CO")}
                  </h3>

                </div>

                <div className="bg-zinc-950 rounded-2xl p-4">

                  <p className="text-zinc-500 text-sm mb-2">
                    Gastos
                  </p>

                  <h3 className="text-2xl font-black text-red-500">
                    ${totalExpense.toLocaleString("es-CO")}
                  </h3>

                </div>

              </div>

              <button className="w-full bg-blue-600 rounded-2xl p-5 font-black text-lg">
                ➕ NUEVA TRANSACCIÓN
              </button>

            </Card>

            <div>

              <div className="flex justify-between items-center mb-4">

                <h2 className="text-2xl font-black">
                  Movimientos
                </h2>

                <span className="text-zinc-500 text-sm">
                  {transactions.length} registros
                </span>

              </div>

              {transactions.length === 0 && (

                <Card className="text-center py-10">

                  <p className="text-zinc-500">
                    No hay movimientos registrados.
                  </p>

                </Card>

              )}

            </div>

          </>
        )}

        {activeTab === "debts" && (

          <div>

            <div className="flex justify-between items-center mb-4">

              <h2 className="text-2xl font-black">
                Deudores
              </h2>

              <button className="bg-blue-600 rounded-2xl px-5 py-3 font-black">
                ➕
              </button>

            </div>

            {debts.length === 0 && (

              <Card className="text-center py-10">

                <p className="text-zinc-500">
                  No tienes deudas registradas.
                </p>

              </Card>

            )}

          </div>
        )}

        {activeTab === "stats" && (

          <Card className="text-center py-20">

            <h2 className="text-2xl font-black mb-3">
              Estadísticas
            </h2>

            <p className="text-zinc-500">
              Próximamente disponible.
            </p>

          </Card>
        )}

        {activeTab === "settings" && (

          <Card className="space-y-4">

            <h2 className="text-2xl font-black">
              Configuración
            </h2>

            <button
              onClick={logout}
              className="w-full bg-red-600 p-4 rounded-2xl font-black"
            >
              Cerrar sesión
            </button>

          </Card>
        )}

      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 p-4">

        <div className="max-w-md mx-auto flex justify-between">

          <NavButton
            icon="💳"
            active={activeTab === "wallet"}
            onClick={() => setActiveTab("wallet")}
          />

          <NavButton
            icon="👥"
            active={activeTab === "debts"}
            onClick={() => setActiveTab("debts")}
          />

          <NavButton
            icon="📊"
            active={activeTab === "stats"}
            onClick={() => setActiveTab("stats")}
          />

          <NavButton
            icon="⚙️"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />

        </div>

      </nav>

    </div>
  );
}
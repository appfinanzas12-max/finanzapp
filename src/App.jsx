import React, { useEffect, useState } from 'react'
import {
  Wallet,
  Users,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  LogOut,
  CreditCard,
  MessageCircle,
} from 'lucide-react'

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'

import { auth } from './firebase'

const Card = ({ children, className = '' }) => (
  <div className={`bg-zinc-950 border border-cyan-500/20 rounded-3xl p-5 shadow-2xl shadow-cyan-500/10 ${className}`}>
    {children}
  </div>
)

const NavBtn = ({ icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-2xl transition-all duration-300 ${
      active
        ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/40'
        : 'text-zinc-500'
    }`}
  >
    {icon}
  </button>
)

function Modal({ children }) {
  return (
    <div className='fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50'>
      <div className='w-full max-w-sm bg-zinc-950 border border-cyan-500/20 rounded-3xl p-6'>
        {children}
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('wallet')

  const [transactions, setTransactions] = useState([])
  const [debts, setDebts] = useState([])
  const [ownDebts, setOwnDebts] = useState([])

  const [showTxModal, setShowTxModal] = useState(false)
  const [showDebtModal, setShowDebtModal] = useState(false)
  const [showOwnDebtModal, setShowOwnDebtModal] = useState(false)

  const [selectedDebt, setSelectedDebt] = useState(null)

  const [txData, setTxData] = useState({
    type: 'income',
    category: '',
    amount: '',
  })

  const [debtData, setDebtData] = useState({
    name: '',
    amount: '',
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
    })

    return () => unsubscribe()
  }, [])

  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const addTransaction = (e) => {
    e.preventDefault()

    const item = {
      id: Date.now(),
      ...txData,
      amount: Number(txData.amount),
      date: new Date().toISOString(),
    }

    setTransactions([item, ...transactions])

    setTxData({
      type: 'income',
      category: '',
      amount: '',
    })

    setShowTxModal(false)
  }

  const addDebt = (e) => {
    e.preventDefault()

    const item = {
      id: Date.now(),
      ...debtData,
      amount: Number(debtData.amount),
    }

    setDebts([item, ...debts])

    setDebtData({
      name: '',
      amount: '',
    })

    setShowDebtModal(false)
  }

  const addOwnDebt = (e) => {
    e.preventDefault()

    const item = {
      id: Date.now(),
      ...debtData,
      amount: Number(debtData.amount),
    }

    setOwnDebts([item, ...ownDebts])

    setDebtData({
      name: '',
      amount: '',
    })

    setShowOwnDebtModal(false)
  }

  const sendWhatsApp = (type) => {
    if (!selectedDebt) return

    const messages = {
      friendly: `Hola ${selectedDebt.name}, te recuerdo amablemente el pago pendiente de $${selectedDebt.amount.toLocaleString('es-CO')}.`,
      firm: `Hola ${selectedDebt.name}, tienes un saldo pendiente de $${selectedDebt.amount.toLocaleString('es-CO')}.`,
      urgent: `URGENTE: ${selectedDebt.name}, el pago de $${selectedDebt.amount.toLocaleString('es-CO')} es prioritario.`,
    }

    const url = `https://wa.me/?text=${encodeURIComponent(messages[type])}`

    window.open(url, '_blank')
    setSelectedDebt(null)
  }

  const balance = transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount
  }, 0)

  if (!user) {
    return (
      <div className='min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.12),transparent_60%)]' />

        <div className='relative z-10 w-full max-w-md p-6'>
          <div className='text-center mb-10'>
            <h1 className='text-6xl font-black text-cyan-400'>FINANZAPP</h1>
            <p className='text-zinc-500 tracking-[6px] mt-3'>DEV ZAACK</p>
          </div>

          <Card>
            <h2 className='text-2xl font-black text-center mb-3'>Sistema Privado</h2>

            <p className='text-zinc-500 text-center text-sm mb-8'>
              Finanzas privadas • Seguridad activa
            </p>

            <button
              onClick={loginGoogle}
              className='w-full bg-cyan-400 text-black font-black py-4 rounded-2xl'
            >
              Iniciar sesión con Google
            </button>

            <p className='text-center text-zinc-600 text-xs mt-6'>
              FinanzApp v1.0.01
            </p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-black text-white pb-28'>
      <header className='p-6 flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-black text-cyan-400'>FINANZAPP</h1>
          <p className='text-zinc-500 text-xs tracking-[4px]'>DEV ZAACK</p>
        </div>
      </header>

      <main className='px-6 max-w-md mx-auto space-y-6'>
        {activeTab === 'wallet' && (
          <>
            <Card>
              <p className='text-zinc-500 text-xs uppercase mb-2'>Balance actual</p>

              <h2 className='text-5xl font-black text-cyan-400 mb-8'>
                ${balance.toLocaleString('es-CO')}
              </h2>

              <button
                onClick={() => setShowTxModal(true)}
                className='w-full bg-cyan-400 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2'
              >
                <Plus size={20} />
                NUEVA TRANSACCIÓN
              </button>
            </Card>

            {transactions.length === 0 && (
              <Card>
                <p className='text-zinc-500'>No hay movimientos todavía.</p>
              </Card>
            )}

            {transactions.map((t) => (
              <Card key={t.id}>
                <div className='flex justify-between items-center'>
                  <div>
                    <p className='font-black'>{t.category}</p>
                    <p className='text-zinc-500 text-xs'>
                      {new Date(t.date).toLocaleDateString()}
                    </p>
                  </div>

                  <p className={`font-black ${t.type === 'income' ? 'text-cyan-400' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('es-CO')}
                  </p>
                </div>
              </Card>
            ))}
          </>
        )}

        {activeTab === 'debts' && (
          <>
            <div className='flex justify-between items-center'>
              <h2 className='text-2xl font-black'>Deudores</h2>

              <button
                onClick={() => setShowDebtModal(true)}
                className='bg-cyan-400 text-black p-3 rounded-2xl'
              >
                <Plus />
              </button>
            </div>

            {debts.length === 0 && (
              <Card>
                <p className='text-zinc-500'>No hay deudores registrados.</p>
              </Card>
            )}

            {debts.map((d) => (
              <Card key={d.id}>
                <div className='flex justify-between items-center'>
                  <div>
                    <p className='font-black'>{d.name}</p>
                    <p className='text-cyan-400 font-black'>
                      ${d.amount.toLocaleString('es-CO')}
                    </p>
                  </div>

                  <div className='flex gap-2'>
                    <button
                      onClick={() => setSelectedDebt(d)}
                      className='p-3 bg-green-500/10 text-green-400 rounded-xl'
                    >
                      <MessageCircle size={18} />
                    </button>

                    <button
                      onClick={() => setDebts(debts.filter((x) => x.id !== d.id))}
                      className='p-3 bg-red-500/10 text-red-500 rounded-xl'
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}

        {activeTab === 'ownDebts' && (
          <>
            <div className='flex justify-between items-center'>
              <h2 className='text-2xl font-black'>A quien le debo</h2>

              <button
                onClick={() => setShowOwnDebtModal(true)}
                className='bg-cyan-400 text-black p-3 rounded-2xl'
              >
                <Plus />
              </button>
            </div>

            {ownDebts.length === 0 && (
              <Card>
                <p className='text-zinc-500'>No tienes deudas registradas.</p>
              </Card>
            )}

            {ownDebts.map((d) => (
              <Card key={d.id}>
                <p className='font-black'>{d.name}</p>
                <p className='text-yellow-400 font-black'>
                  ${d.amount.toLocaleString('es-CO')}
                </p>
              </Card>
            ))}
          </>
        )}

        {activeTab === 'analytics' && (
          <Card>
            <h2 className='text-2xl font-black mb-4'>Analytics</h2>

            <div className='space-y-4'>
              <div>
                <p className='text-zinc-500 text-sm'>Ingresos</p>
                <h3 className='text-cyan-400 text-2xl font-black'>
                  ${transactions
                    .filter((t) => t.type === 'income')
                    .reduce((acc, t) => acc + t.amount, 0)
                    .toLocaleString('es-CO')}
                </h3>
              </div>

              <div>
                <p className='text-zinc-500 text-sm'>Gastos</p>
                <h3 className='text-red-500 text-2xl font-black'>
                  ${transactions
                    .filter((t) => t.type === 'expense')
                    .reduce((acc, t) => acc + t.amount, 0)
                    .toLocaleString('es-CO')}
                </h3>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card>
            <h2 className='text-2xl font-black mb-6'>Ajustes</h2>

            <p className='text-zinc-500 text-sm'>Usuario activo</p>
            <p className='font-black mb-6'>{user.email}</p>

            <button
              onClick={logout}
              className='w-full bg-red-500/10 text-red-500 py-4 rounded-2xl font-black flex items-center justify-center gap-2'
            >
              <LogOut size={18} />
              CERRAR SESIÓN
            </button>
          </Card>
        )}
      </main>

      <nav className='fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-cyan-500/10 p-4 flex justify-around'>
        <NavBtn
          icon={<Wallet size={22} />}
          active={activeTab === 'wallet'}
          onClick={() => setActiveTab('wallet')}
        />

        <NavBtn
          icon={<Users size={22} />}
          active={activeTab === 'debts'}
          onClick={() => setActiveTab('debts')}
        />

        <NavBtn
          icon={<CreditCard size={22} />}
          active={activeTab === 'ownDebts'}
          onClick={() => setActiveTab('ownDebts')}
        />

        <NavBtn
          icon={<BarChart3 size={22} />}
          active={activeTab === 'analytics'}
          onClick={() => setActiveTab('analytics')}
        />

        <NavBtn
          icon={<Settings size={22} />}
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
      </nav>

      {showTxModal && (
        <Modal>
          <h2 className='text-2xl font-black mb-5'>Nueva Transacción</h2>

          <form onSubmit={addTransaction} className='space-y-4'>
            <select
              value={txData.type}
              onChange={(e) => setTxData({ ...txData, type: e.target.value })}
              className='w-full p-4 rounded-2xl bg-zinc-900 border border-cyan-500/20 outline-none'
            >
              <option value='income'>Ingreso</option>
              <option value='expense'>Gasto</option>
            </select>

            <input
              required
              type='text'
              placeholder='Categoría'
              value={txData.category}
              onChange={(e) => setTxData({ ...txData, category: e.target.value })}
              className='w-full p-4 rounded-2xl bg-zinc-900 border border-cyan-500/20 outline-none'
            />

            <input
              required
              type='number'
              placeholder='Monto'
              value={txData.amount}
              onChange={(e) => setTxData({ ...txData, amount: e.target.value })}
              className='w-full p-4 rounded-2xl bg-zinc-900 border border-cyan-500/20 outline-none'
            />

            <button className='w-full bg-cyan-400 text-black font-black py-4 rounded-2xl'>
              GUARDAR
            </button>
          </form>
        </Modal>
      )}

      {showDebtModal && (
        <Modal>
          <h2 className='text-2xl font-black mb-5'>Nuevo Deudor</h2>

          <form onSubmit={addDebt} className='space-y-4'>
            <input
              required
              type='text'
              placeholder='Nombre'
              value={debtData.name}
              onChange={(e) => setDebtData({ ...debtData, name: e.target.value })}
              className='w-full p-4 rounded-2xl bg-zinc-900 border border-cyan-500/20 outline-none'
            />

            <input
              required
              type='number'
              placeholder='Monto'
              value={debtData.amount}
              onChange={(e) => setDebtData({ ...debtData, amount: e.target.value })}
              className='w-full p-4 rounded-2xl bg-zinc-900 border border-cyan-500/20 outline-none'
            />

            <button className='w-full bg-cyan-400 text-black font-black py-4 rounded-2xl'>
              GUARDAR
            </button>
          </form>
        </Modal>
      )}

      {showOwnDebtModal && (
        <Modal>
          <h2 className='text-2xl font-black mb-5'>Nueva Deuda</h2>

          <form onSubmit={addOwnDebt} className='space-y-4'>
            <input
              required
              type='text'
              placeholder='Nombre'
              value={debtData.name}
              onChange={(e) => setDebtData({ ...debtData, name: e.target.value })}
              className='w-full p-4 rounded-2xl bg-zinc-900 border border-cyan-500/20 outline-none'
            />

            <input
              required
              type='number'
              placeholder='Monto'
              value={debtData.amount}
              onChange={(e) => setDebtData({ ...debtData, amount: e.target.value })}
              className='w-full p-4 rounded-2xl bg-zinc-900 border border-cyan-500/20 outline-none'
            />

            <button className='w-full bg-cyan-400 text-black font-black py-4 rounded-2xl'>
              GUARDAR
            </button>
          </form>
        </Modal>
      )}

      {selectedDebt && (
        <Modal>
          <h2 className='text-2xl font-black mb-5'>WhatsApp</h2>

          <div className='space-y-3'>
            <button
              onClick={() => sendWhatsApp('friendly')}
              className='w-full bg-cyan-400 text-black font-black py-4 rounded-2xl'
            >
              Recordatorio amable
            </button>

            <button
              onClick={() => sendWhatsApp('firm')}
              className='w-full bg-yellow-400 text-black font-black py-4 rounded-2xl'
            >
              Recordatorio firme
            </button>

            <button
              onClick={() => sendWhatsApp('urgent')}
              className='w-full bg-red-500 text-white font-black py-4 rounded-2xl'
            >
              Recordatorio urgente
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
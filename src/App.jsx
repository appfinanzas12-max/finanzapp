import { useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'

import { auth } from './firebase'

export default function App() {
  const [user, setUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [transactions, setTransactions] = useState([])

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'ingreso',
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })

    return () => unsubscribe()
  }, [])

  const loginGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.log(error)
      alert('Error iniciando sesión')
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const addTransaction = () => {
    if (!formData.title || !formData.amount) {
      alert('Completa todos los campos')
      return
    }

    const newTransaction = {
      id: Date.now(),
      title: formData.title,
      amount: Number(formData.amount),
      type: formData.type,
      date: new Date().toLocaleDateString(),
    }

    setTransactions([newTransaction, ...transactions])

    setFormData({
      title: '',
      amount: '',
      type: 'ingreso',
    })

    setShowModal(false)
  }

  const ingresos = transactions
    .filter((t) => t.type === 'ingreso')
    .reduce((acc, item) => acc + item.amount, 0)

  const gastos = transactions
    .filter((t) => t.type === 'gasto')
    .reduce((acc, item) => acc + item.amount, 0)

  const balance = ingresos - gastos

  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#000',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff',
          flexDirection: 'column',
          fontFamily: 'Arial',
        }}
      >
        <h1 style={{ fontSize: '50px', marginBottom: '10px' }}>
          FinanzApp
        </h1>

        <p style={{ marginBottom: '30px', opacity: 0.7 }}>
          Controla tus finanzas personales
        </p>

        <button
          onClick={loginGoogle}
          style={{
            padding: '15px 25px',
            borderRadius: '12px',
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Iniciar sesión con Google
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        padding: '20px',
        fontFamily: 'Arial',
      }}
    >
      <div
        style={{
          maxWidth: '450px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>FinanzApp</h1>
            <small>{user.email}</small>
          </div>

          <button
            onClick={logout}
            style={{
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Salir
          </button>
        </div>

        <div
          style={{
            background: '#111',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h3>Balance Total</h3>

          <h1>
            ${balance.toLocaleString('es-CO')}
          </h1>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px',
            }}
          >
            <div
              style={{
                flex: 1,
                background: '#1a1a1a',
                padding: '15px',
                borderRadius: '15px',
              }}
            >
              <p>Ingresos</p>
              <h3>
                ${ingresos.toLocaleString('es-CO')}
              </h3>
            </div>

            <div
              style={{
                flex: 1,
                background: '#1a1a1a',
                padding: '15px',
                borderRadius: '15px',
              }}
            >
              <p>Gastos</p>
              <h3>
                ${gastos.toLocaleString('es-CO')}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '15px',
              borderRadius: '15px',
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            + Nueva Transacción
          </button>
        </div>

        <div>
          <h2>Movimientos</h2>

          {transactions.length === 0 ? (
            <div
              style={{
                background: '#111',
                padding: '20px',
                borderRadius: '15px',
                opacity: 0.7,
              }}
            >
              No hay movimientos todavía
            </div>
          ) : (
            transactions.map((item) => (
              <div
                key={item.id}
                style={{
                  background: '#111',
                  padding: '15px',
                  borderRadius: '15px',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.date}</p>
                </div>

                <strong>
                  {item.type === 'gasto' ? '-' : '+'}$
                  {item.amount.toLocaleString('es-CO')}
                </strong>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              background: '#111',
              padding: '20px',
              borderRadius: '20px',
              width: '90%',
              maxWidth: '400px',
            }}
          >
            <h2>Nueva Transacción</h2>

            <input
              type='text'
              name='title'
              placeholder='Descripción'
              value={formData.title}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '15px',
                borderRadius: '10px',
                border: 'none',
              }}
            />

            <input
              type='number'
              name='amount'
              placeholder='Valor'
              value={formData.amount}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '15px',
                borderRadius: '10px',
                border: 'none',
              }}
            />

            <select
              name='type'
              value={formData.type}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '15px',
                borderRadius: '10px',
              }}
            >
              <option value='ingreso'>Ingreso</option>
              <option value='gasto'>Gasto</option>
            </select>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px',
              }}
            >
              <button
                onClick={addTransaction}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '10px',
                  background: '#2563eb',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Guardar
              </button>

              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
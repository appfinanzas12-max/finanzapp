import { useEffect, useState } from 'react'
            </div>
          </div>
        </div>
      )}

      {showDebtModal && (
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
            <h2>Nuevo Deudor</h2>

            <input
              type='text'
              placeholder='Nombre'
              value={debtData.name}
              onChange={(e) => setDebtData({ ...debtData, name: e.target.value })}
              style={{ width: '100%', padding: '12px', marginTop: '15px', borderRadius: '10px', border: 'none' }}
            />

            <input
              type='number'
              placeholder='Monto'
              value={debtData.amount}
              onChange={(e) => setDebtData({ ...debtData, amount: e.target.value })}
              style={{ width: '100%', padding: '12px', marginTop: '15px', borderRadius: '10px', border: 'none' }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={addDebt}
                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', background: '#2563eb', color: '#fff' }}
              >
                Guardar
              </button>

              <button
                onClick={() => setShowDebtModal(false)}
                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px' }}
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
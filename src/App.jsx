import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const mxn = n =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 })

const DISPLAY_PACKS = [
  { id: "c30", coins: 30, price: 6.89 },
  { id: "c40", coins: 40, price: 9.19 },
  { id: "c50", coins: 50, price: 11.49 },
  { id: "c80", coins: 80, price: 18.35 },
  { id: "c100", coins: 100, price: 22.95 },
  { id: "c150", coins: 150, price: 34.39 },
  { id: "c550", coins: 550, price: 126.09 },
  { id: "custom", custom: true },
]

function randomCardLast4 () {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export default function App () {
  // Estados principales
  const [budget, setBudget] = useState(200)
  const [coins, setCoins] = useState(99999999) // <-- balance inicial grande pedido
  const [spent, setSpent] = useState(0)
  const [history, setHistory] = useState([])
  const [selected, setSelected] = useState("c30")
  const [customCoins, setCustomCoins] = useState(300)
  const [discount, setDiscount] = useState(true)
  const [targetUser, setTargetUser] = useState("") // usuario a enviar
  // compra simulada
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [last4, setLast4] = useState(randomCardLast4())
  const [toast, setToast] = useState(null)

  const effectivePacks = useMemo(() => {
    if (!discount) return DISPLAY_PACKS
    return DISPLAY_PACKS.map(p => (p.custom ? p : { ...p, price: +(p.price * 0.75).toFixed(2) }))
  }, [discount])

  const percent = Math.min(200, Math.round((spent / Math.max(1, budget)) * 100))
  const riskLevel = percent < 50 ? "Bajo" : percent < 100 ? "Medio" : percent < 150 ? "Alto" : "Crítico"
  const remaining = Math.max(0, budget - spent)
  const currentPack = effectivePacks.find(p => p.id === selected) || effectivePacks[0]

  const chartData = useMemo(
    () =>
      history.map((h, i) => ({
        name: new Date(h.t).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
        Gasto: h.price,
        Acumulado: history.slice(0, i + 1).reduce((acc, x) => acc + x.price, 0),
      })),
    [history]
  )

  // enviar monedas a otro usuario (simulado)
  const handleSendToUser = () => {
    if (!targetUser.trim()) {
      setToast({ type: "error", text: "Escribe el usuario destino." })
      clearToastLater()
      return
    }
    const toSend = 100 // ejemplo fijo
    if (coins < toSend) {
      setToast({ type: "error", text: "No tienes suficientes monedas para enviar." })
      clearToastLater()
      return
    }
    setCoins(c => c - toSend)
    setHistory(h => [...h, { t: Date.now(), coins: -toSend, price: 0, note: `Enviado a ${targetUser}` }])
    setToast({ type: "success", text: `Enviadas ${toSend} monedas a ${targetUser}` })
    setTargetUser("")
    clearToastLater()
  }

  function clearToastLater (ms = 2500) {
    setTimeout(() => setToast(null), ms)
  }

  // abrir modal compra -> genera últimos 4 aleatorios cada vez
  const openBuyModal = () => {
    setLast4(randomCardLast4())
    setShowBuyModal(true)
  }

  // confirmar compra simulada (muestra spinner y luego confirma)
  const confirmPurchase = () => {
    // calcular pack seleccionado
    let pack = currentPack
    if (pack.custom) {
      const unit = 22.95 / 100
      pack = { id: "custom", coins: customCoins, price: +(customCoins * unit).toFixed(2) }
      if (discount) pack.price = +(pack.price * 0.75).toFixed(2)
    }
    setIsProcessing(true)
    // simulación de espera (2.2s)
    setTimeout(() => {
      setIsProcessing(false)
      setShowBuyModal(false)
      setCoins(c => c + (pack.coins || 0))
      setSpent(s => s + (pack.price || 0))
      setHistory(h => [...h, { t: Date.now(), coins: pack.coins || 0, price: pack.price || 0, note: "Compra simulada" }])
      setToast({ type: "success", text: `Compra completada: ${pack.coins} monedas — ${mxn(pack.price)}` })
      clearToastLater(3500)
    }, 2200)
  }

  return (
    <div className='container'>
      <div className='card clean-card header-like'>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div className='avatar' />
          <div>
            <div className='title'>navii.exe</div>
            <div className='muted small'>Saldo de regalos: $0.00</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className='mini-card'>
            <div className='muted small'>Balance</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{coins.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className='banner'>
        <div>
          <strong>Recargar:</strong> Ahorra un 25% con una tarifa de servicio más baja.
        </div>
        <label className='toggle'>
          <input type='checkbox' checked={discount} onChange={() => setDiscount(v => !v)} />
          <span>{discount ? "Descuento ON" : "Descuento OFF"}</span>
        </label>
      </div>

      {/* Packs */}
      <div className='grid-like'>
        {effectivePacks.map(p => {
          const isSelected = selected === p.id
          if (p.custom) {
            return (
              <button key={p.id} className={"tile custom " + (isSelected ? "selected" : "")} onClick={() => setSelected(p.id)}>
                <div className='coin'>⚙️</div>
                <div className='big'>Personalizar</div>
                <div className='muted'>Gran cantidad subvencionada</div>
              </button>
            )
          }
          return (
            <button key={p.id} className={"tile " + (isSelected ? "selected" : "")} onClick={() => setSelected(p.id)}>
              <div className='coin'>🟡</div>
              <div className='big'>{p.coins}</div>
              <div className='price'>{mxn(p.price)}</div>
            </button>
          )
        })}
      </div>

      {/* Compra rápida */}
      <div className='card clean-card buybar'>
        {currentPack?.custom ? (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              className='input'
              type='number'
              min={50}
              step={10}
              value={customCoins}
              onChange={e => setCustomCoins(Math.max(50, Number(e.target.value || 0)))}
              style={{ width: 140 }}
            />
            <div className='muted'>Precio estimado</div>
          </div>
        ) : (
          <div className='muted'>
            Seleccionado: <strong>{currentPack?.coins} monedas</strong> — {mxn(currentPack?.price || 0)}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button className='btn' onClick={() => { /* añadir al carrito local */ setToast({ type: "info", text: "Añadido (simulado)" }); clearToastLater() }}>
            Agregar
          </button>
          <button className='btn primary' onClick={openBuyModal}>
            Comprar (simulado)
          </button>
        </div>
      </div>

      {/* Enviar a usuario */}
      <div className='card' style={{ marginTop: 12 }}>
        <h3>Enviar monedas a otro usuario</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input className='input' placeholder='Usuario destino' value={targetUser} onChange={e => setTargetUser(e.target.value)} />
          <button className='btn primary' onClick={handleSendToUser}>Enviar 100</button>
        </div>
        <div className='note' style={{ marginTop: 8 }}>Envía 100 monedas de forma simulada a la cuenta indicada.</div>
      </div>

      {/* Presupuesto y grafica */}
      <div className='grid-2' style={{ marginTop: 12 }}>
        <div className='card'>
          <h2>Presupuesto semanal</h2>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label>Cantidad (MXN)</label>
            <input className='input' type='number' min={50} step={10} value={budget} onChange={e => setBudget(Math.max(50, Number(e.target.value || 0)))} style={{ width: 120 }} />
            <div className='note'>Restante: <strong>{mxn(remaining)}</strong></div>
          </div>
          <div className='progress' style={{ marginTop: 10 }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, percent)}%` }} transition={{ type: "spring", stiffness: 80, damping: 20 }} style={{ background: percent < 100 ? "#10b981" : percent < 150 ? "#f59e0b" : "#ef4444" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span className='small'>Gastado: <strong>{mxn(spent)}</strong></span>
            <span className='small'>Nivel: <strong>{riskLevel}</strong> ({percent}%)</span>
          </div>
        </div>

        <div className='card'>
          <h2>Evolución del gasto</h2>
          {history.length === 0 ? <div className='note'>Aún no hay datos.</div> : <div style={{ height: 260 }}><ResponsiveContainer width='100%' height='100%'><LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray='3 3' /><XAxis dataKey='name' /><YAxis /><Tooltip /><Line type='monotone' dataKey='Gasto' dot /><Line type='monotone' dataKey='Acumulado' dot /></LineChart></ResponsiveContainer></div>}
        </div>
      </div>

      {/* Historial */}
      <div className='card' style={{ marginTop: 12 }}>
        <h3>Historial (simulado)</h3>
        {history.length === 0 ? <div className='note'>Sin transacciones.</div> : history.slice().reverse().map((h, i) => <div key={i} className='row' style={{ justifyContent: "space-between" }}><div>{new Date(h.t).toLocaleTimeString()} — {h.note || ""}</div><div className='muted'>{h.coins > 0 ? `+${h.coins}` : h.coins}</div></div>)}
      </div>

      <div style={{ height: 48 }} />

      {/* Modal de compra */}
      {showBuyModal && (
        <div className='modal-overlay'>
          <motion.div className='modal' initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h3>Confirmar compra (simulado)</h3>
            <div className='muted small'>Método de pago</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ fontSize: 20 }}>💳</div>
                <div>
                  <div style={{ fontWeight: 700 }}>VISA</div>
                  <div className='muted'>•••• {last4}</div>
                </div>
              </div>
              <div style={{ fontWeight: 700 }}>{currentPack?.custom ? `${customCoins} monedas` : `${currentPack?.coins} monedas`}</div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className='btn' onClick={() => setShowBuyModal(false)} disabled={isProcessing}>Cancelar</button>
              <button className='btn primary' onClick={confirmPurchase} disabled={isProcessing}>
                {isProcessing ? "Procesando..." : "Confirmar compra"}
              </button>
            </div>

            {isProcessing && <div style={{ marginTop: 12, textAlign: "center" }}><div className='spinner' /></div>}
          </motion.div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === "error" ? "toast-error" : toast.type === "info" ? "toast-info" : "toast-success"}`}>
          {toast.text}
        </div>
      )}

      <div className='footer small'>Proyecto educativo — compras simuladas, no reales.</div>
    </div>
  )
}

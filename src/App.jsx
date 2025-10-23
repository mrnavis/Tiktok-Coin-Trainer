import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"

const mxn = n =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 })

// Packs como en la UI
const DISPLAY_PACKS = [
  { id: "c30",  coins: 30,  price: 6.89 },
  { id: "c40",  coins: 40,  price: 9.19 },
  { id: "c50",  coins: 50,  price: 11.49 },
  { id: "c80",  coins: 80,  price: 18.35 },
  { id: "c100", coins: 100, price: 22.95 },
  { id: "c150", coins: 150, price: 34.39 },
  { id: "c550", coins: 550, price: 126.09 },
  { id: "custom", custom: true },
]

// Últimos 4 estáticos (NO 1234)
const CARD_LAST4 = "7284"

export default function App () {
  const [coins, setCoins] = useState(99999999)
  const [selected, setSelected] = useState("c30")
  const [customCoins, setCustomCoins] = useState(300)
  const [discount, setDiscount] = useState(true)

  // Envío
  const [targetUser, setTargetUser] = useState("")
  const [sendAmount, setSendAmount] = useState(100)
  const [lastSend, setLastSend] = useState({ user: "", amount: 0 })

  // Modales/estados
  const [buyOpen, setBuyOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sendCountdown, setSendCountdown] = useState(0)
  const [toast, setToast] = useState(null)

  // packs con descuento
  const effectivePacks = useMemo(() => {
    if (!discount) return DISPLAY_PACKS
    return DISPLAY_PACKS.map(p => (p.custom ? p : { ...p, price: +(p.price * 0.75).toFixed(2) }))
  }, [discount])

  const currentPack = effectivePacks.find(p => p.id === selected) || effectivePacks[0]

  // total a pagar
  const totalPrice = useMemo(() => {
    if (!currentPack) return 0
    if (!currentPack.custom) return currentPack.price
    const unit = 22.95 / 100
    const base = +(customCoins * unit).toFixed(2)
    return discount ? +(base * 0.75).toFixed(2) : base
  }, [currentPack, customCoins, discount])

  /* ---------------- Comprar ---------------- */
  const openBuy = () => { setSuccess(false); setBuyOpen(true) }
  const closeBuy = () => { if (!processing) { setBuyOpen(false); setSuccess(false) } }

  const confirmBuy = () => {
    setProcessing(true)
    setTimeout(() => {
      const add = currentPack?.custom ? customCoins : (currentPack?.coins || 0)
      setCoins(c => c + add)
      setProcessing(false)
      setSuccess(true)
    }, 1500)
  }

  /* ---------------- Enviar ---------------- */
  const openSend = () => {
    const name = targetUser.trim()
    if (!name) {
      setToast({ kind: "warn", text: "Escribe un usuario destino" })
      return clearToastLater()
    }
    if (!Number.isFinite(sendAmount) || sendAmount <= 0) {
      setToast({ kind: "warn", text: "Indica una cantidad válida a enviar" })
      return clearToastLater()
    }
    if (sendAmount > coins) {
      setToast({ kind: "warn", text: "Saldo insuficiente" })
      return clearToastLater()
    }
    setSuccess(false)
    setSendOpen(true)
    startSendCountdown(3)
  }
  const closeSend = () => { if (!processing) { setSendOpen(false); setSuccess(false) } }

  const startSendCountdown = (sec) => {
    setSendCountdown(sec)
    const id = setInterval(() => {
      setSendCountdown(prev => {
        if (prev <= 1) { clearInterval(id); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const confirmSend = () => {
    if (sendCountdown > 0) return
    const user = targetUser.trim()
    const amount = sendAmount

    setProcessing(true)
    setTimeout(() => {
      setCoins(c => c - amount)
      setProcessing(false)
      setSuccess(true)
      setLastSend({ user, amount }) // guardar datos del envío
      setToast({ kind: "ok", text: `Monedas enviadas con éxito a ${user}` })
      setTargetUser("")
      clearToastLater(3000)
    }, 1400)
  }

  function clearToastLater (ms = 2200) {
    setTimeout(() => setToast(null), ms)
  }

  return (
    <div className="page">
      <div className="topbar">
        <div className="title-xl">Obtener Monedas</div>
        <a className="link" href="#" onClick={e => e.preventDefault()}>Ver historial de transacciones</a>
      </div>

      {/* Header */}
      <div className="header-cards">
        <div className="panel profile">
          <div className="row">
            <div className="avatar" />
            <div>
              <div className="user">navii.exe</div>
              <div className="muted small">0</div>
            </div>
          </div>
          <div className="muted small">Canjear por Monedas ▸</div>
          <div className="muted small">Saldo de Regalos LIVE: $0.00</div>
        </div>
        <div className="panel invite">
          <div className="muted small">Invita y consigue recompensas ▸</div>
          <div className="code">U4XPSF68</div>
        </div>
      </div>

      {/* Banner */}
      <div className="notice">
        <strong>Recargar:</strong> Ahorra un 25 % con una tarifa de servicio de terceros más baja.
        <label className="toggle">
          <input type="checkbox" checked={discount} onChange={() => setDiscount(v => !v)} />
          <span>{discount ? "ON" : "OFF"}</span>
        </label>
      </div>

      {/* Grid de paquetes */}
      <div className="pack-grid">
        {effectivePacks.map(p => {
          const isSel = selected === p.id
          if (p.custom) {
            return (
              <button key={p.id} className={"pack custom " + (isSel ? "selected" : "")} onClick={() => setSelected(p.id)}>
                <div className="coin">🟡</div>
                <div className="big">Personalizar</div>
                <div className="muted">Gran cantidad subvencionada</div>
              </button>
            )
          }
          return (
            <button key={p.id} className={"pack " + (isSel ? "selected" : "")} onClick={() => setSelected(p.id)}>
              <div className="coin">🟡</div>
              <div className="big">{p.coins}</div>
              <div className="muted">{mxn(p.price)}</div>
            </button>
          )
        })}
      </div>

      {/* Enviar monedas */}
      <div className="panel sendbox">
        <div className="strong">Enviar monedas</div>
        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          <input className="input" placeholder="Usuario" value={targetUser} onChange={e => setTargetUser(e.target.value)} />
          <input
            className="input"
            type="number"
            min={1}
            step={1}
            value={sendAmount}
            onChange={e => setSendAmount(Math.max(1, Math.floor(Number(e.target.value || 0))))}
            style={{ width: 120 }}
            placeholder="Cantidad"
          />
          <button className="btn primary" onClick={openSend}>Enviar</button>
        </div>
      </div>

      {/* MODAL: Enviar */}
      {sendOpen && (
        <div className="modal-overlay" onClick={closeSend}>
          <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ scale: .96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {!success ? (
              <>
                <div className="modal-title">Confirmar envío</div>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                  <div className="muted small">Usuario destino</div>
                  <div className="strong">{targetUser}</div>
                </div>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                  <div className="muted small">Cantidad</div>
                  <div className="strong">{sendAmount} monedas</div>
                </div>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div className="muted small">Confirmar habilitado en</div>
                  <div className="price">{sendCountdown}s</div>
                </div>

                <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                  <button className="btn" onClick={closeSend} disabled={processing}>Cancelar</button>
                  <button className="btn primary" onClick={confirmSend} disabled={processing || sendCountdown > 0}>
                    {processing ? "Procesando..." : (sendCountdown > 0 ? `Esperar ${sendCountdown}s` : "Confirmar")}
                  </button>
                </div>

                {processing && <div className="waiting"><div className="spinner" /></div>}
              </>
            ) : (
              <SuccessBlock text={`Monedas enviadas con éxito a ${lastSend.user} (${lastSend.amount} monedas)`} onClose={closeSend} />
            )}
          </motion.div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={"toast " + (toast.kind === "ok" ? "ok" : "warn")}>
          {toast.kind === "ok" ? <span className="check">✔</span> : <span className="warn">!</span>}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  )
}

/** Bloque de éxito con paloma verde */
function SuccessBlock ({ text, onClose }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0 2px" }}>
      <div style={{
        width: 70, height: 70, margin: "6px auto 10px",
        borderRadius: "999px", background: "#ecfdf5",
        display: "grid", placeItems: "center", border: "1px solid #bbf7d0"
      }}>
        <span style={{ color: "#16a34a", fontSize: 36, fontWeight: 900 }}>✔</span>
      </div>
      <div style={{ fontWeight: 800, marginBottom: 12 }}>{text}</div>
      <button className="btn primary" onClick={onClose}>Cerrar</button>
    </div>
  )
}

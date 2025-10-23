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
  // Estado base
  const [coins, setCoins] = useState(99999999) // balance grande
  const [selected, setSelected] = useState("c30")
  const [customCoins, setCustomCoins] = useState(300)
  const [discount, setDiscount] = useState(true)
  const [targetUser, setTargetUser] = useState("")

  // UI
  const [buyOpen, setBuyOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState(null)

  // packs con descuento ON/OFF
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

  // compra
  const openBuy = () => setBuyOpen(true)
  const closeBuy = () => { if (!processing) setBuyOpen(false) }

  const confirmBuy = () => {
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      setBuyOpen(false)
      const add = currentPack?.custom ? customCoins : (currentPack?.coins || 0)
      setCoins(c => c + add)
      setToast({ kind: "ok", text: "Pago aprobado" })
      clearToastLater(3000)
    }, 1800)
  }

  // enviar monedas
  const sendCoins = () => {
    if (!targetUser.trim()) {
      setToast({ kind: "warn", text: "Escribe un usuario destino" })
      clearToastLater()
      return
    }
    const toSend = 100
    if (coins < toSend) {
      setToast({ kind: "warn", text: "Saldo insuficiente" })
      clearToastLater()
      return
    }
    setCoins(c => c - toSend)
    setToast({ kind: "ok", text: `Monedas enviadas con éxito a ${targetUser}` })
    setTargetUser("")
    clearToastLater(2800)
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

      {/* Header con tarjeta izquierda y “invita” derecha */}
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

      {/* Banner de descuento */}
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

      {/* Reembolso / banner inferior */}
      <div className="rebate">
        <div className="pct">5%</div>
        <div>
          <div className="strong">Reembolso de hasta USD 250.</div>
          <div className="muted small">Agrega y recarga desde el escritorio para aplicarlo. Código completado automáticamente.</div>
        </div>
        <button className="btn">Agregar</button>
      </div>

      {/* “Método de pago” + Total + Recargar */}
      <div className="paycard">
        <div className="muted small">Método de pago</div>
        <div className="payrow">
          {["/visa.png","/mastercard.png","/paypal.png","/oxxo.png"].map((src, i) => (
            <img key={i} src={src} alt="" onError={e => { e.currentTarget.replaceWith(Object.assign(document.createElement('span'), { className: 'badge', innerText: ['VISA','MC','PayPal','OXXO'][i] })) }} />
          ))}
        </div>
        <div className="total">
          <div>Total</div>
          <div className="price">{mxn(totalPrice)}</div>
        </div>
        <button className="recargar" onClick={openBuy}>Recargar</button>
        <div className="secure">
          <img src="/secure.png" alt="" onError={e => { e.currentTarget.style.display='none' }} />
          <span>SECURE Payment</span>
        </div>
      </div>

      {/* Enviar monedas */}
      <div className="panel sendbox">
        <div className="strong">Enviar monedas</div>
        <div className="row">
          <input className="input" placeholder="Usuario" value={targetUser} onChange={e => setTargetUser(e.target.value)} />
          <button className="btn primary" onClick={sendCoins}>Enviar 100</button>
        </div>
      </div>

      {/* Footer “Invita…” */}
      <div className="panel invite-wide">
        <div>👋 Invita y consigue recompensas</div>
        <div className="muted small">¡Echa un vistazo a esta nueva función!</div>
      </div>

      {/* MODAL COMPRA */}
      {buyOpen && (
        <div className="modal-overlay" onClick={closeBuy}>
          <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ scale: .96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="modal-title">Confirmar pago</div>
            <div className="payrow" style={{ marginBottom: 8 }}>
              <img src="/visa.png" alt="" onError={e => { e.currentTarget.replaceWith(Object.assign(document.createElement('span'), { className: 'badge', innerText: 'VISA' })) }} />
              <div className="muted">•••• {CARD_LAST4}</div>
            </div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <div className="muted small">Compra</div>
              <div className="strong">{currentPack?.custom ? `${customCoins} monedas` : `${currentPack?.coins} monedas`}</div>
            </div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
              <div className="muted small">Total</div>
              <div className="price">{mxn(totalPrice)}</div>
            </div>

            <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" onClick={closeBuy} disabled={processing}>Cancelar</button>
              <button className="btn primary" onClick={confirmBuy} disabled={processing}>
                {processing ? "Procesando..." : "Pagar"}
              </button>
            </div>

            {processing && <div className="waiting"><div className="spinner" /></div>}
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

      {/* Barra fija abajo con total y botón (estilo móvil) */}
      <div className="bottombar">
        <div className="muted small">Total</div>
        <div className="price">{mxn(totalPrice)}</div>
        <button className="recargar" onClick={openBuy}>Recargar</button>
      </div>
    </div>
  )
}

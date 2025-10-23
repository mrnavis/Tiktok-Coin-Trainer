import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"

const mxn = n =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 })

// Paquetes y precios como TikTok (MXN)
const DISPLAY_PACKS = [
  { id: "c30",    coins: 30,    price: 6.89 },
  { id: "c350",   coins: 350,   price: 80.25 },
  { id: "c700",   coins: 700,   price: 160.49 },
  { id: "c1400",  coins: 1400,  price: 320.95 },
  { id: "c3500",  coins: 3500,  price: 802.39 },
  { id: "c7000",  coins: 7000,  price: 1604.75 },
  { id: "c17500", coins: 17500, price: 4011.85 },
  { id: "custom", custom: true },
]

// Últimos 4 estáticos de la tarjeta
const CARD_LAST4 = "7284"

export default function App () {
  const [coins, setCoins] = useState(99999999)

  // Selección y descuento
  const [selected, setSelected] = useState("c30")
  const [customCoins, setCustomCoins] = useState(300)
  const [discount, setDiscount] = useState(true)

  // Envío
  const [targetUser, setTargetUser] = useState("")
  const [sendAmount, setSendAmount] = useState(100)
  const [lastSend, setLastSend] = useState({ user: "", amount: 0, bought: 0 })

  // Modales y estado de UI
  const [buyOpen, setBuyOpen]   = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [toast, setToast] = useState(null)

  const effectivePacks = useMemo(() => {
    if (!discount) return DISPLAY_PACKS
    return DISPLAY_PACKS.map(p => (p.custom ? p : { ...p, price: +(p.price * 0.75).toFixed(2) }))
  }, [discount])

  const currentPack = effectivePacks.find(p => p.id === selected) || effectivePacks[0]
  const packCoins = currentPack?.custom ? customCoins : (currentPack?.coins || 0)

  // Total a pagar del pack seleccionado
  const totalPrice = useMemo(() => {
    if (!currentPack) return 0
    if (!currentPack.custom) return currentPack.price
    // estimación lineal educativa (basada en c350=80.25)
    const unit = 80.25 / 350
    const base = +(customCoins * unit).toFixed(2)
    return discount ? +(base * 0.75).toFixed(2) : base
  }, [currentPack, customCoins, discount])

  /* ------------ Compra ------------ */
  const openBuy  = () => { setSuccess(false); setBuyOpen(true) }
  const closeBuy = () => { if (!processing) { setBuyOpen(false); setSuccess(false) } }

  const confirmBuy = () => {
    if (totalPrice <= 0) return
    setProcessing(true)
    setTimeout(() => {
      setCoins(c => c + packCoins)
      setProcessing(false)
      setSuccess(true)
    }, 1200)
  }

  /* ------------ Enviar (comprar y enviar) ------------ */
  const openSend = () => {
    const name = targetUser.trim()
    if (!name) { setToast({ kind:"warn", text:"Escribe un usuario destino" }); return clearToastLater() }
    if (!Number.isFinite(sendAmount) || sendAmount <= 0) {
      setToast({ kind:"warn", text:"Indica una cantidad válida a enviar" }); return clearToastLater()
    }
    setSuccess(false)
    setSendOpen(true)
  }
  const closeSend = () => { if (!processing) { setSendOpen(false); setSuccess(false) } }

  const confirmSend = () => {
    setProcessing(true)
    const user = targetUser.trim()
    const amount = sendAmount
    const bought = packCoins
    setTimeout(() => {
      // Compra + envío: sumamos lo comprado y descontamos lo enviado
      setCoins(c => c + bought - amount)
      setProcessing(false)
      setSuccess(true)
      setLastSend({ user, amount, bought })
      setTargetUser("")
      setToast({ kind:"ok", text:`Se enviaron ${amount} monedas a ${user}` })
      clearToastLater(2800)
    }, 1300)
  }

  function clearToastLater (ms = 2200) {
    setTimeout(() => setToast(null), ms)
  }

  return (
    <div className="page">
      {/* Topbar */}
      <div className="topbar">
        <div className="title-xl">Obtener Monedas</div>
        <a className="link" href="#" onClick={e => e.preventDefault()}>Iniciar sesión</a>
      </div>

      {/* SALDO con ícono */}
      <div className="balance-box">
        <div className="balance-label">Saldo actual:</div>
        <div className="balance-value">
          <img src="/coin.png" alt="coin" className="coin-img" />
          {coins.toLocaleString("es-MX")}
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
                <img src="/coin.png" alt="coin" className="coin-img" />
                <div className="big">Personalizar</div>
                <div className="muted">Gran cantidad subvencionada</div>
              </button>
            )
          }
          return (
            <button key={p.id} className={"pack " + (isSel ? "selected" : "")} onClick={() => setSelected(p.id)}>
              <img src="/coin.png" alt="coin" className="coin-img" />
              <div className="big">{p.coins.toLocaleString("es-MX")}</div>
              <div className="muted">{mxn(p.price)}</div>
            </button>
          )
        })}
      </div>

      {/* Total + Recargar */}
      <div className="paycard" style={{ marginTop: 12 }}>
        <div className="total">
          <div>Total</div>
          <div className="price">{mxn(totalPrice)}</div>
        </div>
        <button
          className="recargar"
          onClick={openBuy}
          disabled={totalPrice <= 0}
          style={{ opacity: totalPrice <= 0 ? 0.5 : 1 }}
        >
          Recargar
        </button>
        <div className="secure">
          <span className="badge">SECURE</span><span>Payment</span>
        </div>
      </div>

      {/* Enviar */}
      <div className="panel sendbox" style={{ marginTop: 14 }}>
        <div className="strong">Enviar monedas</div>
        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          <input
            className="input"
            placeholder="Usuario"
            value={targetUser}
            onChange={e => setTargetUser(e.target.value)}
          />
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
        <div className="muted small" style={{ marginTop: 6 }}>
          Al enviar, se comprará el paquete seleccionado y se enviarán esas monedas al usuario.
        </div>
      </div>

      {/* MODAL: Confirmar pago */}
      {buyOpen && (
        <div className="modal-overlay" onClick={closeBuy}>
          <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ scale:.96, opacity:0 }} animate={{ scale:1, opacity:1 }}>
            {!success ? (
              <>
                <div className="modal-title">Confirmar pago</div>
                <div className="payrow" style={{ marginBottom: 8 }}>
                  <span className="badge">VISA</span>
                  <div className="muted">•••• {CARD_LAST4}</div>
                </div>
                <div className="row" style={{ justifyContent:"space-between", marginBottom:10 }}>
                  <div className="muted small">Compra</div>
                  <div className="strong">{packCoins.toLocaleString("es-MX")} monedas</div>
                </div>
                <div className="row" style={{ justifyContent:"space-between", marginBottom:14 }}>
                  <div className="muted small">Total</div>
                  <div className="price">{mxn(totalPrice)}</div>
                </div>

                <div className="row" style={{ justifyContent:"flex-end", gap:8 }}>
                  <button className="btn" onClick={closeBuy} disabled={processing}>Cancelar</button>
                  <button className="btn primary" onClick={confirmBuy} disabled={processing || totalPrice<=0}>
                    {processing ? "Procesando..." : "Pagar"}
                  </button>
                </div>

                {processing && <div className="waiting"><div className="spinner" /></div>}
              </>
            ) : (
              <SuccessBlock text="Pago aprobado" onClose={closeBuy} />
            )}
          </motion.div>
        </div>
      )}

      {/* MODAL: Enviar = Comprar y enviar */}
      {sendOpen && (
        <div className="modal-overlay" onClick={closeSend}>
          <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ scale:.96, opacity:0 }} animate={{ scale:1, opacity:1 }}>
            {!success ? (
              <>
                <div className="modal-title">Confirmar compra y envío</div>
                <div className="payrow" style={{ marginBottom: 8 }}>
                  <span className="badge">VISA</span>
                  <div className="muted">•••• {CARD_LAST4}</div>
                </div>

                <div className="row" style={{ justifyContent:"space-between", marginBottom:8 }}>
                  <div className="muted small">Paquete a comprar</div>
                  <div className="strong">{packCoins.toLocaleString("es-MX")} monedas</div>
                </div>
                <div className="row" style={{ justifyContent:"space-between", marginBottom:8 }}>
                  <div className="muted small">Usuario destino</div>
                  <div className="strong">{targetUser}</div>
                </div>
                <div className="row" style={{ justifyContent:"space-between", marginBottom:10 }}>
                  <div className="muted small">Cantidad a enviar</div>
                  <div className="strong">{sendAmount.toLocaleString("es-MX")} monedas</div>
                </div>

                <div className="row" style={{ justifyContent:"space-between", marginBottom:14 }}>
                  <div className="muted small">Total a pagar</div>
                  <div className="price">{mxn(totalPrice)}</div>
                </div>

                <div className="row" style={{ justifyContent:"flex-end", gap:8 }}>
                  <button className="btn" onClick={closeSend} disabled={processing}>Cancelar</button>
                  <button className="btn primary" onClick={confirmSend} disabled={processing || totalPrice<=0}>
                    {processing ? "Procesando..." : "Confirmar"}
                  </button>
                </div>

                {processing && <div className="waiting"><div className="spinner" /></div>}
              </>
            ) : (
              <SuccessBlock
                text={`Se compraron ${lastSend.bought.toLocaleString("es-MX")} y se enviaron ${lastSend.amount.toLocaleString("es-MX")} a ${lastSend.user}`}
                onClose={closeSend}
              />
            )}
          </motion.div>
        </div>
      )}

      {/* Toast */}
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

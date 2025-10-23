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
// Monto interno para enviar (no se muestra en UI)
const SEND_AMOUNT = 100

export default function App () {
  const [coins, setCoins] = useState(99999999)
  const [selected, setSelected] = useState("c30")
  const [customCoins, setCustomCoins] = useState(300)
  const [discount, setDiscount] = useState(true)
  const [targetUser, setTargetUser] = useState("")

  // UI modales/estados
  const [buyOpen, setBuyOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)       // muestra paloma verde
  const [sendCountdown, setSendCountdown] = useState(0) // 3 → 2 → 1 → 0 para habilitar Confirmar

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

  // -------- Comprar --------
  const openBuy = () => { setSuccess(false); setBuyOpen(true) }
  const closeBuy = () => { if (!processing) { setBuyOpen(false); setSuccess(false) } }

  const confirmBuy = () => {
    setProcessing(true)
    setTimeout(() => {
      const add = currentPack?.custom ? customCoins : (currentPack?.coins || 0)
      setCoins(c => c + add)
      setProcessing(false)
      setSuccess(true) // muestra paloma dentro del modal
    }, 1500)
  }

  // -------- Enviar --------
  const openSend = () => {
    if (!targetUser.trim()) {
      setToast({ kind: "warn", text: "Escribe un usuario destino" })
      clearToastLater()
      return
    }
    setSuccess(false)
    setSendOpen(true)
    startSendCountdown(3) // 3s
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
    setProcessing(true)
    setTimeout(() => {
      // descuenta internamente, sin mostrar cantidad en UI
      setCoins(c => c - SEND_AMOUNT)
      setProcessing(false)
      setSuccess(true) // paloma dentro del modal
      setToast({ kind: "ok", text: `Monedas enviadas con éxito a ${targetUser}` })
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

      {/* Reembolso */}
      <div className="rebate">
        <div className="pct">5%</div>
        <div>
          <div className="strong">Reembolso de hasta USD 250.</div>
          <div className="muted small">Agrega y recarga desde el escritorio para aplicarlo. Código completado automáticamente.</div>
        </div>
        <button className="btn">Agregar</button>
      </div>

      {/* Método de pago + Total + Recargar */}
      <div className="paycard">
        <div className="muted small">Método de pago</div>
        <div className="payrow">
          {["/visa.png","/mastercard.png","/paypal.png","/oxxo.png"].map((src, i) => (
            <img key={i} src={src} alt="" onError={e => {
              const el = document.createElement('span'); el.className='badge'
              el.innerText = ['VISA','MC','PayPal','OXXO'][i]; e.currentTarget.replaceWith(el)
            }} />
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
          <button className="btn primary" onClick={openSend}>Enviar</button>
        </div>
      </div>

      {/* Footer “Invita…” */}
      <div className="panel invite-wide">
        <div>👋 Invita y consigue recompensas</div>
        <div className="muted small">¡Echa un vistazo a esta nueva función!</div>
      </div>

      {/* MODAL: Comprar */}
      {buyOpen && (
        <div className="modal-overlay" onClick={closeBuy}>
          <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ scale: .96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {!success ? (
              <>
                <div className="modal-title">Confirmar pago</div>
                <div className="payrow" style={{ marginBottom: 8 }}>
                  <img src="/visa.png" alt="" onError={e => { const el=document.createElement('span'); el.className='badge'; el.innerText='VISA'; e.currentTarget.replaceWith(el) }} />
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
              </>
            ) : (
              <SuccessBlock text="Pago aprobado" onClose={closeBuy} />
            )}
          </motion.div>
        </div>
      )}

      {/* MODAL: Enviar (misma ventana) */}
      {sendOpen && (
        <div className="modal-overlay" onClick={closeSend}>
          <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ scale: .96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {!success ? (
              <>
                <div className="modal-title">Confirmar envío</div>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
                  <div className="muted small">Usuario destino</div>
                  <div className="strong">@{targetUser}</div>
                </div>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
                  <div className="muted small">Acción</div>
                  <div className="strong">Enviar monedas</div>
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
              <SuccessBlock text={`Monedas enviadas con éxito a @${targetUser || "usuario"}`} onClose={closeSend} />
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

      {/* Barra inferior fija (móvil) */}
      <div className="bottombar">
        <div className="muted small">Total</div>
        <div className="price">{mxn(totalPrice)}</div>
        <button className="recargar" onClick={openBuy}>Recargar</button>
      </div>
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

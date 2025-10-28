import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"

const mxn = n =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 })

// Paquetes (MXN)
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

const CARD_LAST4 = "7284"

// ✅ base para GitHub Pages (sirve también local)
const BASE = import.meta.env.BASE_URL || "/"
const COIN_IMG = `${BASE}coin.png`
const AVATAR_FALLBACK = `${BASE}avatar-fallback.png`

export default function App () {
  const [coins, setCoins] = useState(999999999)

  // compra
  const [selected, setSelected] = useState("c30")
  const [customCoins, setCustomCoins] = useState(300)
  const [discount, setDiscount] = useState(true)

  // envío
  const [targetUser, setTargetUser] = useState("")
  const [sendAmount, setSendAmount] = useState(100)
  const [lastSend, setLastSend] = useState({ user: "", amount: 0 })
  const [recipientAvatar, setRecipientAvatar] = useState(null)

  // modales y estado
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

  // total para custom (estimación)
  const totalPrice = useMemo(() => {
    if (!currentPack) return 0
    if (!currentPack.custom) return currentPack.price
    const unit = 80.25 / 350
    const base = +(customCoins * unit).toFixed(2)
    return discount ? +(base * 0.75).toFixed(2) : base
  }, [currentPack, customCoins, discount])

  /* ---------------- Enviar (arriba) ---------------- */
  const openSend = () => {
    const name = targetUser.trim()
    if (!name) { note("warn", "Escribe un usuario destino"); return }
    if (!Number.isFinite(sendAmount) || sendAmount <= 0) { note("warn", "Cantidad inválida"); return }
    if (sendAmount > coins) { note("warn", "Saldo insuficiente"); return }

    const handle = name.replace(/^@/, "")
    // Avatar por Unavatar (frontend); si falla, cae a placeholder local
    setRecipientAvatar(`https://unavatar.io/tiktok/${encodeURIComponent(handle)}`)

    setSuccess(false)
    setSendOpen(true)
  }

  const closeSend = () => { if (!processing) { setSendOpen(false); setSuccess(false) } }

  const confirmSend = () => {
    setProcessing(true)
    const user = targetUser.trim()
    const amount = sendAmount
    setTimeout(() => {
      setCoins(c => c - amount)
      setProcessing(false)
      setSuccess(true)
      setLastSend({ user, amount })
      setTargetUser("")
      note("ok", `Se enviaron ${amount} monedas a ${user}`, 2800)
    }, 1000)
  }

  /* ---------------- Compra (abajo) ---------------- */
  const openBuy  = () => { setSuccess(false); setBuyOpen(true) }
  const closeBuy = () => { if (!processing) { setBuyOpen(false); setSuccess(false) } }
  const confirmBuy = () => {
    if (totalPrice <= 0) return
    setProcessing(true)
    setTimeout(() => {
      setCoins(c => c + packCoins) // solo compra
      setProcessing(false)
      setSuccess(true)
    }, 1200)
  }

  function note(kind, text, ms = 2200) { setToast({ kind, text }); setTimeout(() => setToast(null), ms) }

  const remainingAfterSend = Math.max(0, coins - Math.max(0, sendAmount))

  return (
    <div className="page">
      {/* Topbar */}
      <div className="topbar">
        <div className="title-xl">Get Coins</div>
        <a className="link" href="#" onClick={(e)=>e.preventDefault()}>Iniciar sesión</a>
      </div>

      {/* Saldo */}
      <div className="balance-box">
        <div className="balance-label">Saldo actual:</div>
        <div className="balance-value">
          <img src={COIN_IMG} alt="coin" className="coin-img" />
          {coins.toLocaleString("es-MX")}
        </div>
      </div>

      {/* ===== Enviar monedas (ARRIBA) ===== */}
      <div className="panel sendbox">
        <div className="strong">Enviar monedas</div>
        <div className="row" style={{ marginBottom: 8 }}>
          <input className="input" placeholder="Usuario"
                 value={targetUser} onChange={e => setTargetUser(e.target.value)} />
          <input className="input" type="number" min={1} step={1}
                 value={sendAmount}
                 onChange={e => setSendAmount(Math.max(1, Math.floor(Number(e.target.value || 0))))}
                 style={{ width: 120 }} placeholder="Cantidad" />
          <button className="btn primary" onClick={openSend}>Enviar</button>
        </div>

        {/* Vista previa del destinatario (avatar) */}
        {targetUser.trim() && (
          <div className="row" style={{ alignItems:"center", gap:10 }}>
            <img
              src={recipientAvatar || AVATAR_FALLBACK}
              onError={(e)=>{ e.currentTarget.src = AVATAR_FALLBACK }}
              alt="avatar"
              className="avatar-sm"
            />
            <div style={{ fontWeight: 600 }}>{targetUser.trim()}</div>
          </div>
        )}

        <div className="muted small" style={{ marginTop: 8 }}>
          El envío se descuenta de tu saldo actual. Si necesitas más monedas, usa “Recargar”.
        </div>
      </div>

      {/* ===== Recarga/Compras (ABAJO) ===== */}
      <div className="notice" style={{ marginTop: 16 }}>
        <strong>Recargar:</strong> Ahorra un 25 % con una tarifa de servicio de terceros más baja.
        <label className="toggle">
          <input type="checkbox" checked={discount} onChange={() => setDiscount(v => !v)} />
          <span>{discount ? "ON" : "OFF"}</span>
        </label>
      </div>

      <div className="pack-grid">
        {effectivePacks.map(p => {
          const isSel = selected === p.id
          if (p.custom) {
            return (
              <button key={p.id} className={"pack custom " + (isSel ? "selected" : "")} onClick={() => setSelected(p.id)}>
                <img src={COIN_IMG} alt="coin" className="coin-img" />
                <div className="big">Personalizar</div>
                <div className="muted">Gran cantidad subvencionada</div>
              </button>
            )
          }
          return (
            <button key={p.id} className={"pack " + (isSel ? "selected" : "")} onClick={() => setSelected(p.id)}>
              <img src={COIN_IMG} alt="coin" className="coin-img" />
              <div className="big">{p.coins.toLocaleString("es-MX")}</div>
              <div className="muted">{mxn(p.price)}</div>
            </button>
          )
        })}
      </div>

      <div className="paycard">
        <div className="total">
          <div>Total</div>
          <div className="price">{mxn(totalPrice)}</div>
        </div>
        <div className="payment-section">
          <button className="recargar" onClick={openBuy} disabled={totalPrice <= 0}>Recargar</button>
          <span className="secure">SECURE Payment</span>
        </div>
      </div>

      {/* MODAL: Enviar */}
      {sendOpen && (
        <Modal onClose={closeSend}>
          {!success ? (
            <>
              <div className="modal-title">Send coins</div>
              <Row label="Recipient">
                <div className="strong" style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <img
                    src={recipientAvatar || AVATAR_FALLBACK}
                    onError={(e)=>{ e.currentTarget.src = AVATAR_FALLBACK }}
                    alt="avatar"
                    className="avatar-sm"
                  />
                  {targetUser}
                </div>
              </Row>
              <Row label="Amount to send"><div className="strong">{sendAmount.toLocaleString("es-MX")} coins</div></Row>
              <Row label="Balance after send"><div className="price">{remainingAfterSend.toLocaleString("es-MX")} coins</div></Row>
              <FooterButtons processing={processing} onCancel={closeSend} onConfirm={confirmSend} confirmText="Confirm" />
              {processing && <Waiter/>}
            </>
          ) : (
            <SuccessBlock text={`Se enviaron ${lastSend.amount.toLocaleString("es-MX")} a ${lastSend.user}`} onClose={closeSend}/>
          )}
        </Modal>
      )}

      {/* MODAL: Compra */}
      {buyOpen && (
        <Modal onClose={closeBuy}>
          {!success ? (
            <>
              <div className="modal-title">Order summary</div>
              <Row label="Payment method"><div><span className="badge">VISA</span> <span className="muted">•••• {CARD_LAST4}</span></div></Row>
              <Row label="Purchase"><div className="strong">{packCoins.toLocaleString("es-MX")} coins</div></Row>
              <Row label="Total"><div className="price">{mxn(totalPrice)}</div></Row>
              <FooterButtons processing={processing} onCancel={closeBuy} onConfirm={confirmBuy} confirmText="Pay" />
              {processing && <Waiter/>}
            </>
          ) : (
            <SuccessBlock text="Pago aprobado" onClose={closeBuy}/>
          )}
        </Modal>
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

/* ---------- UI helpers ---------- */
const Modal = ({ children, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ scale:.96, opacity:0 }} animate={{ scale:1, opacity:1 }}>
      {children}
    </motion.div>
  </div>
)
const Row = ({ label, children }) => (
  <div className="row" style={{ justifyContent:"space-between", marginBottom:8 }}>
    <div className="muted small">{label}</div>
    {children}
  </div>
)
const FooterButtons = ({ processing, onCancel, onConfirm, confirmText }) => (
  <div className="row" style={{ justifyContent:"flex-end", gap:8 }}>
    <button className="btn" onClick={onCancel} disabled={processing}>Cancel</button>
    <button className="btn primary" onClick={onConfirm} disabled={processing}>{processing ? "Processing..." : confirmText}</button>
  </div>
)
const Waiter = () => (<div className="waiting"><div className="spinner" /></div>)

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

import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"

const mxn = n =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 })

const DISPLAY_PACKS = [
  { id: "c30",    coins: 30,    price: 6.89 },
  { id: "c350",   coins: 350,   price: 80.25 },
  { id: "c700",   coins: 700,   price: 160.49 },
  { id: "c1400",  coins: 1400,  price: 320.95 },
  { id: "c3500",  coins: 3500,  price: 802.39 },
  { id: "c7000",  coins: 7000,  price: 1604.75 },
  { id: "c17500", coins: 17500, price: 4011.85 },
  { id: "custom", custom: true },
];

const CARD_LAST4 = "7284"

export default function App () {
  const [coins, setCoins] = useState(99999999)

  // compra
  const [selected, setSelected] = useState("c30")
  const [customCoins, setCustomCoins] = useState(300)
  const [discount, setDiscount] = useState(true)

  // envío
  const [targetUser, setTargetUser] = useState("")
  const [sendAmount, setSendAmount] = useState(100)
  const [lastSend, setLastSend] = useState({ user: "", amount: 0 })
  const [recipientAvatar, setRecipientAvatar] = useState(null)

  // modales
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

  const totalPrice = useMemo(() => {
    if (!currentPack) return 0
    if (!currentPack.custom) return currentPack.price
    const unit = 80.25 / 350
    const base = +(customCoins * unit).toFixed(2)
    return discount ? +(base * 0.75).toFixed(2) : base
  }, [currentPack, customCoins, discount])

  /* ------- Compra ------- */
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

  /* ------- Enviar (desde saldo) ------- */
  const openSend = async () => {
    const name = targetUser.trim()
    if (!name)      { setToast({ kind:"warn", text:"Escribe un usuario destino" }); return clearToastLater() }
    if (sendAmount<=0||!Number.isFinite(sendAmount)) { setToast({ kind:"warn", text:"Cantidad inválida" }); return clearToastLater() }
    if (sendAmount > coins) { setToast({ kind:"warn", text:"Saldo insuficiente" }); return clearToastLater() }

    setRecipientAvatar(null)     // limpia anterior
    setSuccess(false)
    setSendOpen(true)

    // intenta obtener el avatar (sin bloquear el modal)
    try {
      const handle = name.replace(/^@/, "")
      const r = await fetch(`/api/avatar/${encodeURIComponent(handle)}`)
      const data = await r.json()
      if (data?.avatar) setRecipientAvatar(data.avatar)
    } catch {}
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
      setToast({ kind:"ok", text:`Se enviaron ${amount} monedas a ${user}` })
      clearToastLater(2800)
    }, 1100)
  }

  function clearToastLater (ms = 2200) {
    setTimeout(() => setToast(null), ms)
  }

  const remainingAfterSend = Math.max(0, coins - Math.max(0, sendAmount))

  return (
    <div className="page">
      <div className="topbar">
        <div className="title-xl">Get Coins</div>
        <a className="link" href="#" onClick={(e)=>e.preventDefault()}>Iniciar sesión</a>
      </div>

      <div className="balance-box">
        <div className="balance-label">Saldo actual:</div>
        <div className="balance-value">
          <img src="/coin.png" alt="coin" className="coin-img" />
          {coins.toLocaleString("es-MX")}
        </div>
      </div>

      <div className="notice">
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

      <div className="panel sendbox">
        <div className="strong">Enviar monedas</div>
        <div className="row">
          <input className="input" placeholder="Usuario" value={targetUser} onChange={e => setTargetUser(e.target.value)} />
          <input className="input" type="number" min={1} step={1}
            value={sendAmount} onChange={e => setSendAmount(Math.max(1, Math.floor(Number(e.target.value || 0))))}
            style={{ width: 120 }} placeholder="Cantidad" />
          <button className="btn primary" onClick={openSend}>Enviar</button>
        </div>
        <div className="muted small" style={{ marginTop: 6 }}>
          El envío se descuenta de tu saldo actual. Si necesitas más monedas, usa “Recargar”.
        </div>
      </div>

      {/* MODAL: Compra */}
      {/* … igual que ya tenías … (omito por brevedad, no cambia) */}

      {/* MODAL: Enviar (muestra avatar si existe) */}
      {sendOpen && (
        <div className="modal-overlay" onClick={closeSend}>
          <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ scale:.96, opacity:0 }} animate={{ scale:1, opacity:1 }}>
            {!success ? (
              <>
                <div className="modal-title">Send coins</div>

                <div className="row" style={{ justifyContent:"space-between", marginBottom:8 }}>
                  <div className="muted small">Recipient</div>
                  <div className="strong" style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {recipientAvatar ? (
                      <img src={recipientAvatar} alt="avatar" className="avatar-sm" />
                    ) : null}
                    {targetUser}
                  </div>
                </div>

                <div className="row" style={{ justifyContent:"space-between", marginBottom:8 }}>
                  <div className="muted small">Amount to send</div>
                  <div className="strong">{sendAmount.toLocaleString("es-MX")} coins</div>
                </div>

                <div className="row" style={{ justifyContent:"space-between", marginBottom:14 }}>
                  <div className="muted small">Balance after send</div>
                  <div className="price">{Math.max(0, coins - sendAmount).toLocaleString("es-MX")} coins</div>
                </div>

                <div className="row" style={{ justifyContent:"flex-end", gap:8 }}>
                  <button className="btn" onClick={closeSend} disabled={processing}>Cancel</button>
                  <button className="btn primary" onClick={confirmSend} disabled={processing || sendAmount > coins || sendAmount <= 0}>
                    {processing ? "Processing..." : "Confirm"}
                  </button>
                </div>

                {processing && <div className="waiting"><div className="spinner" /></div>}
              </>
            ) : (
              <SuccessBlock text={`Se enviaron ${lastSend.amount.toLocaleString("es-MX")} a ${lastSend.user}`} onClose={closeSend} />
            )}
          </motion.div>
        </div>
      )}

      {toast && (
        <div className={"toast " + (toast.kind === "ok" ? "ok" : "warn")}>
          {toast.kind === "ok" ? <span className="check">✔</span> : <span className="warn">!</span>}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  )
}

/* paloma verde */
function SuccessBlock({ text, onClose }) {
  return (
    <div style={{ textAlign:"center", padding:"8px 0 2px" }}>
      <div style={{ width:70,height:70,margin:"6px auto 10px",borderRadius:"999px",background:"#ecfdf5",display:"grid",placeItems:"center",border:"1px solid #bbf7d0" }}>
        <span style={{ color:"#16a34a",fontSize:36,fontWeight:900 }}>✔</span>
      </div>
      <div style={{ fontWeight:800, marginBottom:12 }}>{text}</div>
      <button className="btn primary" onClick={onClose}>Cerrar</button>
    </div>
  )
}

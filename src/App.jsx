import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Sparkles, AlertTriangle, Shield, Coins, TimerReset, TrendingUp } from 'lucide-react'

const BASE_PACKS = [
  { id: 'p1', label: '100 monedas', coins: 100, price: 19 },
  { id: 'p2', label: '550 monedas', coins: 550, price: 99 },
  { id: 'p3', label: '1,200 monedas', coins: 1200, price: 199 },
  { id: 'p4', label: '2,500 monedas', coins: 2500, price: 399, best: true },
  { id: 'p5', label: '5,200 monedas', coins: 5200, price: 799 },
]

const DARK_PATTERNS = [
  { key: 'urgency', label: 'Cuenta regresiva (urgencia)', icon: TimerReset },
  { key: 'scarcity', label: 'Stock limitado (escasez)', icon: TrendingUp },
  { key: 'bundle', label: 'Paquete más valor (anclaje)', icon: Coins },
  { key: 'sparkle', label: 'Brillos y confeti (refuerzo)', icon: Sparkles },
]

const mxn = n => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

export default function App () {
  const [budget, setBudget] = useState(200)
  const [coins, setCoins] = useState(0)
  const [spent, setSpent] = useState(0)
  const [history, setHistory] = useState([])
  const [parentalMode, setParentalMode] = useState(false)
  const [activePatterns, setActivePatterns] = useState(['bundle'])
  const [promo, setPromo] = useState(null)

  const packs = useMemo(() => {
    const hasHook = activePatterns.includes('urgency') || activePatterns.includes('scarcity')
    return BASE_PACKS.map(p =>
      p.best && hasHook ? { ...p, price: Math.max(1, Math.round(p.price * 0.9)) } : p
    )
  }, [activePatterns])

  const percent = Math.min(200, Math.round((spent / Math.max(1, budget)) * 100))
  const riskLevel = percent < 50 ? 'Bajo' : percent < 100 ? 'Medio' : percent < 150 ? 'Alto' : 'Crítico'
  const remaining = Math.max(0, budget - spent)

  const handleBuy = (pack, note) => {
    if (parentalMode && spent + pack.price > budget) {
      alert('Modo guía: Esta compra excede el presupuesto semanal. Hablemos antes de proceder.')
      return
    }
    setCoins(c => c + pack.coins)
    setSpent(s => s + pack.price)
    setHistory(h => [...h, { t: Date.now(), coins: pack.coins, price: pack.price, note }])
  }

  const addPromo = () => {
    const bonus = 150 + Math.floor(Math.random() * 350)
    const price = 49
    setPromo({ label: `PROMO relámpago +${bonus}`, coins: 200 + bonus, price, expiresAt: Date.now() + 1000 * 60 * 3 })
    if (!activePatterns.includes('urgency')) setActivePatterns(p => [...p, 'urgency'])
    if (!activePatterns.includes('sparkle')) setActivePatterns(p => [...p, 'sparkle'])
  }

  const chartData = useMemo(() =>
    history.map((h, i) => ({
      name: new Date(h.t).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      Gasto: h.price,
      Acumulado: history.slice(0, i + 1).reduce((acc, x) => acc + x.price, 0)
    })), [history]
  )

  const insights = [
    percent >= 50 && "Vas a la mitad del presupuesto: el anclaje al pack 'mejor valor' puede empujarte a gastar más.",
    percent >= 100 && 'Ya superaste el 100% del presupuesto. Esto simula gasto impulsivo.',
    activePatterns.includes('urgency') && 'La urgencia limita tu reflexión y favorece decisiones rápidas.',
    activePatterns.includes('scarcity') && 'La escasez percibida aumenta la disposición a pagar.',
    history.length >= 3 && "Compras pequeñas acumuladas generan el 'goteo' de gasto.",
  ].filter(Boolean)

  const timeLeft = promo?.expiresAt ? Math.max(0, promo.expiresAt - Date.now()) : 0
  const mm = Math.floor(timeLeft / 60000)
  const ss = Math.floor((timeLeft % 60000) / 1000)

  return (
    <div className='container'>
      <header>
        <h1>Simulador de Monedas — "TikCoin Trainer"</h1>
        <div className='subtitle'>Explora cómo los micropagos y los <em>dark patterns</em> afectan tus decisiones.</div>
      </header>

      <div className='grid grid-3'>
        <div className='card'>
          <h2>Presupuesto semanal</h2>
          <div className='row' style={{ gap: 12 }}>
            <label>Cantidad (MXN)</label>
            <input className='input' type='number' min={50} step={10} value={budget}
              onChange={e => setBudget(Math.max(50, Number(e.target.value || 0)))} style={{ width: 120 }} />
            <div className='note'>Restante: <strong>{mxn(remaining)}</strong></div>
          </div>
          <div className='progress' style={{ marginTop: 10 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, percent)}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 20 }}
              style={{ background: percent < 100 ? 'var(--ok)' : percent < 150 ? 'var(--warn)' : 'var(--danger)' }}
            />
          </div>
          <div className='row' style={{ justifyContent: 'space-between', marginTop: 8 }}>
            <span className='small'>Gastado: <strong>{mxn(spent)}</strong> / Presupuesto: <strong>{mxn(budget)}</strong></span>
            <span className='small'>Nivel de riesgo: <strong>{riskLevel}</strong> ({percent}%)</span>
          </div>
        </div>

        <div className='card'>
          <h2>Estado</h2>
          <div className='kv'><Coins size={16}/> Monedas: <strong>{coins}</strong></div>
          <div className='kv'><AlertTriangle size={16}/> Compras: <strong>{history.length}</strong></div>
          <div className='note'>Consejo: fija un objetivo antes de comprar y revísalo.</div>
          <div className='row' style={{ marginTop: 8 }}>
            <label className='kv' style={{ gap: 6 }}><Shield size={16}/> Modo guía</label>
            <button className={parentalMode ? 'btn primary' : 'btn'} onClick={() => setParentalMode(v => !v)}>
              {parentalMode ? 'Activado' : 'Desactivado'}
            </button>
          </div>
        </div>
      </div>

      <div className='grid grid-3' style={{ marginTop: 16 }}>
        <div className='card'>
          <div className='row' style={{ justifyContent: 'space-between' }}>
            <h2>Tienda de monedas</h2>
            <div className='chips'>
              {DARK_PATTERNS.map(p => {
                const Icon = p.icon
                const on = activePatterns.includes(p.key)
                return (
                  <button key={p.key} className={on ? 'badge active' : 'badge'}
                    onClick={() => setActivePatterns(prev =>
                      prev.includes(p.key) ? prev.filter(x => x !== p.key) : [...prev, p.key])}>
                    <Icon size={14} style={{ verticalAlign: 'text-bottom' }}/> {p.key}
                  </button>
                )
              })}
            </div>
          </div>

          <div className='grid-3-col' style={{ marginTop: 8 }}>
            {packs.map(p => (
              <motion.div key={p.id} whileHover={{ y: -2 }} className='card' style={{ borderColor: p.best ? 'var(--ring)' : '#e5e7eb' }}>
                <div className='row' style={{ justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0 }}>{p.label}</h3>
                  {p.best && <span className='badge' style={{ background: '#fef3c7', color: '#854d0e' }}>Mejor valor</span>}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{mxn(p.price)}</div>
                <div className='note'>{p.coins.toLocaleString()} monedas</div>
                {activePatterns.includes('sparkle') && <div className='small' style={{ color: '#059669', marginTop: 6 }}>¡Bonus visual! ✨</div>}
                <button className='btn primary' style={{ marginTop: 10, width: '100%' }} onClick={() => handleBuy(p)}>Comprar</button>
              </motion.div>
            ))}

            {promo && (
              <motion.div layout className='card promo'>
                <div className='row' style={{ justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0 }}>{promo.label}</h3>
                  <span className='badge' style={{ background: '#db2777', color: '#fff' }}>
                    <TimerReset size={12}/> {mm}:{String(ss).padStart(2, '0')}
                  </span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{mxn(promo.price)}</div>
                <div className='note'>{promo.coins.toLocaleString()} monedas</div>
                <button className='btn primary' style={{ marginTop: 10, width: '100%' }}
                  onClick={() => handleBuy({ id: 'promo', label: promo.label, coins: promo.coins, price: promo.price }, 'Promo relámpago')}>
                  Aprovechar
                </button>
              </motion.div>
            )}
          </div>

          <div className='row' style={{ marginTop: 8, gap: 8 }}>
            <button className='btn' onClick={addPromo}>Activar oferta engañosa ✨</button>
            <button className='btn' onClick={() => setActivePatterns(p => p.includes('scarcity')
              ? p.filter(x => x !== 'scarcity') : [...p, 'scarcity'])}>
              Simular escasez
            </button>
          </div>
        </div>

        <div className='card'>
          <h2>Observaciones en tiempo real</h2>
          {insights.length === 0
            ? <div className='note'>Compra algunos paquetes para ver señales y reflexiones aquí.</div>
            : insights.map((msg, i) => <div key={i} className='helper' style={{ marginBottom: 8 }}>• {msg}</div>)}
          {percent >= 100 && (
            <div className='toast' style={{ marginTop: 8 }}>
              <strong>Reflexión:</strong> ¿Lo que estás comprando cumple un objetivo concreto o es por impulso? Considera un "enfriamiento" de 24h.
            </div>
          )}
        </div>
      </div>

      <div className='card' style={{ marginTop: 16 }}>
        <h2>Evolución del gasto</h2>
        {history.length === 0
          ? <div className='note'>Aún no hay datos. Realiza compras para ver la gráfica.</div>
          : <div style={{ height: 280 }}>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray='3 3'/>
                  <XAxis dataKey='name'/>
                  <YAxis/>
                  <Tooltip/>
                  <Line type='monotone' dataKey='Gasto' dot/>
                  <Line type='monotone' dataKey='Acumulado' dot/>
                </LineChart>
              </ResponsiveContainer>
            </div>}
      </div>

      <div className='card' style={{ marginTop: 16 }}>
        <h2>Guía rápida para docentes</h2>
        <ol style={{ paddingLeft: 18 }}>
          <li><strong>Objetivo:</strong> identificar cómo los micropagos y los <em>dark patterns</em> influyen en el gasto.</li>
          <li><strong>Inicio (10 min):</strong> ¿qué son las monedas y para qué se usan? Mostrar el simulador.</li>
          <li><strong>Exploración (15 min):</strong> dejen que compren con un presupuesto de prueba. Activa ofertas engañosas.</li>
          <li><strong>Análisis (10 min):</strong> revisen la barra de riesgo y la gráfica. ¿Qué detonó el sobre gasto?</li>
          <li><strong>Cierre (10 min):</strong> compromisos: límite y regla de "24h antes de comprar".</li>
        </ol>
        <div className='grid-3-col'>
          <div className='helper'>Competencias: pensamiento crítico, finanzas personales, autocontrol.</div>
          <div className='helper'>Evaluación: captura de su gráfica + reflexión escrita (150 palabras).</div>
          <div className='helper'>Extensión: investigar política de reembolsos y comparar con otras apps.</div>
        </div>
      </div>

      <div className='footer'>Proyecto educativo sin pagos reales. Datos locales en memoria. Diseñado para discusión y reflexión.</div>
    </div>
  )
}

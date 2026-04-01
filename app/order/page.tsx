'use client'

import { useState, useEffect, useRef } from 'react'
import { MenuItem, CartItem } from '@/lib/types'
import { createBrowserSupabase } from '@/lib/supabase'
import { SUGAR_LEVELS, ICE_LEVELS, TOPPINGS } from '@/lib/menu'
import ItemModal from '@/components/ItemModal'
import CheckoutModal from '@/components/CheckoutModal'

type MenuItemX = MenuItem & { is_signature?: boolean }

const SECTIONS = [
  { key: 'signature',  label: 'Signature',   anchor: 'sec-signature'  },
  { key: 'bubble_tea', label: 'Bubble Tea',   anchor: 'sec-bubble-tea' },
  { key: 'dumpling',   label: 'Dumplings',    anchor: 'sec-dumplings'  },
]

const DRINK_IMAGES: Record<string, string> = {
  'Classic Milk Tea':      '☕',
  'Taro Milk Tea':         '🟣',
  'Matcha Milk Tea':       '🍵',
  'Brown Sugar Boba':      '🧋',
  'Strawberry Fruit Tea':  '🍓',
  'Mango Fruit Tea':       '🥭',
  'Passion Fruit Tea':     '🌺',
  'Pork & Cabbage':        '🥟',
  'Veggie Dumplings':      '🥟',
}

function ItemEmoji({ name }: { name: string }) {
  const emoji = DRINK_IMAGES[name] ?? '🧋'
  return (
    <div className="w-full aspect-square bg-orange-50 rounded-2xl flex items-center justify-center text-5xl mb-2">
      {emoji}
    </div>
  )
}

export default function OrderPage() {
  const [menuItems, setMenuItems] = useState<MenuItemX[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selected, setSelected] = useState<MenuItemX | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [activeSection, setActiveSection] = useState('signature')
  const [loading, setLoading] = useState(true)
  const [orderPlaced, setOrderPlaced] = useState<{ number: number; name: string } | null>(null)

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabase> | null>(null)
  function getDb() {
    if (!supabaseRef.current) supabaseRef.current = createBrowserSupabase()
    return supabaseRef.current
  }

  useEffect(() => {
    getDb().from('corgi_menu_items').select('*').eq('available', true).order('display_order')
      .then(({ data }) => { setMenuItems(data ?? []); setLoading(false) })

    const ch = getDb().channel('menu-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'corgi_menu_items' }, (p) => {
        setMenuItems(prev => prev.map(i => i.id === p.new.id ? { ...i, ...p.new } : i))
      }).subscribe()
    return () => { getDb().removeChannel(ch) }
  }, [])

  // Scroll spy
  useEffect(() => {
    if (!menuItems.length) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const sec = SECTIONS.find(s => s.anchor === e.target.id)
          if (sec) setActiveSection(sec.key)
        }
      })
    }, { threshold: 0.2, rootMargin: '-100px 0px -55% 0px' })
    Object.values(sectionRefs.current).forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [menuItems])

  function scrollTo(sec: typeof SECTIONS[0]) {
    setActiveSection(sec.key)
    sectionRefs.current[sec.anchor]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const signature  = menuItems.filter(i => (i as any).is_signature)
  const bubbleteas = menuItems.filter(i => i.category === 'bubble_tea')
  const dumplings  = menuItems.filter(i => i.category === 'dumpling')

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="text-7xl mb-4">🎉</div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Order Confirmed</p>
        <div className="text-8xl font-black text-gray-900 mb-3">#{orderPlaced.number}</div>
        <p className="text-gray-500 mb-1">Hi <strong>{orderPlaced.name}</strong>!</p>
        <p className="text-gray-400 text-sm mb-8">We'll call your number when it's ready 🔔</p>
        <button onClick={() => { setOrderPlaced(null); setCart([]) }}
          className="bg-orange-500 text-white font-bold px-10 py-3 rounded-full">
          Order Again
        </button>
      </div>
    )
  }

  function Grid({ items, sectionKey }: { items: MenuItemX[], sectionKey: string }) {
    if (!items.length) return null
    const isActive = activeSection === sectionKey
    return (
      <div className={`grid grid-cols-2 gap-3 px-3 pb-4 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
        {items.map(item => (
          <button key={item.id} onClick={() => !item.sold_out && isActive && setSelected(item)}
            className={`bg-white rounded-2xl p-3 text-left transition active:scale-95 ${item.sold_out ? 'opacity-50' : ''} ${!isActive ? 'pointer-events-none' : ''}`}>
            <ItemEmoji name={item.name} />
            <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{item.name}</p>
            {(item as any).is_signature && (
              <span className="inline-block bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wide">Signature</span>
            )}
            <p className="text-xs font-bold text-gray-700 mt-1">${item.price_small?.toFixed(2)}{item.price_large ? '+' : ''}</p>
            {item.sold_out && <p className="text-[10px] text-red-500 font-medium mt-0.5">Sold Out</p>}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-orange-500">

      {/* Header */}
      <div className="px-5 pt-10 pb-5 bg-orange-500">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-black text-white tracking-tight">🐾 CORGI TEA</h1>
          {cartCount > 0 && (
            <button onClick={() => setShowCheckout(true)}
              className="bg-white text-orange-500 font-black text-xs px-4 py-2 rounded-full flex items-center gap-1.5">
              🛒 {cartCount} · ${cartTotal.toFixed(2)}
            </button>
          )}
        </div>
        <p className="text-orange-100 text-sm">Bubble Tea & Dumplings · Pick Up</p>
      </div>

      {/* Body — left sidebar + right content */}
      <div className="flex flex-1 bg-white rounded-t-3xl overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>

        {/* Left sidebar — FIXED, never scrolls */}
        <nav className="w-24 flex-shrink-0 bg-white border-r border-gray-100 pt-4 overflow-hidden">
          {SECTIONS.map(sec => {
            const isActive = activeSection === sec.key
            return (
              <button key={sec.key} onClick={() => scrollTo(sec)}
                className={`w-full px-3 py-4 text-left transition-all relative ${
                  isActive ? 'bg-white' : 'bg-gray-50'
                }`}>
                {/* Active orange bar on left */}
                <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all ${
                  isActive ? 'bg-orange-500' : 'bg-transparent'
                }`} />
                <span className={`text-xs leading-tight block transition-all ${
                  isActive ? 'text-gray-900 font-black' : 'text-gray-400 font-medium'
                }`}>{sec.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Right scrollable content */}
        <main className="flex-1 overflow-y-auto pb-28">

          {loading ? (
            <div className="grid grid-cols-2 gap-3 p-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-orange-50 rounded-2xl p-3 animate-pulse">
                  <div className="aspect-square bg-orange-100 rounded-xl mb-2"/>
                  <div className="h-3 bg-orange-100 rounded w-3/4 mb-1"/>
                  <div className="h-3 bg-orange-100 rounded w-1/3"/>
                </div>
              ))}
            </div>
          ) : (
            <>
              {signature.length > 0 && (
                <section id="sec-signature" ref={el => { sectionRefs.current['sec-signature'] = el }}>
                  <h2 className={`px-3 pt-4 pb-2 text-base font-black transition-colors ${activeSection === 'signature' ? 'text-gray-900' : 'text-gray-300'}`}>Signature</h2>
                  <Grid items={signature} sectionKey="signature" />
                </section>
              )}

              <section id="sec-bubble-tea" ref={el => { sectionRefs.current['sec-bubble-tea'] = el }}>
                <h2 className={`px-3 pt-4 pb-2 text-base font-black transition-colors ${activeSection === 'bubble_tea' ? 'text-gray-900' : 'text-gray-300'}`}>Bubble Tea</h2>
                <Grid items={bubbleteas} sectionKey="bubble_tea" />
              </section>

              <section id="sec-dumplings" ref={el => { sectionRefs.current['sec-dumplings'] = el }}>
                <h2 className={`px-3 pt-4 pb-2 text-base font-black transition-colors ${activeSection === 'dumpling' ? 'text-gray-900' : 'text-gray-300'}`}>Dumplings</h2>
                <Grid items={dumplings} sectionKey="dumpling" />
              </section>
            </>
          )}
        </main>
      </div>

      {/* Checkout bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <button onClick={() => setShowCheckout(true)}
            className="w-full bg-orange-500 text-white font-black py-4 rounded-2xl flex items-center justify-between px-5 text-sm">
            <span className="bg-orange-600 rounded-lg px-2 py-0.5 text-xs font-black">{cartCount}</span>
            <span>View Order</span>
            <span>${cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {selected && (
        <ItemModal item={selected} sugarLevels={SUGAR_LEVELS} iceLevels={ICE_LEVELS} toppings={TOPPINGS}
          onAdd={item => { setCart(prev => [...prev, item]); setSelected(null) }}
          onClose={() => setSelected(null)} />
      )}

      {showCheckout && (
        <CheckoutModal cart={cart} total={cartTotal}
          onClose={() => setShowCheckout(false)}
          onSuccess={(num, name) => { setShowCheckout(false); setOrderPlaced({ number: num, name }) }} />
      )}
    </div>
  )
}

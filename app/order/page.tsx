'use client'

import { useState, useEffect, useRef } from 'react'
import { MenuItem, CartItem } from '@/lib/types'
import { createBrowserSupabase } from '@/lib/supabase'
import { SUGAR_LEVELS, ICE_LEVELS, TOPPINGS } from '@/lib/menu'
import ItemModal from '@/components/ItemModal'
import CheckoutModal from '@/components/CheckoutModal'

const CATEGORIES = [
  { key: 'bubble_tea', label: 'Bubble Tea' },
  { key: 'dumpling',   label: 'Dumplings' },
]

// Placeholder drink images by name keyword
function getDrinkEmoji(name: string) {
  const n = name.toLowerCase()
  if (n.includes('taro'))      return '🟣'
  if (n.includes('matcha'))    return '🍵'
  if (n.includes('strawberry'))return '🍓'
  if (n.includes('mango'))     return '🥭'
  if (n.includes('passion'))   return '🌺'
  if (n.includes('brown sugar'))return '🧋'
  if (n.includes('dumpling'))  return '🥟'
  return '🧋'
}

export default function OrderPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [activeCategory, setActiveCategory] = useState('bubble_tea')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [orderPlaced, setOrderPlaced] = useState<{ number: number; name: string } | null>(null)
  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabase> | null>(null)
  function getDb() {
    if (!supabaseRef.current) supabaseRef.current = createBrowserSupabase()
    return supabaseRef.current
  }

  useEffect(() => {
    getDb().from('corgi_menu_items').select('*').eq('available', true).order('display_order')
      .then(({ data }) => { setMenuItems(data ?? []); setLoading(false) })

    const channel = getDb().channel('menu-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'corgi_menu_items' }, (payload) => {
        setMenuItems(prev => prev.map(i => i.id === payload.new.id ? { ...i, ...payload.new } : i))
      }).subscribe()
    return () => { getDb().removeChannel(channel) }
  }, [])

  const filtered = menuItems
    .filter(i => i.category === activeCategory)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="text-7xl mb-6">🎉</div>
        <p className="text-gray-500 text-sm mb-2 uppercase tracking-widest font-medium">Order Confirmed</p>
        <div className="text-8xl font-black text-gray-900 mb-2">#{orderPlaced.number}</div>
        <p className="text-gray-600 text-lg mb-1">Hi <strong>{orderPlaced.name}</strong>!</p>
        <p className="text-gray-400 text-sm mb-8">We'll call your number when it's ready 🔔</p>
        <button onClick={() => { setOrderPlaced(null); setCart([]) }}
          className="bg-[#D62B2B] text-white font-bold px-8 py-3 rounded-full text-sm">
          Order Again
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 pt-4 pb-0 sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#D62B2B] flex items-center justify-center text-white text-xl font-black flex-shrink-0">
            🐾
          </div>
          <div className="flex-1">
            <h1 className="text-base font-black text-gray-900 leading-tight">Corgi Tea</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>
              <span className="text-xs text-gray-500">Pickup · 5–10 Minutes</span>
            </div>
          </div>
          {cartCount > 0 && (
            <button onClick={() => setShowCheckout(true)}
              className="bg-[#D62B2B] text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5">
              🛒 {cartCount} · ${cartTotal.toFixed(2)}
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-0 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
              className={`flex-shrink-0 py-2.5 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeCategory === cat.key
                  ? 'border-[#D62B2B] text-[#D62B2B]'
                  : 'border-transparent text-gray-400'
              }`}>
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b border-gray-50">
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search menu"
            className="bg-transparent text-sm text-gray-700 flex-1 focus:outline-none" />
        </div>
      </div>

      {/* Items */}
      <main className="flex-1 pb-24">
        {loading ? (
          <div className="flex flex-col gap-0">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3"/>
                  <div className="h-3 bg-gray-100 rounded w-full"/>
                  <div className="h-3 bg-gray-100 rounded w-1/4"/>
                </div>
                <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0"/>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">
                  {CATEGORIES.find(c => c.key === activeCategory)?.label} ({filtered.length})
                </h2>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filtered.map(item => (
                <button key={item.id}
                  onClick={() => !item.sold_out && setSelectedItem(item)}
                  className={`w-full flex items-center gap-4 px-4 py-4 text-left transition active:bg-gray-50 ${item.sold_out ? 'opacity-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                    )}
                    <p className="text-sm font-semibold text-gray-800 mt-1.5">
                      ${item.price_small?.toFixed(2)}
                      {item.price_large ? `+` : ''}
                    </p>
                    {item.sold_out && (
                      <span className="text-xs text-red-500 font-medium">Sold Out</span>
                    )}
                  </div>
                  {/* Item image placeholder */}
                  <div className="w-20 h-20 rounded-xl bg-orange-50 flex items-center justify-center text-4xl flex-shrink-0 relative">
                    {getDrinkEmoji(item.name)}
                    {!item.sold_out && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#D62B2B] rounded-full flex items-center justify-center">
                        <span className="text-white text-lg font-black leading-none mb-0.5">+</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
              {filtered.length === 0 && !loading && (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-3xl mb-2">{activeCategory === 'bubble_tea' ? '🧋' : '🥟'}</p>
                  <p className="text-sm">No items found</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Sticky checkout bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <button onClick={() => setShowCheckout(true)}
            className="w-full bg-[#D62B2B] text-white font-bold py-4 rounded-2xl flex items-center justify-between px-5 text-sm">
            <span className="bg-red-700 rounded-lg px-2 py-0.5 text-xs font-black">{cartCount}</span>
            <span className="font-bold">View Order</span>
            <span>${cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {selectedItem && (
        <ItemModal item={selectedItem} sugarLevels={SUGAR_LEVELS} iceLevels={ICE_LEVELS} toppings={TOPPINGS}
          onAdd={item => { setCart(prev => [...prev, item]); setSelectedItem(null) }}
          onClose={() => setSelectedItem(null)} />
      )}

      {showCheckout && (
        <CheckoutModal cart={cart} total={cartTotal}
          onClose={() => setShowCheckout(false)}
          onSuccess={(num, name) => { setShowCheckout(false); setOrderPlaced({ number: num, name }) }} />
      )}
    </div>
  )
}
// force deploy Tue Mar 31 19:36:23 EDT 2026

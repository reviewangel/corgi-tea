'use client'

import { useState, useEffect, useRef } from 'react'
import { MenuItem, CartItem } from '@/lib/types'
import { createBrowserSupabase } from '@/lib/supabase'
import { SUGAR_LEVELS, ICE_LEVELS, TOPPINGS } from '@/lib/menu'
import CartDrawer from '@/components/CartDrawer'
import ItemModal from '@/components/ItemModal'
import CheckoutModal from '@/components/CheckoutModal'

export default function OrderPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'bubble_tea' | 'dumpling'>('bubble_tea')
  const [loading, setLoading] = useState(true)
  const [orderPlaced, setOrderPlaced] = useState<{ number: number; name: string } | null>(null)

  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabase> | null>(null)
  function getDb() {
    if (!supabaseRef.current) supabaseRef.current = createBrowserSupabase()
    return supabaseRef.current
  }

  useEffect(() => {
    fetchMenu()

    // Real-time menu availability updates
    const channel = getDb()
      .channel('menu-availability')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'menu_items',
      }, (payload) => {
        setMenuItems(prev => prev.map(item =>
          item.id === payload.new.id ? { ...item, ...payload.new } : item
        ))
      })
      .subscribe()

    return () => { getDb().removeChannel(channel) }
  }, [])

  async function fetchMenu() {
    const { data } = await getDb()
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('display_order')
    setMenuItems(data ?? [])
    setLoading(false)
  }

  const bubbleteas = menuItems.filter(i => i.category === 'bubble_tea')
  const dumplings = menuItems.filter(i => i.category === 'dumpling')
  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🧋</div>
        <h1 className="text-3xl font-black text-[#1A0F00] mb-2">Order Placed!</h1>
        <div className="bg-[#FF6B35] text-white rounded-3xl px-8 py-4 mb-4">
          <p className="text-sm font-semibold uppercase tracking-wide">Your Order Number</p>
          <p className="text-6xl font-black">#{orderPlaced.number}</p>
        </div>
        <p className="text-[#6B4226] font-medium mb-1">Hi {orderPlaced.name}! 👋</p>
        <p className="text-[#6B4226] text-sm">We'll call your number when it's ready.</p>
        <button onClick={() => { setOrderPlaced(null); setCart([]) }}
          className="mt-8 bg-[#1A0F00] text-white font-bold px-8 py-3 rounded-2xl">
          Order Again
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      {/* Header */}
      <header className="bg-[#1A0F00] px-5 pt-10 pb-5 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">🐾 Corgi Tea</h1>
            <p className="text-[#FFB347] text-xs font-medium mt-0.5">Bubble Tea & Dumplings</p>
          </div>
          {cartCount > 0 && (
            <button onClick={() => setShowCart(true)}
              className="relative bg-[#FF6B35] text-white font-bold px-4 py-2 rounded-2xl text-sm flex items-center gap-2">
              🛒 Cart
              <span className="bg-white text-[#FF6B35] text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mt-4">
          {(['bubble_tea', 'dumpling'] as const).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
                activeCategory === cat
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-white/10 text-white/70'
              }`}>
              {cat === 'bubble_tea' ? '🧋 Bubble Tea' : '🥟 Dumplings'}
            </button>
          ))}
        </div>
      </header>

      {/* Menu */}
      <main className="px-4 py-5 pb-28">
        {loading ? (
          <div className="text-center py-16 text-[#6B4226]">Loading menu…</div>
        ) : (
          <div className="space-y-3">
            {(activeCategory === 'bubble_tea' ? bubbleteas : dumplings).map(item => (
              <button key={item.id} onClick={() => !item.sold_out && setSelectedItem(item)}
                className={`w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border-2 text-left transition ${
                  item.sold_out ? 'opacity-50 border-gray-200 cursor-not-allowed' : 'border-transparent hover:border-[#FF6B35]'
                }`}>
                <div className="text-3xl flex-shrink-0">
                  {item.category === 'bubble_tea' ? '🧋' : '🥟'}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#1A0F00] text-sm">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-[#6B4226] mt-0.5">{item.description}</p>
                  )}
                  <p className="text-[#FF6B35] font-bold text-sm mt-1">
                    {item.price_small && item.price_large
                      ? `$${item.price_small.toFixed(2)} / $${item.price_large.toFixed(2)}`
                      : item.price_small
                      ? `$${item.price_small.toFixed(2)}`
                      : ''}
                  </p>
                </div>
                {item.sold_out ? (
                  <span className="text-xs bg-gray-200 text-gray-500 font-bold px-3 py-1 rounded-full">Sold Out</span>
                ) : (
                  <span className="text-[#FF6B35] text-xl">+</span>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Sticky cart button */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FFF9F0] to-transparent">
          <button onClick={() => setShowCheckout(true)}
            className="w-full bg-[#FF6B35] text-white font-black py-4 rounded-2xl text-lg shadow-lg flex items-center justify-between px-6">
            <span>{cartCount} item{cartCount > 1 ? 's' : ''}</span>
            <span>Checkout</span>
            <span>${cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Item customization modal */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          sugarLevels={SUGAR_LEVELS}
          iceLevels={ICE_LEVELS}
          toppings={TOPPINGS}
          onAdd={(cartItem) => {
            setCart(prev => [...prev, cartItem])
            setSelectedItem(null)
          }}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Cart drawer */}
      {showCart && (
        <CartDrawer
          cart={cart}
          onUpdate={setCart}
          onClose={() => setShowCart(false)}
          onCheckout={() => { setShowCart(false); setShowCheckout(true) }}
        />
      )}

      {/* Checkout modal */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          total={cartTotal}
          onClose={() => setShowCheckout(false)}
          onSuccess={(orderNumber, name) => {
            setShowCheckout(false)
            setOrderPlaced({ number: orderNumber, name })
          }}
        />
      )}
    </div>
  )
}

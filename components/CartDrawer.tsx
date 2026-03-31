'use client'

import { CartItem } from '@/lib/types'

type Props = {
  cart: CartItem[]
  onUpdate: (cart: CartItem[]) => void
  onClose: () => void
  onCheckout: () => void
}

export default function CartDrawer({ cart, onUpdate, onClose, onCheckout }: Props) {
  const total = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

  function remove(id: string) {
    onUpdate(cart.filter(i => i.id !== id))
  }

  function updateQty(id: string, qty: number) {
    if (qty < 1) { remove(id); return }
    onUpdate(cart.map(i => i.id === id ? { ...i, quantity: qty } : i))
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-5 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-[#1A0F00]">Your Cart</h2>
          <button onClick={onClose} className="text-2xl text-gray-400">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {cart.map(item => (
            <div key={item.id} className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3">
              <div className="text-2xl">{item.name.includes('Dumpling') ? '🥟' : '🧋'}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A0F00] text-sm">{item.name}</p>
                <p className="text-xs text-[#6B4226] mt-0.5">
                  {[item.size, item.sugar, item.ice, ...(item.toppings ?? [])].filter(Boolean).join(' · ')}
                </p>
                {item.specialInstructions && (
                  <p className="text-xs text-gray-400 italic mt-0.5">"{item.specialInstructions}"</p>
                )}
                <p className="text-[#D62B2B] font-bold text-sm mt-1">${(item.unitPrice * item.quantity).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-xl px-2 py-1 border border-gray-200">
                <button onClick={() => updateQty(item.id, item.quantity - 1)} className="text-lg font-bold text-[#1A0F00] w-6">−</button>
                <span className="text-sm font-black text-[#1A0F00] w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, item.quantity + 1)} className="text-lg font-bold text-[#1A0F00] w-6">+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-[#1A0F00]">Total</span>
            <span className="text-xl font-black text-[#D62B2B]">${total.toFixed(2)}</span>
          </div>
          <button onClick={onCheckout}
            className="w-full bg-[#D62B2B] text-white font-black py-4 rounded-2xl text-lg">
            Checkout →
          </button>
        </div>
      </div>
    </div>
  )
}

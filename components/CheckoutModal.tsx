'use client'

import { useState } from 'react'
import { CartItem } from '@/lib/types'

type Props = {
  cart: CartItem[]
  total: number
  onClose: () => void
  onSuccess: (orderNumber: number, name: string) => void
}

export default function CheckoutModal({ cart, total, onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your name'); return }
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, paymentMethod, notes, cart, total }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { setError(data.error ?? 'Failed to place order'); return }
    onSuccess(data.orderNumber, name)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-[#1A0F00]">Checkout</h2>
          <button onClick={onClose} className="text-2xl text-gray-400">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#6B4226] uppercase tracking-wide block mb-1">Your Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="So we can call your order"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35]" />
          </div>

          <div>
            <label className="text-xs font-bold text-[#6B4226] uppercase tracking-wide block mb-1">Phone (optional)</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="For order updates"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35]" />
          </div>

          <div>
            <label className="text-xs font-bold text-[#6B4226] uppercase tracking-wide block mb-2">Payment</label>
            <div className="flex gap-2">
              {(['cash', 'card'] as const).map(p => (
                <button type="button" key={p} onClick={() => setPaymentMethod(p)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition ${
                    paymentMethod === p ? 'bg-[#FF6B35] text-white border-[#FF6B35]' : 'border-gray-200 text-[#1A0F00]'
                  }`}>
                  {p === 'cash' ? '💵 Cash at Pickup' : '💳 Card at Pickup'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#6B4226] uppercase tracking-wide block mb-1">Order Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Allergies, special requests..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:border-[#FF6B35]"
              rows={2} />
          </div>

          {/* Order summary */}
          <div className="bg-[#FFF9F0] rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-[#6B4226] uppercase tracking-wide">Order Summary</p>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-[#1A0F00]">{item.quantity}× {item.name}</span>
                <span className="text-[#1A0F00] font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-black text-[#1A0F00] pt-2 border-t border-[#FFB347]/30">
              <span>Total</span>
              <span className="text-[#FF6B35]">${total.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">⚠️ {error}</p>}

          <button type="submit" disabled={submitting}
            className="w-full bg-[#FF6B35] text-white font-black py-4 rounded-2xl text-lg disabled:opacity-60">
            {submitting ? 'Placing Order…' : `Place Order — $${total.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { MenuItem, CartItem } from '@/lib/types'

type Props = {
  item: MenuItem
  sugarLevels: string[]
  iceLevels: string[]
  toppings: { name: string; price: number }[]
  onAdd: (item: CartItem) => void
  onClose: () => void
}

export default function ItemModal({ item, sugarLevels, iceLevels, toppings, onAdd, onClose }: Props) {
  const isTea = item.category === 'bubble_tea'
  const [size, setSize] = useState<'small' | 'large'>('large')
  const [sugar, setSugar] = useState(sugarLevels[0])
  const [ice, setIce] = useState(iceLevels[0])
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [special, setSpecial] = useState('')
  const [qty, setQty] = useState(1)

  const basePrice = isTea
    ? (size === 'large' ? (item.price_large ?? 0) : (item.price_small ?? 0))
    : (item.price_small ?? 0)
  const toppingPrice = selectedToppings.reduce((s, t) => s + (toppings.find(x => x.name === t)?.price ?? 0), 0)
  const unitPrice = basePrice + toppingPrice

  function toggleTopping(name: string) {
    setSelectedToppings(prev => prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name])
  }

  function handleAdd() {
    onAdd({
      id: crypto.randomUUID(),
      menuItemId: item.id,
      name: item.name,
      size: isTea ? size : undefined,
      sugar: isTea ? sugar : undefined,
      ice: isTea ? ice : undefined,
      toppings: isTea ? selectedToppings : undefined,
      specialInstructions: special || undefined,
      quantity: qty,
      unitPrice,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-[#1A0F00]">{item.name}</h2>
            {item.description && <p className="text-sm text-[#6B4226] mt-0.5">{item.description}</p>}
          </div>
          <button onClick={onClose} className="text-2xl text-gray-400 ml-4">✕</button>
        </div>

        {/* Size (tea only) */}
        {isTea && item.price_small && item.price_large && (
          <div className="mb-5">
            <p className="text-xs font-bold text-[#6B4226] uppercase tracking-wide mb-2">Size</p>
            <div className="flex gap-2">
              {(['small', 'large'] as const).map(s => (
                <button key={s} onClick={() => setSize(s)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition ${
                    size === s ? 'bg-[#FF6B35] text-white border-[#FF6B35]' : 'border-gray-200 text-[#1A0F00]'
                  }`}>
                  {s === 'small' ? `Small — $${item.price_small?.toFixed(2)}` : `Large — $${item.price_large?.toFixed(2)}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sugar (tea only) */}
        {isTea && (
          <div className="mb-5">
            <p className="text-xs font-bold text-[#6B4226] uppercase tracking-wide mb-2">Sugar Level</p>
            <div className="flex flex-wrap gap-2">
              {sugarLevels.map(s => (
                <button key={s} onClick={() => setSugar(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition ${
                    sugar === s ? 'bg-[#FF6B35] text-white border-[#FF6B35]' : 'border-gray-200 text-[#1A0F00]'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Ice (tea only) */}
        {isTea && (
          <div className="mb-5">
            <p className="text-xs font-bold text-[#6B4226] uppercase tracking-wide mb-2">Ice Level</p>
            <div className="flex flex-wrap gap-2">
              {iceLevels.map(i => (
                <button key={i} onClick={() => setIce(i)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition ${
                    ice === i ? 'bg-[#FF6B35] text-white border-[#FF6B35]' : 'border-gray-200 text-[#1A0F00]'
                  }`}>{i}</button>
              ))}
            </div>
          </div>
        )}

        {/* Toppings (tea only) */}
        {isTea && (
          <div className="mb-5">
            <p className="text-xs font-bold text-[#6B4226] uppercase tracking-wide mb-2">Add Toppings</p>
            <div className="flex flex-wrap gap-2">
              {toppings.map(t => (
                <button key={t.name} onClick={() => toggleTopping(t.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition ${
                    selectedToppings.includes(t.name)
                      ? 'bg-[#1A0F00] text-white border-[#1A0F00]'
                      : 'border-gray-200 text-[#1A0F00]'
                  }`}>
                  {t.name} +${t.price.toFixed(2)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Special instructions */}
        <div className="mb-5">
          <p className="text-xs font-bold text-[#6B4226] uppercase tracking-wide mb-2">Special Instructions</p>
          <textarea value={special} onChange={e => setSpecial(e.target.value)}
            placeholder="Any special requests?"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#FF6B35]"
            rows={2} />
        </div>

        {/* Quantity + Add */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-2">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="text-xl font-bold text-[#1A0F00]">−</button>
            <span className="text-lg font-black text-[#1A0F00] w-6 text-center">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="text-xl font-bold text-[#1A0F00]">+</button>
          </div>
          <button onClick={handleAdd}
            className="flex-1 bg-[#FF6B35] text-white font-black py-4 rounded-2xl text-base">
            Add to Cart — ${(unitPrice * qty).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Order, MenuItem } from '@/lib/types'
import { createBrowserSupabase } from '@/lib/supabase'

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  preparing:  'bg-blue-100 text-blue-800 border-blue-200',
  ready:      'bg-green-100 text-green-800 border-green-200',
  completed:  'bg-gray-100 text-gray-500 border-gray-200',
  cancelled:  'bg-red-100 text-red-500 border-red-200',
}

const STATUS_NEXT: Record<string, string> = {
  pending:   'preparing',
  preparing: 'ready',
  ready:     'completed',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   '→ Start Preparing',
  preparing: '→ Mark Ready',
  ready:     '→ Complete',
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders')
  const [filter, setFilter] = useState<'active' | 'all'>('active')

  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabase> | null>(null)
  function getDb() {
    if (!supabaseRef.current) supabaseRef.current = createBrowserSupabase()
    return supabaseRef.current
  }

  useEffect(() => {
    fetchOrders()
    fetchMenu()

    // Real-time new orders
    const ordersChannel = getDb()
      .channel('dashboard-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders())
      .subscribe()

    return () => { getDb().removeChannel(ordersChannel) }
  }, [])

  async function fetchOrders() {
    const { data } = await getDb()
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(100)
    setOrders(data ?? [])
  }

  async function fetchMenu() {
    const { data } = await getDb()
      .from('menu_items')
      .select('*')
      .order('display_order')
    setMenuItems(data ?? [])
  }

  async function updateStatus(orderId: string, status: string) {
    await getDb().from('orders').update({ status }).eq('id', orderId)
    fetchOrders()
  }

  async function toggleAvailability(itemId: string, available: boolean) {
    await getDb().from('menu_items').update({ available }).eq('id', itemId)
    fetchMenu()
  }

  async function toggleSoldOut(itemId: string, soldOut: boolean) {
    await getDb().from('menu_items').update({ sold_out: soldOut }).eq('id', itemId)
    fetchMenu()
  }

  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status))
  const displayOrders = filter === 'active' ? activeOrders : orders

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1A0F00] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">🐾 Corgi Tea Dashboard</h1>
          <p className="text-[#FFB347] text-xs mt-0.5">
            {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {(['orders', 'menu'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === tab ? 'bg-[#FF6B35] text-white' : 'bg-white/10 text-white'
              }`}>
              {tab === 'orders' ? '📋 Orders' : '🎛 Menu Control'}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'orders' && (
        <div className="p-4">
          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {(['active', 'all'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${
                  filter === f ? 'bg-[#FF6B35] text-white border-[#FF6B35]' : 'bg-white border-gray-200 text-gray-600'
                }`}>
                {f === 'active' ? `Active (${activeOrders.length})` : `All Orders (${orders.length})`}
              </button>
            ))}
          </div>

          {/* Orders grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayOrders.map(order => (
              <div key={order.id} className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${
                order.status === 'pending' ? 'border-yellow-300' :
                order.status === 'preparing' ? 'border-blue-300' :
                order.status === 'ready' ? 'border-green-400 ring-2 ring-green-200' :
                'border-gray-200'
              }`}>
                {/* Order header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                  <div>
                    <span className="text-2xl font-black text-[#1A0F00]">#{order.order_number}</span>
                    <span className="ml-2 font-bold text-gray-700">{order.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      order.payment_method === 'cash' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {order.payment_method === 'cash' ? '💵' : '💳'}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="px-4 py-3 space-y-2">
                  {order.order_items?.map(item => (
                    <div key={item.id} className="text-sm">
                      <p className="font-bold text-[#1A0F00]">
                        {item.quantity}× {item.menu_item_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {[item.size, item.sugar_level, item.ice_level, ...(item.toppings ?? [])].filter(Boolean).join(' · ')}
                      </p>
                      {item.special_instructions && (
                        <p className="text-xs text-orange-600 font-medium">📝 {item.special_instructions}</p>
                      )}
                    </div>
                  ))}
                  {order.notes && (
                    <p className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg font-medium">
                      📝 {order.notes}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-black text-[#FF6B35]">${order.total_amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {STATUS_NEXT[order.status] && (
                      <button onClick={() => updateStatus(order.id, STATUS_NEXT[order.status])}
                        className="bg-[#FF6B35] text-white text-xs font-bold px-3 py-2 rounded-xl">
                        {STATUS_LABEL[order.status]}
                      </button>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                      <button onClick={() => updateStatus(order.id, 'cancelled')}
                        className="bg-red-100 text-red-600 text-xs font-bold px-3 py-2 rounded-xl">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {displayOrders.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <p className="text-4xl mb-2">🧋</p>
                <p className="font-medium">No orders yet — waiting for customers!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">
            Toggle items on/off in real time — customers see changes instantly on their phones.
          </p>
          <div className="space-y-3">
            {menuItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="text-2xl">{item.category === 'bubble_tea' ? '🧋' : '🥟'}</div>
                <div className="flex-1">
                  <p className="font-bold text-[#1A0F00]">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.price_small && item.price_large
                      ? `$${item.price_small} / $${item.price_large}`
                      : item.price_small ? `$${item.price_small}` : ''}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {/* Available toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-medium text-gray-600">Available</span>
                    <button onClick={() => toggleAvailability(item.id, !item.available)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${item.available ? 'bg-[#FF6B35]' : 'bg-gray-300'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${item.available ? 'left-6' : 'left-1'}`} />
                    </button>
                  </label>
                  {/* Sold out toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-medium text-gray-600">Sold Out</span>
                    <button onClick={() => toggleSoldOut(item.id, !item.sold_out)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${item.sold_out ? 'bg-red-400' : 'bg-gray-300'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${item.sold_out ? 'left-6' : 'left-1'}`} />
                    </button>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

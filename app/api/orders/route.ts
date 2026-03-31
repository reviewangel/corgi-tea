import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { CartItem } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { name, phone, paymentMethod, notes, cart, total } = await req.json()
    if (!name || !cart?.length) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const db = getSupabaseAdmin()

    const { data: order, error: orderError } = await db
      .from('corgi_orders')
      .insert({
        customer_name: name,
        customer_phone: phone || null,
        payment_method: paymentMethod,
        total_amount: total,
        notes: notes || null,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError || !order) return NextResponse.json({ error: orderError?.message ?? 'Failed to create order' }, { status: 500 })

    const items = (cart as CartItem[]).map(item => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      menu_item_name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      size: item.size ?? null,
      sugar_level: item.sugar ?? null,
      ice_level: item.ice ?? null,
      toppings: item.toppings?.length ? item.toppings : null,
      special_instructions: item.specialInstructions ?? null,
    }))

    const { error: itemsError } = await db.from('corgi_order_items').insert(items)
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

    // Label print trigger will go here once printer model is confirmed

    return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.order_number })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

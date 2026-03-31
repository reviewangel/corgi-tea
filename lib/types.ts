export type MenuItem = {
  id: string
  category: 'bubble_tea' | 'dumpling'
  name: string
  description: string | null
  price_small: number | null
  price_large: number | null
  available: boolean
  sold_out: boolean
  display_order: number
}

export type CartItem = {
  id: string
  menuItemId: string
  name: string
  size?: 'regular' | 'bottle' | 'xl'
  sugar?: string
  ice?: string
  toppings?: string[]
  specialInstructions?: string
  quantity: number
  unitPrice: number
}

export type Order = {
  id: string
  order_number: number
  customer_name: string
  customer_phone: string | null
  payment_method: 'cash' | 'card'
  total_amount: number
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  notes: string | null
  created_at: string
  order_items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  menu_item_name: string
  quantity: number
  unit_price: number
  size: string | null
  sugar_level: string | null
  ice_level: string | null
  toppings: string[] | null
  special_instructions: string | null
}

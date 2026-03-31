-- Menu items (controlled by dashboard)
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('bubble_tea', 'dumpling')),
  name TEXT NOT NULL,
  description TEXT,
  price_small NUMERIC(6,2),
  price_large NUMERIC(6,2),
  available BOOLEAN NOT NULL DEFAULT true,
  sold_out BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customization options
CREATE TABLE customization_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'size','sugar','ice','topping'
  label TEXT NOT NULL,
  price_add NUMERIC(6,2) DEFAULT 0,
  available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','card')),
  stripe_payment_intent TEXT,
  total_amount NUMERIC(8,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','preparing','ready','completed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order line items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  menu_item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(6,2) NOT NULL,
  size TEXT,
  sugar_level TEXT,
  ice_level TEXT,
  toppings TEXT[],
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime on all tables
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

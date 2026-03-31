// Default menu — swap with real items once confirmed
export const DEFAULT_MENU = {
  bubble_tea: [
    { name: 'Classic Milk Tea', description: 'Smooth black tea with creamy milk', price_small: 5.00, price_large: 6.00 },
    { name: 'Taro Milk Tea', description: 'Sweet purple taro with milk', price_small: 5.50, price_large: 6.50 },
    { name: 'Matcha Milk Tea', description: 'Japanese green tea with milk', price_small: 5.50, price_large: 6.50 },
    { name: 'Brown Sugar Boba', description: 'Tiger stripes with fresh milk', price_small: 6.00, price_large: 7.00 },
    { name: 'Strawberry Fruit Tea', description: 'Fresh strawberry green tea', price_small: 5.00, price_large: 6.00 },
    { name: 'Mango Fruit Tea', description: 'Tropical mango with green tea', price_small: 5.00, price_large: 6.00 },
    { name: 'Passion Fruit Tea', description: 'Tangy passion fruit with green tea', price_small: 5.00, price_large: 6.00 },
  ],
  dumplings: [
    { name: 'Pork & Cabbage Dumplings', description: 'Pan-fried, 6 pieces', price: 8.00 },
    { name: 'Veggie Dumplings', description: 'Pan-fried, 6 pieces', price: 7.00 },
  ],
}

export const SIZES = [
  { key: 'regular',  label: 'Regular',         oz: '24oz',  priceField: 'price_small' },
  { key: 'bottle',   label: 'Carrying Bottle',  oz: '24oz',  priceAdd: 1.00 },
  { key: 'xl',       label: 'XL Mug',           oz: '40oz',  priceField: 'price_large' },
]

export const SUGAR_LEVELS = ['100%', '75%', '50%', '25%', '0% (No Sugar)']
export const ICE_LEVELS = ['Regular Ice', 'Less Ice', 'No Ice', 'Warm', 'Hot']
export const TOPPINGS = [
  { name: 'Boba Pearls',   price: 0.75 },
  { name: 'Coconut Jelly', price: 0.75 },
  { name: 'Popping Boba',  price: 0.75 },
  { name: 'Red Beans',     price: 0.75 },
]

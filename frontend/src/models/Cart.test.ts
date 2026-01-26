import { describe, it, expect, beforeEach } from 'vitest';
import { Cart } from './Cart';
import { Product, CartItem } from '../types';

describe('Cart Model', () => {
  let cart: Cart;
  const mockProduct: Product = {
    id: 'p1',
    name: 'Test Tea',
    categories: ['Tea'],
    price: 10,
    rating: 5,
    image: 'img.jpg',
    tags: [],
    origin: 'India',
    caffeine: 'High',
    flavorProfile: { floral: 0, grassy: 0, nutty: 0, sweet: 0, earthy: 0 },
    brewing: { temperature: 90, time: 3, instructions: '' },
    story: '',
    format: 'Loose Leaf',
    attributes: [
        {
            id: 'size',
            name: 'Size',
            type: 'select',
            required: true,
            options: [
                { id: 's', value: 's', displayName: 'Small', priceAdjustment: 0, inStock: true },
                { id: 'l', value: 'l', displayName: 'Large', priceAdjustment: 5, inStock: true }
            ]
        }
    ]
  };

  beforeEach(() => {
    cart = new Cart();
  });

  it('should start with empty items', () => {
    expect(cart.getItems()).toHaveLength(0);
  });

  it('should add item', () => {
    cart.addItem(mockProduct, 1);
    expect(cart.getItems()).toHaveLength(1);
    expect(cart.getItems()[0].quantity).toBe(1);
  });

  it('should merge identical items', () => {
    cart.addItem(mockProduct, 1);
    cart.addItem(mockProduct, 2);
    expect(cart.getItems()).toHaveLength(1);
    expect(cart.getItems()[0].quantity).toBe(3);
  });

  it('should separate items with different attributes', () => {
    cart.addItem(mockProduct, 1, { size: 's' });
    cart.addItem(mockProduct, 1, { size: 'l' });
    expect(cart.getItems()).toHaveLength(2);
  });

  it('should update quantity', () => {
    cart.addItem(mockProduct, 1);
    const key = cart.getItems()[0].itemKey;
    cart.updateQuantity(key, 5);
    expect(cart.getItems()[0].quantity).toBe(5);
  });

  it('should remove item', () => {
    cart.addItem(mockProduct, 1);
    const key = cart.getItems()[0].itemKey;
    cart.removeItem(key);
    expect(cart.getItems()).toHaveLength(0);
  });

  it('should calculate total correctly', () => {
    cart.addItem(mockProduct, 2); // 10 * 2 = 20
    expect(cart.getTotal()).toBe(20);
  });

  it('should calculate total with attributes', () => {
    // Large is +5
    cart.addItem(mockProduct, 1, { size: 'l' }); // (10 + 5) * 1 = 15
    expect(cart.getTotal()).toBe(15);
  });
});

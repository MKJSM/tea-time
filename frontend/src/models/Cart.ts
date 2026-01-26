import { CartItem, Product, SelectedAttributes, CustomBlend } from '../types';

export class Cart {
  private items: CartItem[];

  constructor(items: CartItem[] = []) {
    this.items = [...items];
  }

  public getItems(): CartItem[] {
    return this.items;
  }

  private generateItemKey(productId: string, attributes?: SelectedAttributes, customizationId?: string): string {
    const attrPart = attributes ? JSON.stringify(Object.keys(attributes).sort().reduce((acc: any, key) => {
      acc[key] = attributes[key];
      return acc;
    }, {})) : '';
    return `${productId}-${customizationId || 'std'}-${attrPart}`;
  }

  public addItem(
    product: Product, 
    quantity: number, 
    selectedAttributes?: SelectedAttributes, 
    customization?: CustomBlend
  ): void {
    const itemKey = this.generateItemKey(product.id, selectedAttributes, customization?.id);
    
    const existingIndex = this.items.findIndex((i) => i.itemKey === itemKey);

    if (existingIndex !== -1) {
      this.items[existingIndex].quantity += quantity;
    } else {
      const newItem: CartItem = {
        ...product,
        quantity,
        customization,
        selectedAttributes,
        itemKey
      };
      this.items.push(newItem);
    }
  }

  public removeItem(itemKey: string): void {
    this.items = this.items.filter((i) => i.itemKey !== itemKey);
  }

  public updateQuantity(itemKey: string, quantity: number): void {
    const item = this.items.find((i) => i.itemKey === itemKey);
    if (item) {
      item.quantity = Math.max(1, quantity);
    }
  }

  public getTotal(): number {
    return this.items.reduce((total, item) => {
      // Base price
      let itemPrice = item.price;

      // Add attribute adjustments
      if (item.selectedAttributes && item.attributes) {
        Object.entries(item.selectedAttributes).forEach(([attrId, optionId]) => {
          const attribute = item.attributes?.find(a => a.id === attrId);
          const option = attribute?.options.find(o => o.id === optionId);
          if (option) {
            itemPrice += option.priceAdjustment;
          }
        });
      }

      return total + (itemPrice * item.quantity);
    }, 0);
  }
}

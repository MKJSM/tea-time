export interface Product {
  id: number;
  name: string;
  description?: string;
  base_price: number;
  category: string;
  image_url?: string;
  is_active: boolean;
  sku?: string;
  stock_quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface CustomizationOption {
  id: number;
  group_id: number;
  name: string;
  price_modifier: number;
  is_default: boolean;
  display_order: number;
}

export interface CustomizationGroup {
  id: number;
  name: string;
  description?: string;
  input_type: string;
  min_selections: number;
  max_selections?: number;
  is_required: boolean;
}

export interface ProductCustomization {
  id: number; // group id from backend flattened
  name: string;
  description?: string;
  input_type: string;
  min_selections: number;
  max_selections?: number;
  is_required: boolean;
  options: CustomizationOption[];
}

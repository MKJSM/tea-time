use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct AddToCartRequest {
    pub product_id: String, // UUID
    #[validate(range(min = 1))]
    pub quantity: i32,
    pub customizations: Vec<CartCustomizationRequest>,
}

#[derive(Debug, Deserialize)]
pub struct CartCustomizationRequest {
    pub group_id: String,  // UUID
    pub option_id: String, // UUID
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateCartItemRequest {
    #[validate(range(min = 0))]
    pub quantity: i32,
}

/// Request for merging guest cart items into user cart on login
#[derive(Debug, Deserialize)]
pub struct MergeCartRequest {
    pub items: Vec<MergeCartItem>,
}

#[derive(Debug, Deserialize)]
pub struct MergeCartItem {
    pub product_id: String,
    pub quantity: i32,
    pub customizations: Vec<CartCustomizationRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct CartCustomization {
    pub group_id: String,  // UUID
    pub option_id: String, // UUID
    pub price_modifier: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CartItem {
    pub id: Option<String>, // UUID - Database ID
    pub product_id: String, // UUID
    pub quantity: i32,
    pub unit_price: f64,
    pub customizations: Vec<CartCustomization>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Cart {
    pub items: Vec<CartItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CartDto {
    pub items: Vec<CartItemDto>,
    pub total: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CartItemDto {
    pub id: Option<String>, // UUID
    pub product_id: String, // UUID
    pub name: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub customizations: Vec<CartCustomizationDto>,
    pub total_price: f64,
    pub image_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CartCustomizationDto {
    pub group_name: String,
    pub option_name: String,
    pub price_modifier: f64,
}

impl Cart {
    pub fn new() -> Self {
        Self { items: Vec::new() }
    }

    pub fn add_item(
        &mut self,
        product_id: String,
        quantity: i32,
        unit_price: f64,
        customizations: Vec<CartCustomization>,
    ) {
        if let Some(item) = self
            .items
            .iter_mut()
            .find(|i| i.product_id == product_id && i.customizations == customizations)
        {
            item.quantity += quantity;
            item.unit_price = unit_price;
        } else {
            self.items.push(CartItem {
                id: None,
                product_id,
                quantity,
                unit_price,
                customizations,
            });
        }
    }

    pub fn remove_item(&mut self, cart_item_id: &str) {
        self.items.retain(|i| i.id.as_deref() != Some(cart_item_id));
    }

    pub fn update_quantity(&mut self, cart_item_id: &str, quantity: i32) {
        if quantity <= 0 {
            self.remove_item(cart_item_id);
            return;
        }
        if let Some(item) = self
            .items
            .iter_mut()
            .find(|i| i.id.as_deref() == Some(cart_item_id))
        {
            item.quantity = quantity;
        }
    }

    pub fn get_total(&self) -> f64 {
        self.items
            .iter()
            .map(|item| {
                let customization_price: f64 =
                    item.customizations.iter().map(|c| c.price_modifier).sum();
                (item.unit_price + customization_price) * item.quantity as f64
            })
            .sum()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_item_with_customizations() {
        let mut cart = Cart::new();
        let cust1 = vec![CartCustomization {
            group_id: "group-1".to_string(),
            option_id: "option-1".to_string(),
            price_modifier: 2.0,
        }];

        cart.add_item("product-1".to_string(), 1, 10.0, cust1.clone());
        assert_eq!(cart.items.len(), 1);
        assert_eq!(cart.items[0].customizations.len(), 1);

        // Add same item, same customizations -> should merge
        cart.add_item("product-1".to_string(), 1, 10.0, cust1.clone());
        assert_eq!(cart.items.len(), 1);
        assert_eq!(cart.items[0].quantity, 2);

        // Add same item, different customizations -> should be new line
        let cust2 = vec![CartCustomization {
            group_id: "group-1".to_string(),
            option_id: "option-2".to_string(),
            price_modifier: 5.0,
        }];
        cart.add_item("product-1".to_string(), 1, 10.0, cust2);
        assert_eq!(cart.items.len(), 2);
    }

    #[test]
    fn test_remove_item() {
        let mut cart = Cart::new();
        let cust = vec![];
        cart.items.push(CartItem {
            id: Some("item-100".to_string()),
            product_id: "product-1".to_string(),
            quantity: 1,
            unit_price: 10.0,
            customizations: cust.clone(),
        });

        cart.remove_item("item-100");
        assert_eq!(cart.items.len(), 0);
    }

    #[test]
    fn test_get_total_with_modifiers() {
        let mut cart = Cart::new();
        let cust = vec![CartCustomization {
            group_id: "group-1".to_string(),
            option_id: "option-1".to_string(),
            price_modifier: 2.0,
        }];

        // (10.0 + 2.0) * 2 = 24.0
        cart.add_item("product-1".to_string(), 2, 10.0, cust);

        assert_eq!(cart.get_total(), 24.0);
    }
}

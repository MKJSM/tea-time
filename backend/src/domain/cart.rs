use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct AddToCartRequest {
    pub product_id: Uuid,
    #[validate(range(min = 1))]
    pub quantity: i32,
    pub customizations: Vec<CartCustomizationRequest>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CartCustomizationRequest {
    pub group_id: Uuid,
    pub option_id: Uuid,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
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
    pub product_id: Uuid,
    pub quantity: i32,
    pub customizations: Vec<CartCustomizationRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub struct CartCustomization {
    pub group_id: Uuid,
    pub option_id: Uuid,
    pub price_modifier: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CartItem {
    pub id: Option<Uuid>, // Database ID
    pub product_id: Uuid,
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
    pub id: Option<Uuid>,
    pub product_id: Uuid,
    pub name: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub customizations: Vec<CartCustomizationDto>,
    pub total_price: f64,
    pub image_urls: Vec<String>,
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
        product_id: Uuid,
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

    pub fn remove_item(&mut self, cart_item_id: Uuid) {
        self.items.retain(|i| i.id != Some(cart_item_id));
    }

    pub fn update_quantity(&mut self, cart_item_id: Uuid, quantity: i32) {
        if quantity <= 0 {
            self.remove_item(cart_item_id);
            return;
        }
        if let Some(item) = self.items.iter_mut().find(|i| i.id == Some(cart_item_id)) {
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

    // ============================================================================
    // Cart Creation Tests
    // ============================================================================

    #[test]
    fn test_new_cart_is_empty() {
        let cart = Cart::new();
        assert!(cart.items.is_empty());
    }

    #[test]
    fn test_default_cart_is_empty() {
        let cart = Cart::default();
        assert!(cart.items.is_empty());
    }

    // ============================================================================
    // Add Item Tests
    // ============================================================================

    #[test]
    fn test_add_item_to_empty_cart() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();

        cart.add_item(pid, 1, 10.0, vec![]);

        assert_eq!(cart.items.len(), 1);
        assert_eq!(cart.items[0].product_id, pid);
        assert_eq!(cart.items[0].quantity, 1);
        assert_eq!(cart.items[0].unit_price, 10.0);
        assert!(cart.items[0].id.is_none());
    }

    #[test]
    fn test_add_item_with_customizations() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let oid1 = Uuid::new_v4();
        let oid2 = Uuid::new_v4();

        let cust1 = vec![CartCustomization {
            group_id: gid,
            option_id: oid1,
            price_modifier: 2.0,
        }];

        cart.add_item(pid, 1, 10.0, cust1.clone());
        assert_eq!(cart.items.len(), 1);
        assert_eq!(cart.items[0].customizations.len(), 1);

        // Add same item, same customizations -> should merge
        cart.add_item(pid, 1, 10.0, cust1.clone());
        assert_eq!(cart.items.len(), 1);
        assert_eq!(cart.items[0].quantity, 2);

        // Add same item, different customizations -> should be new line
        let cust2 = vec![CartCustomization {
            group_id: gid,
            option_id: oid2,
            price_modifier: 5.0,
        }];
        cart.add_item(pid, 1, 10.0, cust2);
        assert_eq!(cart.items.len(), 2);
    }

    #[test]
    fn test_add_item_merges_same_product_same_customizations() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let oid = Uuid::new_v4();

        let cust = vec![CartCustomization {
            group_id: gid,
            option_id: oid,
            price_modifier: 5.0,
        }];

        cart.add_item(pid, 2, 10.0, cust.clone());
        cart.add_item(pid, 3, 10.0, cust.clone());

        assert_eq!(cart.items.len(), 1);
        assert_eq!(cart.items[0].quantity, 5);
    }

    #[test]
    fn test_add_item_creates_new_line_for_different_customizations() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let oid1 = Uuid::new_v4();
        let oid2 = Uuid::new_v4();

        cart.add_item(
            pid,
            1,
            10.0,
            vec![CartCustomization {
                group_id: gid,
                option_id: oid1,
                price_modifier: 2.0,
            }],
        );

        cart.add_item(
            pid,
            1,
            10.0,
            vec![CartCustomization {
                group_id: gid,
                option_id: oid2,
                price_modifier: 3.0,
            }],
        );

        assert_eq!(cart.items.len(), 2);
    }

    #[test]
    fn test_add_item_creates_new_line_for_different_products() {
        let mut cart = Cart::new();
        let pid1 = Uuid::new_v4();
        let pid2 = Uuid::new_v4();

        cart.add_item(pid1, 1, 10.0, vec![]);
        cart.add_item(pid2, 1, 20.0, vec![]);

        assert_eq!(cart.items.len(), 2);
    }

    #[test]
    fn test_add_item_updates_unit_price() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();

        cart.add_item(pid, 1, 10.0, vec![]);
        assert_eq!(cart.items[0].unit_price, 10.0);

        // Add same item with new price - should update
        cart.add_item(pid, 1, 15.0, vec![]);
        assert_eq!(cart.items[0].unit_price, 15.0);
        assert_eq!(cart.items[0].quantity, 2);
    }

    #[test]
    fn test_add_item_with_multiple_customizations() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();
        let gid1 = Uuid::new_v4();
        let gid2 = Uuid::new_v4();
        let oid1 = Uuid::new_v4();
        let oid2 = Uuid::new_v4();

        let custs = vec![
            CartCustomization {
                group_id: gid1,
                option_id: oid1,
                price_modifier: 2.0,
            },
            CartCustomization {
                group_id: gid2,
                option_id: oid2,
                price_modifier: 3.0,
            },
        ];

        cart.add_item(pid, 1, 10.0, custs);

        assert_eq!(cart.items.len(), 1);
        assert_eq!(cart.items[0].customizations.len(), 2);
    }

    #[test]
    fn test_add_item_with_zero_quantity() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();

        cart.add_item(pid, 0, 10.0, vec![]);

        assert_eq!(cart.items.len(), 1);
        assert_eq!(cart.items[0].quantity, 0);
    }

    #[test]
    fn test_add_item_with_negative_quantity() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();

        cart.add_item(pid, -5, 10.0, vec![]);

        assert_eq!(cart.items.len(), 1);
        assert_eq!(cart.items[0].quantity, -5);
    }

    // ============================================================================
    // Remove Item Tests
    // ============================================================================

    #[test]
    fn test_remove_item() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();
        let item_id = Uuid::new_v4();
        cart.items.push(CartItem {
            id: Some(item_id),
            product_id: pid,
            quantity: 1,
            unit_price: 10.0,
            customizations: vec![],
        });

        cart.remove_item(item_id);
        assert_eq!(cart.items.len(), 0);
    }

    #[test]
    fn test_remove_item_nonexistent() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();
        let item_id = Uuid::new_v4();
        let other_id = Uuid::new_v4();

        cart.items.push(CartItem {
            id: Some(item_id),
            product_id: pid,
            quantity: 1,
            unit_price: 10.0,
            customizations: vec![],
        });

        cart.remove_item(other_id);
        assert_eq!(cart.items.len(), 1); // Item should remain
    }

    #[test]
    fn test_remove_item_from_empty_cart() {
        let mut cart = Cart::new();
        cart.remove_item(Uuid::new_v4());
        assert!(cart.items.is_empty());
    }

    #[test]
    fn test_remove_item_preserves_others() {
        let mut cart = Cart::new();
        let pid1 = Uuid::new_v4();
        let pid2 = Uuid::new_v4();
        let item_id1 = Uuid::new_v4();
        let item_id2 = Uuid::new_v4();

        cart.items.push(CartItem {
            id: Some(item_id1),
            product_id: pid1,
            quantity: 1,
            unit_price: 10.0,
            customizations: vec![],
        });
        cart.items.push(CartItem {
            id: Some(item_id2),
            product_id: pid2,
            quantity: 2,
            unit_price: 20.0,
            customizations: vec![],
        });

        cart.remove_item(item_id1);

        assert_eq!(cart.items.len(), 1);
        assert_eq!(cart.items[0].id, Some(item_id2));
    }

    #[test]
    fn test_remove_item_without_id() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();

        cart.items.push(CartItem {
            id: None,
            product_id: pid,
            quantity: 1,
            unit_price: 10.0,
            customizations: vec![],
        });

        // Remove by random ID should not affect item with None id
        cart.remove_item(Uuid::new_v4());
        assert_eq!(cart.items.len(), 1);
    }

    // ============================================================================
    // Update Quantity Tests
    // ============================================================================

    #[test]
    fn test_update_quantity_positive() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();
        let item_id = Uuid::new_v4();

        cart.items.push(CartItem {
            id: Some(item_id),
            product_id: pid,
            quantity: 1,
            unit_price: 10.0,
            customizations: vec![],
        });

        cart.update_quantity(item_id, 5);
        assert_eq!(cart.items[0].quantity, 5);
    }

    #[test]
    fn test_update_quantity_to_zero_removes_item() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();
        let item_id = Uuid::new_v4();

        cart.items.push(CartItem {
            id: Some(item_id),
            product_id: pid,
            quantity: 3,
            unit_price: 10.0,
            customizations: vec![],
        });

        cart.update_quantity(item_id, 0);
        assert!(cart.items.is_empty());
    }

    #[test]
    fn test_update_quantity_negative_removes_item() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();
        let item_id = Uuid::new_v4();

        cart.items.push(CartItem {
            id: Some(item_id),
            product_id: pid,
            quantity: 3,
            unit_price: 10.0,
            customizations: vec![],
        });

        cart.update_quantity(item_id, -1);
        assert!(cart.items.is_empty());
    }

    #[test]
    fn test_update_quantity_nonexistent_item() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();
        let item_id = Uuid::new_v4();
        let other_id = Uuid::new_v4();

        cart.items.push(CartItem {
            id: Some(item_id),
            product_id: pid,
            quantity: 1,
            unit_price: 10.0,
            customizations: vec![],
        });

        cart.update_quantity(other_id, 5);
        assert_eq!(cart.items[0].quantity, 1); // Unchanged
    }

    #[test]
    fn test_update_quantity_on_empty_cart() {
        let mut cart = Cart::new();
        cart.update_quantity(Uuid::new_v4(), 5);
        assert!(cart.items.is_empty());
    }

    // ============================================================================
    // Get Total Tests
    // ============================================================================

    #[test]
    fn test_get_total_empty_cart() {
        let cart = Cart::new();
        assert_eq!(cart.get_total(), 0.0);
    }

    #[test]
    fn test_get_total_single_item_no_customizations() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();

        cart.add_item(pid, 2, 10.0, vec![]);

        assert_eq!(cart.get_total(), 20.0);
    }

    #[test]
    fn test_get_total_single_item_with_customizations() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let oid = Uuid::new_v4();

        let custs = vec![CartCustomization {
            group_id: gid,
            option_id: oid,
            price_modifier: 5.0,
        }];

        cart.add_item(pid, 2, 10.0, custs);

        // (10.0 + 5.0) * 2 = 30.0
        assert_eq!(cart.get_total(), 30.0);
    }

    #[test]
    fn test_get_total_multiple_items() {
        let mut cart = Cart::new();
        let pid1 = Uuid::new_v4();
        let pid2 = Uuid::new_v4();

        cart.add_item(pid1, 2, 10.0, vec![]);
        cart.add_item(pid2, 3, 20.0, vec![]);

        // 2*10 + 3*20 = 20 + 60 = 80
        assert_eq!(cart.get_total(), 80.0);
    }

    #[test]
    fn test_get_total_multiple_customizations() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();
        let gid1 = Uuid::new_v4();
        let gid2 = Uuid::new_v4();
        let oid1 = Uuid::new_v4();
        let oid2 = Uuid::new_v4();

        let custs = vec![
            CartCustomization {
                group_id: gid1,
                option_id: oid1,
                price_modifier: 2.0,
            },
            CartCustomization {
                group_id: gid2,
                option_id: oid2,
                price_modifier: 3.0,
            },
        ];

        cart.add_item(pid, 2, 10.0, custs);

        // (10.0 + 2.0 + 3.0) * 2 = 30.0
        assert_eq!(cart.get_total(), 30.0);
    }

    #[test]
    fn test_get_total_with_negative_price_modifier() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let oid = Uuid::new_v4();

        let custs = vec![CartCustomization {
            group_id: gid,
            option_id: oid,
            price_modifier: -2.0, // Discount
        }];

        cart.add_item(pid, 2, 10.0, custs);

        // (10.0 - 2.0) * 2 = 16.0
        assert_eq!(cart.get_total(), 16.0);
    }

    #[test]
    fn test_get_total_with_zero_quantity() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();

        cart.items.push(CartItem {
            id: Some(Uuid::new_v4()),
            product_id: pid,
            quantity: 0,
            unit_price: 10.0,
            customizations: vec![],
        });

        assert_eq!(cart.get_total(), 0.0);
    }

    #[test]
    fn test_get_total_with_zero_price() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();

        cart.add_item(pid, 5, 0.0, vec![]);

        assert_eq!(cart.get_total(), 0.0);
    }

    #[test]
    fn test_get_total_precision() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let oid = Uuid::new_v4();

        let custs = vec![CartCustomization {
            group_id: gid,
            option_id: oid,
            price_modifier: 0.01,
        }];

        cart.add_item(pid, 3, 9.99, custs);

        // (9.99 + 0.01) * 3 = 30.0
        assert_eq!(cart.get_total(), 30.0);
    }

    // ============================================================================
    // CartCustomization Tests
    // ============================================================================

    #[test]
    fn test_cart_customization_equality() {
        let gid = Uuid::new_v4();
        let oid = Uuid::new_v4();

        let cust1 = CartCustomization {
            group_id: gid,
            option_id: oid,
            price_modifier: 5.0,
        };

        let cust2 = CartCustomization {
            group_id: gid,
            option_id: oid,
            price_modifier: 5.0,
        };

        assert_eq!(cust1, cust2);
    }

    #[test]
    fn test_cart_customization_inequality_different_option() {
        let gid = Uuid::new_v4();
        let oid1 = Uuid::new_v4();
        let oid2 = Uuid::new_v4();

        let cust1 = CartCustomization {
            group_id: gid,
            option_id: oid1,
            price_modifier: 5.0,
        };

        let cust2 = CartCustomization {
            group_id: gid,
            option_id: oid2,
            price_modifier: 5.0,
        };

        assert_ne!(cust1, cust2);
    }

    #[test]
    fn test_cart_customization_inequality_different_price() {
        let gid = Uuid::new_v4();
        let oid = Uuid::new_v4();

        let cust1 = CartCustomization {
            group_id: gid,
            option_id: oid,
            price_modifier: 5.0,
        };

        let cust2 = CartCustomization {
            group_id: gid,
            option_id: oid,
            price_modifier: 10.0,
        };

        assert_ne!(cust1, cust2);
    }

    #[test]
    fn test_cart_customization_default() {
        let cust = CartCustomization::default();
        assert_eq!(cust.price_modifier, 0.0);
    }

    // ============================================================================
    // CartItem Tests
    // ============================================================================

    #[test]
    fn test_cart_item_equality() {
        let pid = Uuid::new_v4();

        let item1 = CartItem {
            id: None,
            product_id: pid,
            quantity: 2,
            unit_price: 10.0,
            customizations: vec![],
        };

        let item2 = CartItem {
            id: None,
            product_id: pid,
            quantity: 2,
            unit_price: 10.0,
            customizations: vec![],
        };

        assert_eq!(item1, item2);
    }

    #[test]
    fn test_cart_item_clone() {
        let pid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let oid = Uuid::new_v4();

        let item = CartItem {
            id: Some(Uuid::new_v4()),
            product_id: pid,
            quantity: 2,
            unit_price: 10.0,
            customizations: vec![CartCustomization {
                group_id: gid,
                option_id: oid,
                price_modifier: 5.0,
            }],
        };

        let cloned = item.clone();
        assert_eq!(item, cloned);
    }

    // ============================================================================
    // Serialization Tests
    // ============================================================================

    #[test]
    fn test_cart_serialization() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();

        cart.add_item(pid, 2, 10.0, vec![]);

        let json = serde_json::to_string(&cart).unwrap();
        let deserialized: Cart = serde_json::from_str(&json).unwrap();

        assert_eq!(cart.items.len(), deserialized.items.len());
        assert_eq!(cart.items[0].product_id, deserialized.items[0].product_id);
    }

    #[test]
    fn test_cart_customization_serialization() {
        let gid = Uuid::new_v4();
        let oid = Uuid::new_v4();

        let cust = CartCustomization {
            group_id: gid,
            option_id: oid,
            price_modifier: 5.0,
        };

        let json = serde_json::to_string(&cust).unwrap();
        let deserialized: CartCustomization = serde_json::from_str(&json).unwrap();

        assert_eq!(cust, deserialized);
    }

    // ============================================================================
    // Edge Cases
    // ============================================================================

    #[test]
    fn test_cart_with_large_quantity() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();

        cart.add_item(pid, i32::MAX, 1.0, vec![]);

        assert_eq!(cart.items[0].quantity, i32::MAX);
    }

    #[test]
    fn test_cart_with_large_price() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();

        cart.add_item(pid, 1, f64::MAX / 2.0, vec![]);

        assert!(cart.get_total() > 0.0);
    }

    #[test]
    fn test_many_items_in_cart() {
        let mut cart = Cart::new();

        for _ in 0..1000 {
            let pid = Uuid::new_v4();
            cart.add_item(pid, 1, 10.0, vec![]);
        }

        assert_eq!(cart.items.len(), 1000);
        assert_eq!(cart.get_total(), 10000.0);
    }

    #[test]
    fn test_many_customizations_per_item() {
        let mut cart = Cart::new();
        let pid = Uuid::new_v4();

        let custs: Vec<CartCustomization> = (0..100)
            .map(|i| CartCustomization {
                group_id: Uuid::new_v4(),
                option_id: Uuid::new_v4(),
                price_modifier: i as f64,
            })
            .collect();

        cart.add_item(pid, 1, 10.0, custs);

        // 10.0 + sum(0..100) = 10.0 + 4950 = 4960.0
        assert_eq!(cart.items[0].customizations.len(), 100);
        assert_eq!(cart.get_total(), 4960.0);
    }
}

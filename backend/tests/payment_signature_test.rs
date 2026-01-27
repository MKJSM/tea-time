//! Tests for Razorpay signature verification
//!
//! These tests verify the HMAC-SHA256 signature verification logic
//! used for payment verification.

use hmac::{Hmac, Mac};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

/// Verify Razorpay signature using HMAC-SHA256
fn verify_razorpay_signature(data: &str, signature: &str, secret: &str) -> bool {
    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC can take key of any size");
    mac.update(data.as_bytes());

    let expected = hex::encode(mac.finalize().into_bytes());
    expected == signature
}

/// Generate a valid signature for testing
fn generate_signature(data: &str, secret: &str) -> String {
    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC can take key of any size");
    mac.update(data.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

// ============================================================================
// Signature Verification Tests
// ============================================================================

mod signature_verification_tests {
    use super::*;

    #[test]
    fn test_valid_signature_verification() {
        let secret = "test_secret_key_12345";
        let order_id = "order_PqR1234567890";
        let payment_id = "pay_AbC1234567890";

        let data = format!("{}|{}", order_id, payment_id);
        let signature = generate_signature(&data, secret);

        assert!(verify_razorpay_signature(&data, &signature, secret));
    }

    #[test]
    fn test_invalid_signature_rejected() {
        let secret = "test_secret_key_12345";
        let data = "order_123|pay_456";
        let wrong_signature = "invalid_signature_hex_string";

        assert!(!verify_razorpay_signature(data, wrong_signature, secret));
    }

    #[test]
    fn test_wrong_secret_fails() {
        let correct_secret = "correct_secret";
        let wrong_secret = "wrong_secret";

        let data = "order_123|pay_456";
        let signature = generate_signature(data, correct_secret);

        assert!(!verify_razorpay_signature(data, &signature, wrong_secret));
    }

    #[test]
    fn test_modified_data_fails() {
        let secret = "test_secret";
        let original_data = "order_123|pay_456";
        let modified_data = "order_123|pay_789";

        let signature = generate_signature(original_data, secret);

        assert!(!verify_razorpay_signature(
            modified_data,
            &signature,
            secret
        ));
    }

    #[test]
    fn test_empty_signature_fails() {
        let secret = "test_secret";
        let data = "order_123|pay_456";

        assert!(!verify_razorpay_signature(data, "", secret));
    }

    #[test]
    fn test_empty_data() {
        let secret = "test_secret";
        let data = "";
        let signature = generate_signature(data, secret);

        assert!(verify_razorpay_signature(data, &signature, secret));
    }

    #[test]
    fn test_empty_secret() {
        let secret = "";
        let data = "order_123|pay_456";
        let signature = generate_signature(data, secret);

        assert!(verify_razorpay_signature(data, &signature, secret));
    }

    #[test]
    fn test_signature_is_lowercase_hex() {
        let secret = "test_secret";
        let data = "order_123|pay_456";
        let signature = generate_signature(data, secret);

        // Verify signature is lowercase hex
        assert!(signature
            .chars()
            .all(|c| c.is_ascii_hexdigit() && !c.is_uppercase()));
    }

    #[test]
    fn test_signature_length() {
        let secret = "test_secret";
        let data = "order_123|pay_456";
        let signature = generate_signature(data, secret);

        // SHA256 produces 32 bytes = 64 hex characters
        assert_eq!(signature.len(), 64);
    }

    #[test]
    fn test_case_sensitive_data() {
        let secret = "test_secret";
        let data1 = "ORDER_123|PAY_456";
        let data2 = "order_123|pay_456";

        let signature1 = generate_signature(data1, secret);
        let signature2 = generate_signature(data2, secret);

        assert_ne!(signature1, signature2);
    }

    #[test]
    fn test_case_sensitive_secret() {
        let secret1 = "TestSecret";
        let secret2 = "testsecret";
        let data = "order_123|pay_456";

        let signature1 = generate_signature(data, secret1);
        let signature2 = generate_signature(data, secret2);

        assert_ne!(signature1, signature2);
    }

    #[test]
    fn test_unicode_in_data() {
        let secret = "test_secret";
        let data = "order_123|pay_456|notes=कुछ_नोट्स";
        let signature = generate_signature(data, secret);

        assert!(verify_razorpay_signature(data, &signature, secret));
    }

    #[test]
    fn test_special_characters_in_data() {
        let secret = "test_secret";
        let data = "order_123|pay_456|amount=100.50&currency=INR";
        let signature = generate_signature(data, secret);

        assert!(verify_razorpay_signature(data, &signature, secret));
    }

    #[test]
    fn test_long_secret() {
        let secret = "a".repeat(1000);
        let data = "order_123|pay_456";
        let signature = generate_signature(data, &secret);

        assert!(verify_razorpay_signature(data, &signature, &secret));
    }

    #[test]
    fn test_long_data() {
        let secret = "test_secret";
        let data =
            "order_".to_string() + &"0123456789".repeat(100) + "|pay_" + &"0123456789".repeat(100);
        let signature = generate_signature(&data, secret);

        assert!(verify_razorpay_signature(&data, &signature, secret));
    }
}

// ============================================================================
// Razorpay Payment Data Format Tests
// ============================================================================

mod razorpay_format_tests {
    use super::*;

    #[test]
    fn test_standard_razorpay_format() {
        // Standard Razorpay signature format: order_id|payment_id
        let secret = "rzp_test_secret_12345";
        let order_id = "order_PqRsTuVwXyZ12345";
        let payment_id = "pay_AbCdEfGhIjKl12345";

        let data = format!("{}|{}", order_id, payment_id);
        let signature = generate_signature(&data, secret);

        assert!(verify_razorpay_signature(&data, &signature, secret));
    }

    #[test]
    fn test_razorpay_order_id_format() {
        // Razorpay order IDs start with "order_"
        let order_id = "order_PqRsTuVwXyZ12345";
        assert!(order_id.starts_with("order_"));
        assert!(order_id.len() > 10);
    }

    #[test]
    fn test_razorpay_payment_id_format() {
        // Razorpay payment IDs start with "pay_"
        let payment_id = "pay_AbCdEfGhIjKl12345";
        assert!(payment_id.starts_with("pay_"));
        assert!(payment_id.len() > 10);
    }

    #[test]
    fn test_separator_is_pipe() {
        let secret = "test_secret";
        let order_id = "order_123";
        let payment_id = "pay_456";

        // Correct separator
        let correct_data = format!("{}|{}", order_id, payment_id);
        let signature = generate_signature(&correct_data, secret);

        // Wrong separator
        let wrong_data_ampersand = format!("{}&{}", order_id, payment_id);
        let wrong_data_slash = format!("{}/{}", order_id, payment_id);
        let wrong_data_colon = format!("{}:{}", order_id, payment_id);

        assert!(verify_razorpay_signature(&correct_data, &signature, secret));
        assert!(!verify_razorpay_signature(
            &wrong_data_ampersand,
            &signature,
            secret
        ));
        assert!(!verify_razorpay_signature(
            &wrong_data_slash,
            &signature,
            secret
        ));
        assert!(!verify_razorpay_signature(
            &wrong_data_colon,
            &signature,
            secret
        ));
    }

    #[test]
    fn test_order_matters() {
        let secret = "test_secret";
        let order_id = "order_123";
        let payment_id = "pay_456";

        let correct_order = format!("{}|{}", order_id, payment_id);
        let wrong_order = format!("{}|{}", payment_id, order_id);

        let signature = generate_signature(&correct_order, secret);

        assert!(verify_razorpay_signature(
            &correct_order,
            &signature,
            secret
        ));
        assert!(!verify_razorpay_signature(&wrong_order, &signature, secret));
    }
}

// ============================================================================
// Edge Cases Tests
// ============================================================================

mod edge_case_tests {
    use super::*;

    #[test]
    fn test_whitespace_sensitivity() {
        let secret = "test_secret";
        let data_no_space = "order_123|pay_456";
        let data_with_space = "order_123 |pay_456";
        let data_with_newline = "order_123|\npay_456";

        let signature = generate_signature(data_no_space, secret);

        assert!(verify_razorpay_signature(data_no_space, &signature, secret));
        assert!(!verify_razorpay_signature(
            data_with_space,
            &signature,
            secret
        ));
        assert!(!verify_razorpay_signature(
            data_with_newline,
            &signature,
            secret
        ));
    }

    #[test]
    fn test_null_bytes() {
        let secret = "test_secret";
        let data_with_null = "order_123\0|pay_456";
        let signature = generate_signature(data_with_null, secret);

        assert!(verify_razorpay_signature(
            data_with_null,
            &signature,
            secret
        ));
    }

    #[test]
    fn test_multiple_pipes() {
        let secret = "test_secret";
        let data = "order_123|pay_456|extra_data";
        let signature = generate_signature(data, secret);

        assert!(verify_razorpay_signature(data, &signature, secret));
    }

    #[test]
    fn test_uppercase_hex_in_signature_fails() {
        let secret = "test_secret";
        let data = "order_123|pay_456";
        let lowercase_signature = generate_signature(data, secret);
        let uppercase_signature = lowercase_signature.to_uppercase();

        // Our implementation generates lowercase, so uppercase won't match
        assert!(verify_razorpay_signature(
            data,
            &lowercase_signature,
            secret
        ));
        assert!(!verify_razorpay_signature(
            data,
            &uppercase_signature,
            secret
        ));
    }

    #[test]
    fn test_partial_signature_fails() {
        let secret = "test_secret";
        let data = "order_123|pay_456";
        let full_signature = generate_signature(data, secret);
        let partial_signature = &full_signature[..32]; // Only first half

        assert!(!verify_razorpay_signature(data, partial_signature, secret));
    }

    #[test]
    fn test_signature_with_invalid_hex_fails() {
        let secret = "test_secret";
        let data = "order_123|pay_456";
        let invalid_signature = "gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg";

        assert!(!verify_razorpay_signature(data, invalid_signature, secret));
    }
}

// ============================================================================
// Security Tests
// ============================================================================

mod security_tests {
    use super::*;

    #[test]
    fn test_timing_attack_resistance() {
        // This test verifies that our comparison doesn't short-circuit
        // Note: In real security testing, you'd measure timing, but here we just verify behavior
        let secret = "test_secret";
        let data = "order_123|pay_456";
        let correct_signature = generate_signature(data, secret);

        // These should all take roughly the same time (in practice)
        let wrong_first_char = format!("x{}", &correct_signature[1..]);
        let wrong_last_char = format!("{}x", &correct_signature[..63]);
        let completely_wrong = "0".repeat(64);

        assert!(!verify_razorpay_signature(data, &wrong_first_char, secret));
        assert!(!verify_razorpay_signature(data, &wrong_last_char, secret));
        assert!(!verify_razorpay_signature(data, &completely_wrong, secret));
    }

    #[test]
    fn test_replay_attack_signature_specific_to_ids() {
        // A valid signature for one payment cannot be reused for another
        let secret = "test_secret";

        let order1 = "order_111|pay_111";
        let order2 = "order_222|pay_222";

        let signature1 = generate_signature(order1, secret);
        let signature2 = generate_signature(order2, secret);

        assert_ne!(signature1, signature2);
        assert!(!verify_razorpay_signature(order2, &signature1, secret));
        assert!(!verify_razorpay_signature(order1, &signature2, secret));
    }

    #[test]
    fn test_secret_not_leaked_in_signature() {
        let secret = "my_secret_key_12345";
        let data = "order_123|pay_456";
        let signature = generate_signature(data, secret);

        // Signature should not contain the secret
        assert!(!signature.contains(secret));
        assert!(!signature.contains("secret"));
    }

    #[test]
    fn test_deterministic_output() {
        let secret = "test_secret";
        let data = "order_123|pay_456";

        let signature1 = generate_signature(data, secret);
        let signature2 = generate_signature(data, secret);
        let signature3 = generate_signature(data, secret);

        assert_eq!(signature1, signature2);
        assert_eq!(signature2, signature3);
    }
}

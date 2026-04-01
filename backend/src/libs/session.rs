pub const CUSTOMER_SESSION_COOKIE: &str = "tea_time_customer_session";
pub const ADMIN_SESSION_COOKIE: &str = "tea_time_admin_session";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SessionScope {
    Customer,
    Admin,
}

pub fn cookie_name(scope: SessionScope) -> &'static str {
    match scope {
        SessionScope::Customer => CUSTOMER_SESSION_COOKIE,
        SessionScope::Admin => ADMIN_SESSION_COOKIE,
    }
}

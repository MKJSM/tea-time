# Backend Structure & Implementation Plan

## 1. Project Structure

The project will be organized to separate concerns (API, Domain, Infrastructure).

```
backend/
├── src/
│   ├── config.rs           # Configuration (Env vars)
│   ├── error.rs            # Global Error Handling
│   ├── main.rs             # Entry point & App wiring
│   ├── state.rs            # AppState (DB pool, etc.)
│   ├── auth.rs             # Auth middleware & Session definitions
│   ├── domain/             # Domain Models & DTOs
│   │   ├── mod.rs
│   │   └── models.rs       # User, Product, Session structs (updated to UUID)
│   ├── handlers/           # HTTP Request Handlers
│   │   ├── mod.rs          # Route definitions & Router builder
│   │   ├── auth.rs         # Login, Signup, Logout (All/Device)
│   │   ├── products.rs     # Product listing/details
│   │   ├── favorites.rs    # Favorites management
│   │   └── pages.rs        # Static/Template pages
│   └── infrastructure/     # Database & External Services
│       ├── mod.rs
│       └── session_store.rs # Custom SQLite Session Store (supporting logout-all)
```

## 2. UUID Migration

- **Users Table:** `id` becomes `TEXT` (UUID string).
- **Sessions Table:** `user_id` becomes `TEXT`.
- **Favorites Table:** `user_id` becomes `TEXT`.
- **Code Updates:** `i32` references to user ID will be updated to `uuid::Uuid`.

## 3. Session Management (Custom Store)

To support "Logout All" and "Device Info", we will implement a custom `SessionStore` based on the `base-session` example but adapted for SQLite.

- **Table Schema:**
  ```sql
  CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      data BLOB NOT NULL,
      expiry_date INTEGER NOT NULL, -- Unix timestamp or Text ISO
      user_id TEXT,                 -- For efficient querying by user
      ip_address TEXT,              -- Device Info
      user_agent TEXT               -- Device Info
  );
  ```
- **Features:**
  - `save`: Stores session data + extracted `user_id` and device info.
  - `load`: Standard load.
  - `delete`: Standard delete.
  - `delete_by_user`: Custom method to remove all sessions for a user.
  - `delete_by_user_and_session`: Custom method for specific device logout.

## 4. Documentation & TDD

- **Rust Docs:** Every handler and service function will have `///` comments.
- **Doctests:** Usage examples in comments will be runnable tests.
- **Integration Tests:** `tests/` module or in-file `mod tests` for every handler covering:
  - Success paths
  - Error paths (Invalid auth, Bad inputs)
  - Security checks (CSRF, Auth requirements)

## 5. Routing

- `handlers/mod.rs` will export a `build_router(state: AppState) -> Router` function.
- `main.rs` will call this function.

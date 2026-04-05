CREATE TABLE app_session (
    id UUID PRIMARY KEY,
    scope TEXT NOT NULL CHECK (scope IN ('customer', 'admin')),
    subject_id UUID NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    expires_on TIMESTAMPTZ NOT NULL,
    created_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX app_session_scope_subject_idx ON app_session (scope, subject_id);
CREATE INDEX app_session_scope_token_idx ON app_session (scope, session_token);

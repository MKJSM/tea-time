CREATE TABLE category (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    images TEXT[] NOT NULL DEFAULT '{}',
    created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    images TEXT[] NOT NULL DEFAULT '{}',
    price DOUBLE PRECISION NOT NULL,
    description TEXT NULL,
    created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE category_product (
    category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    PRIMARY KEY (category_id, product_id)
);


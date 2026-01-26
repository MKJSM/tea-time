-- Update existing products category from "Category" to '["Category"]'
UPDATE products SET category = '["' || category || '"]' WHERE category NOT LIKE '[%';

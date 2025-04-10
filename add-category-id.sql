-- Aggiungi la colonna category_id alla tabella articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);

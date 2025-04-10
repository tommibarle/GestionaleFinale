-- Aggiungi la tabella delle categorie se non esiste
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Aggiungi la colonna category_id alla tabella articles se non esiste
DO 2676 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='articles' AND column_name='category_id'
  ) THEN
    ALTER TABLE articles ADD COLUMN category_id INTEGER REFERENCES categories(id);
  END IF;
END 2676;

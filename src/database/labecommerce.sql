-- Active: 1681593296130@@127.0.0.1@3306

CREATE TABLE users(
  id INTEGER NOT NULL UNIQUE PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT (DATETIME()) NOT NULL
);

DROP TABLE users;
INSERT INTO users(name, email, password)
VALUES
  ("Carol", "carol@email.com", "carol0123"),
  ("Carol", "beltrano@email.com", "carol0123");

SELECT * FROM users;

CREATE TABLE purchases(
  id INTEGER NOT NULL UNIQUE PRIMARY KEY AUTOINCREMENT,
  buyer_id INTEGER NOT NULL,
  total_price REAL NOT NULL,
  created_at TEXT DEFAULT (DATETIME()) NOT NULL,
  paid BOOLEAN DEFAULT(false) NOT NULL,
  FOREIGN KEY (buyer_id) REFERENCES users(id)
);

CREATE TABLE purchases_products(
 purchase_id INTEGER,
 product_id INTEGER,
 quantity INTEGER,
 FOREIGN KEY (purchase_id) REFERENCES purchases(id),
 FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE products(
  id INTEGER UNIQUE NOT NULL PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  image_url TEXT
);

SELECT * FROM products;

INSERT INTO products(name, price)
VALUES
  ("Os 3 Porquinhos", 26.80);
  

SELECT * FROM purchases;

SELECT * FROM purchases_products;

DROP TABLE products;

DROP TABLE purchases;

DROP TABLE purchases_products;


import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import {
  InsertArticle,
  InsertProduct,
  InsertOrder,
  insertArticleSchema,
  insertProductSchema,
  insertOrderSchema,
  insertProductArticleSchema,
  insertOrderProductSchema
} from "@shared/schema";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Autenticazione richiesta" });
};

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && (req.user as Express.User).role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Permesso negato. Richiesti privilegi di amministratore." });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Categories routes hanno stato rimosse
  
  // Articoli (Articles) routes
  app.get("/api/articles", isAuthenticated, async (req, res) => {
    try {
      const articles = await storage.getAllArticles();
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Errore durante il recupero degli articoli" });
    }
  });

  app.get("/api/articles/:id", isAuthenticated, async (req, res) => {
    try {
      const article = await storage.getArticle(Number(req.params.id));
      if (!article) {
        return res.status(404).json({ message: "Articolo non trovato" });
      }
      res.json({
        ...article,
        status: storage.calculateArticleStatus(article)
      });
    } catch (error) {
      res.status(500).json({ message: "Errore durante il recupero dell'articolo" });
    }
  });

  app.post("/api/articles", isAuthenticated, async (req, res) => {
    try {
      const articleData = insertArticleSchema.parse(req.body);
      
      // Check if code already exists
      const existingArticle = await storage.getArticleByCode(articleData.code);
      if (existingArticle) {
        return res.status(400).json({ message: "Codice articolo già esistente" });
      }
      
      const article = await storage.createArticle(articleData);
      res.status(201).json({
        ...article,
        status: storage.calculateArticleStatus(article)
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).json({ message: "Errore durante la creazione dell'articolo" });
    }
  });

  app.put("/api/articles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      // Partial update is allowed
      const articleData = insertArticleSchema.partial().parse(req.body);
      
      // If code is being updated, check for duplicates
      if (articleData.code) {
        const existingArticle = await storage.getArticleByCode(articleData.code);
        if (existingArticle && existingArticle.id !== id) {
          return res.status(400).json({ message: "Codice articolo già esistente" });
        }
      }
      
      const updatedArticle = await storage.updateArticle(id, articleData);
      if (!updatedArticle) {
        return res.status(404).json({ message: "Articolo non trovato" });
      }
      
      res.json({
        ...updatedArticle,
        status: storage.calculateArticleStatus(updatedArticle)
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).json({ message: "Errore durante l'aggiornamento dell'articolo" });
    }
  });

  app.delete("/api/articles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const article = await storage.getArticle(id);
      
      if (!article) {
        return res.status(404).json({ message: "Articolo non trovato" });
      }
      
      const deleted = await storage.deleteArticle(id);
      
      if (!deleted) {
        return res.status(500).json({ message: "Errore durante l'eliminazione dell'articolo" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Errore durante l'eliminazione dell'articolo" });
    }
  });

  // Prodotti (Products) routes
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Errore durante il recupero dei prodotti" });
    }
  });

  app.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProduct(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Prodotto non trovato" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Errore durante il recupero del prodotto" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const { product, articles } = req.body;
      
      const productData = insertProductSchema.parse(product);
      
      // Check if code already exists
      const existingProduct = await storage.getProductByCode(productData.code);
      if (existingProduct) {
        return res.status(400).json({ message: "Codice prodotto già esistente" });
      }
      
      // Create the product
      const newProduct = await storage.createProduct(productData);
      
      // Add articles to the product
      if (Array.isArray(articles) && articles.length > 0) {
        for (const article of articles) {
          const productArticleData = insertProductArticleSchema.parse({
            ...article,
            productId: newProduct.id
          });
          
          await storage.addArticleToProduct(productArticleData);
        }
      }
      
      // Get the enriched product with articles
      const productWithArticles = await storage.getProduct(newProduct.id);
      
      res.status(201).json(productWithArticles);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).json({ message: "Errore durante la creazione del prodotto" });
    }
  });

  app.put("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { product, articles } = req.body;
      
      // Partial update is allowed for product data
      const productData = insertProductSchema.partial().parse(product);
      
      // If code is being updated, check for duplicates
      if (productData.code) {
        const existingProduct = await storage.getProductByCode(productData.code);
        if (existingProduct && existingProduct.id !== id) {
          return res.status(400).json({ message: "Codice prodotto già esistente" });
        }
      }
      
      // Update the product
      const updatedProduct = await storage.updateProduct(id, productData);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Prodotto non trovato" });
      }
      
      // If articles are provided, delete existing and add new ones
      if (Array.isArray(articles)) {
        // First, delete all existing product articles
        const existingProductWithArticles = await storage.getProduct(id);
        if (existingProductWithArticles) {
          for (const pa of existingProductWithArticles.articles) {
            await storage.deleteProduct(pa.id);
          }
        }
        
        // Then, add new articles
        for (const article of articles) {
          const productArticleData = insertProductArticleSchema.parse({
            ...article,
            productId: id
          });
          
          await storage.addArticleToProduct(productArticleData);
        }
      }
      
      // Get the enriched product with articles
      const productWithArticles = await storage.getProduct(id);
      
      res.json(productWithArticles);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).json({ message: "Errore durante l'aggiornamento del prodotto" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Prodotto non trovato" });
      }
      
      const deleted = await storage.deleteProduct(id);
      
      if (!deleted) {
        return res.status(500).json({ message: "Errore durante l'eliminazione del prodotto" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Errore durante l'eliminazione del prodotto" });
    }
  });

  // Ordini (Orders) routes
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Errore durante il recupero degli ordini" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getOrder(Number(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Ordine non trovato" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Errore durante il recupero dell'ordine" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const { order, products } = req.body;
      
      const orderData = insertOrderSchema.parse({
        ...order,
        createdBy: req.user?.id
      });
      
      // Create the order
      const newOrder = await storage.createOrder(orderData);
      
      // Add products to the order and update inventory
      if (Array.isArray(products) && products.length > 0) {
        for (const product of products) {
          // Ottieni il prodotto per ottenere il prezzo
          const productInfo = await storage.getProduct(product.productId);
          if (!productInfo) {
            continue;
          }
          
          // Calcola il prezzo totale in base alla quantità
          const price = productInfo.price;
          const totalPrice = price * product.quantity;
          
          const orderProductData = insertOrderProductSchema.parse({
            ...product,
            orderId: newOrder.id,
            price: price,
            totalPrice: totalPrice
          });
          
          await storage.addProductToOrder(orderProductData);
        }
        
        // Update inventory based on the order
        await storage.updateInventoryForOrder(newOrder);
      }
      
      // Get the enriched order with products
      const orderWithProducts = await storage.getOrder(newOrder.id);
      
      res.status(201).json(orderWithProducts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).json({ message: "Errore durante la creazione dell'ordine" });
    }
  });

  app.put("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { order } = req.body;
      
      // Get existing order
      const existingOrder = await storage.getOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Ordine non trovato" });
      }
      
      // Partial update is allowed for order data
      const orderData = insertOrderSchema.partial().parse(order);
      
      // Add the items back to inventory if order is being cancelled
      if (orderData.status === "cancelled" && existingOrder.status !== "cancelled") {
        await storage.updateInventoryForOrder(existingOrder, true);
      }
      
      // Update the order
      const updatedOrder = await storage.updateOrder(id, orderData);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Ordine non trovato" });
      }
      
      // Get the enriched order with products
      const orderWithProducts = await storage.getOrder(id);
      
      res.json(orderWithProducts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      res.status(500).json({ message: "Errore durante l'aggiornamento dell'ordine" });
    }
  });

  app.delete("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Ordine non trovato" });
      }
      
      // Add the items back to inventory
      await storage.updateInventoryForOrder(order, true);
      
      const deleted = await storage.deleteOrder(id);
      
      if (!deleted) {
        return res.status(500).json({ message: "Errore durante l'eliminazione dell'ordine" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Errore durante l'eliminazione dell'ordine" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard", isAuthenticated, async (req, res) => {
    try {
      const articles = await storage.getAllArticles();
      const products = await storage.getAllProducts();
      const orders = await storage.getAllOrders();
      const lowStockArticles = await storage.getLowStockArticles();
      
      // Calcola il valore totale degli ordini
      const totalOrdersValue = orders.reduce((sum, order) => {
        // Aggiungi il prezzo totale di ogni prodotto nell'ordine
        return sum + order.products.reduce((orderSum, op) => orderSum + op.totalPrice, 0);
      }, 0);
      
      // Get recent orders (last 5)
      const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      res.json({
        totalArticles: articles.length,
        totalProducts: products.length,
        totalOrders: orders.length,
        totalOrdersValue,
        lowStockArticles,
        recentOrders
      });
    } catch (error) {
      console.error("Errore dashboard:", error);
      res.status(500).json({ message: "Errore durante il recupero dei dati della dashboard" });
    }
  });

  // Users routes (solo gli admin possono gestire gli utenti)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Rimuovi le password dagli utenti nella risposta
      const sanitizedUsers = users.map(({ password, ...rest }) => rest);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Errore nel recupero degli utenti:", error);
      res.status(500).json({ message: "Errore durante il recupero degli utenti" });
    }
  });

  app.get("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      
      // Rimuovi la password dalla risposta
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Errore nel recupero dell'utente:", error);
      res.status(500).json({ message: "Errore durante il recupero dell'utente" });
    }
  });

  app.post("/api/users", isAdmin, async (req, res) => {
    try {
      const userData = req.body;
      
      if (!userData || !userData.email || !userData.password || !userData.name) {
        return res.status(400).json({ message: "Dati utente incompleti" });
      }
      
      // Controlla se esiste già un utente con la stessa email
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email già in uso" });
      }
      
      // Hascia la password prima di salvarla
      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(userData.password);
      
      // Crea l'utente
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
        role: userData.role || "operator" // Default role se non specificato
      });
      
      // Rimuovi la password dalla risposta
      const { password, ...sanitizedUser } = newUser;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      console.error("Errore nella creazione dell'utente:", error);
      res.status(500).json({ message: "Errore durante la creazione dell'utente" });
    }
  });

  app.put("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userData = req.body;
      
      if (!userData) {
        return res.status(400).json({ message: "Dati utente non forniti" });
      }
      
      // Per l'utente admin principale (ID 1), non consentire la modifica del ruolo a non-admin
      if (id === 1 && userData.role && userData.role !== "admin") {
        return res.status(403).json({ message: "Non è possibile modificare il ruolo dell'amministratore principale" });
      }
      
      // Controlla se c'è una nuova email che è già in uso
      if (userData.email) {
        const existingUser = await storage.getUserByEmail(userData.email);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Email già in uso" });
        }
      }
      
      // Se viene fornita una nuova password, hashala
      let updatedUserData = { ...userData };
      if (userData.password) {
        const { hashPassword } = await import("./auth");
        updatedUserData.password = await hashPassword(userData.password);
      }
      
      // Aggiorna l'utente
      const updatedUser = await storage.updateUser(id, updatedUserData);
      if (!updatedUser) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      
      // Rimuovi la password dalla risposta
      const { password, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Errore nell'aggiornamento dell'utente:", error);
      res.status(500).json({ message: "Errore durante l'aggiornamento dell'utente" });
    }
  });

  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      // Non consentire l'eliminazione dell'utente admin principale
      if (id === 1) {
        return res.status(403).json({ message: "Non è possibile eliminare l'amministratore principale" });
      }
      
      // Non consentire l'eliminazione del proprio account
      if (id === (req.user as Express.User).id) {
        return res.status(403).json({ message: "Non è possibile eliminare il proprio account" });
      }
      
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Errore nell'eliminazione dell'utente:", error);
      res.status(500).json({ message: "Errore durante l'eliminazione dell'utente" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import { users, articles, products, productArticles, orders, orderProducts } from "@shared/schema";
import type { User, Article, Product, ProductArticle, Order, OrderProduct, InsertUser, InsertArticle, InsertProduct, InsertProductArticle, InsertOrder, InsertOrderProduct, ArticleWithStatus, ProductWithArticles, OrderWithProducts } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, asc, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // Session store
  sessionStore: any; // Using any for session store type

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Article operations
  getAllArticles(): Promise<ArticleWithStatus[]>;
  getArticle(id: number): Promise<Article | undefined>;
  getArticleByCode(code: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>;
  
  // Product operations
  getAllProducts(): Promise<ProductWithArticles[]>;
  getProduct(id: number): Promise<ProductWithArticles | undefined>;
  getProductByCode(code: string): Promise<ProductWithArticles | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  addArticleToProduct(productArticle: InsertProductArticle): Promise<ProductArticle>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Order operations
  getAllOrders(): Promise<OrderWithProducts[]>;
  getOrder(id: number): Promise<OrderWithProducts | undefined>;
  getOrderByCode(code: string): Promise<OrderWithProducts | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  addProductToOrder(orderProduct: InsertOrderProduct): Promise<OrderProduct>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  
  // Inventory operations
  calculateArticleStatus(article: Article): 'available' | 'low' | 'critical' | 'out';
  calculateProductAvailability(product: ProductWithArticles): 'available' | 'limited' | 'unavailable';
  updateInventoryForOrder(order: Order, addToInventory?: boolean): Promise<boolean>;
  getLowStockArticles(): Promise<ArticleWithStatus[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private articles: Map<number, Article>;
  private products: Map<number, Product>;
  private productArticles: Map<number, ProductArticle>;
  private orders: Map<number, Order>;
  private orderProducts: Map<number, OrderProduct>;
  
  public sessionStore: any; // Using any for session store type
  
  private userId: number;
  private articleId: number;
  private productId: number;
  private productArticleId: number;
  private orderId: number;
  private orderProductId: number;

  constructor() {
    this.users = new Map();
    this.articles = new Map();
    this.products = new Map();
    this.productArticles = new Map();
    this.orders = new Map();
    this.orderProducts = new Map();
    
    this.userId = 1;
    this.articleId = 1;
    this.productId = 1;
    this.productArticleId = 1;
    this.orderId = 1;
    this.orderProductId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 1 day in ms
    });
    
    // Add default admin user with scrypt-compatible password hash for "password"
    this.createUser({
      email: "admin@esempio.it",
      password: "c0067d4af4e87f00dbac63b6156828237059172d1bbeac67427345d6a9fda484e7c0e93634ec357c0e9b4e3d2b6603d319b2618fdb53b3e0c8f51b1da0892135.ab468950522f2dec2e0dfcd16ec35aa5", // "password"
      name: "Admin Manager",
      role: "admin"
    });
    
    // Add some sample articles
    this.createArticle({
      code: "ART-001",
      name: "Viti 3x10mm",
      description: "Viti a testa piatta",
      category: "Viti",
      quantity: 25,
      threshold: 50
    });
    
    this.createArticle({
      code: "ART-002",
      name: "Bottoni Dorati",
      description: "Bottoni decorativi in metallo",
      category: "Bottoni",
      quantity: 12,
      threshold: 30
    });
    
    this.createArticle({
      code: "ART-003",
      name: "Etichette Logo Grande",
      description: "Etichette adesive con logo aziendale",
      category: "Etichette",
      quantity: 5,
      threshold: 20
    });
    
    this.createArticle({
      code: "ART-004",
      name: "Cerniere Piccole",
      description: "Cerniere metalliche per scatole",
      category: "Cerniere",
      quantity: 0,
      threshold: 15
    });
    
    this.createArticle({
      code: "ART-005",
      name: "Vetro 10x15cm",
      description: "Vetro temperato trasparente",
      category: "Vetri",
      quantity: 35,
      threshold: 20
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Article operations
  async getAllArticles(): Promise<ArticleWithStatus[]> {
    return Array.from(this.articles.values()).map(article => ({
      ...article,
      status: this.calculateArticleStatus(article)
    }));
  }

  async getArticle(id: number): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async getArticleByCode(code: string): Promise<Article | undefined> {
    return Array.from(this.articles.values()).find(article => article.code === code);
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const id = this.articleId++;
    const now = new Date();
    const newArticle: Article = {
      ...article,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.articles.set(id, newArticle);
    return newArticle;
  }

  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined> {
    const existingArticle = this.articles.get(id);
    if (!existingArticle) return undefined;
    
    const updatedArticle: Article = {
      ...existingArticle,
      ...article,
      updatedAt: new Date()
    };
    
    this.articles.set(id, updatedArticle);
    return updatedArticle;
  }

  async deleteArticle(id: number): Promise<boolean> {
    return this.articles.delete(id);
  }

  // Product operations
  async getAllProducts(): Promise<ProductWithArticles[]> {
    return Array.from(this.products.values()).map(product => {
      const productWithArticles = this.enrichProductWithArticles(product);
      return {
        ...productWithArticles,
        availability: this.calculateProductAvailability(productWithArticles)
      };
    });
  }

  async getProduct(id: number): Promise<ProductWithArticles | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const productWithArticles = this.enrichProductWithArticles(product);
    return {
      ...productWithArticles,
      availability: this.calculateProductAvailability(productWithArticles)
    };
  }

  async getProductByCode(code: string): Promise<ProductWithArticles | undefined> {
    const product = Array.from(this.products.values()).find(product => product.code === code);
    if (!product) return undefined;
    
    const productWithArticles = this.enrichProductWithArticles(product);
    return {
      ...productWithArticles,
      availability: this.calculateProductAvailability(productWithArticles)
    };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const now = new Date();
    const newProduct: Product = {
      ...product,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async addArticleToProduct(productArticle: InsertProductArticle): Promise<ProductArticle> {
    const id = this.productArticleId++;
    const newProductArticle: ProductArticle = { ...productArticle, id };
    this.productArticles.set(id, newProductArticle);
    return newProductArticle;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;
    
    const updatedProduct: Product = {
      ...existingProduct,
      ...product,
      updatedAt: new Date()
    };
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    // Delete product articles first
    Array.from(this.productArticles.values())
      .filter(pa => pa.productId === id)
      .forEach(pa => this.productArticles.delete(pa.id));
    
    return this.products.delete(id);
  }

  // Order operations
  async getAllOrders(): Promise<OrderWithProducts[]> {
    return Array.from(this.orders.values()).map(order => this.enrichOrderWithProducts(order));
  }

  async getOrder(id: number): Promise<OrderWithProducts | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    return this.enrichOrderWithProducts(order);
  }

  async getOrderByCode(code: string): Promise<OrderWithProducts | undefined> {
    const order = Array.from(this.orders.values()).find(order => order.code === code);
    if (!order) return undefined;
    
    return this.enrichOrderWithProducts(order);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderId++;
    const now = new Date();
    const newOrder: Order = {
      ...order,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async addProductToOrder(orderProduct: InsertOrderProduct): Promise<OrderProduct> {
    const id = this.orderProductId++;
    const newOrderProduct: OrderProduct = { ...orderProduct, id };
    this.orderProducts.set(id, newOrderProduct);
    return newOrderProduct;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;
    
    const updatedOrder: Order = {
      ...existingOrder,
      ...order,
      updatedAt: new Date()
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    // Delete order products first
    Array.from(this.orderProducts.values())
      .filter(op => op.orderId === id)
      .forEach(op => this.orderProducts.delete(op.id));
    
    return this.orders.delete(id);
  }

  // Inventory calculations
  calculateArticleStatus(article: Article): 'available' | 'low' | 'critical' | 'out' {
    if (article.quantity === 0) return 'out';
    if (article.quantity <= article.threshold * 0.25) return 'critical';
    if (article.quantity <= article.threshold) return 'low';
    return 'available';
  }

  calculateProductAvailability(product: ProductWithArticles): 'available' | 'limited' | 'unavailable' {
    if (!product.articles || product.articles.length === 0) return 'available';
    
    const articleStatuses = product.articles.map(pa => {
      const article = pa.article;
      const status = this.calculateArticleStatus(article);
      return { status, required: pa.quantity, available: article.quantity };
    });
    
    if (articleStatuses.some(as => as.status === 'out' || as.available < as.required)) {
      return 'unavailable';
    }
    
    if (articleStatuses.some(as => as.status === 'critical' || as.status === 'low')) {
      return 'limited';
    }
    
    return 'available';
  }

  async updateInventoryForOrder(order: Order, addToInventory: boolean = false): Promise<boolean> {
    const orderWithProducts = await this.getOrder(order.id);
    if (!orderWithProducts) return false;
    
    // For each product in the order
    for (const op of orderWithProducts.products) {
      const product = await this.getProduct(op.productId);
      if (!product) continue;
      
      // For each article in the product
      for (const pa of product.articles) {
        const article = await this.getArticle(pa.articleId);
        if (!article) continue;
        
        // Calculate total article quantity needed for this order
        const quantityChange = pa.quantity * op.quantity;
        
        // Update article quantity
        if (addToInventory) {
          article.quantity += quantityChange;
        } else {
          article.quantity -= quantityChange;
          if (article.quantity < 0) article.quantity = 0; // Prevent negative quantities
        }
        
        await this.updateArticle(article.id, { quantity: article.quantity });
      }
    }
    
    return true;
  }

  async getLowStockArticles(): Promise<ArticleWithStatus[]> {
    const allArticles = await this.getAllArticles();
    return allArticles.filter(article => 
      article.status === 'low' || article.status === 'critical' || article.status === 'out'
    );
  }

  // Helper methods
  private enrichProductWithArticles(product: Product): ProductWithArticles {
    const productArticleEntries = Array.from(this.productArticles.values())
      .filter(pa => pa.productId === product.id)
      .map(pa => ({
        ...pa,
        article: this.articles.get(pa.articleId)!
      }));
    
    return {
      ...product,
      articles: productArticleEntries,
      availability: 'available' // Will be calculated later
    };
  }

  private enrichOrderWithProducts(order: Order): OrderWithProducts {
    const orderProductEntries = Array.from(this.orderProducts.values())
      .filter(op => op.orderId === order.id)
      .map(op => ({
        ...op,
        product: this.products.get(op.productId)!
      }));
    
    return {
      ...order,
      products: orderProductEntries
    };
  }
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Initialize the database with default data if needed
    this.initializeDatabase();
  }
  
  private async initializeDatabase() {
    try {
      // Check if admin user exists
      const adminUser = await this.getUserByEmail("admin@esempio.it");
      
      if (!adminUser) {
        // Add default admin user
        await this.createUser({
          email: "admin@esempio.it",
          password: "c0067d4af4e87f00dbac63b6156828237059172d1bbeac67427345d6a9fda484e7c0e93634ec357c0e9b4e3d2b6603d319b2618fdb53b3e0c8f51b1da0892135.ab468950522f2dec2e0dfcd16ec35aa5", // "password"
          name: "Admin Manager",
          role: "admin"
        });
        
        // Add sample articles
        const article1 = await this.createArticle({
          code: "ART-001",
          name: "Viti 3x10mm",
          description: "Viti a testa piatta",
          category: "Viti",
          quantity: 25,
          threshold: 50
        });
        
        const article2 = await this.createArticle({
          code: "ART-002",
          name: "Bottoni Dorati",
          description: "Bottoni decorativi in metallo",
          category: "Bottoni",
          quantity: 12,
          threshold: 30
        });
        
        const article3 = await this.createArticle({
          code: "ART-003",
          name: "Etichette Logo Grande",
          description: "Etichette adesive con logo aziendale",
          category: "Etichette",
          quantity: 5,
          threshold: 20
        });
        
        const article4 = await this.createArticle({
          code: "ART-004",
          name: "Cerniere Piccole",
          description: "Cerniere metalliche per scatole",
          category: "Cerniere",
          quantity: 0,
          threshold: 15
        });
        
        const article5 = await this.createArticle({
          code: "ART-005",
          name: "Vetro 10x15cm",
          description: "Vetro temperato trasparente",
          category: "Vetri",
          quantity: 35,
          threshold: 20
        });
      }
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  // Article operations
  async getAllArticles(): Promise<ArticleWithStatus[]> {
    const allArticles = await db.select().from(articles).orderBy(asc(articles.name));
    return allArticles.map(article => ({
      ...article,
      status: this.calculateArticleStatus(article)
    }));
  }

  async getArticle(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async getArticleByCode(code: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.code, code));
    return article;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const now = new Date();
    const [newArticle] = await db.insert(articles)
      .values({
        ...article,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return newArticle;
  }

  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined> {
    const [updatedArticle] = await db.update(articles)
      .set({
        ...article,
        updatedAt: new Date()
      })
      .where(eq(articles.id, id))
      .returning();
    return updatedArticle;
  }

  async deleteArticle(id: number): Promise<boolean> {
    try {
      await db.delete(articles).where(eq(articles.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Product operations
  async getAllProducts(): Promise<ProductWithArticles[]> {
    const allProducts = await db.select().from(products).orderBy(asc(products.name));
    
    const productsWithArticles: ProductWithArticles[] = [];
    
    for (const product of allProducts) {
      const productWithArticles = await this.enrichProductWithArticles(product);
      productsWithArticles.push({
        ...productWithArticles,
        availability: this.calculateProductAvailability(productWithArticles)
      });
    }
    
    return productsWithArticles;
  }

  async getProduct(id: number): Promise<ProductWithArticles | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) return undefined;
    
    const productWithArticles = await this.enrichProductWithArticles(product);
    return {
      ...productWithArticles,
      availability: this.calculateProductAvailability(productWithArticles)
    };
  }

  async getProductByCode(code: string): Promise<ProductWithArticles | undefined> {
    const [product] = await db.select().from(products).where(eq(products.code, code));
    if (!product) return undefined;
    
    const productWithArticles = await this.enrichProductWithArticles(product);
    return {
      ...productWithArticles,
      availability: this.calculateProductAvailability(productWithArticles)
    };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const now = new Date();
    const [newProduct] = await db.insert(products)
      .values({
        ...product,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return newProduct;
  }

  async addArticleToProduct(productArticle: InsertProductArticle): Promise<ProductArticle> {
    const [newProductArticle] = await db.insert(productArticles)
      .values(productArticle)
      .returning();
    return newProductArticle;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db.update(products)
      .set({
        ...product,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      // Delete product articles first to maintain referential integrity
      await db.delete(productArticles).where(eq(productArticles.productId, id));
      
      // Then delete the product
      await db.delete(products).where(eq(products.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Order operations
  async getAllOrders(): Promise<OrderWithProducts[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    
    const ordersWithProducts: OrderWithProducts[] = [];
    
    for (const order of allOrders) {
      ordersWithProducts.push(await this.enrichOrderWithProducts(order));
    }
    
    return ordersWithProducts;
  }

  async getOrder(id: number): Promise<OrderWithProducts | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    
    return this.enrichOrderWithProducts(order);
  }

  async getOrderByCode(code: string): Promise<OrderWithProducts | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.code, code));
    if (!order) return undefined;
    
    return this.enrichOrderWithProducts(order);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const now = new Date();
    const [newOrder] = await db.insert(orders)
      .values({
        ...order,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return newOrder;
  }

  async addProductToOrder(orderProduct: InsertOrderProduct): Promise<OrderProduct> {
    const [newOrderProduct] = await db.insert(orderProducts)
      .values(orderProduct)
      .returning();
    return newOrderProduct;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updatedOrder] = await db.update(orders)
      .set({
        ...order,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      // Delete order products first to maintain referential integrity
      await db.delete(orderProducts).where(eq(orderProducts.orderId, id));
      
      // Then delete the order
      await db.delete(orders).where(eq(orders.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Inventory calculations
  calculateArticleStatus(article: Article): 'available' | 'low' | 'critical' | 'out' {
    if (article.quantity === 0) return 'out';
    if (article.quantity <= article.threshold * 0.25) return 'critical';
    if (article.quantity <= article.threshold) return 'low';
    return 'available';
  }

  calculateProductAvailability(product: ProductWithArticles): 'available' | 'limited' | 'unavailable' {
    if (!product.articles || product.articles.length === 0) return 'available';
    
    const articleStatuses = product.articles.map(pa => {
      const article = pa.article;
      const status = this.calculateArticleStatus(article);
      return { status, required: pa.quantity, available: article.quantity };
    });
    
    if (articleStatuses.some(as => as.status === 'out' || as.available < as.required)) {
      return 'unavailable';
    }
    
    if (articleStatuses.some(as => as.status === 'critical' || as.status === 'low')) {
      return 'limited';
    }
    
    return 'available';
  }

  async updateInventoryForOrder(order: Order, addToInventory: boolean = false): Promise<boolean> {
    const orderWithProducts = await this.getOrder(order.id);
    if (!orderWithProducts) return false;
    
    // For each product in the order
    for (const op of orderWithProducts.products) {
      const product = await this.getProduct(op.productId);
      if (!product) continue;
      
      // For each article in the product
      for (const pa of product.articles) {
        const article = await this.getArticle(pa.articleId);
        if (!article) continue;
        
        // Calculate total article quantity needed for this order
        const quantityChange = pa.quantity * op.quantity;
        
        // Update article quantity
        let newQuantity: number;
        if (addToInventory) {
          newQuantity = article.quantity + quantityChange;
        } else {
          newQuantity = article.quantity - quantityChange;
          if (newQuantity < 0) newQuantity = 0; // Prevent negative quantities
        }
        
        await this.updateArticle(article.id, { quantity: newQuantity });
      }
    }
    
    return true;
  }

  async getLowStockArticles(): Promise<ArticleWithStatus[]> {
    const allArticles = await this.getAllArticles();
    return allArticles.filter(article => 
      article.status === 'low' || article.status === 'critical' || article.status === 'out'
    );
  }
  
  // Helper methods
  private async enrichProductWithArticles(product: Product): Promise<ProductWithArticles> {
    const productArticleEntries = await db.select()
      .from(productArticles)
      .where(eq(productArticles.productId, product.id));
    
    const enrichedEntries = [];
    
    for (const pa of productArticleEntries) {
      const article = await this.getArticle(pa.articleId);
      if (article) {
        enrichedEntries.push({
          ...pa,
          article
        });
      }
    }
    
    return {
      ...product,
      articles: enrichedEntries,
      availability: 'available' // Will be calculated later
    };
  }

  private async enrichOrderWithProducts(order: Order): Promise<OrderWithProducts> {
    const orderProductEntries = await db.select()
      .from(orderProducts)
      .where(eq(orderProducts.orderId, order.id));
    
    const enrichedEntries = [];
    
    for (const op of orderProductEntries) {
      const [product] = await db.select()
        .from(products)
        .where(eq(products.id, op.productId));
        
      if (product) {
        enrichedEntries.push({
          ...op,
          product
        });
      }
    }
    
    return {
      ...order,
      products: enrichedEntries
    };
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();

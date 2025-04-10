import { pgTable, text, serial, integer, boolean, timestamp, jsonb, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  role: true,
});

// Articles (basic units)
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  threshold: integer("threshold").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articles).pick({
  code: true,
  name: true,
  description: true,
  category: true,
  quantity: true,
  threshold: true,
});

// Products (combination of articles)
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  price: integer("price").notNull().default(0), // Prezzo in centesimi di euro
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  code: true,
  name: true,
  description: true,
  category: true,
  price: true,
});

// Product-Article relationship (composition)
export const productArticles = pgTable("product_articles", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  articleId: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
});

export const insertProductArticleSchema = createInsertSchema(productArticles).pick({
  productId: true,
  articleId: true,
  quantity: true,
});

// Orders 
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  code: true,
  notes: true,
  status: true,
  createdBy: true,
});

// Order-Product relationship
export const orderProducts = pgTable("order_products", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  price: integer("price").notNull().default(0),
  totalPrice: integer("total_price").notNull().default(0),
});

export const insertOrderProductSchema = createInsertSchema(orderProducts).pick({
  orderId: true,
  productId: true,
  quantity: true,
  price: true,
  totalPrice: true,
});

// Types for ORM
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductArticle = typeof productArticles.$inferSelect;
export type InsertProductArticle = z.infer<typeof insertProductArticleSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderProduct = typeof orderProducts.$inferSelect;
export type InsertOrderProduct = z.infer<typeof insertOrderProductSchema>;

// Extended types for the application
export type ArticleWithStatus = Article & {
  status: 'available' | 'low' | 'critical' | 'out';
};

export type ProductWithArticles = Product & {
  articles: (ProductArticle & { article: Article })[];
  availability: 'available' | 'limited' | 'unavailable';
};

export type OrderWithProducts = Order & {
  products: (OrderProduct & { product: Product })[];
};

// Note: Parameters table è stata rimossa per evitare errori

export type Parameters = {
  orderValue: number;
};

// Extended schemas for forms
export const loginSchema = z.object({
  email: z.string().email("Email non valido"),
  password: z.string().min(6, "Password deve essere di almeno 6 caratteri"),
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = insertUserSchema.extend({
  email: z.string().email("Email non valido"),
  password: z.string().min(6, "Password deve essere di almeno 6 caratteri"),
  name: z.string().min(2, "Nome deve essere di almeno 2 caratteri"),
  confirmPassword: z.string().min(6, "Conferma password deve essere di almeno 6 caratteri"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

export type RegisterData = z.infer<typeof registerSchema>;

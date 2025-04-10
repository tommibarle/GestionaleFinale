import ConnectPgSimple from "connect-pg-simple";
import session from "express-session";
const PostgresSessionStore = ConnectPgSimple(session);
import { db } from "./db"; // Assuming db is defined elsewhere

interface Parameters {
  orderValue: number;
}

// ... other interfaces and types ...

class DatabaseStorage {
  private sessionStore: PostgresSessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      // ... PostgresSessionStore configuration ...
    });
  }

  // ... other methods ...

  // Parameters methods
  async getParameters(): Promise<Parameters | null> {
    try {
      const [params] = await db.select().from('parameters'); // Assuming table name is 'parameters'
      return params ? { orderValue: params.orderValue } : { orderValue: 10 };
    } catch (error) {
      console.error("Error getting parameters:", error);
      return { orderValue: 10 }; // Default value
    }
  }

  async setParameters(params: Parameters): Promise<void> {
    try {
      // Delete existing parameters first
      await db.delete().from('parameters'); // Assuming table name is 'parameters'
      // Insert new parameters
      await db.insert({
        orderValue: params.orderValue,
        updatedAt: new Date()
      }).into('parameters'); // Assuming table name is 'parameters'
    } catch (error) {
      console.error("Error setting parameters:", error);
      throw error;
    }
  }

  private async enrichOrderWithProducts(order: Order): Promise<OrderWithProducts> {
    // ... existing code ...
  }
  // ... rest of the class ...
}

export default DatabaseStorage;
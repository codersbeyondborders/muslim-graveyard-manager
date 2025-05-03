import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { insertFamilySchema, insertPaymentSchema, familySearchSchema, insertUserSchema, users as usersTable } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();

  // Health check
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Dashboard stats
  apiRouter.get("/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });

  // Recent activity (last 5 payments)
  apiRouter.get("/dashboard/recent-activity", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      
      // Sort by latest payment date
      const sortedPayments = payments
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);
      
      // Fetch family details for each payment
      const activitiesWithFamilies = await Promise.all(
        sortedPayments.map(async (payment) => {
          const family = await storage.getFamily(payment.familyId);
          return {
            payment,
            family
          };
        })
      );
      
      res.json(activitiesWithFamilies);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Error fetching recent activity" });
    }
  });

  // Family endpoints
  apiRouter.get("/families", async (req: Request, res: Response) => {
    try {
      const validation = familySearchSchema.safeParse(req.query);
      
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { query, page, limit } = validation.data;
      const result = await storage.getFamilies(page, limit, query);
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching families:", error);
      res.status(500).json({ message: "Error fetching families" });
    }
  });
  
  apiRouter.get("/families/with-payments", async (req: Request, res: Response) => {
    try {
      const validation = familySearchSchema.safeParse(req.query);
      
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { query, page, limit } = validation.data;
      const result = await storage.getFamiliesWithPayments(page, limit, query);
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching families with payments:", error);
      res.status(500).json({ message: "Error fetching families with payments" });
    }
  });

  apiRouter.get("/families/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid family ID" });
      }
      
      const family = await storage.getFamily(id);
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }
      
      res.json(family);
    } catch (error) {
      console.error("Error fetching family:", error);
      res.status(500).json({ message: "Error fetching family" });
    }
  });

  apiRouter.post("/families", async (req: Request, res: Response) => {
    try {
      const validation = insertFamilySchema.safeParse(req.body);
      
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const newFamily = await storage.createFamily(validation.data);
      res.status(201).json(newFamily);
    } catch (error) {
      console.error("Error creating family:", error);
      res.status(500).json({ message: "Error creating family" });
    }
  });

  apiRouter.put("/families/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid family ID" });
      }
      
      const validation = insertFamilySchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const updatedFamily = await storage.updateFamily(id, validation.data);
      if (!updatedFamily) {
        return res.status(404).json({ message: "Family not found" });
      }
      
      res.json(updatedFamily);
    } catch (error) {
      console.error("Error updating family:", error);
      res.status(500).json({ message: "Error updating family" });
    }
  });

  apiRouter.delete("/families/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid family ID" });
      }
      
      const success = await storage.deleteFamily(id);
      if (!success) {
        return res.status(404).json({ message: "Family not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting family:", error);
      res.status(500).json({ message: "Error deleting family" });
    }
  });

  // Payment endpoints
  apiRouter.get("/payments", async (req: Request, res: Response) => {
    try {
      const familyId = req.query.familyId ? parseInt(req.query.familyId as string) : undefined;
      
      if (req.query.familyId && isNaN(familyId!)) {
        return res.status(400).json({ message: "Invalid family ID" });
      }
      
      const payments = await storage.getPayments(familyId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Error fetching payments" });
    }
  });

  apiRouter.get("/payments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }
      
      const payment = await storage.getPayment(id);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(payment);
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ message: "Error fetching payment" });
    }
  });

  apiRouter.post("/payments", async (req: Request, res: Response) => {
    try {
      const validation = insertPaymentSchema.safeParse(req.body);
      
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Verify the family exists
      const family = await storage.getFamily(validation.data.familyId);
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }
      
      const newPayment = await storage.createPayment(validation.data);
      res.status(201).json(newPayment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Error creating payment" });
    }
  });

  // User endpoints
  apiRouter.post("/users", async (req: Request, res: Response) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        const validationError = fromZodError(validation.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validation.data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Remove confirmPassword before creating user
      const { confirmPassword, ...userData } = validation.data;
      const newUser = await storage.createUser(userData);
      
      // Don't send the password hash back to the client
      const { passwordHash, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error creating user" });
    }
  });
  
  apiRouter.get("/users", async (req: Request, res: Response) => {
    try {
      // Get all users
      // This would be paginated in a real application, but for simplicity, we'll get all users
      const usersList = await db.select({
        id: usersTable.id,
        name: usersTable.name, 
        email: usersTable.email,
        role: usersTable.role,
        status: usersTable.status,
        createdAt: usersTable.createdAt
      }).from(usersTable);
      
      res.json(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  apiRouter.get("/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send the password hash back to the client
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  // Register all API routes with /api prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}

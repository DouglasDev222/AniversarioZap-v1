import { 
  type Employee, 
  type InsertEmployee, 
  type Contact, 
  type InsertContact,
  type Message,
  type InsertMessage,
  type Settings,
  type InsertSettings,
  employees,
  contacts,
  messages,
  settings
} from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Employee operations
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;

  // Contact operations
  getContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<boolean>;

  // Message operations
  getMessages(): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: string, message: Partial<InsertMessage>): Promise<Message | undefined>;
  deleteMessage(id: string): Promise<boolean>;

  // Settings operations
  getSettings(): Promise<Settings | undefined>;
  createOrUpdateSettings(settings: InsertSettings): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private employees: Map<string, Employee>;
  private contacts: Map<string, Contact>;
  private messages: Map<string, Message>;
  private settings: Settings | undefined;

  constructor() {
    this.employees = new Map();
    this.contacts = new Map();
    this.messages = new Map();
    this.initializeDefaults();
  }

  private initializeDefaults() {
    // Initialize default settings
    this.settings = {
      id: randomUUID(),
      reminderTemplate: "🎉 Lembrete: Amanhã é aniversário de [NOME]!\nCargo: [CARGO]\nNão esqueça de parabenizar! 🎂",
      birthdayTemplate: "🎂 Hoje é aniversário de [NOME]!\nCargo: [CARGO]\nParabenize nossa equipe! 🎉🎈",
      reminderTime: "08:00",
      birthdayTime: "09:00",
      weekendsEnabled: true,
      retryAttempts: 2,
      retryInterval: 5,
    };
  }

  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const employee: Employee = { 
      ...insertEmployee, 
      id,
      email: insertEmployee.email || null 
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const existing = this.employees.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...employee };
    this.employees.set(id, updated);
    return updated;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }

  // Contact operations
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  async getContact(id: string): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = randomUUID();
    const contact: Contact = { 
      ...insertContact, 
      id,
      isActive: insertContact.isActive ?? true
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const existing = this.contacts.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...contact };
    this.contacts.set(id, updated);
    return updated;
  }

  async deleteContact(id: string): Promise<boolean> {
    return this.contacts.delete(id);
  }

  // Message operations
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { 
      ...insertMessage, 
      id,
      scheduledFor: insertMessage.scheduledFor || null,
      sentAt: insertMessage.sentAt || null,
      errorMessage: insertMessage.errorMessage || null
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessage(id: string, message: Partial<InsertMessage>): Promise<Message | undefined> {
    const existing = this.messages.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...message };
    this.messages.set(id, updated);
    return updated;
  }

  async deleteMessage(id: string): Promise<boolean> {
    return this.messages.delete(id);
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async createOrUpdateSettings(insertSettings: InsertSettings): Promise<Settings> {
    const id = this.settings?.id || randomUUID();
    this.settings = { 
      ...insertSettings, 
      id,
      reminderTime: insertSettings.reminderTime || "08:00",
      birthdayTime: insertSettings.birthdayTime || "09:00",
      weekendsEnabled: insertSettings.weekendsEnabled ?? true,
      retryAttempts: insertSettings.retryAttempts || 2,
      retryInterval: insertSettings.retryInterval || 5
    };
    return this.settings;
  }
}

// PostgreSQL Database Storage
export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }

  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    return await this.db.select().from(employees);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const result = await this.db.select().from(employees).where(eq(employees.id, id));
    return result[0];
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const newEmployee = { ...employee, id };
    const result = await this.db.insert(employees).values(newEmployee).returning();
    return result[0];
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const result = await this.db.update(employees).set(employee).where(eq(employees.id, id)).returning();
    return result[0];
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await this.db.delete(employees).where(eq(employees.id, id));
    return result.rowCount > 0;
  }

  // Contact operations
  async getContacts(): Promise<Contact[]> {
    return await this.db.select().from(contacts);
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const result = await this.db.select().from(contacts).where(eq(contacts.id, id));
    return result[0];
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const id = randomUUID();
    const newContact = { ...contact, id };
    const result = await this.db.insert(contacts).values(newContact).returning();
    return result[0];
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const result = await this.db.update(contacts).set(contact).where(eq(contacts.id, id)).returning();
    return result[0];
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await this.db.delete(contacts).where(eq(contacts.id, id));
    return result.rowCount > 0;
  }

  // Message operations
  async getMessages(): Promise<Message[]> {
    return await this.db.select().from(messages);
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const result = await this.db.select().from(messages).where(eq(messages.id, id));
    return result[0];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const newMessage = { 
      ...message, 
      id,
      scheduledFor: message.scheduledFor || null,
      sentAt: message.sentAt || null,
      errorMessage: message.errorMessage || null
    };
    const result = await this.db.insert(messages).values(newMessage).returning();
    return result[0];
  }

  async updateMessage(id: string, message: Partial<InsertMessage>): Promise<Message | undefined> {
    const result = await this.db.update(messages).set(message).where(eq(messages.id, id)).returning();
    return result[0];
  }

  async deleteMessage(id: string): Promise<boolean> {
    const result = await this.db.delete(messages).where(eq(messages.id, id));
    return result.rowCount > 0;
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    const result = await this.db.select().from(settings).limit(1);
    return result[0];
  }

  async createOrUpdateSettings(insertSettings: InsertSettings): Promise<Settings> {
    const existing = await this.getSettings();
    
    if (existing) {
      const result = await this.db.update(settings)
        .set({
          ...insertSettings,
          reminderTime: insertSettings.reminderTime || "08:00",
          birthdayTime: insertSettings.birthdayTime || "09:00",
          weekendsEnabled: insertSettings.weekendsEnabled ?? true,
          retryAttempts: insertSettings.retryAttempts || 2,
          retryInterval: insertSettings.retryInterval || 5
        })
        .where(eq(settings.id, existing.id))
        .returning();
      return result[0];
    } else {
      const id = randomUUID();
      const newSettings = { 
        ...insertSettings, 
        id,
        reminderTime: insertSettings.reminderTime || "08:00",
        birthdayTime: insertSettings.birthdayTime || "09:00",
        weekendsEnabled: insertSettings.weekendsEnabled ?? true,
        retryAttempts: insertSettings.retryAttempts || 2,
        retryInterval: insertSettings.retryInterval || 5
      };
      const result = await this.db.insert(settings).values(newSettings).returning();
      return result[0];
    }
  }
}

// Initialize storage with fallback
async function initializeStorage(): Promise<IStorage> {
  try {
    const dbStorage = new DatabaseStorage();
    // Test the connection
    await dbStorage.getSettings();
    console.log('✅ Conectado ao PostgreSQL (Supabase)');
    return dbStorage;
  } catch (error: any) {
    console.log('⚠️ Falha na conexão PostgreSQL, usando armazenamento em memória');
    console.log('Erro:', error.message || error);
    return new MemStorage();
  }
}

// Initialize storage asynchronously
let storage: IStorage;
const storagePromise = initializeStorage().then((s) => {
  storage = s;
  return s;
});

export { storage, storagePromise };

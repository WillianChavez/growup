import { z } from 'zod';

const MAX_IMPORT_ITEMS_PER_COLLECTION = 5000;
const MAX_IMPORT_VERSION_LENGTH = 20;

const dateStringSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Fecha inválida en archivo de importación',
});

const optionalStringSchema = z.string().nullable().optional();
const moneyNumberSchema = z
  .number()
  .finite()
  .refine((value) => Number.isInteger(value * 100), {
    message: 'Los montos deben tener máximo 2 decimales',
  });

const habitCategorySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).max(120),
    emoji: z.string().min(1).max(16),
    color: z.string().min(1).max(32),
  })
  .strict();

const habitSchema = z
  .object({
    id: z.string().min(1),
    categoryId: z.string().min(1),
    title: z.string().min(1).max(180),
    description: optionalStringSchema,
    emoji: z.string().min(1).max(16),
    isActive: z.boolean(),
    isArchived: z.boolean(),
  })
  .strict();

const habitEntrySchema = z
  .object({
    habitId: z.string().min(1),
    date: dateStringSchema,
    completed: z.boolean(),
    notes: optionalStringSchema,
    completedAt: dateStringSchema.nullable().optional(),
  })
  .strict();

const bookSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).max(300),
    author: z.string().min(1).max(220),
    pages: z.number().int().min(0),
    currentPage: z.number().int().min(0),
    status: z.string().min(1).max(40),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    review: optionalStringSchema,
    notes: optionalStringSchema,
    isbn: optionalStringSchema,
    coverUrl: optionalStringSchema,
    genre: optionalStringSchema,
    startDate: dateStringSchema.nullable().optional(),
    endDate: dateStringSchema.nullable().optional(),
    tags: z.array(z.string().min(1).max(100)).nullable().optional(),
  })
  .strict();

const bookQuoteSchema = z
  .object({
    bookId: z.string().min(1),
    quote: z.string().min(1),
    pageNumber: z.number().int().min(0).nullable().optional(),
    isFavorite: z.boolean().optional(),
  })
  .strict();

const transactionCategorySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).max(120),
    emoji: z.string().min(1).max(16),
    type: z.string().min(1).max(30),
    color: z.string().min(1).max(32),
  })
  .strict();

const transactionSchema = z
  .object({
    categoryId: z.string().min(1).nullable().optional(),
    amount: moneyNumberSchema,
    description: z.string().min(1).max(500),
    type: z.string().min(1).max(30),
    date: dateStringSchema,
    notes: optionalStringSchema,
    isRecurring: z.boolean().optional(),
    recurringFrequency: optionalStringSchema,
    tags: z.array(z.string().min(1).max(100)).nullable().optional(),
  })
  .strict();

const goalSchema = z
  .object({
    title: z.string().min(1).max(220),
    description: optionalStringSchema,
    category: optionalStringSchema,
    priority: optionalStringSchema,
    targetDate: dateStringSchema.nullable().optional(),
    status: z.string().min(1).max(60),
    progress: z.number().int().min(0).max(100),
    milestones: z
      .array(
        z
          .object({
            id: z.string().min(1).optional(),
            title: z.string().min(1).max(300),
            completed: z.boolean(),
            status: z.string().min(1).max(60).optional(),
            startDate: dateStringSchema.nullable().optional(),
            targetDate: dateStringSchema.nullable().optional(),
            completedAt: dateStringSchema.nullable().optional(),
          })
          .strict()
      )
      .optional(),
    completedAt: dateStringSchema.nullable().optional(),
  })
  .strict();

const incomeSourceSchema = z
  .object({
    name: z.string().min(1).max(180),
    amount: moneyNumberSchema,
    frequency: z.string().min(1).max(40),
    category: z.string().min(1).max(60),
    isPrimary: z.boolean(),
    description: optionalStringSchema,
    isActive: z.boolean(),
    startDate: dateStringSchema,
    endDate: dateStringSchema.nullable().optional(),
  })
  .strict();

const recurringExpenseSchema = z
  .object({
    name: z.string().min(1).max(180),
    amount: moneyNumberSchema,
    frequency: z.string().min(1).max(40),
    category: z.string().min(1).max(60),
    dueDay: z.number().int().min(1).max(31).nullable().optional(),
    description: optionalStringSchema,
    isActive: z.boolean(),
    isEssential: z.boolean(),
    startDate: dateStringSchema,
    endDate: dateStringSchema.nullable().optional(),
    lastPaid: dateStringSchema.nullable().optional(),
  })
  .strict();

const assetSchema = z
  .object({
    name: z.string().min(1).max(180),
    value: moneyNumberSchema,
    type: z.string().min(1).max(40),
    category: z.string().min(1).max(60),
    description: optionalStringSchema,
    isActive: z.boolean(),
    purchaseDate: dateStringSchema.nullable().optional(),
  })
  .strict();

const debtSchema = z
  .object({
    creditor: z.string().min(1).max(220),
    totalAmount: moneyNumberSchema,
    remainingAmount: moneyNumberSchema,
    monthlyPayment: moneyNumberSchema,
    annualRate: z.number().finite(),
    type: z.string().min(1).max(40),
    description: optionalStringSchema,
    status: z.string().min(1).max(40),
    startDate: dateStringSchema,
    endDate: dateStringSchema.nullable().optional(),
    paidDate: dateStringSchema.nullable().optional(),
  })
  .strict();

const importDataSchema = z
  .object({
    habits: z.array(habitSchema).max(MAX_IMPORT_ITEMS_PER_COLLECTION).optional(),
    habitCategories: z.array(habitCategorySchema).max(MAX_IMPORT_ITEMS_PER_COLLECTION).optional(),
    habitEntries: z.array(habitEntrySchema).max(MAX_IMPORT_ITEMS_PER_COLLECTION).optional(),
    books: z.array(bookSchema).max(MAX_IMPORT_ITEMS_PER_COLLECTION).optional(),
    bookQuotes: z.array(bookQuoteSchema).max(MAX_IMPORT_ITEMS_PER_COLLECTION).optional(),
    transactions: z.array(transactionSchema).max(MAX_IMPORT_ITEMS_PER_COLLECTION).optional(),
    transactionCategories: z
      .array(transactionCategorySchema)
      .max(MAX_IMPORT_ITEMS_PER_COLLECTION)
      .optional(),
    goals: z.array(goalSchema).max(MAX_IMPORT_ITEMS_PER_COLLECTION).optional(),
    incomeSources: z.array(incomeSourceSchema).max(MAX_IMPORT_ITEMS_PER_COLLECTION).optional(),
    recurringExpenses: z
      .array(recurringExpenseSchema)
      .max(MAX_IMPORT_ITEMS_PER_COLLECTION)
      .optional(),
    assets: z.array(assetSchema).max(MAX_IMPORT_ITEMS_PER_COLLECTION).optional(),
    debts: z.array(debtSchema).max(MAX_IMPORT_ITEMS_PER_COLLECTION).optional(),
  })
  .strict();

export const importPayloadSchema = z
  .object({
    version: z.string().min(1).max(MAX_IMPORT_VERSION_LENGTH),
    exportDate: z.string().optional(),
    userId: z.string().optional(),
    data: importDataSchema,
  })
  .strict();

export type ImportPayload = z.infer<typeof importPayloadSchema>;

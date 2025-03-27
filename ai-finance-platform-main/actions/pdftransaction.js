"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function scanPdf(file) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert File to Base64
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this bank statement PDF and extract all transactions into an array of objects.
      Each transaction should have the following properties:
      - amount: number (positive for income, negative for expenses)
      - date: ISO 8601 date string (YYYY-MM-DD)
      - description: string (transaction details)
      - merchantName: string (if available)
      - category: one of (housing, transportation, groceries, utilities, entertainment, food, shopping, healthcare, education, personal, travel, insurance, gifts, bills, other-expense)

      Important:
      1. Respond ONLY with a valid JSON array
      2. Ensure all dates are in YYYY-MM-DD format
      3. Make amounts negative for expenses, positive for income
      4. Categorize transactions appropriately
      5. Include all transaction details in the description
      6.if its positive then type is INCOME and category one of (Salary, Investments,Freelance,Rental,Business,Other Income)

      Example format:
      [
        {
          "amount": -1000,
          "type": "EXPENSE",  depends on amount if amount is negative then type is EXPENSE else INCOME 
          "date": "2024-03-15",
          "description": "Payment to XYZ Store",
          "merchantName": "XYZ Store",
          "category": "shopping"
        }
      ]
    `;

    // Generate response from Gemini
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);
        
    const response = await result.response;
    const text = response.text();

    // Clean and parse the response
    const cleanedText = text
      .replace(/```json/g, '')  // Remove markdown code block
      .replace(/```/g, '')      // Remove closing markdown
      .replace(/json/g, '')     // Remove any 'json' text
      .trim();                  // Remove extra whitespace

    let transactions;
    try {
      transactions = JSON.parse(cleanedText);
    } catch (error) {
      console.error("Failed to parse Gemini response:", cleanedText);
      throw new Error("Invalid response format from Gemini AI. Please try again.");
    }

    // Validate transactions
    if (!Array.isArray(transactions)) {
      throw new Error("Response is not an array of transactions");
    }

    if (transactions.length === 0) {
      throw new Error("No transactions found in the statement");
    }

    // Validate each transaction
    const validTransactions = transactions.filter(t => {
      return (
        typeof t.amount === 'number' &&
        typeof t.date === 'string' &&
        typeof t.description === 'string' &&
        typeof t.category === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(t.date) // Validate date format
      );
    });

    if (validTransactions.length === 0) {
      throw new Error("No valid transactions found in the statement");
    }

    // Authenticate user
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Fetch user from DB
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Fetch user's default account
    const defaultAccount = await db.account.findFirst({
      where: { userId: user.id, isDefault: true },
    });

    if (!defaultAccount) throw new Error("No default account found");

    // Prepare transactions for batch insert
    const transactionData = validTransactions.map((t) => ({
      type: t.amount >= 0 ? "INCOME" : "EXPENSE",
      amount: Math.abs(t.amount), // Store absolute value
      description: t.description,
      date: new Date(t.date).toISOString(),
      category: t.category,
      isRecurring: false,
      nextRecurringDate: null,
      status: "COMPLETED",
      userId: user.id,
      accountId: defaultAccount.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Insert transactions
    const createdTransactions = await db.transaction.createMany({
      data: transactionData,
    });

    return {
      success: true,
      message: `Successfully imported ${createdTransactions.count} transactions`,
      count: createdTransactions.count
    };

  } catch (error) {
    console.error("Error scanning PDF:", error);
    return {
      success: false,
      error: error.message || "Failed to scan PDF. Please try again."
    };
  }
}
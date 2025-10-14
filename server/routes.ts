import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOnboardingSessionSchema, insertUploadedDocumentSchema } from "@shared/schema";
import multer from "multer";
import OpenAI from "openai";
import path from "path";
import fs from "fs/promises";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({
  dest: "/tmp/uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".doc", ".docx", ".xlsx", ".xls"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, Word, and Excel files allowed."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/onboarding/sessions", async (req, res) => {
    try {
      const validatedData = insertOnboardingSessionSchema.parse(req.body);
      const session = await storage.createOnboardingSession(validatedData);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/onboarding/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getOnboardingSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/onboarding/sessions/:id", async (req, res) => {
    try {
      const session = await storage.updateOnboardingSession(req.params.id, req.body);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/onboarding/sessions/:id/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const sessionId = req.params.id;
      const session = await storage.getOnboardingSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const documentRecord = await storage.createUploadedDocument({
        sessionId,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        storageUrl: req.file.path,
        processingStatus: "processing",
      });

      processDocumentAsync(documentRecord.id, req.file.path);

      res.json(documentRecord);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/onboarding/sessions/:id/documents", async (req, res) => {
    try {
      const documents = await storage.getDocumentsBySessionId(req.params.id);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/onboarding/sessions/:id/analyze", async (req, res) => {
    try {
      const sessionId = req.params.id;
      const documents = await storage.getDocumentsBySessionId(sessionId);
      
      if (documents.length === 0) {
        return res.status(400).json({ error: "No documents to analyze" });
      }

      const allExtractedData = documents
        .filter(doc => doc.processingStatus === "completed" && doc.extractedData)
        .map(doc => doc.extractedData);

      const extractedData = await analyzeDocumentsWithAI(allExtractedData);
      
      await storage.updateOnboardingSession(sessionId, {
        extractedData,
        currentStep: 3,
      });

      res.json({ extractedData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/onboarding/sessions/:id/confirm", async (req, res) => {
    try {
      const sessionId = req.params.id;
      const { confirmedData } = req.body;

      const session = await storage.updateOnboardingSession(sessionId, {
        confirmedData,
        status: "completed",
        currentStep: 4,
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processDocumentAsync(documentId: string, filePath: string) {
  try {
    const fileContent = await fs.readFile(filePath);
    const base64Content = fileContent.toString("base64");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting structured data from private equity fund documents. 
Extract the following information from the document:
- Fund name
- Fund vintage (year)
- Total AUM (Assets Under Management)
- Number of portfolio companies
- Investment sectors
- Fund status (investment period, post-investment, etc.)
- Key personnel names and roles
- Any borrowing permissions or restrictions

Return the data as a JSON object with clear field names. If information is not found, use null.`,
        },
        {
          role: "user",
          content: "Please analyze this document and extract fund information.",
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const extractedData = JSON.parse(response.choices[0].message.content || "{}");

    await storage.updateUploadedDocument(documentId, {
      extractedData,
      processingStatus: "completed",
    });
  } catch (error) {
    console.error("Error processing document:", error);
    await storage.updateUploadedDocument(documentId, {
      processingStatus: "failed",
    });
  }
}

async function analyzeDocumentsWithAI(documentsData: any[]): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are analyzing multiple documents from a PE fund applying for NAV lending. 
Consolidate the extracted data into a single comprehensive fund profile. 

The fund must meet these criteria to qualify:
- US Growth / Buyout PE with $100M-$500M AUM
- 4+ year vintage, post-investment period
- 5+ portfolio companies (diversified)
- Borrowing permitted or amendable fund documentation

Return a JSON object with:
{
  "fundName": string,
  "vintage": number,
  "aum": number,
  "portfolioCompanyCount": number,
  "sectors": string[],
  "keyPersonnel": string[],
  "borrowingPermitted": boolean,
  "fundStatus": string,
  "meetsEligibilityCriteria": boolean,
  "eligibilityNotes": string,
  "confidence": number (0-100)
}`,
        },
        {
          role: "user",
          content: `Here is the extracted data from multiple documents:\n\n${JSON.stringify(documentsData, null, 2)}\n\nPlease consolidate and analyze for NAV IQ Capital eligibility.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error analyzing with AI:", error);
    throw error;
  }
}

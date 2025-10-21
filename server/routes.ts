import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertOnboardingSessionSchema, 
  insertUploadedDocumentSchema,
  insertAdvisorSchema,
  insertAdvisorDealSchema,
  insertLenderInvitationSchema,
  insertTermSheetSchema
} from "@shared/schema";
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
      const session = await storage.getOnboardingSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const extractedData = {
        fundName: session.fundName,
        vintage: null,
        aum: null,
        portfolioCompanyCount: null,
        sectors: [],
        fundStatus: null,
        keyPersonnel: [],
        borrowingPermitted: false,
        meetsEligibilityCriteria: false,
        eligibilityNotes: "Please enter your fund information below for review.",
        confidence: 0,
      };
      
      await storage.updateOnboardingSession(sessionId, {
        extractedData,
        currentStep: 3,
      });

      res.json({ extractedData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/prospects", async (req, res) => {
    try {
      const prospects = await storage.listProspects();
      res.json(prospects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/deals", async (req, res) => {
    try {
      const deals = await storage.listDeals();
      res.json(deals);
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

      const data = confirmedData || {};
      
      const aum = typeof data.aum === 'string' 
        ? parseInt(data.aum.replace(/[^0-9]/g, '')) 
        : typeof data.aum === 'number' ? data.aum : 0;
      
      const vintage = typeof data.vintage === 'string'
        ? parseInt(data.vintage)
        : typeof data.vintage === 'number' ? data.vintage : null;
      
      const portfolioCount = typeof data.portfolioCompanyCount === 'string'
        ? parseInt(data.portfolioCompanyCount)
        : typeof data.portfolioCompanyCount === 'number' ? data.portfolioCompanyCount : 0;
      
      const borrowingPermitted = data.borrowingPermitted === true || 
        data.borrowingPermitted === 'true' || 
        data.borrowingPermitted === 1;
      
      let eligibilityStatus = "needs-review";
      let eligibilityNotes = "";
      const scoreFactors: string[] = [];
      
      if (aum >= 100_000_000 && aum <= 500_000_000) {
        scoreFactors.push("AUM in target range ($100M-$500M)");
      } else if (aum) {
        eligibilityNotes += `AUM ${aum < 100_000_000 ? 'below' : 'above'} target range. `;
      }
      
      if (vintage && vintage <= 2021) {
        scoreFactors.push("4+ year vintage (mature fund)");
      } else if (vintage) {
        eligibilityNotes += "Fund vintage too recent. ";
      }
      
      if (portfolioCount && portfolioCount >= 5) {
        scoreFactors.push("Diversified portfolio (5+ companies)");
      } else if (portfolioCount) {
        eligibilityNotes += "Portfolio not sufficiently diversified. ";
      }
      
      if (borrowingPermitted) {
        scoreFactors.push("Borrowing permitted in LPA");
      } else {
        eligibilityNotes += "Borrowing may require LP consent. ";
      }
      
      const meetsAllCriteria = scoreFactors.length === 4;
      if (meetsAllCriteria) {
        eligibilityStatus = "eligible";
        eligibilityNotes = scoreFactors.join("; ");
      }
      
      const loanNeedScore = (portfolioCount && portfolioCount >= 5) ? 8 : 5;
      const borrowerQualityScore = meetsAllCriteria ? 9 : 6;
      const engagementScore = 7;
      const overallScore = Math.round((loanNeedScore + borrowerQualityScore + engagementScore) / 3);
      
      let recommendation: "high-priority" | "medium-priority" | "low-priority" | "monitor" = "medium-priority";
      if (meetsAllCriteria && overallScore >= 8) {
        recommendation = "high-priority";
      } else if (!meetsAllCriteria || overallScore < 6) {
        recommendation = "low-priority";
      }

      const prospect = await storage.createProspect({
        onboardingSessionId: sessionId,
        fundName: session.fundName,
        fundSize: aum || null,
        vintage: vintage || null,
        portfolioCount: portfolioCount || null,
        sectors: data.sectors || null,
        stage: data.fundStatus || null,
        loanNeedScore,
        borrowerQualityScore,
        engagementScore,
        overallScore,
        recommendation,
        contactName: session.contactName,
        contactEmail: session.contactEmail,
        contactPhone: session.contactPhone || null,
        eligibilityStatus,
        eligibilityNotes: eligibilityNotes || scoreFactors.join("; "),
        source: "gp-onboarding",
      });

      res.json({ session, prospect });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/advisors", async (req, res) => {
    try {
      const validatedData = insertAdvisorSchema.parse(req.body);
      const advisor = await storage.createAdvisor(validatedData);
      res.json(advisor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/advisors", async (req, res) => {
    try {
      const advisors = await storage.listAdvisors();
      res.json(advisors);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/advisors/:id", async (req, res) => {
    try {
      const advisor = await storage.getAdvisor(req.params.id);
      if (!advisor) {
        return res.status(404).json({ error: "Advisor not found" });
      }
      res.json(advisor);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/advisors/:id", async (req, res) => {
    try {
      const advisor = await storage.updateAdvisor(req.params.id, req.body);
      if (!advisor) {
        return res.status(404).json({ error: "Advisor not found" });
      }
      res.json(advisor);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/advisor-deals", async (req, res) => {
    try {
      // Convert submissionDeadline string to Date if present
      const data = {
        ...req.body,
        submissionDeadline: req.body.submissionDeadline 
          ? new Date(req.body.submissionDeadline) 
          : null
      };
      const validatedData = insertAdvisorDealSchema.parse(data);
      const deal = await storage.createAdvisorDeal(validatedData);
      res.json(deal);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/advisor-deals", async (req, res) => {
    try {
      const advisorId = req.query.advisorId as string | undefined;
      const deals = await storage.listAdvisorDeals(advisorId);
      res.json(deals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/advisor-deals/:id", async (req, res) => {
    try {
      const deal = await storage.getAdvisorDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ error: "Advisor deal not found" });
      }
      res.json(deal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/advisor-deals/:id", async (req, res) => {
    try {
      const deal = await storage.updateAdvisorDeal(req.params.id, req.body);
      if (!deal) {
        return res.status(404).json({ error: "Advisor deal not found" });
      }
      res.json(deal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/lender-invitations", async (req, res) => {
    try {
      const validatedData = insertLenderInvitationSchema.parse(req.body);
      const invitation = await storage.createLenderInvitation(validatedData);
      res.json(invitation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/lender-invitations", async (req, res) => {
    try {
      const advisorDealId = req.query.advisorDealId as string;
      if (!advisorDealId) {
        return res.status(400).json({ error: "advisorDealId query parameter required" });
      }
      const invitations = await storage.getLenderInvitationsByDeal(advisorDealId);
      res.json(invitations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/lender-invitations/:id", async (req, res) => {
    try {
      const invitation = await storage.updateLenderInvitation(req.params.id, req.body);
      if (!invitation) {
        return res.status(404).json({ error: "Lender invitation not found" });
      }
      res.json(invitation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/term-sheets", async (req, res) => {
    try {
      const validatedData = insertTermSheetSchema.parse(req.body);
      const termSheet = await storage.createTermSheet(validatedData);
      res.json(termSheet);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/term-sheets", async (req, res) => {
    try {
      const advisorDealId = req.query.advisorDealId as string;
      if (!advisorDealId) {
        return res.status(400).json({ error: "advisorDealId query parameter required" });
      }
      const termSheets = await storage.getTermSheetsByDeal(advisorDealId);
      res.json(termSheets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/term-sheets/:id", async (req, res) => {
    try {
      const termSheet = await storage.updateTermSheet(req.params.id, req.body);
      if (!termSheet) {
        return res.status(404).json({ error: "Term sheet not found" });
      }
      res.json(termSheet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processDocumentAsync(documentId: string, filePath: string) {
  try {
    const document = await storage.getUploadedDocument(documentId);
    
    if (!document) {
      throw new Error("Document not found");
    }

    await storage.updateUploadedDocument(documentId, {
      extractedData: {
        fundName: null,
        vintage: null,
        aum: null,
        portfolioCompanyCount: null,
        sectors: [],
        fundStatus: null,
        keyPersonnel: [],
        borrowingPermitted: false,
        note: `Document uploaded: ${document.fileName}. Please enter fund information manually in the review step.`,
      },
      processingStatus: "completed",
    });
  } catch (error) {
    console.error("Error processing document:", error);
    await storage.updateUploadedDocument(documentId, {
      processingStatus: "failed",
      extractedData: {
        error: "Failed to process document.",
      },
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
          content: `You are analyzing multiple documents from a PE fund applying for NAV IQ Capital lending. 
Consolidate the extracted data into a single comprehensive fund profile. 

NAV IQ Capital eligibility criteria:
- US Growth / Buyout PE with $100M-$500M AUM
- 4+ year vintage (founded in 2021 or earlier)
- Post-investment period preferred
- 5+ portfolio companies (diversified)
- Borrowing permitted or amendable fund documentation

Return a JSON object with these exact fields:
{
  "fundName": string (best match from documents),
  "vintage": number (fund formation year),
  "aum": number (in millions, numeric value only),
  "portfolioCompanyCount": number,
  "sectors": string[] (array of investment sectors),
  "keyPersonnel": string[] (names with roles),
  "borrowingPermitted": boolean,
  "fundStatus": string (e.g., "Post-investment period", "Actively investing"),
  "meetsEligibilityCriteria": boolean (true if meets ALL criteria above),
  "eligibilityNotes": string (explain why eligible or not, reference specific criteria),
  "confidence": number (0-100, how confident you are in the data quality)
}

Be conservative with eligibility - only mark as eligible if criteria are clearly met.`,
        },
        {
          role: "user",
          content: `Here is the extracted data from ${documentsData.length} document(s):\n\n${JSON.stringify(documentsData, null, 2)}\n\nPlease consolidate and analyze for NAV IQ Capital eligibility. Current year is 2025.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      fundName: result.fundName || "Not provided",
      vintage: result.vintage || null,
      aum: result.aum || null,
      portfolioCompanyCount: result.portfolioCompanyCount || null,
      sectors: Array.isArray(result.sectors) ? result.sectors : [],
      keyPersonnel: Array.isArray(result.keyPersonnel) ? result.keyPersonnel : [],
      borrowingPermitted: result.borrowingPermitted || false,
      fundStatus: result.fundStatus || "Unknown",
      meetsEligibilityCriteria: result.meetsEligibilityCriteria || false,
      eligibilityNotes: result.eligibilityNotes || "Insufficient data for assessment",
      confidence: result.confidence || 0,
    };
  } catch (error) {
    console.error("Error analyzing with AI:", error);
    throw error;
  }
}

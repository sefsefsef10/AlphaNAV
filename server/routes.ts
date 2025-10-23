import type { Express } from "express";
import { createServer, type Server } from "http";
import { DatabaseStorage } from "./dbStorage";

const storage = new DatabaseStorage();
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertOnboardingSessionSchema, 
  insertUploadedDocumentSchema,
  insertAdvisorSchema,
  insertAdvisorDealSchema,
  insertLenderInvitationSchema,
  insertTermSheetSchema,
  insertMessageSchema
} from "@shared/schema";
import {
  createNotification,
  notifyDealStatusChange,
  notifyTermSheetReceived,
  notifyLenderResponse,
  notifyProspectEligibility,
} from "./notificationUtils";
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
  // Setup authentication
  await setupAuth(app);

  // Auth endpoints
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/auth/user/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      
      if (!['advisor', 'gp', 'operations', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updated = await storage.upsertUser({
        ...user,
        role,
      });
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Onboarding endpoints (public for GP self-service)
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

      // WORKFLOW CONNECTION: Notify operations team about new prospect
      if (meetsAllCriteria) {
        await createNotification({
          userId: "operations-team",
          title: "High-Priority Prospect",
          message: `${session.fundName} completed onboarding - ${scoreFactors.join("; ")}`,
          type: "success",
          priority: "high",
          actionUrl: `/prospects/${prospect.id}`,
        });
      }

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
      const advisorDeal = await storage.createAdvisorDeal(validatedData);

      // WORKFLOW CONNECTION: Create corresponding Deal in operations pipeline (background)
      storage.createDeal({
        fundName: advisorDeal.fundName,
        fundSize: advisorDeal.fundSize,
        loanAmount: advisorDeal.loanAmount,
        vintage: null,
        stage: "rfp",
        status: "pending",
        assignedTo: null,
        nextSteps: "Awaiting lender responses",
        lastContactDate: new Date(),
        tags: ["advisor-sourced"],
        advisorDealId: advisorDeal.id,
      }).catch(err => console.error("Error creating operations deal:", err));

      // WORKFLOW CONNECTION: Notify advisor that deal was submitted
      if (advisorDeal.advisorId) {
        const advisor = await storage.getAdvisor(advisorDeal.advisorId);
        if (advisor && advisor.userId) {
          await createNotification({
            userId: advisor.userId,
            title: "Deal Submitted Successfully",
            message: `RFP for ${advisorDeal.fundName} has been created`,
            type: "success",
            priority: "medium",
            actionUrl: `/advisor/active-rfps`,
          });
        }
      }

      // Return only advisorDeal to maintain API compatibility
      res.json(advisorDeal);
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
      const oldDeal = await storage.getAdvisorDeal(req.params.id);
      if (!oldDeal) {
        return res.status(404).json({ error: "Advisor deal not found" });
      }

      const updatedDeal = await storage.updateAdvisorDeal(req.params.id, req.body);
      if (!updatedDeal) {
        return res.status(404).json({ error: "Advisor deal not found" });
      }

      // WORKFLOW CONNECTION: Notify advisor of status changes
      if (req.body.status && req.body.status !== oldDeal.status) {
        if (updatedDeal.advisorId) {
          const advisor = await storage.getAdvisor(updatedDeal.advisorId);
          if (advisor && advisor.userId) {
            await notifyDealStatusChange(
              advisor.userId,
              updatedDeal.id,
              updatedDeal.fundName,
              oldDeal.status,
              updatedDeal.status
            );
          }
        }
      }

      res.json(updatedDeal);
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
      const oldInvitation = await storage.getLenderInvitation(req.params.id);
      if (!oldInvitation) {
        return res.status(404).json({ error: "Lender invitation not found" });
      }

      const invitation = await storage.updateLenderInvitation(req.params.id, req.body);
      if (!invitation) {
        return res.status(404).json({ error: "Lender invitation not found" });
      }

      // WORKFLOW CONNECTION: Notify advisor when lender responds
      if (req.body.status && req.body.status !== oldInvitation.status && req.body.status !== "pending") {
        const advisorDeal = await storage.getAdvisorDeal(invitation.advisorDealId);
        if (advisorDeal && advisorDeal.advisorId) {
          const advisor = await storage.getAdvisor(advisorDeal.advisorId);
          if (advisor && advisor.userId) {
            await notifyLenderResponse(
              advisor.userId,
              advisorDeal.id,
              advisorDeal.fundName,
              invitation.lenderName,
              invitation.status
            );
          }
        }
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

      // WORKFLOW CONNECTION: Notify advisor when term sheet is submitted
      const advisorDeal = await storage.getAdvisorDeal(termSheet.advisorDealId);
      if (advisorDeal && advisorDeal.advisorId) {
        const advisor = await storage.getAdvisor(advisorDeal.advisorId);
        if (advisor && advisor.userId) {
          await notifyTermSheetReceived(
            advisor.userId,
            advisorDeal.id,
            advisorDeal.fundName,
            termSheet.lenderName
          );
        }
      }

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

  // Facilities endpoints (requires authentication for GPs to view their facilities)
  app.get("/api/facilities", async (req, res) => {
    try {
      const facilities = await storage.listFacilities();
      res.json(facilities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/facilities/:id", async (req, res) => {
    try {
      const facility = await storage.getFacility(req.params.id);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }
      res.json(facility);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Draw Requests endpoints
  app.get("/api/draw-requests", async (req, res) => {
    try {
      const facilityId = req.query.facilityId as string | undefined;
      if (facilityId) {
        const drawRequests = await storage.getDrawRequestsByFacility(facilityId);
        res.json(drawRequests);
      } else {
        const drawRequests = await storage.listDrawRequests();
        res.json(drawRequests);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/draw-requests", async (req, res) => {
    try {
      const drawRequest = await storage.createDrawRequest(req.body);
      
      // WORKFLOW CONNECTION: Notify operations team of new draw request
      await createNotification({
        userId: "operations-team", // TODO: Get actual operations team IDs
        type: "draw_request",
        title: "New Draw Request",
        message: `Draw request for $${(req.body.requestedAmount / 1000000).toFixed(1)}M submitted`,
        relatedEntityType: "draw_request",
        relatedEntityId: drawRequest.id,
        priority: "medium",
      });
      
      res.json(drawRequest);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/draw-requests/:id", async (req, res) => {
    try {
      const drawRequest = await storage.getDrawRequest(req.params.id);
      if (!drawRequest) {
        return res.status(404).json({ error: "Draw request not found" });
      }
      res.json(drawRequest);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/draw-requests/:id", async (req, res) => {
    try {
      const oldDrawRequest = await storage.getDrawRequest(req.params.id);
      if (!oldDrawRequest) {
        return res.status(404).json({ error: "Draw request not found" });
      }

      const drawRequest = await storage.updateDrawRequest(req.params.id, req.body);
      
      // WORKFLOW CONNECTION: Notify GP of status changes
      if (req.body.status && req.body.status !== oldDrawRequest.status) {
        let title = "Draw Request Updated";
        let message = `Your draw request status changed to ${req.body.status}`;
        
        if (req.body.status === "approved") {
          title = "Draw Request Approved";
          message = `Your draw request for $${(oldDrawRequest.requestedAmount / 1000000).toFixed(1)}M has been approved`;
        } else if (req.body.status === "rejected") {
          title = "Draw Request Rejected";
          message = `Your draw request for $${(oldDrawRequest.requestedAmount / 1000000).toFixed(1)}M has been rejected`;
        } else if (req.body.status === "disbursed") {
          title = "Funds Disbursed";
          message = `$${(oldDrawRequest.requestedAmount / 1000000).toFixed(1)}M has been disbursed to your account`;
        }
        
        await createNotification({
          userId: oldDrawRequest.requestedBy, // TODO: Get actual GP user ID
          type: "draw_request",
          title,
          message,
          relatedEntityType: "draw_request",
          relatedEntityId: drawRequest.id,
          priority: req.body.status === "approved" || req.body.status === "disbursed" ? "high" : "medium",
        });
      }
      
      res.json(drawRequest);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cash Flows endpoints
  app.get("/api/cash-flows", async (req, res) => {
    try {
      const facilityId = req.query.facilityId as string | undefined;
      if (facilityId) {
        const cashFlows = await storage.getCashFlowsByFacility(facilityId);
        res.json(cashFlows);
      } else {
        const cashFlows = await storage.listCashFlows();
        res.json(cashFlows);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/cash-flows", async (req, res) => {
    try {
      const cashFlow = await storage.createCashFlow(req.body);
      res.json(cashFlow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/cash-flows/:id", async (req, res) => {
    try {
      const cashFlow = await storage.updateCashFlow(req.params.id, req.body);
      if (!cashFlow) {
        return res.status(404).json({ error: "Cash flow not found" });
      }
      res.json(cashFlow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Messages endpoints
  app.get("/api/messages", async (req, res) => {
    try {
      const threadId = req.query.threadId as string | undefined;
      if (threadId) {
        const messages = await storage.getMessagesByThread(threadId);
        res.json(messages);
      } else {
        const messages = await storage.listMessages();
        res.json(messages);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      // Validate message data using Zod schema
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      
      // WORKFLOW CONNECTION: Notify recipient of new message
      await createNotification({
        userId: validatedData.recipientId,
        type: "message",
        title: "New Message",
        message: `New message from ${validatedData.senderRole}: ${validatedData.subject || "New message"}`,
        relatedEntityType: "message",
        relatedEntityId: message.id,
        priority: "medium",
      });
      
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/messages/:id/read", async (req, res) => {
    try {
      const message = await storage.markMessageAsRead(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Facility documents endpoint
  app.get("/api/facilities/:facilityId/documents", async (req, res) => {
    try {
      const documents = await storage.getDocumentsByFacility(req.params.facilityId);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload facility document
  app.post("/api/upload-facility-document", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const facilityId = req.body.facilityId;
      if (!facilityId) {
        return res.status(400).json({ error: "Facility ID required" });
      }

      const storageUrl = `/uploads/${req.file.filename}`;
      const document = await storage.createUploadedDocument({
        facilityId,
        sessionId: null,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        storageUrl,
        extractedData: null,
        processingStatus: "completed",
      });

      res.json(document);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/uploaded-documents/:id", async (req, res) => {
    try {
      await storage.deleteUploadedDocument(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Notifications endpoints (requires authentication)
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Notification Preferences endpoints
  app.get("/api/user/notification-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getNotificationPreferences(userId);
      if (!preferences) {
        // Return default preferences if none exist
        return res.json({
          emailNotifications: true,
          pushNotifications: true,
          dealUpdates: true,
          underwritingAlerts: true,
          portfolioAlerts: true,
          systemAnnouncements: true,
          weeklyDigest: false,
          instantAlerts: true,
        });
      }
      res.json(preferences);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/user/notification-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Validate request body to ensure only valid booleans
      const validPreferences: any = {};
      const allowedFields = [
        'emailNotifications',
        'pushNotifications',
        'dealUpdates',
        'underwritingAlerts',
        'portfolioAlerts',
        'systemAnnouncements',
        'weeklyDigest',
        'instantAlerts'
      ];
      
      for (const field of allowedFields) {
        if (field in req.body && typeof req.body[field] === 'boolean') {
          validPreferences[field] = req.body[field];
        }
      }
      
      const preferences = await storage.upsertNotificationPreferences(userId, validPreferences);
      res.json(preferences);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Global search endpoint
  app.get("/api/search", isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.searchQuery as string;
      if (!query || query.length < 2) {
        return res.json({ results: [] });
      }

      const results = await storage.globalSearch(query);
      res.json({ results });
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

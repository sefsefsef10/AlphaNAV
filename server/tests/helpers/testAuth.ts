/**
 * Test Authentication Helper
 * 
 * Provides middleware to inject test users for HTTP integration testing
 */

import { Request, Response, NextFunction } from "express";
import { User } from "../../../shared/schema";

// Middleware to inject a test user into req.user
export function injectTestUser(user: Partial<User> & { id: string; role: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.user = user as Express.User;
    next();
  };
}

// Test user fixtures
export const testUsers = {
  gp1: {
    id: "Av82cL",
    email: "gp1-test@alphanav.com",
    role: "gp" as const,
    firstName: "GP",
    lastName: "One"
  },
  gp2: {
    id: "FG9ujq",
    email: "gp2-test@alphanav.com",
    role: "gp" as const,
    firstName: "GP",
    lastName: "Two"
  },
  gp3: {
    id: "GpeoZT",
    email: "gp3-test@alphanav.com",
    role: "gp" as const,
    firstName: "GP",
    lastName: "Three"
  },
  operations: {
    id: "ops-user-1",
    email: "ops-test@alphanav.com",
    role: "operations" as const,
    firstName: "Operations",
    lastName: "User"
  }
};

// Test facility IDs
export const testFacilities = {
  ownedByGP1: ["facility-1", "facility-2"],
  ownedByGP2: ["facility-3", "facility-4"],
  ownedByGP3: ["facility-5"]
};

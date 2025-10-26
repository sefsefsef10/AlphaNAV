import { User as DbUser } from "../../shared/schema";

declare global {
  namespace Express {
    interface User extends DbUser {
      // Extending Express.User with our database User type
      // This includes: id, email, firstName, lastName, role, etc.
    }
  }
}

export {};

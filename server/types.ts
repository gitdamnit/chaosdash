import type { Request } from "express";

export interface SessionUser {
  id: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user: SessionUser;
}

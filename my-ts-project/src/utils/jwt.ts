import jwt, { SignOptions } from "jsonwebtoken";
import '.././config';
import { JwtPayload } from "../types";
const p = process.env;
export function signToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: p.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, String(p.JWT_SECRET), options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token,String(p.JWT_SECRET)) as JwtPayload;
}

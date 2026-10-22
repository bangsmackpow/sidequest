import { Hono } from "hono";
import { Env } from "../types/env";
import { createAuth } from "../auth";

export const authRouter = new Hono<{ Bindings: Env }>();

authRouter.all("/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

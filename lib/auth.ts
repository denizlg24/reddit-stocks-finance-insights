import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { Resend } from "resend";
import { verificationEmailHtml } from "@/lib/email-templates";

const mongoUri =
  process.env.MONGODB_URI ??
  "mongodb://localhost:27017/finance-insights";

const client = new MongoClient(mongoUri);

export const auth = betterAuth({
  database: mongodbAdapter(client.db()),
  secret: process.env.BETTER_AUTH_SECRET ?? "build-time-placeholder-secret",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail =
        process.env.RESEND_FROM_EMAIL ?? "insights@example.com";

      await resend.emails.send({
        from: fromEmail,
        to: user.email,
        subject: "Verify your email — Finance Insights",
        html: verificationEmailHtml(url),
      });
    },
  },
  user: {
    additionalFields: {
      approved: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [nextCookies()],
});

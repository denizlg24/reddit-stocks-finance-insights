import { Resend } from "resend";
import { connectDB } from "@/lib/db";
import { Recipient } from "@/lib/models/recipient";
import { analysisNotificationHtml } from "@/lib/email-templates";
import { generateAnalysisPdf } from "@/lib/pdf";

export async function sendAnalysisEmail(
  analysisMarkdown: string
): Promise<string[]> {
  await connectDB();

  const recipients = await Recipient.find({ active: true }).lean();

  if (recipients.length === 0) {
    return [];
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "insights@example.com";
  const htmlContent = analysisNotificationHtml();
  const pdfBuffer = await generateAnalysisPdf(analysisMarkdown);
  const sentTo: string[] = [];

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const dateSlug = new Date().toISOString().slice(0, 10);

  for (const recipient of recipients) {
    try {
      await resend.emails.send({
        from: `Finance Pal <${fromEmail}>`,
        to: recipient.email,
        subject: `Finance Insights — ${today}`,
        html: htmlContent,
        attachments: [
          {
            content: pdfBuffer,
            filename: `finance-insights-${dateSlug}.pdf`,
            contentType: "application/pdf",
          },
        ],
      });
      sentTo.push(recipient.email);
    } catch (e) {
      console.error(`Error sending email to ${recipient.email}:`, e);
      console.error(`Failed to send email to ${recipient.email}`);
    }
  }

  return sentTo;
}

import { resend } from "../infra/resend";

export async function sendEmail(
  to: string,
  subject: string,
  body: string
) {
  await resend.emails.send({
    from: "onboarding@resend.dev", 
    to,
    subject,
    text: body,
  });
}
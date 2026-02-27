import { resend } from "../infra/resend";

export async function sendEmail(
  to: string,
  subject: string,
  body: string
) {
  console.log("Sending email to:", to);

  const response = await resend.emails.send({
    from: "noreply@lindaos.dev",
    to,
    subject,
    text: body,
  });

  console.log("Resend response:", response);
}
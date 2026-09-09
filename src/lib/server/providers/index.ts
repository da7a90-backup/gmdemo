export * from "./postscript";
export * from "./sendgrid";
import { postscriptConfigured } from "./postscript";
import { sendgridConfigured } from "./sendgrid";

// Email is SendGrid (all transactional + broadcasts); SMS is Postscript. OTP is
// self-hosted (we generate the code, SendGrid/Postscript just deliver it).
export function providerStatus() {
  return {
    email_sendgrid: sendgridConfigured() ? "configured" : "stubbed (set SENDGRID_API_KEY)",
    sms_postscript: postscriptConfigured() ? "configured" : "stubbed (set POSTSCRIPT_API_KEY)",
  };
}

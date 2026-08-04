export * from "./postscript";
export * from "./klaviyo";
export * from "./sendgrid";
import { postscriptConfigured } from "./postscript";
import { klaviyoConfigured } from "./klaviyo";
import { sendgridConfigured } from "./sendgrid";

export function providerStatus() {
  return {
    sms_postscript: postscriptConfigured() ? "configured" : "stubbed (set POSTSCRIPT_API_KEY)",
    email_klaviyo: klaviyoConfigured() ? "configured" : "stubbed (set KLAVIYO_API_KEY)",
    txn_sendgrid: sendgridConfigured() ? "configured" : "stubbed (set SENDGRID_API_KEY)",
  };
}

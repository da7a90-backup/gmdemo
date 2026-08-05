export * from "./postscript";
export * from "./klaviyo";
import { postscriptConfigured } from "./postscript";
import { klaviyoConfigured } from "./klaviyo";

// Transactional email is NOT a separate provider: OTP is Shopify-hosted (Customer
// Account API) and receipt/"you won" are Klaviyo events → transactional flows.
export function providerStatus() {
  return {
    sms_postscript: postscriptConfigured() ? "configured" : "stubbed (set POSTSCRIPT_API_KEY)",
    email_klaviyo: klaviyoConfigured() ? "configured" : "stubbed (set KLAVIYO_API_KEY)",
  };
}

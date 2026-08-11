// Login feature flags (client-safe). Flip SMS_LOGIN_ENABLED to true to re-enable phone
// OTP everywhere — the login UI tab and the /api/auth/otp routes both read this. All the
// phone/Postscript code is kept intact; this only gates it on/off.
export const SMS_LOGIN_ENABLED = false;

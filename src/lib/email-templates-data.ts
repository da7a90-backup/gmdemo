// Transactional email templates — code defaults + the variable contract each one
// exposes. The GM admin edits subject/body (HTML with {{variables}}); code fills the
// variables and injects the rendered subject + body_html into the Klaviyo event, so
// Klaviyo's flow only needs {{ event.subject }} and {{ event.body_html | safe }}.
// Client-safe (pure data) so the admin desk can render the variable chips + preview.
export type EmailVar = { name: string; example: string };
export type EmailTemplateDef = {
  key: string;        // matches the Klaviyo metric mapping in code
  metric: string;     // the Klaviyo metric that triggers it
  name: string;
  description: string;
  variables: EmailVar[];
  subject: string;
  body: string;       // HTML, may contain {{variable}}
};

export const EMAIL_TEMPLATES: EmailTemplateDef[] = [
  {
    key: "tickets_minted",
    metric: "Tickets Minted",
    name: "Purchase receipt — “You're in”",
    description: "Sent right after a paid order's tickets are minted (orders/paid webhook).",
    variables: [
      { name: "entries", example: "10" },
      { name: "cycle", example: "1" },
      { name: "prize", example: "2024 Chevrolet Corvette" },
      { name: "ticket_prefix", example: "GM01-0004" },
      { name: "order_token", example: "0004" },
    ],
    subject: "You're in — {{entries}} tickets for Cycle {{cycle}}",
    body:
      `<h1 style="font-family:Georgia,serif">You're in.</h1>
<p>We printed <strong>{{entries}}</strong> tickets for Cycle {{cycle}} — the {{prize}}.</p>
<p>Your batch is <strong>{{ticket_prefix}}</strong> (order {{order_token}}). Every entry is in the drum for the live draw.</p>
<p>Good luck — and thank you for funding the cause.</p>`,
  },
  {
    key: "won_drawing",
    metric: "Won Drawing",
    name: "Winner notification — “You won”",
    description: "Sent when a winner is recorded with an email (admin winners desk).",
    variables: [
      { name: "winner_name", example: "Sid B" },
      { name: "prize", example: "2024 Chevrolet Corvette" },
      { name: "cycle", example: "1" },
      { name: "charity", example: "Habitat for Humanity" },
    ],
    subject: "🎉 You won the {{prize}}!",
    body:
      `<h1 style="font-family:Georgia,serif">Congratulations, {{winner_name}}!</h1>
<p>You won the <strong>{{prize}}</strong> in Cycle {{cycle}}.</p>
<p>Your entry also helped fund <strong>{{charity}}</strong>. We'll reach out shortly to arrange delivery and the handover on stream.</p>`,
  },
  {
    key: "login_code",
    metric: "Login Code",
    name: "Sign-in code (email)",
    description: "The one-time passcode for email login (self-hosted OTP — /api/auth/otp/start).",
    variables: [{ name: "code", example: "482913" }],
    subject: "Your Generous Motors sign-in code",
    body:
      `<h1 style="font-family:Georgia,serif">Your sign-in code</h1>
<p>Enter this code to sign in:</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:6px;font-family:Georgia,serif">{{code}}</p>
<p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  },
  {
    key: "newsletter_welcome",
    metric: "Newsletter Welcome",
    name: "Newsletter welcome",
    description: "Sent once when someone subscribes to the newsletter (footer/popup).",
    variables: [{ name: "prize", example: "2024 Chevrolet Corvette" }],
    subject: "Welcome to Generous Motors",
    body:
      `<h1 style="font-family:Georgia,serif">Welcome to the club.</h1>
<p>You're on the list — we'll send you cycle updates, winner stories, and the occasional bonus-entry offer.</p>
<p>Right now we're giving away the <strong>{{prize}}</strong>. Every ticket is printed and pulled on a live stream, and every dollar funds the cause.</p>
<p>See you in the drum.</p>`,
  },
  {
    key: "membership_started",
    metric: "Membership Started",
    name: "Membership — welcome",
    description: "Sent when a subscription first becomes active (subscription_contracts).",
    variables: [{ name: "prize", example: "2024 Chevrolet Corvette" }, { name: "cycle", example: "1" }],
    subject: "Your membership is live 🎉",
    body:
      `<h1 style="font-family:Georgia,serif">You're a member.</h1>
<p>Your monthly entries are locked in — they'll be printed automatically every cycle, starting with Cycle {{cycle}} (the {{prize}}).</p>
<p>Your loyalty multiplier grows the longer you stay. Thank you for funding the cause every single month.</p>`,
  },
  {
    key: "membership_payment_failed",
    metric: "Membership Payment Failed",
    name: "Membership — payment failed",
    description: "Sent when a subscription billing attempt fails (dunning).",
    variables: [{ name: "prize", example: "2024 Chevrolet Corvette" }],
    subject: "Action needed — your membership payment didn't go through",
    body:
      `<h1 style="font-family:Georgia,serif">We couldn't process your payment.</h1>
<p>Your latest membership charge didn't go through, so this cycle's entries are on hold. Please update your payment method to keep your streak — and your loyalty multiplier — going.</p>
<p>We'll retry automatically, or you can update your card from your account.</p>`,
  },
  {
    key: "membership_cancelled",
    metric: "Membership Cancelled",
    name: "Membership — cancelled",
    description: "Sent when a subscription is cancelled or expires.",
    variables: [{ name: "prize", example: "2024 Chevrolet Corvette" }],
    subject: "Your membership was cancelled",
    body:
      `<h1 style="font-family:Georgia,serif">Your membership has ended.</h1>
<p>Your monthly entries have stopped and your loyalty multiplier is paused. We're sorry to see you go — thank you for everything you funded while you were a member.</p>
<p>You can rejoin any time and pick your streak back up. One-time tickets are always open too.</p>`,
  },
];

export const emailTemplateDef = (key: string) => EMAIL_TEMPLATES.find((t) => t.key === key);

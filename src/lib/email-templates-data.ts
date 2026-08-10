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
];

export const emailTemplateDef = (key: string) => EMAIL_TEMPLATES.find((t) => t.key === key);

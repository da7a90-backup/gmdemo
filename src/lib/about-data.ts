// About "how the draw works" process steps — seeded into Shopify `about_step`
// metaobjects, and used as the fallback when Shopify is unreachable.
// Client-safe (pure data).
export type AboutStep = { title: string; body: string };

export const DEFAULT_ABOUT_STEPS: AboutStep[] = [
  {
    title: "Printed and dropped",
    body: "Every entry is printed onto a paper ticket and dropped into the drum before the draw. Each ticket has a unique GM-cycle-buyer ID.",
  },
  {
    title: "Pulled on camera",
    body: "The grand-prize drawing is fully livestreamed in front of thousands of viewers. One ticket is pulled. The ID is read aloud and into the chat. The full clip stays in the archive.",
  },
  {
    title: "Winner announced live",
    body: "The winner is announced in real time, on stream. Win or not, every ticket bought helps fund the cycle’s charity partner.",
  },
];

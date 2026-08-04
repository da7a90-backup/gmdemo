import { Ticket, Printer, Tv2, Flag } from "lucide-react";
import { YouTubeFacade } from "@/components/youtube-facade";
import { getContentServer } from "@/lib/server/copy";

const ICONS = [Ticket, Printer, Tv2, Flag];

/** Extract a YouTube video id from a watch/share/embed URL (or pass through an id). */
function youtubeId(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m?.[1] ?? url.trim();
}

export async function HowItWorks() {
  const copy = await getContentServer();
  const steps = ICONS.map((icon, i) => ({
    icon,
    label: copy[`home.how.step${i + 1}.label`],
    body: copy[`home.how.step${i + 1}.body`],
  }));
  const videoId = youtubeId(copy["home.how.videoUrl"] ?? "");
  const poster = copy["home.how.poster"] || "/vehicles/drum-poster.jpg";
  return (
    <section className="bg-paper-3 text-ink border-y border-rule" id="how-it-works">
      <div className="mx-auto max-w-[1400px] px-5 py-24">
        <div className="border-b border-rule-soft pb-10">
          <p className="section-eyebrow section-eyebrow-rule">{copy["home.how.eyebrow"]}</p>
          <h2 className="mt-4 hero-headline" style={{ fontSize: "clamp(2.25rem,5vw,4.25rem)" }}>
            {copy["home.how.h.lead"]} <span className="accent-serif">{copy["home.how.h.accent"]}</span>
          </h2>
        </div>

        <ol className="mt-12 grid border border-ink/10 bg-paper-3 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-ink/10 lg:divide-y-0 lg:divide-x rounded-2xl overflow-hidden">
          {steps.map((s, i) => (
            <li key={s.label} className="relative p-8">
              <div className="flex items-baseline justify-between gap-4 mb-6">
                <span className="font-condensed text-5xl font-semibold text-ink leading-none numeral">№{String(i + 1).padStart(2, "0")}</span>
                <s.icon size={22} className="text-ink-3" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink">{s.label}</h3>
              <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 mx-auto max-w-4xl shadow-soft rounded-2xl">
          <YouTubeFacade
            videoId={videoId}
            poster={poster}
            title="How a Generous Motors cycle runs"
          />
        </div>
      </div>
    </section>
  );
}

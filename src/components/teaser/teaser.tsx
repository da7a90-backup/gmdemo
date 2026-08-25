import { AnimIgnition } from "@/components/teaser/anim-ignition";
import { TeaserSignup } from "@/components/teaser/signup";

/**
 * Coming-soon teaser shown at "/" while the full site is soft-launched under /beta.
 * Ignition logo animation over a darkened brand video + the newsletter capture.
 */
export function Teaser() {
  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden bg-[#0a0a0a] text-white">
      {/* background video + slightly-dark overlay */}
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/teaser/ignition-poster.jpg"
      >
        <source src="/teaser/ignition-bg-1080.mp4" type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-black/40" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, rgba(0,209,189,0.12), transparent 60%), radial-gradient(80% 50% at 50% 115%, rgba(0,209,189,0.14), transparent 70%)",
        }}
      />

      {/* content column — main block centered in the free space, tagline pinned at
          the bottom of the flow so nothing clips on short mobile viewports */}
      <div className="relative z-[1] flex min-h-[100svh] flex-col items-center px-6 py-10">
        <div className="flex flex-1 flex-col items-center justify-center">
          <AnimIgnition theme="dark" />

          <p className="mt-9 max-w-md text-center font-serif text-[15px] text-white/75">
            A new kind of car giveaway is pulling up. Drop your email and be first through the door.
          </p>
          <div className="mt-5 flex w-full justify-center">
            <TeaserSignup source="Coming soon" />
          </div>
        </div>

        <p className="shrink-0 pt-8 text-center font-condensed text-[15px] font-bold uppercase tracking-[0.28em] text-white/85 sm:text-[17px]">
          Launching soon…
        </p>
      </div>
    </div>
  );
}

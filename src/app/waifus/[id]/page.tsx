import Link from "next/link";
import { notFound } from "next/navigation";
import { BOSS, SQUAD, getWaifu } from "@/lib/waifus";

export function generateStaticParams() {
  return [...SQUAD.map((w) => ({ id: w.id })), { id: BOSS.id }];
}

export default async function WaifuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === BOSS.id) {
    return (
      <Shell
        name={BOSS.name}
        title={BOSS.title}
        avatar={BOSS.avatar}
        accent="#0A0A0A"
        role="BOSS"
        schedule="always on"
        job="panther-command"
        cron="lucy-prime"
        files="Telegram @sageglowsbot · C:/emergent-matrix"
        goal={BOSS.bio}
        powers={BOSS.powers}
      />
    );
  }
  const w = getWaifu(id);
  if (!w) notFound();
  return (
    <Shell
      name={w.name}
      title={w.title}
      avatar={w.avatar}
      accent={w.accent}
      role={w.role}
      schedule={w.schedule}
      job={w.job}
      cron={w.cron}
      files={w.files}
      goal={w.goal}
      bio={w.bio}
      powers={w.powers}
      link={w.link}
    />
  );
}

function Shell(p: {
  name: string; title: string; avatar: string; accent: string; role: string;
  schedule: string; job: string; cron: string; files: string; goal: string;
  bio?: string; powers: string[]; link?: string;
}) {
  return (
    <div className="relative min-h-screen text-[#0A0A0A] overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <img src="/home-bg.jpg" alt="" aria-hidden className="h-full w-full object-cover object-[center_30%] scale-[1.02]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.62)_0%,rgba(248,248,247,0.84)_36%,rgba(248,248,247,0.96)_68%,#F8F8F7_92%)]" />
      </div>
      <header className="sticky top-0 z-30 border-b border-white/50 bg-white/72 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1120px] items-center gap-2.5 px-4 py-3 sm:px-6">
          <Link href="/" className="grid size-9 place-items-center overflow-hidden rounded-xl border border-[#0A0A0A]/10 bg-white p-0.5" title="Home">
            <img src="/panther-icon.png" alt="home" className="h-7 w-7 object-contain" />
          </Link>
          <Link href="/waifus" className="rounded-full border border-[#0A0A0A]/10 bg-white/80 px-3 py-1.5 text-[11px] font-bold tracking-widest hover:border-[#0A0A0A]">← SQUAD</Link>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold tracking-[0.14em] text-white" style={{ background: p.accent }}>
            {p.role} · {p.name.toUpperCase()}
          </span>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[860px] px-4 pb-14 pt-8 sm:px-6">
        <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/72 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="h-2 w-full" style={{ background: p.accent }} />
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:p-8">
            <img src={p.avatar} alt={`${p.name} — ${p.title}`} className="size-40 shrink-0 rounded-[24px] border border-white/70 bg-white object-cover object-top shadow-[0_8px_28px_rgba(0,0,0,0.10)] sm:size-52" />
            <div className="min-w-0">
              <h1 className="text-[32px] font-black tracking-[-0.03em] leading-none">{p.name}</h1>
              <div className="mt-1 text-[14px] font-semibold text-[#6B6B6B]">{p.title}</div>
              <div className="mt-1 font-mono text-[12px] text-[#9A9A9A]">{p.job} · {p.schedule}</div>
              {p.bio && <p className="mt-3 max-w-[520px] text-[13.5px] leading-6">{p.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.powers.map((pw) => (
                  <span key={pw} className="rounded-full border border-[#E8E8E8] bg-white/80 px-3 py-1 text-[11px] font-bold">{pw}</span>
                ))}
              </div>
              {p.link && (
                <Link href={p.link} className="mt-4 inline-block rounded-full bg-[#0A0A0A] px-5 py-2.5 text-[12px] font-bold text-white hover:bg-black">
                  Open {p.name}&apos;s desk ↗
                </Link>
              )}
            </div>
          </div>
          <div className="grid gap-3 border-t border-white/60 bg-white/55 p-5 sm:grid-cols-2 sm:p-6">
            <div className="rounded-2xl border border-[#E8E8E8]/70 bg-white/80 p-4">
              <div className="text-[10px] font-bold tracking-[0.16em] text-[#9A9A9A]">MISSION</div>
              <div className="mt-1 text-[12.5px] leading-5">{p.goal}</div>
            </div>
            <div className="rounded-2xl border border-[#E8E8E8]/70 bg-white/80 p-4">
              <div className="text-[10px] font-bold tracking-[0.16em] text-[#9A9A9A]">WATCHES</div>
              <div className="mt-1 break-all font-mono text-[11px] leading-4">{p.files}</div>
              <div className="mt-2 font-mono text-[11px] text-[#6B6B6B]">cron {p.cron}</div>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center text-[10px] tracking-[0.20em] text-[#9A9A9A]">© PANTHERDIGITAL — {p.name.toUpperCase()} · {p.role}</div>
      </main>
    </div>
  );
}

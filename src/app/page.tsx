import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BookOpen, CircuitBoard, Layers3, Radio } from 'lucide-react';
import { articles } from '@/lib/content/articles';

function CircuitPreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#2b3d4b] bg-[#101a24] shadow-[0_25px_80px_#00000035]">
      <div className="flex items-center justify-between border-b border-[#233241] px-5 py-4 text-xs">
        <span className="flex items-center gap-2 font-mono text-[#91a2b7]"><span className="h-2 w-2 rounded-full bg-[#c4ef72]" /> CIRCUIT 001 / START–STOP</span>
        <span className="rounded border border-[#354a32] bg-[#c4ef72]/8 px-2 py-1 text-[10px] font-medium tracking-widest text-[#c4ef72]">ILLUSTRATION</span>
      </div>
      <div className="relative px-5 py-10 sm:px-8" style={{ backgroundImage: 'radial-gradient(#2c3a46 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        <div className="relative flex items-center justify-between gap-3" aria-label="Start and stop signals connect to a latch, which drives a motor indicator">
          <div className="flex flex-col gap-5">
            <div className="w-24 rounded-lg border border-[#395047] bg-[#162521] px-3 py-3 sm:w-28">
              <div className="mb-2 font-mono text-[10px] text-[#91a2b7]">I1 / START</div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#c4ef72]"><span className="h-2 w-2 rounded-full bg-[#c4ef72]" /> TRUE</div>
            </div>
            <div className="w-24 rounded-lg border border-[#334150] bg-[#141e29] px-3 py-3 sm:w-28">
              <div className="mb-2 font-mono text-[10px] text-[#91a2b7]">I2 / STOP</div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#91a2b7]"><span className="h-2 w-2 rounded-full bg-[#536373]" /> FALSE</div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-[66px]" aria-hidden="true"><div className="h-px bg-[#c4ef72]/60" /><div className="h-px bg-[#526473]" /></div>
          <div className="relative w-24 rounded-lg border border-[#c4ef72]/40 bg-[#15221f] p-4 text-center sm:w-28">
            <div className="mb-1 font-mono text-[10px] text-[#91a2b7]">B001</div>
            <div className="text-3xl font-light text-[#c4ef72]">RS</div>
            <div className="mt-2 text-[10px] text-[#a9b7a9]">Reset priority</div>
          </div>
          <div className="h-px flex-1 bg-[#c4ef72]/60" aria-hidden="true" />
          <div className="flex w-20 flex-col items-center gap-3 sm:w-24">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#c4ef72]/50 bg-[#c4ef72]/8 shadow-[0_0_35px_#c4ef7212]"><Radio size={25} strokeWidth={1.4} className="text-[#c4ef72]" /></div>
            <span className="font-mono text-[10px] text-[#c4ef72]">Q1 / MOTOR</span>
          </div>
        </div>
        <div className="mt-9 flex justify-between border-t border-[#233241] pt-4 font-mono text-[10px] uppercase tracking-wider text-[#72879a]"><span>01 · Stimulate</span><span>02 · Evaluate</span><span>03 · Observe</span></div>
      </div>
      <div className="flex items-center gap-3 border-t border-[#233241] bg-[#0e1720] px-5 py-4 text-xs text-[#91a2b7]"><span className="text-[#72d9e5]">↳</span> Understand the circuit. Then put it to the test.</div>
    </div>
  );
}

export default function Home() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-14">
      <section className="grid items-center gap-12 border-b border-[#233241] py-14 lg:grid-cols-[1.06fr_1fr] lg:gap-16 lg:py-20">
        <div>
          <div className="mb-7 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#91a2b7]"><span className="h-px w-7 bg-[#c4ef72]" /> A workspace for curious engineers</div>
          <h1 className="max-w-2xl text-[clamp(2.8rem,5.7vw,5.4rem)] leading-[1.05] font-medium tracking-[-0.065em] text-[#e5edf5]">Good logic<br />starts with<br /><span className="text-[#c4ef72]">understanding.</span></h1>
          <p className="mt-6 max-w-[430px] text-base leading-7 text-[#91a2b7]">Explore industrial automation, one idea and one circuit at a time. Read the fieldnotes. Build in the lab. See why it works.</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/lab" className="inline-flex items-center gap-6 rounded-lg bg-[#c4ef72] px-5 py-3.5 text-sm font-semibold text-[#122018] transition hover:bg-[#d7fa94]">Open the logic lab <ArrowUpRight size={17} /></Link>
            <Link href="/journal" className="inline-flex items-center gap-2 rounded-lg px-4 py-3.5 text-sm text-[#d4dfe9] transition hover:bg-[#172430]">Read the journal <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#73879a]"><span className="h-1.5 w-1.5 rounded-full bg-[#c4ef72]" /> Browser-based · Built for exploration</div>
        </div>
        <div className="lg:pt-8"><CircuitPreview /><div className="mt-4 flex items-center justify-between px-1 font-mono text-[10px] uppercase tracking-widest text-[#61778b]"><span>The theory, made tangible</span><span>F / 001</span></div></div>
      </section>

      <section className="grid gap-6 border-b border-[#233241] py-8 md:grid-cols-3 md:gap-10" aria-label="Explore Fieldnotes">
        {[
          { icon: BookOpen, label: '01 / READ', title: 'The engineering journal', description: 'Practical notes on signals, control logic, and the decisions behind a working system.', href: '/journal' },
          { icon: CircuitBoard, label: '02 / BUILD', title: 'Your own logic workbench', description: 'Connect blocks, change inputs, and follow a signal through an interactive circuit.', href: '/lab' },
          { icon: Layers3, label: '03 / EXPLORE', title: 'A growing component library', description: 'From digital logic to analog control. Find the blocks and follow the implementation roadmap.', href: '/library' },
        ].map(({ icon: Icon, label, title, description, href }) => (
          <Link key={href} href={href} className="group flex gap-4 rounded-lg p-2 transition hover:bg-[#101a24]">
            <Icon size={21} strokeWidth={1.4} className="mt-1 shrink-0 text-[#72d9e5]" />
            <div><div className="mb-2 font-mono text-[10px] tracking-widest text-[#70859b]">{label}</div><h2 className="flex items-center gap-2 text-sm font-medium text-[#e5edf5]">{title}<ArrowUpRight size={13} className="text-[#607489] transition group-hover:text-[#c4ef72]" /></h2><p className="mt-2 max-w-sm text-xs leading-5 text-[#91a2b7]">{description}</p></div>
          </Link>
        ))}
      </section>

      <section className="py-12 lg:py-14">
        <div className="mb-7 flex items-end justify-between gap-4"><div><p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-[#72d9e5]">FROM THE JOURNAL</p><h2 className="text-3xl font-medium tracking-tight text-[#e5edf5]">Ideas worth wiring up.</h2></div><Link href="/journal" className="inline-flex items-center gap-2 whitespace-nowrap pb-1 text-xs text-[#aebdcd] hover:text-[#c4ef72]">All notes <ArrowUpRight size={14} /></Link></div>
        <div className="grid gap-4 md:grid-cols-3">
          {articles.map((article, index) => (
            <Link key={article.slug} href={`/journal/${article.slug}`} className="group flex flex-col rounded-xl border border-[#233241] bg-[#101a24] p-6 transition hover:border-[#516444] hover:bg-[#13202a]">
              <div className="mb-7 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-widest text-[#72d9e5]">{article.category}</span><span className="font-mono text-xs text-[#51677a]">0{index + 1}</span></div>
              <h3 className="max-w-xs text-xl leading-7 font-medium tracking-tight text-[#e5edf5]">{article.title}</h3><p className="mt-3 flex-1 text-sm leading-6 text-[#91a2b7]">{article.excerpt}</p>
              <div className="mt-8 flex items-center justify-between border-t border-[#233241] pt-4 text-xs text-[#70869c]"><span>{article.readingMinutes} min read</span><ArrowUpRight size={16} className="text-[#91a2b7] transition group-hover:text-[#c4ef72]" /></div>
            </Link>
          ))}
        </div>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#233241] py-6 text-xs text-[#6f8397]"><span>Fieldnotes / Automation engineering</span><span>Learn the principle. Test the idea.</span></footer>
    </main>
  );
}

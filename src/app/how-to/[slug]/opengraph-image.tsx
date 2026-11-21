import { ImageResponse } from 'next/og';
import { HOW_TOS, getHowTo } from '@/lib/howto/catalog';

export const alt = 'PLC programming example with a live simulator';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return HOW_TOS.map((guide) => ({ slug: guide.slug }));
}

export default async function Image(props: { params: Promise<{ slug: string }> }) {
  const guide = getHowTo((await props.params).slug);
  const title = guide?.title ?? 'PLC programming examples';
  const level = guide ? guide.level[0].toUpperCase() + guide.level.slice(1) : 'How-to';

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#fbfbfd', padding: '64px 72px', fontFamily: 'sans-serif', color: '#1d1d1f' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 28, fontWeight: 700 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#1d1d1f', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>AH</div>
          AutomationHub
          <div style={{ marginLeft: 'auto', fontSize: 22, fontWeight: 500, color: '#059669', border: '2px solid #05966933', borderRadius: 999, padding: '6px 18px' }}>{`How-to - ${level}`}</div>
        </div>
        <div style={{ display: 'flex', fontSize: title.length > 70 ? 56 : 64, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.5 }}>{title}</div>
        <div style={{ display: 'flex', gap: 28, fontSize: 26, color: '#515154' }}>
          <span>Live simulator</span>
          <span>Ladder diagram</span>
          <span>Arduino code</span>
          <span style={{ color: '#059669' }}>Tested circuit</span>
        </div>
      </div>
    ),
    size,
  );
}

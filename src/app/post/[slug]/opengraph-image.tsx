import { ImageResponse } from 'next/og';
import { BLOG_POSTS, AUTHOR_NAME } from '@/lib/mockPosts';

export const alt = 'AutomationHub Masterclass Schematics';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  const title = post?.title || 'Industrial Automation Masterclass';
  const tag = post?.tag || 'Process Control';
  const readingTime = post?.readingTime || '15 min read + interactive labs';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#fbfbfd',
          backgroundImage:
            'radial-gradient(circle at 90% 10%, rgba(0, 113, 227, 0.08) 0%, transparent 45%), radial-gradient(circle at 10% 90%, rgba(5, 150, 105, 0.08) 0%, transparent 45%)',
          padding: '60px 70px',
          fontFamily: 'sans-serif',
          color: '#1d1d1f',
          position: 'relative',
        }}
      >
        {/* Subtle decorative Apple hairline border */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            right: 24,
            bottom: 24,
            border: '1px solid #e5e5ea',
            borderRadius: 24,
            pointerEvents: 'none',
          }}
        />

        {/* Top Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#ffffff',
                border: '1px solid #e5e5ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                fontSize: 22,
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              }}
            >
              ⚡
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  color: '#1d1d1f',
                }}
              >
                AutomationHub
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  color: '#86868b',
                  fontWeight: 600,
                }}
              >
                DETERMINISTIC CONTROLS &amp; SCADA
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 18px',
              borderRadius: 30,
              backgroundColor: '#f5f5f7',
              border: '1px solid #e5e5ea',
              color: '#0071e3',
              fontSize: 13,
              fontFamily: 'monospace',
              fontWeight: 700,
            }}
          >
            <span>{tag.toUpperCase()}</span>
            <span>•</span>
            <span>{readingTime}</span>
          </div>
        </div>

        {/* Middle: Title & Schematic Indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px' }}>
          <h1
            style={{
              fontSize: title.length > 80 ? 42 : 50,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-1.5px',
              color: '#1d1d1f',
              margin: 0,
            }}
          >
            {title}
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#515154',
              fontSize: 17,
            }}
          >
            <span style={{ color: '#059669', fontWeight: 700 }}>▶</span>
            <span>Interactive Function Block Diagram (FBD) Lab &amp; Root Cause Failure Diagnosis</span>
          </div>
        </div>

        {/* Bottom Author Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #e5e5ea',
            paddingTop: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: '#1d1d1f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 'bold',
                color: '#ffffff',
                fontFamily: 'monospace',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}
            >
              AW
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f' }}>
                Authored by Alazar Wake Kore
              </span>
              <span style={{ fontSize: 13, color: '#86868b' }}>
                Electrical Engineering Technology Senior at Higher Colleges of Technology (UAE)
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 14,
              fontFamily: 'monospace',
              fontWeight: 600,
              color: '#0071e3',
            }}
          >
            <span>industrialautomation.website</span>
            <span>↗</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

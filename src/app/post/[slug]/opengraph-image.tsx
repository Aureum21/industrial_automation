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
          backgroundColor: '#070b14',
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.18) 0%, transparent 45%), radial-gradient(circle at 15% 85%, rgba(6, 182, 212, 0.15) 0%, transparent 45%)',
          padding: '60px 70px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Subtle decorative circuit border */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            right: 24,
            bottom: 24,
            border: '1px solid rgba(16, 185, 129, 0.25)',
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
                backgroundColor: '#0d1829',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                fontSize: 22,
                fontWeight: 'bold',
              }}
            >
              ⚡
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: '1px',
                  color: '#ffffff',
                }}
              >
                AUTOMATIONHUB
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'monospace',
                  letterSpacing: '2px',
                  color: '#34d399',
                }}
              >
                DETERMINISTIC LOGIC &amp; CONTROLS
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
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#6ee7b7',
              fontSize: 14,
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
              lineHeight: 1.2,
              letterSpacing: '-1px',
              color: '#ffffff',
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
              color: '#94a3b8',
              fontSize: 16,
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: '#10b981' }}>▶</span>
            <span>Includes 3 Interactive Function Block Diagram (FBD) Labs &amp; P&amp;ID Incident Diagnosis</span>
          </div>
        </div>

        {/* Bottom Author Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 'bold',
                color: '#34d399',
                fontFamily: 'monospace',
              }}
            >
              AW
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
                Authored by Alazar Wake Kore
              </span>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>
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
              color: '#38bdf8',
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

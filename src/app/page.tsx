import Link from 'next/link';
import { BLOG_POSTS } from '@/lib/mockPosts';

const articles = BLOG_POSTS;

export default function Home() {
  return (
    <main className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-yellow-50 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 flex items-center justify-between">
          <div className="max-w-2xl">
            <h1 className="text-6xl md:text-8xl font-serif tracking-tighter text-black mb-8 leading-none">
              Stay curious.
            </h1>
            <p className="text-xl md:text-2xl text-gray-800 mb-10 font-sans max-w-md leading-relaxed">
              Discover stories, thinking, and expertise from writers on industrial automation and PLCs.
            </p>
            <Link href="/write" className="rounded-full bg-black px-8 py-3 text-lg font-medium text-white transition hover:bg-gray-800 w-fit">
              Start reading
            </Link>
          </div>
          {/* Decorative graphic for desktop */}
          <div className="hidden lg:block text-black font-serif text-[200px] leading-none select-none opacity-10">
            A
          </div>
        </div>
      </section>

      {/* Main Feed */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12 flex flex-col-reverse lg:flex-row gap-16">
        
        {/* Left Column: Articles List */}
        <div className="flex-grow lg:w-2/3">
          <div className="flex flex-col gap-10">
            {articles.map((article) => (
              <div key={article.slug} className="flex flex-col gap-3 group border-b border-gray-100 pb-10">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                    {article.author.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-900">{article.author}</span>
                </div>
                
                <Link href={`/post/${article.slug}`}>
                  <h2 className="text-2xl font-extrabold text-gray-900 group-hover:text-black leading-tight mb-2">
                    {article.title}
                  </h2>
                  <p className="text-gray-500 text-base leading-relaxed line-clamp-2 font-serif hidden sm:block">
                    {article.excerpt}
                  </p>
                </Link>

                <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                  <div className="flex items-center gap-2">
                    <span>{article.date}</span>
                    <span>·</span>
                    <span>{article.readingTime}</span>
                    <span>·</span>
                    <span className="bg-gray-100 rounded-full px-3 py-1 text-gray-600 text-xs">
                      {article.tag}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:w-1/3">
          <div className="sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">Discover more of what matters to you</h3>
            <div className="flex flex-wrap gap-2 mb-8">
              {['PLC', 'SCADA', 'Simulink', 'FBD', 'Automation', 'Robotics', 'HMI'].map(tag => (
                <Link key={tag} href={`/tag/${tag}`} className="border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-full text-sm transition">
                  {tag}
                </Link>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
              <Link href="#" className="hover:text-gray-900">Help</Link>
              <Link href="#" className="hover:text-gray-900">Status</Link>
              <Link href="#" className="hover:text-gray-900">Writers</Link>
              <Link href="#" className="hover:text-gray-900">Blog</Link>
              <Link href="#" className="hover:text-gray-900">Careers</Link>
              <Link href="#" className="hover:text-gray-900">Privacy</Link>
              <Link href="#" className="hover:text-gray-900">Terms</Link>
              <Link href="#" className="hover:text-gray-900">About</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

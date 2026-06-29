import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="sticky top-0 bg-white z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-0 flex-shrink-0">
            <div className="flex items-center gap-0 relative">
              <img src="/playra.svg" alt="Playra" className="h-[28px] w-auto" />
              <span className="font-[family-name:var(--font-youtube-sans)] font-bold text-zinc-900 text-2xl tracking-wide ml-0">
                RA
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/how-it-works" className="text-sm text-zinc-700 hover:text-zinc-900 transition-colors">
              How Playra Works
            </Link>
            <Link href="/creators" className="text-sm text-zinc-700 hover:text-zinc-900 transition-colors">
              Creators
            </Link>
            <Link href="/culture" className="text-sm text-zinc-700 hover:text-zinc-900 transition-colors">
              Culture & Trends
            </Link>
            <Link href="/blog" className="text-sm text-zinc-700 hover:text-zinc-900 transition-colors">
              Blog
            </Link>
            <Link href="/earning" className="text-sm font-semibold text-zinc-900 hover:text-blue-600 transition-colors">
              Earning with Playra
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Collage Layout */}
      <section className="w-full">
        <div className="grid grid-cols-4 grid-rows-3 gap-2 p-2 h-[600px]">
          <div className="col-span-2 row-span-2 rounded-lg overflow-hidden">
            <img src="/Football.png" alt="Football" className="w-full h-full object-cover" />
          </div>
          <div className="image-placeholder bg-blue-200 col-span-1 row-span-1 rounded-lg" />
          <div className="image-placeholder bg-green-200 col-span-1 row-span-2 rounded-lg" />
          <div className="image-placeholder bg-yellow-200 col-span-1 row-span-1 rounded-lg" />
          <div className="col-span-1 row-span-1 rounded-lg overflow-hidden">
            <img src="/Mountains.jpg" alt="Mountains" className="w-full h-full object-cover" />
          </div>
          <div className="image-placeholder bg-orange-200 col-span-2 row-span-1 rounded-lg" />
          <div className="col-span-1 row-span-1 rounded-lg overflow-hidden">
            <img src="/Leopard.jpg" alt="Leopard" className="w-full h-full object-cover" />
          </div>
          <div className="image-placeholder bg-red-200 col-span-1 row-span-1 rounded-lg" />
        </div>
      </section>

      {/* Main Mission Statement Area */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-6xl font-bold text-zinc-900 mb-8" style={{ letterSpacing: '-1px' }}>
            About Playra
          </h1>
          <p className="text-2xl text-zinc-700 leading-relaxed mb-6">
            Our mission is to give everyone a voice and show them the world.
          </p>
          <p className="text-2xl text-zinc-700 leading-relaxed">
            We believe that everyone deserves to have a voice, and that the world is a better place when we listen, share and build community through our stories.
          </p>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="w-full bg-[#f9f9f9] pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-6">
          {/* Social Row */}
          <div className="flex items-center gap-4 mb-8">
            <span className="text-sm font-semibold text-zinc-900">Connect</span>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-300" />
              <div className="w-8 h-8 rounded-full bg-gray-300" />
              <div className="w-8 h-8 rounded-full bg-gray-300" />
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-5 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">About Playra</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">About</Link></li>
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Newsroom</Link></li>
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Playra Careers</Link></li>
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Playra for Press</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Products</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Playra Kids</Link></li>
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Playra Music</Link></li>
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Playra Premium</Link></li>
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Playra TV</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">For Business</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Advertising</Link></li>
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Developers</Link></li>
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Playra Partners</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">For Creators</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Playra Studio</Link></li>
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Playra Analytics</Link></li>
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Creator Academy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Our Commitments</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Playra Impact</Link></li>
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Playra Trust</Link></li>
                <li><Link href="#" className="text-sm text-zinc-600 hover:text-zinc-900">Sustainability</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-300 pt-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-0 flex-shrink-0">
              <div className="flex items-center gap-0 relative">
                <img src="/playra.svg" alt="Playra" className="h-[24px] w-auto" />
                <span className="font-[family-name:var(--font-youtube-sans)] font-bold text-zinc-900 text-xl tracking-wide ml-0">
                  RA
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/policies" className="text-sm text-zinc-600 hover:text-zinc-900">Policies & Safety</Link>
              <Link href="/copyright" className="text-sm text-zinc-600 hover:text-zinc-900">Copyright</Link>
              <Link href="/brand" className="text-sm text-zinc-600 hover:text-zinc-900">Brand Guidelines</Link>
              <Link href="/privacy" className="text-sm text-zinc-600 hover:text-zinc-900">Privacy</Link>
              <Link href="/terms" className="text-sm text-zinc-600 hover:text-zinc-900">Terms</Link>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-full text-sm text-zinc-700 hover:bg-gray-300 transition-colors">
              <span className="text-lg">?</span>
              <span>Help</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

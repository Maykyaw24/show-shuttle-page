import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import heroImg from "@/assets/hero-concert.jpg";
import imgColdplay from "@/assets/concert-coldplay.jpg";
import imgBlackpink from "@/assets/concert-blackpink.jpg";
import imgBrunoMars from "@/assets/concert-brunomars.jpg";
import imgEdSheeran from "@/assets/concert-edsheeran.jpg";
import imgTaylorSwift from "@/assets/concert-taylorswift.jpg";
import imgTheWeeknd from "@/assets/concert-theweeknd.jpg";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

type Concert = {
  artist: string;
  date: string;
  venue: string;
  price: string;
  availability: string;
  image: string;
};

const concerts: Concert[] = [
  { artist: "Coldplay", date: "Sat, 29 Jul", venue: "National Stadium", price: "$149", availability: "12 left", image: imgColdplay },
  { artist: "BLACKPINK", date: "Sun, 26 Aug", venue: "Impact Arena", price: "$220", availability: "Selling fast", image: imgBlackpink },
  { artist: "Bruno Mars", date: "Fri, 05 Aug", venue: "Qudos Bank Arena", price: "$189", availability: "Available", image: imgBrunoMars },
  { artist: "Ed Sheeran", date: "Sat, 15 Aug", venue: "Marvel Stadium", price: "$135", availability: "Last row", image: imgEdSheeran },
  { artist: "Taylor Swift", date: "Sat, 22 Aug", venue: "MetLife Stadium", price: "$310", availability: "Waitlist", image: imgTaylorSwift },
  { artist: "The Weeknd", date: "Fri, 04 Sep", venue: "SoFi Stadium", price: "$245", availability: "Available", image: imgTheWeeknd },
];

function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginReason, setLoginReason] = useState("");

  const requireLogin = (reason: string) => {
    setLoginReason(reason);
    setLoginOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-[Inter,sans-serif] overflow-x-hidden">
      <Header onLogin={() => requireLogin("Sign in to continue")} onSell={() => requireLogin("Sign in to sell tickets")} />
      <Hero onBrowse={() => requireLogin("Sign in to browse and buy tickets")} onSell={() => requireLogin("Sign in to list tickets")} />
      <HowItWorks />
      <Concerts onBuy={requireLogin} />
      <TrustSafety />
      <AIChatbot onTry={() => requireLogin("Sign in to chat with our AI assistant")} />
      <QRSection />
      <SellerBuyerSplit onSeller={() => requireLogin("Sign in to become a seller")} onBuyer={() => requireLogin("Sign in to buy tickets")} />
      <CTA onStart={() => requireLogin("Create an account to get started")} />
      <Footer />
      {loginOpen && <LoginModal reason={loginReason} onClose={() => setLoginOpen(false)} />}
    </div>
  );
}

/* ---------------- Header ---------------- */
function Header({ onLogin, onSell }: { onLogin: () => void; onSell: () => void }) {
  return (
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold">
            <span className="text-primary-foreground font-bold text-lg">L</span>
          </div>
          <span className="font-display text-xl tracking-wide">Live<span className="text-gradient-gold">Beat</span></span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#concerts" className="hover:text-foreground transition">Concerts</a>
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#ai" className="hover:text-foreground transition">AI Assistant</a>
          <a href="#safety" className="hover:text-foreground transition">Trust & Safety</a>
        </nav>
        <div className="flex items-center gap-3">
          <button onClick={onLogin} className="text-sm text-muted-foreground hover:text-foreground transition">Sign in</button>
          <button onClick={onSell} className="hidden sm:inline-flex text-sm font-medium px-4 py-2 rounded-full bg-gradient-gold text-primary-foreground shadow-gold hover:opacity-95 transition">
            Sell Tickets
          </button>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */
function Hero({ onBrowse, onSell }: { onBrowse: () => void; onSell: () => void }) {
  return (
    <section className="relative pt-32 pb-24 min-h-[92vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={heroImg} alt="Concert stage" className="w-full h-full object-cover opacity-60" width={1600} height={1000} />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      </div>
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs uppercase tracking-[0.2em] text-primary mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Luxury · Exclusive · Premium
          </div>
          <h1 className="font-display text-6xl md:text-8xl font-bold leading-[0.95] tracking-tight">
            EXPERIENCE.<br />
            <span className="text-gradient-gold">EXCLUSIVITY.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl">
            Premium tickets to the world's most unforgettable nights. Verified sellers, protected checkout, and a unique QR for every seat.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button onClick={onBrowse} className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold hover:scale-[1.02] transition">
              Browse Concerts
              <span className="transition group-hover:translate-x-1">→</span>
            </button>
            <button onClick={onSell} className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-primary/40 text-foreground font-semibold hover:bg-primary/10 transition">
              Sell Tickets
            </button>
          </div>
          <div className="mt-12 flex flex-wrap gap-8 text-sm text-muted-foreground">
            <Stat n="150K+" label="Tickets sold" />
            <Stat n="2,400+" label="Verified sellers" />
            <Stat n="98%" label="On-time entry" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl text-gradient-gold">{n}</div>
      <div className="text-xs uppercase tracking-widest">{label}</div>
    </div>
  );
}

/* ---------------- How It Works ---------------- */
function HowItWorks() {
  const items = [
    { role: "Buyers", desc: "Browse curated concerts, pay securely, and receive a unique QR ticket instantly.", icon: "🎟️" },
    { role: "Sellers", desc: "Apply once, get admin approval, then list events and manage inventory from your dashboard.", icon: "🎤" },
    { role: "Admins", desc: "Vet every seller before listings go live, moderate content, and keep the marketplace safe.", icon: "🛡️" },
  ];
  return (
    <section id="how" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <SectionTitle eyebrow="How it works" title="A marketplace built on trust" />
        <div className="grid md:grid-cols-3 gap-6 mt-14">
          {items.map((i) => (
            <div key={i.role} className="card-premium rounded-2xl p-8 hover:border-primary/40 transition group">
              <div className="text-4xl mb-4">{i.icon}</div>
              <div className="font-display text-2xl mb-2">{i.role}</div>
              <p className="text-muted-foreground">{i.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Concerts ---------------- */
function Concerts({ onBuy }: { onBuy: (reason: string) => void }) {
  return (
    <section id="concerts" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <SectionTitle eyebrow="Featured Events" title="Tonight's headliners" />
          <button onClick={() => onBuy("Sign in to see all concerts")} className="text-sm text-primary hover:underline">View all →</button>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {concerts.map((c) => (
            <article key={c.artist} className="card-premium rounded-2xl overflow-hidden group hover:shadow-elegant transition">
              <div className="relative h-48 overflow-hidden">
                <img src={c.image} alt={`${c.artist} live in concert`} loading="lazy" width={1200} height={900} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <button aria-label="Save" onClick={() => onBuy("Sign in to save concerts")} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/70 backdrop-blur flex items-center justify-center text-primary hover:bg-background/90 transition">♥</button>
                <span className="absolute bottom-2 left-3 text-[10px] uppercase tracking-widest text-primary/90 font-semibold">● Live</span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl">{c.artist}</h3>
                <p className="text-sm text-muted-foreground mt-1">{c.date} · {c.venue}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">From</div>
                    <div className="font-semibold text-primary">{c.price}</div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{c.availability}</div>
                </div>
                <button onClick={() => onBuy(`Sign in to buy ${c.artist} tickets`)} className="mt-4 w-full py-2.5 rounded-full bg-gradient-gold text-primary-foreground text-sm font-semibold hover:opacity-95 transition">
                  🔒 Login to Buy
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Trust & Safety ---------------- */
function TrustSafety() {
  return (
    <section id="safety" className="py-24 px-6">
      <div className="max-w-7xl mx-auto card-premium rounded-3xl p-10 md:p-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs uppercase tracking-widest text-primary mb-6">
            🛡️ Trust & Safety
          </div>
          <h2 className="font-display text-4xl md:text-5xl">Every seller, <span className="text-gradient-gold">admin-approved.</span></h2>
          <p className="mt-5 text-muted-foreground text-lg">
            No listing goes public until our admin team verifies the seller's identity, business documents, and ticket authenticity. What you buy is what you get.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {["Manual seller verification","Encrypted checkout & refunds","24/7 fraud monitoring","Refund guarantee if entry is denied"].map(x => (
              <li key={x} className="flex items-center gap-3"><span className="text-primary">✓</span>{x}</li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div className="card-premium rounded-2xl p-6 shadow-elegant">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold">A</div>
              <div>
                <div className="font-semibold">Admin Panel</div>
                <div className="text-xs text-muted-foreground">Pending seller review · 3</div>
              </div>
            </div>
            {[
              { name: "LuxeEvents Co.", status: "Approved", tone: "text-emerald-400" },
              { name: "Nightline Promo", status: "In review", tone: "text-amber-400" },
              { name: "Ghost Reseller", status: "Rejected", tone: "text-red-400" },
            ].map(r => (
              <div key={r.name} className="mt-4 flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                <span className="text-sm">{r.name}</span>
                <span className={`text-xs ${r.tone}`}>● {r.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- AI Chatbot ---------------- */
function AIChatbot({ onTry }: { onTry: () => void }) {
  return (
    <section id="ai" className="py-24 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <div className="card-premium rounded-3xl p-6 shadow-elegant">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center">✨</div>
              <div>
                <div className="font-semibold">LiveBeat AI</div>
                <div className="text-xs text-emerald-400">● Online</div>
              </div>
            </div>
            <div className="space-y-3 mt-4 text-sm">
              <ChatBubble side="user">Any rock concerts near me next weekend?</ChatBubble>
              <ChatBubble side="ai">I found 4 events. Coldplay at National Stadium is the closest — Sat 29 Jul from $149. Want me to reserve?</ChatBubble>
              <ChatBubble side="user">What's my ticket status?</ChatBubble>
              <ChatBubble side="ai">Your BLACKPINK QR is active ✅. Doors open at 6:30 PM — arrive 45 min early for smoothest entry.</ChatBubble>
            </div>
            <button onClick={onTry} className="mt-5 w-full py-3 rounded-full bg-gradient-gold text-primary-foreground font-semibold text-sm">Try the AI Assistant</button>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs uppercase tracking-widest text-primary mb-6">✨ AI Assistant</div>
          <h2 className="font-display text-4xl md:text-5xl">Your personal <span className="text-gradient-gold">concert concierge.</span></h2>
          <p className="mt-5 text-muted-foreground text-lg">Ask anything, anytime. Our AI helps you discover concerts, track your ticket status, and walks you through check-in step by step.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {["Find concerts by mood","Real-time ticket status","QR & check-in guidance","Refund & transfer help"].map(f=>(
              <div key={f} className="card-premium rounded-xl px-4 py-3 text-sm">{f}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatBubble({ side, children }: { side: "user" | "ai"; children: ReactNode }) {
  return (
    <div className={`flex ${side === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${side === "user" ? "bg-primary/15 text-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"}`}>{children}</div>
    </div>
  );
}

/* ---------------- QR Section ---------------- */
function QRSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto card-premium rounded-3xl p-10 md:p-16 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="grid md:grid-cols-2 gap-12 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs uppercase tracking-widest text-primary mb-6">📱 Secure Entry</div>
            <h2 className="font-display text-4xl md:text-5xl">One ticket. <span className="text-gradient-gold">One unique QR.</span></h2>
            <p className="mt-5 text-muted-foreground text-lg">Every purchase generates an encrypted QR code tied to your identity. Scan at the gate — you're in. No duplicates. No fraud.</p>
            <div className="mt-6 space-y-3 text-sm">
              {["Rotating cryptographic signature","Offline scan support at venues","Auto-void after entry","Transferable to a friend, once"].map(x => (
                <div key={x} className="flex gap-3"><span className="text-primary">◆</span>{x}</div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="card-premium rounded-2xl p-8 max-w-xs w-full text-center shadow-elegant glow-gold">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Ticket #A29-4471</div>
              <div className="font-display text-2xl mt-2">Coldplay</div>
              <div className="text-sm text-muted-foreground">Sat 29 Jul · Sec B · Row 12</div>
              <div className="mt-5 aspect-square rounded-xl bg-foreground p-3 mx-auto">
                <QRPattern />
              </div>
              <div className="mt-4 text-xs text-primary">● Valid for entry</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QRPattern() {
  // Deterministic pseudo-QR grid for visual demo only
  const size = 17;
  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    cells.push(((i * 2654435761) >>> 0) % 3 === 0);
  }
  const corner = (r: number, c: number) =>
    (r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3);
  return (
    <div className="grid w-full h-full" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {cells.map((on, idx) => {
        const r = Math.floor(idx / size), c = idx % size;
        const isCornerRing = corner(r, c) && (r === 0 || c === 0 || r === 2 || c === 2 || r === size - 1 || c === size - 1 || r === size - 3 || c === size - 3);
        const isCornerFill = corner(r, c) && r >= 0 && c >= 0;
        const filled = isCornerFill ? isCornerRing || (r >= 6 - 6 && r <= 6 && c >= 6 - 6 && c <= 6 && false) : on;
        return <div key={idx} className={filled ? "bg-background" : "bg-transparent"} />;
      })}
    </div>
  );
}

/* ---------------- Seller / Buyer Split ---------------- */
function SellerBuyerSplit({ onSeller, onBuyer }: { onSeller: () => void; onBuyer: () => void }) {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">
        <div className="card-premium rounded-3xl p-10 hover:border-primary/40 transition">
          <div className="text-4xl">🎤</div>
          <h3 className="font-display text-3xl mt-4">For Organizers</h3>
          <p className="mt-3 text-muted-foreground">Create events, set pricing tiers, manage inventory, and track sales in real-time. Get paid safely after each event.</p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>• Beautiful listing pages</li>
            <li>• Real-time sales dashboard</li>
            <li>• Automated payouts</li>
          </ul>
          <button onClick={onSeller} className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-primary/40 hover:bg-primary/10 transition text-sm font-semibold">
            🔒 Become a Seller
          </button>
        </div>
        <div className="card-premium rounded-3xl p-10 hover:border-primary/40 transition">
          <div className="text-4xl">🎟️</div>
          <h3 className="font-display text-3xl mt-4">For Buyers</h3>
          <p className="mt-3 text-muted-foreground">Search by artist, city, or vibe. Buy in seconds, save favourites, and keep every ticket in one wallet.</p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>• Smart search & filters</li>
            <li>• Save & share concerts</li>
            <li>• Wallet with QR history</li>
          </ul>
          <button onClick={onBuyer} className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-gold text-primary-foreground shadow-gold text-sm font-semibold">
            🔒 Login to Buy
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
function CTA({ onStart }: { onStart: () => void }) {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto text-center card-premium rounded-3xl p-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,215,120,0.25),transparent_60%)]" />
        <div className="relative">
          <h2 className="font-display text-4xl md:text-6xl">Ready for your <span className="text-gradient-gold">next night out?</span></h2>
          <p className="mt-4 text-muted-foreground text-lg">Create an account in seconds. Your first QR is on us.</p>
          <button onClick={onStart} className="mt-8 inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold hover:scale-[1.02] transition">
            Get Started →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer className="border-t border-border/60 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold">L</div>
            <span className="font-display text-lg">Live<span className="text-gradient-gold">Beat</span></span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Premium tickets to the world's most unforgettable nights.</p>
        </div>
        <FooterCol title="Contact" items={["hello@livebeat.co", "+1 (555) 010-2024", "24/7 chat support"]} />
        <FooterCol title="Support" items={["Help center", "Refund policy", "Ticket transfer", "Report an issue"]} />
        <div>
          <div className="font-semibold mb-4">Follow</div>
          <div className="flex gap-3">
            {["𝕏", "IG", "TT", "FB"].map(s => (
              <a key={s} href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-sm hover:bg-primary/10 hover:border-primary/40 transition">{s}</a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <span>© 2026 LiveBeat. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="font-semibold mb-4">{title}</div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map(i => <li key={i}><a href="#" className="hover:text-foreground transition">{i}</a></li>)}
      </ul>
    </div>
  );
}

/* ---------------- Section Title ---------------- */
function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.3em] text-primary">{eyebrow}</div>
      <h2 className="font-display text-4xl md:text-5xl mt-3">{title}</h2>
    </div>
  );
}

/* ---------------- Login Modal ---------------- */
function LoginModal({ reason, onClose }: { reason: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="card-premium rounded-3xl p-8 max-w-md w-full shadow-elegant relative">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center">✕</button>
        <div className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center text-primary-foreground text-2xl mx-auto shadow-gold">🔒</div>
        <h3 className="font-display text-2xl text-center mt-4">Login required</h3>
        <p className="text-center text-muted-foreground mt-2 text-sm">{reason}</p>
        <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          <input type="email" required placeholder="Email address" className="w-full px-4 py-3 rounded-xl bg-input border border-border focus:border-primary/60 focus:outline-none text-sm" />
          <input type="password" required placeholder="Password" className="w-full px-4 py-3 rounded-xl bg-input border border-border focus:border-primary/60 focus:outline-none text-sm" />
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-gold text-primary-foreground font-semibold text-sm shadow-gold">Sign In</button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          New here? <a href="#" className="text-primary hover:underline">Create an account</a>
        </div>
      </div>
    </div>
  );
}

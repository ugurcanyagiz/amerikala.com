import Image from "next/image";
import Link from "next/link";
import { Instagram, Scissors, Sparkles, Star } from "lucide-react";

const services = [
  {
    title: "Signature Cut & Styling",
    copy: "Precision cuts tailored to face shape, texture, and lifestyle with a camera-ready finish.",
    price: "From $95",
  },
  {
    title: "Lived-In Color",
    copy: "Dimensional balayage and glossing for rich tone, effortless grow-out, and luminous movement.",
    price: "From $180",
  },
  {
    title: "Luxury Blowout",
    copy: "Voluminous, silky blowouts with long-wear hold for events, photoshoots, or your everyday glow.",
    price: "From $70",
  },
];

const stylists = [
  { name: "Mia Laurent", role: "Creative Director", image: "/1bg.png" },
  { name: "Noah Reyes", role: "Color Specialist", image: "/2bg.png" },
  { name: "Sofia Bennett", role: "Stylist & Texture Artist", image: "/3bg.png" },
];

const testimonials = [
  "Best salon experience I’ve had in years. My hair looks luxe but still feels like me.",
  "The whole vibe is elevated and friendly. People literally stop me to ask who does my color.",
  "Booked once and never looked back. Team Hair Pro made me feel confident from the second I walked in.",
  "They understand style, movement, and face shape better than anyone. 10/10.",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#141313] text-[#f5f2ed]">
      <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-8 md:px-8">
        <header className="sticky top-4 z-40 mb-10 rounded-full border border-[#c8ab78]/35 bg-[#1e1b19]/55 px-6 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Team Hair Pro" width={36} height={36} className="h-9 w-9" />
              <span className="text-sm font-semibold tracking-[0.18em] text-[#f4e8d3]">TEAM HAIR PRO</span>
            </div>
            <nav className="hidden items-center gap-7 text-sm text-[#e9ddca]/85 md:flex">
              {[
                "Services",
                "Looks",
                "Experience",
                "Team",
                "Reviews",
                "Contact",
              ].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="transition hover:text-white">
                  {item}
                </a>
              ))}
              <a href="#instagram" aria-label="Instagram" className="rounded-full border border-[#d8be8f]/40 p-2 hover:bg-[#d8be8f]/10">
                <Instagram size={16} />
              </a>
            </nav>
            <Link
              href="#book"
              className="rounded-full bg-[#d4b27e] px-5 py-2 text-sm font-semibold text-[#191714] transition hover:-translate-y-0.5 hover:bg-[#e3c38e]"
            >
              Book Now
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-10 pb-14 md:grid-cols-[1.02fr_1fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4b27e]/40 px-4 py-1 text-xs tracking-[0.2em] text-[#e9d2ab]">
              <Sparkles size={14} /> PREMIUM SALON EXPERIENCE
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-[#f8f5ef] md:text-6xl">
              Hair that moves, shines, and owns every room you walk into.
            </h1>
            <p className="mt-5 max-w-xl text-base text-[#dbcfbf] md:text-lg">
              Team Hair Pro blends editorial craftsmanship with social-first beauty energy. Come for the transformation,
              leave with unstoppable confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="#book" className="rounded-full bg-[#d4b27e] px-6 py-3 font-semibold text-[#1d1915] transition hover:bg-[#e6c591]">
                Reserve Appointment
              </Link>
              <Link href="#looks" className="rounded-full border border-[#f4ebdc]/35 px-6 py-3 font-semibold text-[#f7efe3] transition hover:bg-white/10">
                Explore Looks
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-[#d4b27e]/25 blur-2xl" />
            <Image
              src="/background.png"
              alt="Editorial salon model"
              width={700}
              height={850}
              className="h-[500px] w-full rounded-[2rem] border border-white/10 object-cover shadow-2xl"
              priority
            />
          </div>
        </section>

        <section className="mb-16 grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md md:grid-cols-3">
          {[
            ["4.9", "Average Google Rating"],
            ["1,200+", "Happy Guest Reviews"],
            ["Top 1%", "Premium Color & Styling Team"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-3xl font-bold text-[#edd7b2]">{value}</p>
              <p className="mt-1 text-sm text-[#d8cab4]">{label}</p>
            </div>
          ))}
        </section>

        <section id="services" className="mb-20">
          <h2 className="mb-6 text-3xl font-semibold">Signature Services</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.title}
                className="group rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.02] p-6 transition hover:-translate-y-1 hover:border-[#d4b27e]/45"
              >
                <Scissors className="text-[#e6c691]" size={20} />
                <h3 className="mt-4 text-xl font-semibold">{service.title}</h3>
                <p className="mt-3 text-sm text-[#d7cab8]">{service.copy}</p>
                <p className="mt-5 text-sm font-semibold text-[#efd9b4]">{service.price}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="looks" className="mb-20">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-3xl font-semibold">Featured Looks</h2>
            <p className="text-sm text-[#cdbc9e]">Fresh color stories · movement · shine</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-2">
            <Image src="/1bg.png" alt="Styled look 1" width={400} height={460} className="h-full min-h-52 w-full rounded-3xl object-cover md:col-span-2 md:row-span-2" />
            <Image src="/2bg.png" alt="Styled look 2" width={300} height={220} className="h-full min-h-52 w-full rounded-3xl object-cover" />
            <Image src="/3bg.png" alt="Styled look 3" width={300} height={220} className="h-full min-h-52 w-full rounded-3xl object-cover" />
            <Image src="/4bg.png" alt="Styled look 4" width={300} height={220} className="h-full min-h-52 w-full rounded-3xl object-cover md:col-span-2" />
          </div>
        </section>

        <section id="experience" className="mb-20 grid gap-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:grid-cols-2 md:p-10">
          <Image src="/arkaplan.png" alt="Salon interior" width={700} height={600} className="h-full min-h-72 w-full rounded-3xl object-cover" />
          <div>
            <p className="text-xs tracking-[0.2em] text-[#d5b987]">THE SALON EXPERIENCE</p>
            <h2 className="mt-3 text-3xl font-semibold">Where luxury service meets social energy.</h2>
            <p className="mt-4 text-[#d8cdbd]">
              From music and mood to consultation and finish, every detail is designed to make your appointment feel
              elevated, relaxed, and deeply personal.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#efe2ca]">
              <li>• Personalized consultation + hair roadmap</li>
              <li>• Premium products curated for long-lasting results</li>
              <li>• Content-ready lighting for your reveal moment</li>
            </ul>
          </div>
        </section>

        <section id="team" className="mb-20">
          <h2 className="mb-6 text-3xl font-semibold">Meet the Team</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {stylists.map((member) => (
              <article key={member.name} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <Image src={member.image} alt={member.name} width={360} height={420} className="h-72 w-full rounded-2xl object-cover" />
                <h3 className="mt-4 text-xl font-semibold">{member.name}</h3>
                <p className="text-sm text-[#d9cab4]">{member.role}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="reviews" className="mb-20 overflow-hidden rounded-[2rem] border border-[#d7bf95]/25 bg-gradient-to-br from-[#26211e] to-[#171614] p-7 md:p-10">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.2em] text-[#cfb27e]">GOOGLE REVIEWS</p>
              <h2 className="mt-2 text-3xl font-semibold">Loved by our clients</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2">
              <Star className="text-[#f2cf8d]" size={16} />
              <span className="font-semibold">4.9 · 1,247 reviews</span>
            </div>
          </div>
          <div className="review-track flex gap-4">
            {[...testimonials, ...testimonials].map((quote, idx) => (
              <blockquote key={`${quote}-${idx}`} className="min-w-72 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-[#eadfcb]">
                “{quote}”
              </blockquote>
            ))}
          </div>
        </section>

        <section id="instagram" className="mb-20">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Team Hair Pro social avatar" width={44} height={44} className="h-11 w-11 rounded-full border border-white/20 bg-[#1f1c18] p-1" />
              <div>
                <p className="font-semibold">@teamhairpro</p>
                <p className="text-sm text-[#d0c0a5]">Daily transformations · reel-ready finishes</p>
              </div>
            </div>
            <a className="rounded-full border border-[#d8be8f]/35 px-5 py-2 text-sm hover:bg-white/10" href="#">
              Follow on Instagram
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {["/1bg.png", "/2bg.png", "/3bg.png", "/4bg.png", "/background.png"].map((src) => (
              <Image key={src} src={src} alt="Instagram salon post" width={260} height={320} className="h-56 w-full rounded-3xl object-cover transition duration-300 hover:-translate-y-1 hover:brightness-110" />
            ))}
          </div>
        </section>

        <section id="book" className="rounded-[2.2rem] border border-[#d8be8f]/40 bg-[#f0dfc5] px-8 py-12 text-center text-[#1f1a16]">
          <p className="text-xs tracking-[0.2em] text-[#7f6340]">READY FOR YOUR TRANSFORMATION?</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold md:text-4xl">Your next signature look starts at Team Hair Pro.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[#5f4e39]">Limited high-demand slots each week. Book now and let our team craft your best hair day yet.</p>
          <div className="mt-8 flex justify-center">
            <Link href="#" className="rounded-full bg-[#1d1815] px-7 py-3 font-semibold text-[#f7eddd] hover:bg-black">
              Book Appointment
            </Link>
          </div>
        </section>
      </div>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-[#bcae98]">© {new Date().getFullYear()} Team Hair Pro · Luxury Hair Studio</footer>

      <style jsx global>{`
        .review-track {
          animation: floatReviews 30s linear infinite;
        }

        @keyframes floatReviews {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

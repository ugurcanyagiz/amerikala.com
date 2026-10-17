import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Destek | Amerikala",
  description: "Amerikala uygulaması için yardım ve iletişim.",
  alternates: { canonical: "https://www.amerikala.com/support" },
};

export default function SupportPage() {
  return (
    <main lang="tr" className="min-h-screen bg-[#F8F7F4] px-5 py-12 text-[#192B43] sm:py-20">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xl font-bold">amerikala<span className="text-[#C43737]">.</span></Link>
        <h1 className="mb-5 mt-12 text-4xl font-semibold">Nasıl yardımcı olabiliriz?</h1>
        <p className="mb-8 leading-8 text-[#52657A]">Amerikala iOS ve Android uygulamalarıyla ilgili sorun, geri bildirim ve özellik önerileriniz için bize yazın.</p>
        <section className="rounded-3xl border border-[#E4E9ED] bg-white p-6 sm:p-10">
          <h2 className="mb-4 text-xl font-semibold">Destek ve iletişim</h2>
          <a href="mailto:info@amerikala.com" className="break-words text-lg font-semibold text-[#9C2C2C] underline underline-offset-4">info@amerikala.com</a>
          <p className="mt-5 leading-8 text-[#52657A]">Sorunu açıklarken uygulama sürümünü, cihaz modelini, iOS veya Android sürümünü ve sorunun oluştuğu adımları paylaşın. Gerekirse kişisel bilgileri gizlenmiş bir ekran görüntüsü ekleyin. Şifrenizi veya doğrulama kodunuzu göndermeyin.</p>
          <h2 className="mb-4 mt-8 text-xl font-semibold">Hesap, içerik ve gizlilik konuları</h2>
          <p className="leading-8 text-[#52657A]">Hesabınıza erişim, bir içerikle ilgili şikâyet veya kişisel bilgileriniz hakkında soru için aynı adresten bize ulaşabilirsiniz. İlgili ekranı veya içeriği belirtin; özel mesajları ya da başka kişilerin kişisel bilgilerini gereksiz yere paylaşmayın.</p>
          <p className="mt-5 leading-8"><Link href="/privacy" className="text-[#9C2C2C] underline underline-offset-4">Gizlilik politikası</Link></p>
        </section>
        <Link href="/" className="mt-8 inline-block text-sm underline underline-offset-4">Ana sayfaya dön</Link>
      </div>
    </main>
  );
}

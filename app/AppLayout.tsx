import Navbar from "./components/Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="section-neutral">
        <div className="app-container py-6 sm:py-8">{children}</div>
      </main>
    </>
  );
}

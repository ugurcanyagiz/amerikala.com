import type { Metadata } from "next";
import SeekerListingDetailClient from "./seeker-listing-detail-client";

export const metadata: Metadata = {
  title: "İş Arayan Detayı | Amerikala",
  description: "İş arayan profilinin detaylarını görüntüleyin ve iletişime geçin.",
};

export default function SeekerListingDetailPage() {
  return <SeekerListingDetailClient />;
}

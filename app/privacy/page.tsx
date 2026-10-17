import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Amerikala",
  description: "Learn how Amerikala handles information in its mobile community app.",
  alternates: { canonical: "https://amerikala.com/privacy" },
};

const sections = [
  {
    title: "1. Information we process",
    paragraphs: [
      "Depending on the features you use, Amerikala may process your account details (such as name, email address, city, state, profile photograph and optional biography), your public posts and listings, event participation, messages, and support requests.",
      "When you choose to upload photos or other media, that content may be stored to make your posts, profile or messages available. Authentication and technical services may process identifiers, device information, security events and diagnostic information required to operate and protect the service.",
      "If a feature asks for access to your camera, photo library, microphone or location, you can manage permission through your device settings. The exact access requested depends on the features enabled in your version of the app."
    ],
  },
  {
    title: "2. How information is used",
    paragraphs: [
      "We use relevant information to create and secure accounts, show profiles and user-generated content, provide search and discovery features, support events and listings, deliver messages and notifications, prevent abuse, respond to requests, and maintain service reliability.",
      "We do not treat private messages as public profile content. Content you publish to public listings, events or public profiles may be seen by other users according to the app's visibility settings."
    ],
  },
  {
    title: "3. Sign-in and service providers",
    paragraphs: [
      "The mobile app may offer sign-in with email, Google or Apple. Those sign-in options can provide account identifiers and basic account details based on the permissions and settings you choose.",
      "Amerikala uses service infrastructure for identity, data storage and app functionality, which may include Firebase and related Google services. Details of every active analytics, crash reporting, messaging, hosting and storage provider must be verified against the production app before this policy is published."
    ],
  },
  {
    title: "4. Sharing and visibility",
    paragraphs: [
      "Profile fields and content intentionally posted to public parts of Amerikala can be visible to other users. Messages are intended for the people participating in a conversation, subject to moderation, safety and legal requirements.",
      "Service providers may process information on our behalf to deliver authentication, hosting, storage, notifications or security operations. Information may also be disclosed if required by applicable law or to protect users and the service."
    ],
  },
  {
    title: "5. Retention and deletion",
    paragraphs: [
      "We retain data for as long as needed to provide the service, meet applicable legal obligations, maintain security, and resolve disputes. Retention periods may vary by category of information.",
      "You may request deletion of your account and associated personal information. Account-deletion instructions and the exact handling of posts, messages, backups and legally retained records must be confirmed against the released mobile app. Removing the app from your phone does not itself delete your account."
    ],
  },
  {
    title: "6. Your choices",
    paragraphs: [
      "You can change certain account information and communication preferences within the app where those controls are available. Your device settings allow you to manage notifications and access to camera, photos, microphone and location.",
      "Where applicable, you may request access, correction or deletion of your personal information, and exercise other rights provided by local law."
    ],
  },
  {
    title: "7. Security, children and international processing",
    paragraphs: [
      "We take reasonable measures intended to protect personal information; however, no online service can guarantee absolute security.",
      "The intended minimum age, child-safety policy and any age verification controls must be confirmed before publication. Personal information may be processed in locations where our service providers operate, subject to applicable law."
    ],
  },
  {
    title: "8. Policy updates and contact",
    paragraphs: [
      "We may update this notice as our features or practices change. Material changes will be communicated where required by law.",
      "For privacy questions or requests, contact info@amerikala.co. The responsible operator and this policy's effective date still require confirmation before App Store submission."
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#192B43]">
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
        <div className="mb-12 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight">amerikala<span className="text-[#C43737]">.</span></Link>
          <Link href="/" className="text-sm font-medium text-[#52657A] hover:text-[#C43737]">← Home</Link>
        </div>
        <div className="mb-12">
          <div className="mb-5 inline-flex rounded-full bg-[#FBE8E5] px-3 py-1 text-xs font-semibold text-[#9C2C2C]">Draft — requires verification before publication</div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#C43737]">Your data and privacy</p>
          <h1 className="mb-5 text-4xl font-semibold tracking-tight sm:text-5xl">Privacy Policy</h1>
          <p className="max-w-2xl text-base leading-8 text-[#52657A]">
            This draft describes data practices relevant to the Amerikala mobile community application.
            It must be reviewed against the released iOS and Android app and completed before being used for App Store submission.
          </p>
          <p className="mt-5 text-sm text-[#52657A]">Effective date: To be confirmed before publication</p>
        </div>
        <div className="space-y-10 rounded-[28px] border border-[#E4E9ED] bg-white p-6 shadow-sm sm:p-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-4 text-xl font-semibold">{section.title}</h2>
              <div className="space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-[15px] leading-8 text-[#52657A]">{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-[#788598]">© {new Date().getFullYear()} Amerikala · Privacy Policy draft</p>
      </div>
    </div>
  );
}

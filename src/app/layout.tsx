import type { Metadata } from "next";
import "./globals.css";
import GlobalChatBot from "@/components/GlobalChatBot"; // 🔥 नया इम्पोर्ट

export const metadata: Metadata = {
  title: "AyushGyaan | India's Premium AI-Powered BAMS Academy",
  description: "Master Charak Samhita, Ashtang Hridaya, and BAMS subjects with AyushGyaan's AI Lab. Get NCISM aligned syllabus, Shloka decoding, Padacheda, Vimarsh, Video Lectures, and Smart Analytics.",
  keywords: [
    "BAMS Online Classes", 
    "Charak Samhita PDF", 
    "AI Shloka Reader", 
    "Ayurvedic Medical Education", 
    "NCISM Syllabus 1st Prof",
    "BAMS 2nd Prof Notes",
    "Ayurveda AI Chatbot",
    "Ashtang Hridaya Sutrasthana",
    "AyushGyaan Academy"
  ],
  authors: [{ name: "AyushGyaan Academy" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "AyushGyaan | Smart AI Lab for BAMS Scholars",
    description: "Decode Charak Samhita with ease using Voice search, Image upload, and a strictly authenticated medical AI.",
    url: "https://www.ayushgyaan.com", 
    siteName: "AyushGyaan",
    images: [
      {
        url: "/og-image.jpg", 
        width: 1200,
        height: 630,
        alt: "AyushGyaan Premium BAMS Academy",
      }
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AyushGyaan | India's First AI BAMS Platform",
    description: "Revolutionizing Ayurvedic Education with Next-Gen AI.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased bg-[#020604] text-white">
        
        {children}

        {/* 🔥 हमारा स्मार्ट Auth-Aware चैटबॉट */}
        <GlobalChatBot />
        
      </body>
    </html>
  );
}
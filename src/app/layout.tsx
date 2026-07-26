import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // 1. Core SEO - Title & Description
  title: "AyushGyaan | India's Premium AI-Powered BAMS Academy",
  description: "Master Charak Samhita, Ashtang Hridaya, and BAMS subjects with AyushGyaan's AI Lab. Get NCISM aligned syllabus, Shloka decoding, Padacheda, Vimarsh, Video Lectures, and Smart Analytics.",
  
  // 2. Google Search Keywords
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
  
  // 3. Authorship
  authors: [{ name: "AyushGyaan Academy" }],
  
  // 4. Advanced Google Bot Instructions (To crawl the site effectively)
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
  
  // 5. OpenGraph (For WhatsApp, LinkedIn, Facebook Link Sharing Preview)
  openGraph: {
    title: "AyushGyaan | Smart AI Lab for BAMS Scholars",
    description: "Decode Charak Samhita with ease using Voice search, Image upload, and a strictly authenticated medical AI.",
    url: "https://www.ayushgyaan.com", // Aapka actual domain
    siteName: "AyushGyaan",
    images: [
      {
        url: "/og-image.jpg", // Pura project banne ke baad ek cover image public folder me daal denge
        width: 1200,
        height: 630,
        alt: "AyushGyaan Premium BAMS Academy",
      }
    ],
    locale: "en_IN",
    type: "website",
  },
  
  // 6. Twitter Card (For Twitter Sharing)
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
    // 'scroll-smooth' added for buttery smooth page navigation
    <html lang="en" className="scroll-smooth">
      {/* Global Dark Theme backgrounds applied directly to the body */}
      <body className="antialiased bg-[#020604] text-white">
        {children}
      </body>
    </html>
  );
}
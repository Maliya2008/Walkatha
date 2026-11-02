import React from 'react';
import { Home, ShieldCheck, FileText, Info, Mail, AlertTriangle } from 'lucide-react';

interface StaticPageProps {
  pageType: 'privacy' | 'terms' | 'dmca' | 'about' | 'contact' | 'disclaimer';
  onNavigateHome: () => void;
}

export const StaticPage: React.FC<StaticPageProps> = ({
  pageType,
  onNavigateHome,
}) => {
  const getPageConfig = () => {
    switch (pageType) {
      case 'privacy':
        return {
          icon: <ShieldCheck className="w-6 h-6 text-indigo-500" />,
          title: 'Privacy Policy & Cookie Disclosures',
          sinhalaTitle: 'පුද්ගලිකත්ව ප්‍රතිපත්තිය',
          content: (
            <>
              <p className="leading-relaxed">
                Walkathawa (වල් කතාව) respects the privacy of every reader and contributor. This Privacy Policy outlines our guidelines regarding data collection, cookies, and local browsing data.
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">1. Information Collection</h3>
              <p className="leading-relaxed">
                We do not require users to register or submit personal identifying information simply to read stories. Any reading preferences (such as dark mode, text size, and read history) are stored locally in your browser&apos;s localStorage and are never sent to external tracking servers.
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">2. Cookies and Storage</h3>
              <p className="leading-relaxed">
                We use standard, anonymous browser cookies and local storage tokens solely to maintain your preferred UI theme and reader settings. Third-party advertising networks that serve ads on this platform may use non-identifying cookies to serve relevant advertisements.
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">3. User Submissions</h3>
              <p className="leading-relaxed">
                Writers submitting stories through our admin submission desk acknowledge that their submitted fiction becomes public content upon editorial review. Authors retain copyright of their creative writing.
              </p>
            </>
          ),
        };
      case 'terms':
        return {
          icon: <FileText className="w-6 h-6 text-rose-500" />,
          title: 'Terms and Conditions of Use',
          sinhalaTitle: 'සේවා කොන්දේසි',
          content: (
            <>
              <p className="leading-relaxed">
                Welcome to Walkathawa (වල් කතාව). By accessing this website, reading stories, or interacting with our platform, you agree to comply with the following Terms and Conditions.
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">1. Adult Content & Age Restriction</h3>
              <p className="leading-relaxed">
                This platform publishes adult fiction, romantic literature, and mature stories intended exclusively for audiences of legal age (18+). If you are under 18 years of age or offended by adult fictional themes, please exit immediately.
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">2. Fictional Nature of Content</h3>
              <p className="leading-relaxed">
                All names, characters, places, and events published across our story collections are strictly products of author imagination or used fictitiously. Any resemblance to real persons, living or dead, or actual events is purely coincidental.
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">3. Intellectual Property</h3>
              <p className="leading-relaxed">
                Content published on Walkathawa may not be automatedly scraped, redistributed, republished, or sold without prior written consent from the editorial staff and respective authors.
              </p>
            </>
          ),
        };
      case 'dmca':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          title: 'DMCA & Copyright Notice',
          sinhalaTitle: 'ප්‍රකාශන හිමිකම් සහ DMCA',
          content: (
            <>
              <p className="leading-relaxed">
                Walkathawa respects the intellectual property rights of writers, artists, and creators. We strictly adhere to the provisions of the Digital Millennium Copyright Act (DMCA).
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Takedown Request Process</h3>
              <p className="leading-relaxed">
                If you believe your copyrighted literary work or art has been published on this platform without authorization, please submit a formal DMCA takedown request containing:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>Identification of the copyrighted work claimed to have been infringed.</li>
                <li>The exact URL on Walkathawa where the infringing material is located.</li>
                <li>Your contact information (name, address, email address).</li>
                <li>A statement of good faith belief that the disputed use is not authorized by the copyright owner.</li>
              </ul>
              <p className="mt-4 leading-relaxed">
                Submit DMCA notices directly to: <span className="font-mono text-rose-500">mchethiyabandara@gmail.com</span>. We review and remove verified infringing material within 24–48 hours.
              </p>
            </>
          ),
        };
      case 'about':
        return {
          icon: <Info className="w-6 h-6 text-sky-500" />,
          title: 'About Walkathawa',
          sinhalaTitle: 'අප ගැන (About Us)',
          content: (
            <>
              <p className="leading-relaxed">
                Walkathawa (වල් කතාව) is Sri Lanka’s premier digital Sinhala story platform, dedicated to publishing contemporary Sinhala creative literature, romantic novels, drama series, and engaging short stories.
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Our Mission</h3>
              <p className="leading-relaxed">
                Our mission is to provide Sinhala fiction enthusiasts with a modern, high-speed, and beautifully formatted reader experience. Featuring dark mode, adjustable typography, responsive layouts, and curated category collections, Walkathawa delivers distraction-free reading on all mobile and desktop devices.
              </p>
            </>
          ),
        };
      case 'contact':
        return {
          icon: <Mail className="w-6 h-6 text-emerald-500" />,
          title: 'Contact Editorial Desk',
          sinhalaTitle: 'සම්බන්ධ වන්න (Contact Us)',
          content: (
            <>
              <p className="leading-relaxed">
                We value feedback, story contributions, partnerships, and editorial inquiries.
              </p>
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mt-4 space-y-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Email Address:</p>
                <p className="font-mono text-rose-600 dark:text-rose-400 text-sm">mchethiyabandara@gmail.com</p>
                <p className="text-xs text-slate-500 mt-2">
                  Responses typically sent within 24 to 48 business hours.
                </p>
              </div>
            </>
          ),
        };
      case 'disclaimer':
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          title: 'Disclaimer & Advertising Policy',
          sinhalaTitle: 'වගකීම් පැහැර හැරීම (Disclaimer)',
          content: (
            <>
              <p className="leading-relaxed">
                The content published on Walkathawa (වල් කතාව) is meant strictly for entertainment purposes for consenting adults.
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">Third-Party Advertisements</h3>
              <p className="leading-relaxed">
                Advertisements displayed on this website are delivered by third-party ad networks. Walkathawa does not explicitly endorse external products, services, or destinations advertised through banners or sponsored links.
              </p>
            </>
          ),
        };
    }
  };

  const config = getPageConfig();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
        <button
          type="button"
          onClick={onNavigateHome}
          className="hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>මුල් පිටුව (Home)</span>
        </button>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-100 font-medium">{config.sinhalaTitle}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3.5 pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {config.icon}
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {config.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {config.sinhalaTitle} · Walkathawa (වල් කතාව)
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs text-sm sm:text-base text-slate-700 dark:text-slate-300 space-y-4">
        {config.content}
      </div>

      {/* Back button */}
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm transition-all cursor-pointer shadow-xs"
        >
          <Home className="w-4 h-4" />
          <span>මුල් පිටුවට යන්න (Return to Home)</span>
        </button>
      </div>
    </div>
  );
};

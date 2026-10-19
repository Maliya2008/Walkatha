# Deep-Dive Technical SEO, Indexing & Crawl Frequency Optimization Plan

A production-grade architectural plan to resolve Google Search Console low crawl frequency, eliminate ad-network crawler penalties, maximize organic search impressions for Sinhala story queries, and optimize organic ranking.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed based on your input:
> - **Primary Problem**: Low crawl frequency and impressions in Google Search Console without explicit fatal errors.
> - **Ad Script Isolation**: Detect search engine crawlers (Googlebot, Bingbot, Google-InspectionTool, etc.) and strictly prevent intrusive popunder, social bar, and redirect ad scripts from running during crawler rendering.
> - **Target Audience & Traffic Source**: Organic Google Search queries for Sinhala stories, novels, romantic fiction, and short stories (`සිංහල කතා`, `wal katha`, `sinhala novels`, `aluth katha`).

---

### 1. Overview & Core Concept

- **The Problem**: 
  - Third-party CPM ad scripts (popunders from `profitableratecpmnetwork.com` and `highperformanceformat.com`) execute in Googlebot's Web Rendering Service (WRS), causing rendering stalls, window open attempts, and algorithmic suppression under Google's "Abusive Experiences" and "Intrusive Interstitials" policies.
  - Low crawl budget allocation due to lack of deep contextual internal linking and flat category pages.
  - Insufficient organic keyword density and metadata depth for high-intent Sinhala search terms.
- **The Solution**:
  1. **Crawler-Safe Ad Cloaking Protection**: Ensure third-party ad scripts are only injected for human readers and completely disabled for search engine user-agents (Googlebot, Bingbot, Google-InspectionTool).
  2. **High-Impact Organic SEO Metadata**: Upgrade `<title>`, `<meta name="description">`, OpenGraph, and JSON-LD schema with natural Sinhala search terms, word counts, reading duration, and content classifications.
  3. **Contextual Internal Linking Network**: Link every story to 4–6 related stories in the same taxonomy with keyword-rich crawlable anchor text, creating deep crawl paths for Googlebot to index the entire story catalog.
  4. **Performance & Core Web Vitals**: Ensure instantaneous TTFB (<200ms) with `stale-while-revalidate` caching, eliminating layout shifts (CLS) on ad slots.

---

### 2. User Experience & Visual Design

- **User & Crawler Flows**:
  - **Googlebot**: Fetches SSR HTML -> identifies zero intrusive scripts -> immediately parses complete article content, semantic `<h1>` through `<h3>`, Article JSON-LD, breadcrumb trail, and contextual related story links -> crawls uninterrupted.
  - **Human Reader**: Arrives from Google Search -> reads story with comfortable typography, night/sepia mode, and clean navigation -> non-intrusive ads display smoothly without blocking content.
- **Content Presentation**:
  - Clear editorial layout: Story Title, Publication Date, Category Badge, Reading Time, Story Body, Share Buttons, Related Stories Grid, and Pagination Navigation.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Bot Detection & Ad Isolation**
  - *Chosen Approach*: Identify bot user-agents in both server-side HTML generation and client-side script loaders, skipping all CPM ad and popunder tags for automated search bots.
  - *Why*: Eliminates crawler execution timeouts and protects the site from Google's interstitial penalties.
  - *Alternatives Considered*: Showing ads to bots (damages crawl frequency and Search Console ranking).
- **Decision 2: Rich Semantic Article Schema with Word Count & Language**
  - *Chosen Approach*: Enhance JSON-LD with `inLanguage: "si"`, `articleSection`, `wordCount`, `timeRequired`, `publisher`, and `mainEntityOfPage`.
  - *Why*: Directly powers Google Search Rich Snippets and carousel listings.
- **Decision 3: Deep Contextual Related Story Links**
  - *Chosen Approach*: Server render a dedicated "තවත් සමාන කතා" (Related Stories) section inside the SSR HTML of every story page.
  - *Why*: Provides direct crawl pathways from indexed stories to newly published or deeper stories, solving "Discovered - currently not indexed".

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 Incoming Request (HTTP/S)                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express Host & Bot Detector                 │
│  - User-Agent Inspection (Googlebot, Bingbot, etc.)         │
│  - Apex -> WWW 301 Canonical Redirect                       │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
       Search Engine Bot                 Human Visitor
               │                               │
               ▼                               ▼
┌──────────────────────────────┐┌──────────────────────────────┐
│       Pristine SSR HTML      ││     Standard Interactive     │
│  - Clean Semantic HTML       ││  - Full Reader UI           │
│  - Full Article Text + H1    ││  - Controlled CPM Ads       │
│  - No Popunder / Ad Scripts  ││  - Dark / Sepia Theme       │
│  - Rich Article JSON-LD      ││  - Client-Side Navigation   │
│  - Contextual Internal Links ││                             │
└──────────────────────────────┘└──────────────────────────────┘
               │                               │
               └───────────────┬───────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Live Data & Sitemap Engine                  │
│  - Real-time onSnapshot Firestore Sync                      │
│  - Dynamic XML Sitemaps with genuine <lastmod>              │
│  - Stale-While-Revalidate HTTP Caching (Instant TTFB)       │
└─────────────────────────────────────────────────────────────┘
```

#### Step-by-Step Implementation Sequence:
1. **Crawler-Safe Ad Script Guard (`index.html` & `server.ts`)**:
   - Add user-agent bot detection utility to ensure popunder and social bar ad scripts are never injected for Googlebot, Bingbot, or search inspection tools.
2. **Contextual Internal Linking Network (`server.ts`)**:
   - Enhance `renderStorySeo` to server-render a crawlable "සමාන කතා (Related Stories)" grid on every story page, establishing deep crawl paths across all categories.
3. **Advanced Schema & Meta Optimization (`server.ts`)**:
   - Enrich story metadata with accurate reading time, word count, genre classifications, and `Article` schema properties.
4. **Core Web Vitals & Caching Optimization (`vercel.json` & `server.ts`)**:
   - Configure optimized `Cache-Control` headers (`s-maxage=1800, stale-while-revalidate=86400`) to maximize crawl speed and TTFB.
5. **Verification & Testing (`scripts/verify-seo.ts`)**:
   - Extend test suite to verify bot isolation, related stories internal linking, and rich article schema properties.

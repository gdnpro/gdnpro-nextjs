import { Preload } from "@/interfaces/Preload"

interface Props {
  title?: string
  description?: string
  keywords?: string
  author?: string
  preload?: Array<Preload>
  canonical?: string
  image?: string
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
  type?: "website" | "article" | "product" | "profile"
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  locale?: string
  alternateLocales?: string[]
  noindex?: boolean
  nofollow?: boolean
  structuredData?: object
  siteName?: string
  twitterHandle?: string
  facebookAppId?: string
  googleSiteVerification?: string
  bingSiteVerification?: string
}

export default function SEO({
  title = "GDN Pro | Desarrollo Web, Apps Móviles y Marketing Digital",
  description = "GDN Pro es una plataforma en la que desarrolladores freelancers y clientes en búsqueda de trabajadores se encuentran y llegan a acuerdos corporativos. En GDN PRO creamos soluciones digitales innovadoras. Desarrollo web, apps móviles y marketing digital de clase mundial.",
  keywords = "desarrollo web, aplicaciones móviles, marketing digital, freelancers, desarrollo de software, diseño web, apps iOS, apps Android, SEO, consultoría tecnológica, GDN Pro",
  author = "GDN Pro",
  preload,
  canonical = "https://gdnpro.com/",
  image = "https://gdnpro.com/images/embedded-img.webp",
  imageAlt = "GDN Pro - Desarrollo Web, Apps Móviles y Marketing Digital",
  imageWidth = 1200,
  imageHeight = 630,
  type = "website",
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  locale = "es_ES",
  alternateLocales = [],
  noindex = false,
  nofollow = false,
  structuredData,
  siteName = "GDN Pro",
  twitterHandle = "@gdnpro",
  facebookAppId,
  googleSiteVerification,
  bingSiteVerification,
}: Props) {
  const imageUrl = new URL(image, canonical).toString()
  const fullTitle = title.includes("GDN Pro") ? title : `${title} | GDN Pro`
  const robotsContent = `${noindex ? "noindex" : "index"}, ${nofollow ? "nofollow" : "follow"}, max-image-preview:large, max-snippet:-1, max-video-preview:-1`

  // Default structured data if not provided
  const defaultStructuredData = structuredData || {
    "@context": "https://schema.org",
    "@type": type === "article" ? "Article" : "WebSite",
    name: siteName,
    url: canonical,
    description: description,
    image: imageUrl,
    publisher: {
      "@type": "Organization",
      name: "GDN Pro",
      logo: {
        "@type": "ImageObject",
        url: "https://gdnpro.com/logo.png",
      },
    },
    ...(type === "article" && {
      headline: title,
      datePublished: publishedTime,
      dateModified: modifiedTime || publishedTime,
      author: {
        "@type": "Organization",
        name: author,
      },
      ...(section && { articleSection: section }),
      ...(tags.length > 0 && { keywords: tags.join(", ") }),
    }),
  }

  return (
    <>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta charSet="UTF-8" />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />
      <meta name="robots" content={robotsContent} />
      <meta name="language" content="Spanish" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Viewport and Theme */}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
      />
      <meta name="theme-color" content="#0891b2" />
      <meta name="msapplication-TileColor" content="#0891b2" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* Canonical and Alternate Links */}
      <link rel="canonical" href={canonical} />
      {alternateLocales.map((altLocale) => (
        <link key={altLocale} rel="alternate" hrefLang={altLocale} href={canonical} />
      ))}
      <link rel="alternate" hrefLang={locale} href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      {/* Author and Publisher */}
      <link rel="author" href="https://www.linkedin.com/in/rikirilis" />
      <link rel="publisher" href="https://gdnpro.com" />

      {/* Preload Resources */}
      {preload?.map((p, i) => (
        <link
          key={i}
          rel={p.rel ?? "preload"}
          href={p.href}
          {...(p.as ? { as: p.as } : {})}
          {...(p.type ? { type: p.type } : {})}
          {...(p.crossorigin ? { crossOrigin: p.crossorigin } : {})}
        />
      ))}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:secure_url" content={imageUrl} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:image:width" content={imageWidth.toString()} />
      <meta property="og:image:height" content={imageHeight.toString()} />
      <meta property="og:image:type" content="image/webp" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      {alternateLocales.map((altLocale) => (
        <meta key={altLocale} property="og:locale:alternate" content={altLocale} />
      ))}
      {facebookAppId && <meta property="fb:app_id" content={facebookAppId} />}

      {/* Article specific Open Graph tags */}
      {type === "article" && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
          <meta property="article:author" content={author} />
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageAlt} />
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
      {twitterHandle && <meta name="twitter:creator" content={twitterHandle} />}

      {/* Site Verification */}
      {googleSiteVerification && (
        <meta name="google-site-verification" content={googleSiteVerification} />
      )}
      {bingSiteVerification && (
        <meta name="msvalidate.01" content={bingSiteVerification} />
      )}

      {/* Favicons and Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.webmanifest" />

      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(defaultStructuredData) }}
      />

      {/* Additional Organization Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "GDN Pro",
            url: "https://gdnpro.com",
            logo: "https://gdnpro.com/logo.png",
            description:
              "Transformamos ideas en realidad digital. Expertos en desarrollo web, apps móviles y marketing digital.",
            email: "contact@gdnpro.com",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Newark",
              addressRegion: "DE",
              addressCountry: "US",
            },
            sameAs: [
              "https://linkedin.com/company/gdnpro",
              "https://twitter.com/gdnpro",
              "https://instagram.com/gdnpro",
              "https://github.com/gdnpro",
            ],
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer service",
              email: "contact@gdnpro.com",
            },
          }),
        }}
      />

      {/* Fonts and External Stylesheets */}
      <link
        href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap"
        rel="stylesheet"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.5.0/remixicon.min.css"
      />
    </>
  )
}

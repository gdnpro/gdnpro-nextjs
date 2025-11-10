"use client"

import LanguageSelector from "@/components/ui/LanguageSelector"
import { useTranslation } from "react-i18next"

export default function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  // Schema.org structured data for SEO
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GDN Pro",
    url: "https://gdnpro.com",
    logo: "https://gdnpro.com/logo.png",
    description: t("footer.description"),
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
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GDN Pro",
    url: "https://gdnpro.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://gdnpro.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <footer
      className="relative overflow-hidden bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white"
      itemScope
      itemType="https://schema.org/WPFooter"
    >
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="bg-primary absolute top-0 left-1/4 h-96 w-96 rounded-full blur-3xl"></div>
        <div className="bg-primary absolute right-1/4 bottom-0 h-96 w-96 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-12 lg:gap-16">
          {/* Brand Section */}
          <div
            className="space-y-6 md:col-span-4 lg:col-span-5"
            itemScope
            itemType="https://schema.org/Organization"
          >
            <div className="group w-fit">
              <a href="/" aria-label={`GDN Pro - ${t("header.menu.home")}`} itemProp="url">
                <img
                  src="/logo.png"
                  alt="GDN Pro - Desarrollo Web, Apps Móviles y Marketing Digital"
                  className="h-12 w-auto transition-transform duration-300 group-hover:scale-105 sm:h-14"
                  itemProp="logo"
                  width="auto"
                  height="56"
                />
              </a>
            </div>
            <p
              className="max-w-md text-base leading-relaxed text-gray-300 sm:text-lg"
              itemProp="description"
            >
              {t("footer.description")}
            </p>

            {/* Contact Information for SEO */}
            <div
              className="space-y-2 text-sm text-gray-400"
              itemScope
              itemType="https://schema.org/ContactPoint"
            >
              <div className="flex items-center gap-2">
                <i className="ri-mail-line text-primary"></i>
                <a
                  href="mailto:contact@gdnpro.com"
                  className="transition-colors hover:text-white"
                  itemProp="email"
                >
                  contact@gdnpro.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-map-pin-line text-primary"></i>
                <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                  <span itemProp="addressLocality">New Jersey</span>,{" "}
                  <span itemProp="addressCountry">US</span>
                </span>
              </div>
            </div>

            {/* Social Media Links */}
            <nav aria-label={t("footer.social.linkedin")} className="flex items-center gap-4 pt-2">
              <a
                href="https://linkedin.com/company/gdnpro"
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={t("footer.social.linkedin")}
                className="group hover:bg-primary hover:border-primary/50 relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-gray-700/50 bg-gray-800/50 transition-all duration-300 hover:scale-110"
                itemProp="sameAs"
              >
                <i className="ri-linkedin-line text-lg text-gray-400 transition-colors group-hover:text-white"></i>
              </a>
              <a
                href="https://twitter.com/gdnpro"
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={t("footer.social.twitter")}
                className="group hover:bg-primary hover:border-primary/50 relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-gray-700/50 bg-gray-800/50 transition-all duration-300 hover:scale-110"
                itemProp="sameAs"
              >
                <i className="ri-twitter-line text-lg text-gray-400 transition-colors group-hover:text-white"></i>
              </a>
              <a
                href="https://instagram.com/gdnpro"
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={t("footer.social.instagram")}
                className="group hover:bg-primary hover:border-primary/50 relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-gray-700/50 bg-gray-800/50 transition-all duration-300 hover:scale-110"
                itemProp="sameAs"
              >
                <i className="ri-instagram-line text-lg text-gray-400 transition-colors group-hover:text-white"></i>
              </a>
              <a
                href="https://github.com/gdnpro"
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={t("footer.social.github")}
                className="group hover:bg-primary hover:border-primary/50 relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-gray-700/50 bg-gray-800/50 transition-all duration-300 hover:scale-110"
                itemProp="sameAs"
              >
                <i className="ri-github-line text-lg text-gray-400 transition-colors group-hover:text-white"></i>
              </a>
            </nav>
          </div>

          {/* Links Section */}
          <nav
            className="grid grid-cols-2 gap-8 md:col-span-4 lg:col-span-4 lg:gap-12"
            aria-label={t("footer.sections.services")}
          >
            <div>
              <h2 className="relative mb-6 inline-block text-lg font-bold text-white sm:text-xl">
                {t("footer.sections.services")}
                <span className="bg-primary absolute -bottom-2 left-0 h-0.5 w-8 rounded-full"></span>
              </h2>
              <ul className="space-y-3.5" role="list">
                <li>
                  <a
                    href="/#services"
                    title={`${t("footer.links.webDevelopment")} - GDN Pro`}
                    className="group block cursor-pointer py-1.5 text-sm text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white sm:text-base"
                  >
                    <span className="flex items-center gap-2">
                      <span className="bg-primary h-0.5 w-0 rounded-full transition-all duration-200 group-hover:w-1.5"></span>
                      {t("footer.links.webDevelopment")}
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="/#services"
                    title={`${t("footer.links.mobileDevelopment")} - GDN Pro`}
                    className="group block cursor-pointer py-1.5 text-sm text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white sm:text-base"
                  >
                    <span className="flex items-center gap-2">
                      <span className="bg-primary h-0.5 w-0 rounded-full transition-all duration-200 group-hover:w-1.5"></span>
                      {t("footer.links.mobileDevelopment")}
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="/#services"
                    title={`${t("footer.links.digitalMarketing")} - GDN Pro`}
                    className="group block cursor-pointer py-1.5 text-sm text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white sm:text-base"
                  >
                    <span className="flex items-center gap-2">
                      <span className="bg-primary h-0.5 w-0 rounded-full transition-all duration-200 group-hover:w-1.5"></span>
                      {t("footer.links.digitalMarketing")}
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="/freelancers"
                    title={`${t("footer.links.freelancerNetwork")} - GDN Pro`}
                    className="group block cursor-pointer py-1.5 text-sm text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white sm:text-base"
                  >
                    <span className="flex items-center gap-2">
                      <span className="bg-primary h-0.5 w-0 rounded-full transition-all duration-200 group-hover:w-1.5"></span>
                      {t("footer.links.freelancerNetwork")}
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="/#contact"
                    title={`${t("footer.links.consulting")} - GDN Pro`}
                    className="group block cursor-pointer py-1.5 text-sm text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white sm:text-base"
                  >
                    <span className="flex items-center gap-2">
                      <span className="bg-primary h-0.5 w-0 rounded-full transition-all duration-200 group-hover:w-1.5"></span>
                      {t("footer.links.consulting")}
                    </span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="relative mb-6 inline-block text-lg font-bold text-white sm:text-xl">
                {t("footer.sections.company")}
                <span className="bg-primary absolute -bottom-2 left-0 h-0.5 w-8 rounded-full"></span>
              </h2>
              <ul className="space-y-3.5" role="list">
                <li>
                  <a
                    href="/#about"
                    title={`${t("footer.links.about")} - GDN Pro`}
                    className="group block cursor-pointer py-1.5 text-sm text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white sm:text-base"
                  >
                    <span className="flex items-center gap-2">
                      <span className="bg-primary h-0.5 w-0 rounded-full transition-all duration-200 group-hover:w-1.5"></span>
                      {t("footer.links.about")}
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="/#portfolio"
                    title={`${t("footer.links.portfolio")} - GDN Pro`}
                    className="group block cursor-pointer py-1.5 text-sm text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white sm:text-base"
                  >
                    <span className="flex items-center gap-2">
                      <span className="bg-primary h-0.5 w-0 rounded-full transition-all duration-200 group-hover:w-1.5"></span>
                      {t("footer.links.portfolio")}
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="/#team"
                    title={`${t("footer.links.team")} - GDN Pro`}
                    className="group block cursor-pointer py-1.5 text-sm text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white sm:text-base"
                  >
                    <span className="flex items-center gap-2">
                      <span className="bg-primary h-0.5 w-0 rounded-full transition-all duration-200 group-hover:w-1.5"></span>
                      {t("footer.links.team")}
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="/#testimonials"
                    title={`${t("footer.links.testimonials")} - GDN Pro`}
                    className="group block cursor-pointer py-1.5 text-sm text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white sm:text-base"
                  >
                    <span className="flex items-center gap-2">
                      <span className="bg-primary h-0.5 w-0 rounded-full transition-all duration-200 group-hover:w-1.5"></span>
                      {t("footer.links.testimonials")}
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          {/* Newsletter Section */}
          <div className="md:col-span-4 lg:col-span-3">
            <h2 className="relative mb-3 inline-block text-lg font-bold text-white sm:text-xl">
              {t("footer.newsletter.title")}
              <span className="bg-primary absolute -bottom-2 left-0 h-0.5 w-8 rounded-full"></span>
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-gray-300 sm:text-base">
              {t("footer.newsletter.description")}
            </p>
            <form
              className="space-y-3"
              onSubmit={(e) => e.preventDefault()}
              aria-label={t("footer.newsletter.title")}
            >
              <div className="relative">
                <label htmlFor="email-footer" className="sr-only">
                  {t("footer.newsletter.emailPlaceholder")}
                </label>
                <input
                  id="email-footer"
                  name="email"
                  type="email"
                  placeholder={t("footer.newsletter.emailPlaceholder")}
                  required
                  className="focus:ring-primary focus:border-primary min-h-[44px] w-full rounded-xl border border-gray-700/50 bg-gray-800/50 px-4 py-3.5 text-sm text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-200 hover:border-gray-600 focus:ring-2 focus:outline-none"
                  autoComplete="email"
                  aria-label={t("footer.newsletter.emailPlaceholder")}
                  aria-required="true"
                />
              </div>
              <button
                type="submit"
                className="from-primary hover:to-primary hover:shadow-primary/20 min-h-[44px] w-full cursor-pointer touch-manipulation rounded-xl bg-gradient-to-r to-cyan-600 py-3.5 font-semibold whitespace-nowrap text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-cyan-600 active:scale-[0.98] active:from-cyan-700 active:to-cyan-800"
                aria-label={t("footer.newsletter.subscribe")}
              >
                {t("footer.newsletter.subscribe")}
              </button>
            </form>
          </div>

          {/* Language Selector - Mobile Only */}
          <div className="flex items-center justify-center md:hidden">
            <div className="flex items-center gap-2 rounded-xl border border-gray-700/50 bg-gray-800/50 px-4 py-1">
              <i className="ri-global-line text-gray-400"></i>
              <span className="text-sm text-gray-400">{t("common.language")}:</span>
              <LanguageSelector variant="dark" />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-gray-800/50 pt-8 sm:pt-10">
          <div className="flex flex-col items-center gap-6 text-center sm:gap-8">
            <div className="text-sm text-gray-400 sm:text-base">
              {t("footer.copyright").replace("{year}", currentYear.toString())}
            </div>
            <nav
              aria-label={t("footer.legal.privacy")}
              className="flex flex-col flex-wrap items-center justify-center gap-4 sm:flex-row sm:gap-6"
            >
              <a
                href="/privacy"
                title={`${t("footer.legal.privacy")} - GDN Pro`}
                className="cursor-pointer px-2 py-1.5 text-sm text-gray-400 underline-offset-4 transition-colors duration-200 hover:text-white hover:underline active:text-white sm:text-base"
              >
                {t("footer.legal.privacy")}
              </a>
              <span
                className="hidden cursor-default text-sm text-gray-600 sm:block"
                aria-hidden="true"
              >
                •
              </span>
              <a
                href="/terms"
                title={`${t("footer.legal.terms")} - GDN Pro`}
                className="cursor-pointer px-2 py-1.5 text-sm text-gray-400 underline-offset-4 transition-colors duration-200 hover:text-white hover:underline active:text-white sm:text-base"
              >
                {t("footer.legal.terms")}
              </a>
              <span
                className="hidden cursor-default text-sm text-gray-600 sm:block"
                aria-hidden="true"
              >
                •
              </span>
              <a
                href="/data-deletion"
                title={`${t("footer.legal.dataDeletion")} - GDN Pro`}
                className="cursor-pointer px-2 py-1.5 text-sm text-gray-400 underline-offset-4 transition-colors duration-200 hover:text-white hover:underline active:text-white sm:text-base"
              >
                {t("footer.legal.dataDeletion")}
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}

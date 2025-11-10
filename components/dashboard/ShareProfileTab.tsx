import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/contexts/AuthContext"
import { removeAccents } from "@/libs/removeAccents"

export function ShareProfileTab() {
  const { t } = useTranslation()
  const { profile: user, loading, refreshAuth } = useAuth()
  const [profileUrl, setProfileUrl] = useState("")
  const [shareStats, setShareStats] = useState({
    totalShares: 0,
    clicks: 0,
    conversions: 0,
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (user?.full_name) {
      const slug = user.full_name.toLowerCase().replace(/\s+/g, "-")

      setProfileUrl(`${window.location.origin}/freelancer/${removeAccents(slug)}`)
    }
  }, [user])

  useEffect(() => {
    if (!user && !loading) {
      refreshAuth()
    }
  }, [user, loading, refreshAuth])

  const handleShare = (platform: string) => {
    const shareText = t("dashboard.shareProfile.social.shareText", {
      skills: user?.skills?.slice(0, 3).join(", ") || "",
    })

    let shareUrl = ""

    switch (platform) {
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}&title=${encodeURIComponent(shareText)}`
        break
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`
        break
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`
        break
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + profileUrl)}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400")
      // Aquí podrías registrar el share en analytics
      setShareStats((prev) => ({ ...prev, totalShares: prev.totalShares + 1 }))
    }
  }

  const copyToClipboard = () => {
    if (!profileUrl) {
      window.toast({
        title: t("dashboard.shareProfile.profileUrl.notAvailable"),
        type: "warning",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      return
    }

    try {
      const tempInput = document.createElement("textarea")
      tempInput.value = profileUrl
      document.body.appendChild(tempInput)
      tempInput.select()
      document.execCommand("copy")
      document.body.removeChild(tempInput)

      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      window.toast({
        title: t("dashboard.shareProfile.profileUrl.copyError"),
        type: "error",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error al copiar:", err)
    }
  }

  const generateQRCode = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`
    return qrUrl
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="to-primary rounded-xl bg-gradient-to-r from-cyan-500 p-6 text-white">
        <h2 className="mb-2 text-2xl font-bold">{t("dashboard.shareProfile.title")}</h2>
        <p className="text-cyan-100">{t("dashboard.shareProfile.description")}</p>
      </div>

      {/* URL del perfil */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {t("dashboard.shareProfile.profileUrl.title")}
        </h3>

        <div className="mb-4 flex items-center gap-3">
          <div className="border-primary flex-1 rounded-lg border bg-gray-50 p-3">
            <code className="text-sm break-all text-gray-700">{profileUrl}</code>
          </div>
          <button
            onClick={copyToClipboard}
            className={`cursor-pointer rounded-lg px-4 py-3 font-medium whitespace-nowrap transition-all ${
              copied ? "bg-cyan-500 text-white" : "bg-primary text-white hover:bg-cyan-700"
            }`}
          >
            {copied ? (
              <>
                <i className="ri-check-line mr-2"></i>
                {t("dashboard.shareProfile.profileUrl.copied")}
              </>
            ) : (
              <>
                <i className="ri-file-copy-line mr-2"></i>
                {t("dashboard.shareProfile.profileUrl.copy")}
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <i className="ri-information-line"></i>
          <span>{t("dashboard.shareProfile.profileUrl.description")}</span>
        </div>
      </div>

      {/* Botones de compartir */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {t("dashboard.shareProfile.social.title")}
        </h3>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <button
            onClick={() => handleShare("linkedin")}
            className="group flex cursor-pointer flex-col items-center rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-500 hover:bg-blue-50"
          >
            <div className="bg-primary mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-110">
              <i className="ri-linkedin-fill text-xl text-white"></i>
            </div>
            <span className="font-medium text-gray-900">{t("dashboard.shareProfile.social.linkedin")}</span>
            <span className="text-xs text-gray-500">{t("dashboard.shareProfile.social.linkedinDesc")}</span>
          </button>

          <button
            onClick={() => handleShare("twitter")}
            className="group flex cursor-pointer flex-col items-center rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-400 hover:bg-blue-50"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-400 transition-transform group-hover:scale-110">
              <i className="ri-twitter-fill text-xl text-white"></i>
            </div>
            <span className="font-medium text-gray-900">{t("dashboard.shareProfile.social.twitter")}</span>
            <span className="text-xs text-gray-500">{t("dashboard.shareProfile.social.twitterDesc")}</span>
          </button>

          <button
            onClick={() => handleShare("facebook")}
            className="group flex cursor-pointer flex-col items-center rounded-lg border border-gray-200 p-4 transition-all hover:border-cyan-700 hover:bg-blue-50"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-700 transition-transform group-hover:scale-110">
              <i className="ri-facebook-fill text-xl text-white"></i>
            </div>
            <span className="font-medium text-gray-900">{t("dashboard.shareProfile.social.facebook")}</span>
            <span className="text-xs text-gray-500">{t("dashboard.shareProfile.social.facebookDesc")}</span>
          </button>

          <button
            onClick={() => handleShare("whatsapp")}
            className="group flex cursor-pointer flex-col items-center rounded-lg border border-gray-200 p-4 transition-all hover:border-green-500 hover:bg-green-50"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 transition-transform group-hover:scale-110">
              <i className="ri-whatsapp-fill text-xl text-white"></i>
            </div>
            <span className="font-medium text-gray-900">{t("dashboard.shareProfile.social.whatsapp")}</span>
            <span className="text-xs text-gray-500">{t("dashboard.shareProfile.social.whatsappDesc")}</span>
          </button>
        </div>
      </div>

      {/* Código QR */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {t("dashboard.shareProfile.qr.title")}
        </h3>

        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="shrink-0">
            <img
              src={generateQRCode()}
              alt={t("dashboard.shareProfile.qr.alt")}
              className="h-48 w-48 rounded-lg border border-gray-200"
            />
          </div>

          <div className="flex-1">
            <h4 className="mb-2 font-semibold text-gray-900">
              {t("dashboard.shareProfile.qr.shareTitle")}
            </h4>
            <p className="mb-4 text-gray-600">{t("dashboard.shareProfile.qr.description")}</p>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(generateQRCode())
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)

                    const link = document.createElement("a")
                    link.href = url
                    link.download = `qr-perfil-${user?.full_name?.replace(/\s+/g, "-")}.png`
                    link.click()

                    window.URL.revokeObjectURL(url)
                  } catch (err) {
                    window.toast({
                      title: t("dashboard.shareProfile.qr.downloadError"),
                      type: "error",
                      location: "bottom-center",
                      dismissible: true,
                      icon: true,
                    })
                    console.error("Error al descargar QR:", err)
                  }
                }}
                className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
              >
                <i className="ri-download-line mr-2"></i>
                {t("dashboard.shareProfile.qr.download")}
              </button>

              <button
                onClick={() => window.print()}
                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 font-medium whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50"
              >
                <i className="ri-printer-line mr-2"></i>
                {t("dashboard.shareProfile.qr.print")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {t("dashboard.shareProfile.stats.title")}
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <div className="mb-1 text-2xl font-bold text-emerald-600">{shareStats.totalShares}</div>
            <div className="text-sm text-gray-600">
              {t("dashboard.shareProfile.stats.totalShares")}
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <div className="text-primary mb-1 text-2xl font-bold">{shareStats.clicks}</div>
            <div className="text-sm text-gray-600">{t("dashboard.shareProfile.stats.clicks")}</div>
          </div>

          <div className="rounded-lg bg-purple-50 p-4 text-center">
            <div className="mb-1 text-2xl font-bold text-purple-600">{shareStats.conversions}</div>
            <div className="text-sm text-gray-600">
              {t("dashboard.shareProfile.stats.conversions")}
            </div>
          </div>
        </div>
      </div>

      {/* Tips para compartir */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-emerald-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          <i className="ri-lightbulb-line mr-2 text-yellow-500"></i>
          {t("dashboard.shareProfile.tips.title")}
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-start">
            <div className="mt-1 mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
              <i className="ri-check-line text-sm text-white"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {t("dashboard.shareProfile.tips.updateRegularly.title")}
              </h4>
              <p className="text-sm text-gray-600">
                {t("dashboard.shareProfile.tips.updateRegularly.description")}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="mt-1 mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
              <i className="ri-check-line text-sm text-white"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {t("dashboard.shareProfile.tips.shareValuableContent.title")}
              </h4>
              <p className="text-sm text-gray-600">
                {t("dashboard.shareProfile.tips.shareValuableContent.description")}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="mt-1 mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
              <i className="ri-check-line text-sm text-white"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {t("dashboard.shareProfile.tips.useHashtags.title")}
              </h4>
              <p className="text-sm text-gray-600">
                {t("dashboard.shareProfile.tips.useHashtags.description")}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="mt-1 mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
              <i className="ri-check-line text-sm text-white"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {t("dashboard.shareProfile.tips.interactWithAudience.title")}
              </h4>
              <p className="text-sm text-gray-600">
                {t("dashboard.shareProfile.tips.interactWithAudience.description")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

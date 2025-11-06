import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { removeAccents } from "@/libs/removeAccents"

export function ShareProfileTab() {
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
    const shareText = `¡Conoce mi perfil profesional en GDN Pro! 💼 Especializado en ${user?.skills?.slice(0, 3).join(", ")}`

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
        title: "URL no disponible todavía",
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
        title: "No se pudo copiar la URL. Intenta manualmente",
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
      <div className="to-primary rounded-xl bg-linear-to-r from-cyan-500 p-6 text-white">
        <h2 className="mb-2 text-2xl font-bold">Comparte tu Perfil</h2>
        <p className="text-cyan-100">
          Aumenta tu visibilidad compartiendo tu perfil profesional en redes sociales
        </p>
      </div>

      {/* URL del perfil */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Tu URL de Perfil</h3>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1 rounded-lg border bg-gray-50 p-3">
            <code className="text-sm break-all text-gray-700">{profileUrl}</code>
          </div>
          <button
            onClick={copyToClipboard}
            className={`rounded-lg px-4 py-3 font-medium whitespace-nowrap transition-all ${
              copied ? "bg-cyan-500 text-white" : "bg-primary text-white hover:bg-cyan-700"
            }`}
          >
            {copied ? (
              <>
                <i className="ri-check-line mr-2"></i>
                ¡Copiado!
              </>
            ) : (
              <>
                <i className="ri-file-copy-line mr-2"></i>
                Copiar
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <i className="ri-information-line"></i>
          <span>Esta es tu URL personalizada que puedes compartir en cualquier lugar</span>
        </div>
      </div>

      {/* Botones de compartir */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Compartir en Redes Sociales</h3>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <button
            onClick={() => handleShare("linkedin")}
            className="group flex flex-col items-center rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-500 hover:bg-blue-50"
          >
            <div className="bg-primary mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-110">
              <i className="ri-linkedin-fill text-xl text-white"></i>
            </div>
            <span className="font-medium text-gray-900">LinkedIn</span>
            <span className="text-xs text-gray-500">Profesional</span>
          </button>

          <button
            onClick={() => handleShare("twitter")}
            className="group flex flex-col items-center rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-400 hover:bg-blue-50"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-400 transition-transform group-hover:scale-110">
              <i className="ri-twitter-fill text-xl text-white"></i>
            </div>
            <span className="font-medium text-gray-900">Twitter</span>
            <span className="text-xs text-gray-500">Rápido</span>
          </button>

          <button
            onClick={() => handleShare("facebook")}
            className="group flex flex-col items-center rounded-lg border border-gray-200 p-4 transition-all hover:border-cyan-700 hover:bg-blue-50"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-700 transition-transform group-hover:scale-110">
              <i className="ri-facebook-fill text-xl text-white"></i>
            </div>
            <span className="font-medium text-gray-900">Facebook</span>
            <span className="text-xs text-gray-500">Personal</span>
          </button>

          <button
            onClick={() => handleShare("whatsapp")}
            className="group flex flex-col items-center rounded-lg border border-gray-200 p-4 transition-all hover:border-green-500 hover:bg-green-50"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 transition-transform group-hover:scale-110">
              <i className="ri-whatsapp-fill text-xl text-white"></i>
            </div>
            <span className="font-medium text-gray-900">WhatsApp</span>
            <span className="text-xs text-gray-500">Directo</span>
          </button>
        </div>
      </div>

      {/* Código QR */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Código QR</h3>

        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="shrink-0">
            <img
              src={generateQRCode()}
              alt="QR Code del perfil"
              className="h-48 w-48 rounded-lg border border-gray-200"
            />
          </div>

          <div className="flex-1">
            <h4 className="mb-2 font-semibold text-gray-900">Comparte tu QR</h4>
            <p className="mb-4 text-gray-600">
              Usa este código QR en tus tarjetas de presentación, CV, o cualquier material impreso.
              Los clientes pueden escanearlo para acceder directamente a tu perfil.
            </p>

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
                      title: "No se pudo descargar el QR. Intenta de nuevo.",
                      type: "error",
                      location: "bottom-center",
                      dismissible: true,
                      icon: true,
                    })
                    console.error("Error al descargar QR:", err)
                  }
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 font-medium whitespace-nowrap text-white transition-colors hover:bg-cyan-700"
              >
                <i className="ri-download-line mr-2"></i>
                Descargar QR
              </button>

              <button
                onClick={() => window.print()}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium whitespace-nowrap text-gray-700 transition-colors hover:bg-gray-50"
              >
                <i className="ri-printer-line mr-2"></i>
                Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Estadísticas de Compartir</h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <div className="mb-1 text-2xl font-bold text-emerald-600">{shareStats.totalShares}</div>
            <div className="text-sm text-gray-600">Veces Compartido</div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <div className="text-primary mb-1 text-2xl font-bold">{shareStats.clicks}</div>
            <div className="text-sm text-gray-600">Clicks Recibidos</div>
          </div>

          <div className="rounded-lg bg-purple-50 p-4 text-center">
            <div className="mb-1 text-2xl font-bold text-purple-600">{shareStats.conversions}</div>
            <div className="text-sm text-gray-600">Contactos Generados</div>
          </div>
        </div>
      </div>

      {/* Tips para compartir */}
      <div className="rounded-xl border border-blue-200 bg-linear-to-r from-blue-50 to-emerald-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          <i className="ri-lightbulb-line mr-2 text-yellow-500"></i>
          Tips para Maximizar tu Alcance
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-start">
            <div className="mt-1 mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
              <i className="ri-check-line text-sm text-white"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Actualiza regularmente</h4>
              <p className="text-sm text-gray-600">
                Mantén tu perfil actualizado con nuevos proyectos y habilidades
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="mt-1 mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
              <i className="ri-check-line text-sm text-white"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Comparte contenido valioso</h4>
              <p className="text-sm text-gray-600">Acompaña tu perfil con tips y casos de éxito</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="mt-1 mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
              <i className="ri-check-line text-sm text-white"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Usa hashtags relevantes</h4>
              <p className="text-sm text-gray-600">Incluye hashtags de tu industria al compartir</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="mt-1 mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
              <i className="ri-check-line text-sm text-white"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Interactúa con tu audiencia</h4>
              <p className="text-sm text-gray-600">Responde comentarios y mensajes rápidamente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

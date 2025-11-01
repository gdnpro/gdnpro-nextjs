import { useState, useEffect } from "react"
import { useAuth } from "@/components/AuthContext"
import { removeAccents } from "@/libs/removeAccents"

export function ShareProfileTab() {
  const { user } = useAuth()
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

      setProfileUrl(
        `${window.location.origin}/freelancer/${removeAccents(slug)}`
      )
    }
  }, [user])

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
    if (!profileUrl) return alert("URL no disponible todavía")

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
      console.error("Error al copiar:", err)
      alert("No se pudo copiar la URL. Intenta manualmente.")
    }
  }

  const generateQRCode = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`
    return qrUrl
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-cyan-500 to-primary rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Comparte tu Perfil</h2>
        <p className="text-cyan-100">
          Aumenta tu visibilidad compartiendo tu perfil profesional en redes
          sociales
        </p>
      </div>

      {/* URL del perfil */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tu URL de Perfil
        </h3>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-gray-50 rounded-lg p-3 border">
            <code className="text-sm text-gray-700 break-all">
              {profileUrl}
            </code>
          </div>
          <button
            onClick={copyToClipboard}
            className={`px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              copied
                ? "bg-cyan-500 text-white"
                : "bg-primary hover:bg-cyan-700 text-white"
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
          <span>
            Esta es tu URL personalizada que puedes compartir en cualquier lugar
          </span>
        </div>
      </div>

      {/* Botones de compartir */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Compartir en Redes Sociales
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleShare("linkedin")}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <i className="ri-linkedin-fill text-white text-xl"></i>
            </div>
            <span className="font-medium text-gray-900">LinkedIn</span>
            <span className="text-xs text-gray-500">Profesional</span>
          </button>

          <button
            onClick={() => handleShare("twitter")}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <i className="ri-twitter-fill text-white text-xl"></i>
            </div>
            <span className="font-medium text-gray-900">Twitter</span>
            <span className="text-xs text-gray-500">Rápido</span>
          </button>

          <button
            onClick={() => handleShare("facebook")}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-cyan-700 hover:bg-blue-50 transition-all group"
          >
            <div className="w-12 h-12 bg-cyan-700 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <i className="ri-facebook-fill text-white text-xl"></i>
            </div>
            <span className="font-medium text-gray-900">Facebook</span>
            <span className="text-xs text-gray-500">Personal</span>
          </button>

          <button
            onClick={() => handleShare("whatsapp")}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <i className="ri-whatsapp-fill text-white text-xl"></i>
            </div>
            <span className="font-medium text-gray-900">WhatsApp</span>
            <span className="text-xs text-gray-500">Directo</span>
          </button>
        </div>
      </div>

      {/* Código QR */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Código QR</h3>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="shrink-0">
            <img
              src={generateQRCode()}
              alt="QR Code del perfil"
              className="w-48 h-48 border border-gray-200 rounded-lg"
            />
          </div>

          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2">Comparte tu QR</h4>
            <p className="text-gray-600 mb-4">
              Usa este código QR en tus tarjetas de presentación, CV, o
              cualquier material impreso. Los clientes pueden escanearlo para
              acceder directamente a tu perfil.
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
                    console.error("Error al descargar QR:", err)
                    alert("No se pudo descargar el QR. Intenta de nuevo.")
                  }
                }}
                className="bg-emerald-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                <i className="ri-download-line mr-2"></i>
                Descargar QR
              </button>

              <button
                onClick={() => window.print()}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                <i className="ri-printer-line mr-2"></i>
                Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Estadísticas de Compartir
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600 mb-1">
              {shareStats.totalShares}
            </div>
            <div className="text-sm text-gray-600">Veces Compartido</div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-primary mb-1">
              {shareStats.clicks}
            </div>
            <div className="text-sm text-gray-600">Clicks Recibidos</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {shareStats.conversions}
            </div>
            <div className="text-sm text-gray-600">Contactos Generados</div>
          </div>
        </div>
      </div>

      {/* Tips para compartir */}
      <div className="bg-linear-to-r from-blue-50 to-emerald-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="ri-lightbulb-line text-yellow-500 mr-2"></i>
          Tips para Maximizar tu Alcance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3 mt-1">
              <i className="ri-check-line text-white text-sm"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                Actualiza regularmente
              </h4>
              <p className="text-sm text-gray-600">
                Mantén tu perfil actualizado con nuevos proyectos y habilidades
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3 mt-1">
              <i className="ri-check-line text-white text-sm"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                Comparte contenido valioso
              </h4>
              <p className="text-sm text-gray-600">
                Acompaña tu perfil con tips y casos de éxito
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3 mt-1">
              <i className="ri-check-line text-white text-sm"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                Usa hashtags relevantes
              </h4>
              <p className="text-sm text-gray-600">
                Incluye hashtags de tu industria al compartir
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3 mt-1">
              <i className="ri-check-line text-white text-sm"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                Interactúa con tu audiencia
              </h4>
              <p className="text-sm text-gray-600">
                Responde comentarios y mensajes rápidamente
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

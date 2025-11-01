"use client"

import { supabaseBrowser } from "@/utils/supabase/client"
import { useState } from "react"

const supabase = supabaseBrowser()

interface WhatsAppSetupProps {
  onClose: () => void
}

export default function WhatsAppSetup({ onClose }: WhatsAppSetupProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState({
    whatsappToken: "",
    phoneNumberId: "",
    adminPhone: "",
    verifyToken: "",
  })

  const handleConfigSubmit = async () => {
    setIsLoading(true)
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        throw new Error("No autenticado")
      }

      // Primero guardar la configuración
      const configResponse = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/whatsapp-config",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          body: JSON.stringify({
            action: "save-config",
            verifyToken: config.verifyToken,
            accessToken: config.whatsappToken,
            phoneNumberId: config.phoneNumberId,
            adminPhone: config.adminPhone,
          }),
        }
      )

      if (configResponse.ok) {
        const data = await configResponse.json()
        setStep(4)
      } else {
        throw new Error("Error guardando configuración")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error configurando WhatsApp. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <i className="ri-whatsapp-line text-green-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Configuración WhatsApp Business
              </h2>
              <p className="text-gray-600 text-sm">Paso {step} de 4</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Progreso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum <= step
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {stepNum < step ? <i className="ri-check-line"></i> : stepNum}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all "
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Contenido por pasos */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              📱 Paso 1: Crear Cuenta WhatsApp Business
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                ¿Qué necesitas?
              </h4>
              <ul className="text-cyan-700 text-sm space-y-1">
                <li>✅ Cuenta de WhatsApp Business (gratuita)</li>
                <li>✅ Meta Developer Account (gratuita)</li>
                <li>✅ Número de teléfono dedicado para el negocio</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Instrucciones:</h4>
              <ol className="text-gray-600 text-sm space-y-2 list-decimal list-inside">
                <li>
                  Ve a{" "}
                  <a
                    href="https://business.whatsapp.com/"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    business.whatsapp.com
                  </a>
                </li>
                <li>Crea tu cuenta WhatsApp Business</li>
                <li>Verifica tu número de teléfono</li>
                <li>
                  Ve a{" "}
                  <a
                    href="https://developers.facebook.com/"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    developers.facebook.com
                  </a>
                </li>
                <li>Crea una aplicación y configura WhatsApp Business API</li>
              </ol>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Continuar al Paso 2
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              🔑 Paso 2: Obtener Credenciales
            </h3>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">
                Información necesaria:
              </h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• Access Token de WhatsApp</li>
                <li>• Phone Number ID</li>
                <li>• Tu número de WhatsApp personal</li>
                <li>• Verify Token (puedes crear uno)</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Access Token
                </label>
                <input
                  type="text"
                  value={config.whatsappToken}
                  onChange={(e) =>
                    setConfig({ ...config, whatsappToken: e.target.value })
                  }
                  placeholder="EAAxxxxxxxxxxxxx..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={config.phoneNumberId}
                  onChange={(e) =>
                    setConfig({ ...config, phoneNumberId: e.target.value })
                  }
                  placeholder="123456789012345"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tu Número WhatsApp (con código de país)
                </label>
                <input
                  type="text"
                  value={config.adminPhone}
                  onChange={(e) =>
                    setConfig({ ...config, adminPhone: e.target.value })
                  }
                  placeholder="+1234567890"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verify Token (crea uno único)
                </label>
                <input
                  type="text"
                  value={config.verifyToken}
                  onChange={(e) =>
                    setConfig({ ...config, verifyToken: e.target.value })
                  }
                  placeholder="mi_token_secreto_123"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Volver
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={
                  !config.whatsappToken ||
                  !config.phoneNumberId ||
                  !config.adminPhone ||
                  !config.verifyToken
                }
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              🔗 Paso 3: Configurar Webhook
            </h3>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-800 mb-2">
                ⚠️ IMPORTANTE - Orden correcto:
              </h4>
              <ol className="text-red-700 text-sm space-y-1 list-decimal list-inside">
                <li>
                  <strong>Primero:</strong> Haz clic en "Guardar Configuración"
                  abajo
                </li>
                <li>
                  <strong>Después:</strong> Configura el webhook en Meta
                </li>
                <li>
                  <strong>Nunca al revés</strong> - Meta fallará si no hay
                  configuración
                </li>
              </ol>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">
                URL del Webhook:
              </h4>
              <code className="text-green-700 text-sm bg-green-100 p-2 rounded block break-all">
                https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/whatsapp-integration?action=webhook
              </code>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                Tu Verify Token:
              </h4>
              <code className="text-cyan-700 text-sm bg-blue-100 p-2 rounded block break-all">
                {config.verifyToken}
              </code>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">
                Después de guardar, en Meta Developer Console:
              </h4>
              <ol className="text-gray-600 text-sm space-y-2 list-decimal list-inside">
                <li>Ve a tu aplicación en Meta Developer Console</li>
                <li>Selecciona "WhatsApp" → "Configuration"</li>
                <li>En "Webhook", haz clic en "Edit"</li>
                <li>Pega la URL del webhook de arriba</li>
                <li>Usa tu Verify Token de arriba</li>
                <li>Suscríbete a "messages" events</li>
                <li>Haz clic en "Verify and Save"</li>
              </ol>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Volver
              </button>
              <button
                onClick={handleConfigSubmit}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando Configuración...
                  </div>
                ) : (
                  "💾 Guardar Configuración PRIMERO"
                )}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <i className="ri-check-line text-green-600 text-2xl"></i>
            </div>

            <h3 className="text-lg font-semibold text-gray-800">
              🎉 ¡Configuración Completada!
            </h3>

            <div className="bg-green-50 p-4 rounded-lg text-left">
              <h4 className="font-medium text-green-800 mb-2">
                ¿Cómo funciona ahora?
              </h4>
              <ul className="text-green-700 text-sm space-y-1">
                <li>✅ Los clientes escriben en el chat de Sofia</li>
                <li>
                  ✅ Recibes notificación en tu WhatsApp:{" "}
                  <strong>{config.adminPhone}</strong>
                </li>
                <li>✅ Respondes desde WhatsApp normalmente</li>
                <li>✅ Tu respuesta aparece automáticamente en el chat web</li>
                <li>✅ Conversación fluida en tiempo real</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <h4 className="font-medium text-blue-800 mb-2">💡 Consejos:</h4>
              <ul className="text-cyan-700 text-sm space-y-1">
                <li>• Mantén WhatsApp abierto para respuestas rápidas</li>
                <li>• Las notificaciones llegan instantáneamente</li>
                <li>• Puedes usar emojis, audios y mensajes largos</li>
                <li>• El cliente solo ve el chat web, no tu WhatsApp</li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors cursor-pointer"
            >
              ¡Perfecto! Empezar a Usar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabaseBrowser } from "@/utils/supabase/client"

const supabase = supabaseBrowser()

import type { OccupiedDates } from "@/interfaces/CalendarFilters"

interface Props {
  month: number
  year: number
  occupiedDates: OccupiedDates
}

interface CalendarDay {
  day: number
  date: string
  isOccupied: boolean
  isWeekend: boolean
}

// Helper function para generar el calendario
const generateCalendar = ({ month, year, occupiedDates }: Props) => {
  const daysInMonth = new Date(year, month, 0).getDate()
  const days = []

  for (let i = 1; i <= daysInMonth; i++) {
    const date = `${year}-${month}-${i < 10 ? "0" + i : i}`
    const dayOfWeek = new Date(year, month - 1, i).getDay() // 0=Dom, 1=Lun,...
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isOccupied = occupiedDates[date] === true
    days.push({ day: i, date, isOccupied, isWeekend })
  }

  return days
}

export default function CTA() {
  const scrollToContact = () => {
    const contactSection = document.getElementById("contact")
    if (contactSection) contactSection.scrollIntoView({ behavior: "smooth" })
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [topic, setTopic] = useState("")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedPlatform, setSelectedPlatform] = useState("") // Zoom o WhatsApp
  const [clientName, setClientName] = useState("")
  const [clientContact, setClientContact] = useState("")
  const [occupiedDates, setOccupiedDates] = useState<OccupiedDates>({
    "2025-10-05": true,
    "2025-10-10": true,
  })
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : ""

    const days = generateCalendar({
      month: currentMonth,
      year: currentYear,
      occupiedDates,
    })
    setCalendarDays(days)
  }, [isModalOpen])

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)
  const handleTimeSelect = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setSelectedTime(e.target.value)

  // Enviar los datos al correo (via Supabase Function)
  const handleSchedule = async () => {
    if (
      !topic.trim() ||
      !selectedDate ||
      !selectedTime.trim() ||
      !selectedPlatform ||
      !clientName.trim() ||
      !clientContact.trim()
    ) {
      window.toast({
        title: "Por favor, completa todos los campos antes de agendar",
        type: "warning",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      return
    }

    const appointmentData = {
      topic,
      date: selectedDate,
      time: selectedTime,
      platform: selectedPlatform,
      clientName,
      clientContact,
    }

    try {
      const { data, error } = await supabase.functions.invoke("appointment-handler", {
        body: appointmentData,
      })

      if (error) {
        window.toast({
          title: "Error al enviar la cita",
          type: "success",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
        console.error("Error al invocar función:", error)
        return
      }

      const contactText =
        selectedPlatform === "WhatsApp"
          ? `al número de WhatsApp ${clientContact}`
          : `al correo ${clientContact}`

      window.toast({
        title: `Tu cita fue enviada correctamente. Te contactaremos pronto ${contactText}.`,
        type: "success",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })

      closeModal()
    } catch (error) {
      window.toast({
        title: "Hubo un problema al comunicarse con el servidor",
        type: "success",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      console.error("Error al enviar:", error)
    }
  }

  // Horas laborales de 9 AM a 9 PM
  const workingHours = []
  for (let h = 9; h <= 21; h++) {
    const period = h < 12 ? "AM" : "PM"
    const hour = h <= 12 ? h : h - 12
    workingHours.push(`${hour}:00 ${period}`)
  }

  return (
    <section
      className="relative bg-cover bg-center bg-no-repeat py-24"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/banners/cta-banner.jpg')`,
      }}
    >
      <div className="mx-auto max-w-7xl px-6 text-center text-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-4xl font-bold md:text-6xl">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="mb-12 text-xl leading-relaxed md:text-2xl">
            No esperes más. Comencemos a construir el futuro digital de tu empresa hoy mismo.
            Nuestro equipo está listo para hacer realidad tus ideas más ambiciosas.
          </p>

          <div className="flex flex-col justify-center gap-6 sm:flex-row">
            <button
              onClick={scrollToContact}
              className="bg-primary cursor-pointer rounded-full px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-cyan-700 hover:shadow-xl"
            >
              Empezar Ahora
            </button>
            <button
              onClick={openModal}
              className="cursor-pointer rounded-full border-2 border-white px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white hover:text-gray-900"
            >
              Agenda una cita
            </button>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 text-center md:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <i className="ri-mail-line mb-4 text-3xl"></i>
              <h4 className="mb-2 font-semibold">Escríbenos</h4>
              <p className="text-emerald-100">contact@gdnpro.com</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <i className="ri-calendar-line mb-4 text-3xl"></i>
              <h4 className="mb-2 font-semibold">Reunión Virtual</h4>
              <p className="text-emerald-100">Agenda una cita</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 px-4 backdrop-blur-md sm:px-6"
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white text-gray-900 shadow-2xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modern Header with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 p-8 text-white">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                      <i className="ri-calendar-check-line text-2xl"></i>
                    </div>
                    <div>
                      <h3 className="text-3xl leading-tight font-bold sm:text-4xl">
                        Agenda tu cita gratuita
                      </h3>
                      <p className="mt-2 text-sm text-cyan-100">
                        Completa los datos para confirmar tu reunión
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20"
                  aria-label="Cerrar"
                >
                  <i className="ri-close-line text-xl transition-transform group-hover:rotate-90"></i>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 sm:p-8" style={{ maxHeight: "calc(92vh - 200px)" }}>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Columna izquierda - Calendario */}
                <div className="flex flex-col justify-between space-y-6">
                  {/* Calendario */}
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                        <i className="ri-calendar-line text-lg"></i>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">Selecciona una fecha</h4>
                    </div>
                    <div className="mb-6 grid grid-cols-7 gap-2 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
                      {calendarDays?.map(({ day, date, isOccupied, isWeekend }) => (
                        <button
                          key={date}
                          onClick={() => !isWeekend && !isOccupied && setSelectedDate(date)}
                          className={`group cursor-pointer rounded-xl p-2 text-sm font-semibold transition-all ${
                            isWeekend
                              ? "cursor-not-allowed bg-gray-200 text-gray-400"
                              : isOccupied
                                ? "cursor-not-allowed bg-red-100 text-red-400"
                                : selectedDate === date
                                  ? "scale-110 bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30"
                                  : "bg-gray-100 text-gray-700 hover:scale-105 hover:bg-gray-200"
                          }`}
                          disabled={isWeekend || isOccupied}
                        >
                          {day}
                        </button>
                      ))}
                    </div>

                    {/* Hora */}
                    <div>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                          <i className="ri-time-line text-lg"></i>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">Selecciona la hora</h4>
                      </div>
                      <select
                        value={selectedTime}
                        onChange={handleTimeSelect}
                        className="w-full rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white p-3 text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                      >
                        <option value="">Elige una hora</option>
                        {workingHours.map((hour) => (
                          <option key={hour} value={hour}>
                            {hour}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between space-y-6">
                  <div className="space-y-6">
                    {/* Tema */}
                    <div>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                          <i className="ri-message-3-line text-lg"></i>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">Tema de la reunión</h4>
                      </div>
                      <textarea
                        className="w-full resize-none rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white p-3 text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                        rows={4}
                        placeholder="Cuéntanos brevemente de qué te gustaría hablar..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </div>

                    {/* Nombre */}
                    <div>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                          <i className="ri-user-line text-lg"></i>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">Tu nombre</h4>
                      </div>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Tu nombre completo"
                        className="w-full rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white p-3 text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                      />
                    </div>

                    {/* Plataforma */}
                    <div>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                          <i className="ri-video-line text-lg"></i>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">
                          ¿Cómo prefieres reunirte?
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setSelectedPlatform("Zoom")}
                          className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 p-5 transition-all ${
                            selectedPlatform === "Zoom"
                              ? "scale-105 border-cyan-500 bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30"
                              : "border-gray-200 bg-gray-50 hover:scale-105 hover:border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          <i className="ri-camera-line mb-2 text-3xl transition-transform group-hover:scale-110"></i>
                          <span className="font-bold">ZOOM</span>
                        </button>
                        <button
                          onClick={() => setSelectedPlatform("WhatsApp")}
                          className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 p-5 transition-all ${
                            selectedPlatform === "WhatsApp"
                              ? "scale-105 border-cyan-500 bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30"
                              : "border-gray-200 bg-gray-50 hover:scale-105 hover:border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          <i className="ri-whatsapp-line mb-2 text-3xl transition-transform group-hover:scale-110"></i>
                          <span className="font-bold">WHATSAPP</span>
                        </button>
                      </div>
                    </div>

                    {/* Contacto */}
                    <div>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">
                          <i className="ri-mail-line text-lg"></i>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">Información de contacto</h4>
                      </div>
                      <input
                        type="text"
                        value={clientContact}
                        onChange={(e) => setClientContact(e.target.value)}
                        placeholder={
                          selectedPlatform === "WhatsApp"
                            ? "Número de WhatsApp"
                            : "Correo electrónico"
                        }
                        className="w-full rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white p-3 text-gray-900 shadow-sm transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Botón final */}
                  <button
                    onClick={handleSchedule}
                    className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-4 text-lg font-bold text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
                  >
                    <i className="ri-calendar-check-line text-xl transition-transform group-hover:scale-110"></i>
                    <span>Agendar cita</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  )
}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative grid max-h-[90vh] w-full max-w-4xl grid-cols-1 gap-8 overflow-y-auto rounded-2xl bg-white p-6 text-gray-900 shadow-2xl sm:p-8 lg:grid-cols-2"
          >
            {/* Botón cerrar */}
            <button
              onClick={closeModal}
              className="absolute right-4 z-10 cursor-pointer text-3xl font-bold text-gray-500 hover:text-gray-800"
            >
              &times;
            </button>

            {/* Columna izquierda - Info y Calendario */}
            <div className="flex flex-col justify-between">
              <div>
                <h3 className="mb-3 text-2xl font-bold text-gray-800 sm:text-3xl">
                  Agenda tu cita gratuita
                </h3>
                <p className="mb-6 text-sm text-gray-600 sm:text-base">
                  Completa los datos para confirmar tu reunión. Nuestro equipo te contactará para
                  coordinar los detalles.
                </p>
              </div>

              {/* Calendario */}
              <div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800">Selecciona una fecha</h4>
                <div className="mb-4 grid grid-cols-7 gap-2">
                  {calendarDays?.map(({ day, date, isOccupied, isWeekend }) => (
                    <button
                      key={date}
                      onClick={() => !isWeekend && !isOccupied && setSelectedDate(date)}
                      className={`rounded-lg p-2 text-sm font-semibold transition-all ${
                        isWeekend
                          ? "cursor-not-allowed bg-gray-300 text-gray-500"
                          : isOccupied
                            ? "cursor-not-allowed bg-red-500 text-white"
                            : selectedDate === date
                              ? "bg-cyan-600 text-white shadow-lg"
                              : "bg-gray-200 hover:bg-gray-300"
                      }`}
                      disabled={isWeekend || isOccupied}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {/* Hora */}
                <h4 className="mb-2 text-lg font-semibold text-gray-800">Selecciona la hora</h4>
                <select
                  value={selectedTime}
                  onChange={handleTimeSelect}
                  className="w-full rounded-xl border border-gray-300 p-3 transition focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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

            <div className="flex flex-col justify-between">
              <div>
                {/* 💬 Tema */}
                <textarea
                  className="w-full resize-none rounded-xl border border-gray-300 p-3 transition focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  rows={4}
                  placeholder="Cuéntanos brevemente de qué te gustaría hablar..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />

                {/* Nombre */}
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="mt-4 w-full rounded-xl border border-gray-300 p-3 transition focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />

                {/* Plataforma */}
                <h4 className="mt-6 mb-2 text-center text-lg font-semibold text-gray-800">
                  ¿Cómo prefieres reunirte?
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedPlatform("Zoom")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-5 transition-all ${
                      selectedPlatform === "Zoom"
                        ? "border-cyan-600 bg-cyan-600 text-white shadow-lg"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <i className="ri-camera-line mb-2 text-3xl"></i>
                    <span className="font-semibold">ZOOM</span>
                  </button>
                  <button
                    onClick={() => setSelectedPlatform("WhatsApp")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-5 transition-all ${
                      selectedPlatform === "WhatsApp"
                        ? "border-cyan-600 bg-cyan-600 text-white shadow-lg"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <i className="ri-whatsapp-line mb-2 text-3xl"></i>
                    <span className="font-semibold">WHATSAPP</span>
                  </button>
                </div>

                {/* Contacto */}
                <input
                  type="text"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  placeholder={
                    selectedPlatform === "WhatsApp" ? "Número de WhatsApp" : "Correo electrónico"
                  }
                  className="mt-4 w-full rounded-xl border border-gray-300 p-3 transition focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* Botón final */}
              <button
                onClick={handleSchedule}
                className="mt-6 w-full cursor-pointer rounded-xl bg-cyan-600 py-3 text-lg font-bold text-white shadow-lg transition-all hover:bg-cyan-700"
              >
                Agendar cita
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  )
}

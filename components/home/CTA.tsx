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
  const handleTimeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTime(e.target.value)

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
      const { data, error } = await supabase.functions.invoke(
        "appointment-handler",
        {
          body: appointmentData,
        }
      )

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
      className="py-24 bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/ctabanner.jpg')`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="text-xl md:text-2xl mb-12 leading-relaxed">
            No esperes más. Comencemos a construir el futuro digital de tu
            empresa hoy mismo. Nuestro equipo está listo para hacer realidad tus
            ideas más ambiciosas.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={scrollToContact}
              className="bg-primary cursor-pointer hover:bg-cyan-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Empezar Ahora
            </button>
            <button
              onClick={openModal}
              className="border-2 cursor-pointer border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-full text-lg font-semibold transition-all"
            >
              Agenda una cita
            </button>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <i className="ri-mail-line text-3xl mb-4"></i>
              <h4 className="font-semibold mb-2">Escríbenos</h4>
              <p className="text-emerald-100">contact@gdnpro.com</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <i className="ri-calendar-line text-3xl mb-4"></i>
              <h4 className="font-semibold mb-2">Reunión Virtual</h4>
              <p className="text-emerald-100">Agenda una cita</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white text-gray-900 rounded-2xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl relative overflow-y-auto max-h-[90vh] grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Botón cerrar */}
            <button
              onClick={closeModal}
              className="absolute right-4 cursor-pointer text-gray-500 hover:text-gray-800 text-3xl font-bold z-10"
            >
              &times;
            </button>

            {/* Columna izquierda - Info y Calendario */}
            <div className="flex flex-col justify-between">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-800">
                  Agenda tu cita gratuita
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mb-6">
                  Completa los datos para confirmar tu reunión. Nuestro equipo
                  te contactará para coordinar los detalles.
                </p>
              </div>

              {/* Calendario */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Selecciona una fecha
                </h4>
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {calendarDays?.map(({ day, date, isOccupied, isWeekend }) => (
                    <button
                      key={date}
                      onClick={() =>
                        !isWeekend && !isOccupied && setSelectedDate(date)
                      }
                      className={`p-2 rounded-lg text-sm font-semibold transition-all ${
                        isWeekend
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : isOccupied
                            ? "bg-red-500 text-white cursor-not-allowed"
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
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Selecciona la hora
                </h4>
                <select
                  value={selectedTime}
                  onChange={handleTimeSelect}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
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
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition resize-none"
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
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition mt-4"
                />

                {/* Plataforma */}
                <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2 text-center">
                  ¿Cómo prefieres reunirte?
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedPlatform("Zoom")}
                    className={`rounded-2xl p-5 flex flex-col items-center justify-center border transition-all ${
                      selectedPlatform === "Zoom"
                        ? "bg-cyan-600 text-white border-cyan-600 shadow-lg"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <i className="ri-camera-line text-3xl mb-2"></i>
                    <span className="font-semibold">ZOOM</span>
                  </button>
                  <button
                    onClick={() => setSelectedPlatform("WhatsApp")}
                    className={`rounded-2xl p-5 flex flex-col items-center justify-center border transition-all ${
                      selectedPlatform === "WhatsApp"
                        ? "bg-cyan-600 text-white border-cyan-600 shadow-lg"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <i className="ri-whatsapp-line text-3xl mb-2"></i>
                    <span className="font-semibold">WHATSAPP</span>
                  </button>
                </div>

                {/* Contacto */}
                <input
                  type="text"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  placeholder={
                    selectedPlatform === "WhatsApp"
                      ? "Número de WhatsApp"
                      : "Correo electrónico"
                  }
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition mt-4"
                />
              </div>

              {/* Botón final */}
              <button
                onClick={handleSchedule}
                className="w-full mt-6 bg-cyan-600 cursor-pointer hover:bg-cyan-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg transition-all"
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

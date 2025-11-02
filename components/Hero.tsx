import { gdnStats } from "@/constants/currentData"
import { useRouter } from "next/navigation"

const Hero = () => {
  const navigate = useRouter()

  const scrollToPortfolio = () => {
    const portfolioSection = document.getElementById("portfolio")
    if (portfolioSection) {
      portfolioSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  const scrollToContact = () => {
    const contactSection = document.getElementById("contact")
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  const goToFreelancers = () => {
    navigate.push("/freelancers")
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('/herobanner.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-blue-900/90 via-blue-800/80 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Transformamos
                <span className="block text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-300">
                  Ideas en Realidad
                </span>
              </h1>

              <p className="text-xl lg:text-2xl text-blue-100 leading-relaxed">
                En <span className="font-semibold text-white">GDN PRO</span>{" "}
                creamos soluciones digitales innovadoras. Desarrollo web, apps
                móviles y marketing digital de clase mundial.
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-blue-200">
                <div className="flex items-center gap-2">
                  <i className="ri-check-line text-green-400"></i>
                  <span>+30 Proyectos Completados</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-check-line text-green-400"></i>
                  <span>Equipo de Expertos</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-check-line text-green-400"></i>
                  <span>Soporte 24/7</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={scrollToPortfolio}
                className="px-8 py-4 bg-linear-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all  transform hover:scale-105 shadow-lg hover:shadow-xl whitespace-nowrap cursor-pointer"
              >
                Ver Portafolio
                <i className="ri-arrow-right-line ml-2"></i>
              </button>

              <button
                onClick={scrollToContact}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/30 hover:bg-white/20 transition-all  whitespace-nowrap cursor-pointer"
              >
                Contactar Ahora
                <i className="ri-phone-line ml-2"></i>
              </button>

              <button
                onClick={goToFreelancers}
                className="px-8 py-4 bg-linear-to-r from-cyan-600 to-cyan-500 text-white font-semibold rounded-lg hover:from-cyan-700 hover:to-cyan-600 transition-all  transform hover:scale-105 shadow-lg hover:shadow-xl whitespace-nowrap cursor-pointer"
              >
                Ver Freelancers
                <i className="ri-team-line ml-2"></i>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  +{gdnStats.completedProjects}
                </div>
                <div className="text-blue-200 text-sm">Proyectos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  +{gdnStats.satisfiedClients}
                </div>
                <div className="text-blue-200 text-sm">Clientes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">5★</div>
                <div className="text-blue-200 text-sm">Calificación</div>
              </div>
            </div>
          </div>

          {/* Right side - Image space is handled by background */}
          <div className="hidden lg:block"></div>
        </div>
      </div>

      {/* Animated scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <button onClick={scrollToContact}>
            <i className="ri-arrow-down-line text-white text-2xl"></i>
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero

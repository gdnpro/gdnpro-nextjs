import { gdnStats } from "@/constants/currentData"

const Hero = () => {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('/banners/hero-banner.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/80 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div className="space-y-6 sm:space-y-8 text-white">
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight font-bold">
                Transformamos
                <span className="block bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Ideas en Realidad
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed text-blue-100">
                En <span className="font-semibold text-white">GDN PRO</span> creamos soluciones
                digitales innovadoras. Desarrollo web, apps móviles y marketing digital de clase
                mundial.
              </p>

              <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-blue-200">
                <div className="flex items-center gap-2">
                  <i className="ri-check-line text-green-400 text-sm sm:text-base"></i>
                  <span>+19 Proyectos Completados</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-check-line text-green-400 text-sm sm:text-base"></i>
                  <span>Equipo de Expertos</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-check-line text-green-400 text-sm sm:text-base"></i>
                  <span>Soporte 24/7</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:flex-wrap">
              <a
                href="#portfolio"
                className="w-full sm:w-auto transform cursor-pointer rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 sm:px-8 py-3 sm:py-4 font-semibold text-center whitespace-nowrap text-white shadow-lg transition-all hover:scale-105 hover:from-emerald-700 hover:to-emerald-600 hover:shadow-xl active:scale-95 touch-manipulation min-h-[44px] flex items-center justify-center"
              >
                Ver Portafolio
                <i className="ri-arrow-right-line ml-2"></i>
              </a>

              <a
                href="#contact"
                className="w-full sm:w-auto cursor-pointer rounded-lg border border-white/30 bg-white/10 px-6 sm:px-8 py-3 sm:py-4 font-semibold text-center whitespace-nowrap text-white backdrop-blur-sm transition-all hover:bg-white/20 active:bg-white/30 touch-manipulation min-h-[44px] flex items-center justify-center"
              >
                Contactar Ahora
                <i className="ri-phone-line ml-2"></i>
              </a>

              <a
                href="/freelancers"
                className="w-full sm:w-auto transform cursor-pointer rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 sm:px-8 py-3 sm:py-4 font-semibold text-center whitespace-nowrap text-white shadow-lg transition-all hover:scale-105 hover:from-cyan-700 hover:to-cyan-600 hover:shadow-xl active:scale-95 touch-manipulation min-h-[44px] flex items-center justify-center"
              >
                Ver Freelancers
                <i className="ri-team-line ml-2"></i>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 border-t border-white/20 pt-6 sm:pt-8">
              <div className="group text-center transition-all hover:scale-105">
                <div className="mb-2 inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                  <i className="ri-briefcase-line text-sm sm:text-lg text-white"></i>
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">+{gdnStats.completedProjects}</div>
                <div className="text-xs sm:text-sm text-blue-200">Proyectos</div>
              </div>
              <div className="group text-center transition-all hover:scale-105">
                <div className="mb-2 inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                  <i className="ri-team-line text-sm sm:text-lg text-white"></i>
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">+{gdnStats.satisfiedClients}</div>
                <div className="text-xs sm:text-sm text-blue-200">Clientes</div>
              </div>
              <div className="group text-center transition-all hover:scale-105">
                <div className="mb-2 inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                  <i className="ri-star-fill text-sm sm:text-lg text-yellow-300"></i>
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">5★</div>
                <div className="text-xs sm:text-sm text-blue-200">Calificación</div>
              </div>
            </div>
          </div>

          {/* Right side - Image space is handled by background */}
          <div className="hidden lg:block"></div>
        </div>
      </div>

      {/* Animated scroll indicator */}
      <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 transform md:bottom-8">
        <div className="animate-bounce">
          <a className="cursor-pointer" href="#services">
            <i className="ri-arrow-down-line text-2xl text-white"></i>
          </a>
        </div>
      </div>
    </section>
  )
}

export default Hero

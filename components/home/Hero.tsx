import { gdnStats } from "@/constants/currentData"

const Hero = () => {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
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
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div className="space-y-8 text-white">
            <div className="space-y-6">
              <h1 className="text-5xl leading-tight font-bold lg:text-6xl">
                Transformamos
                <span className="block bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Ideas en Realidad
                </span>
              </h1>

              <p className="text-xl leading-relaxed text-blue-100 lg:text-2xl">
                En <span className="font-semibold text-white">GDN PRO</span> creamos soluciones
                digitales innovadoras. Desarrollo web, apps móviles y marketing digital de clase
                mundial.
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-blue-200">
                <div className="flex items-center gap-2">
                  <i className="ri-check-line text-green-400"></i>
                  <span>+19 Proyectos Completados</span>
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
            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="#portfolio"
                className="transform cursor-pointer rounded-lg bg-linear-to-r from-emerald-600 to-emerald-500 px-8 py-4 font-semibold whitespace-nowrap text-white shadow-lg transition-all hover:scale-105 hover:from-emerald-700 hover:to-emerald-600 hover:shadow-xl"
              >
                Ver Portafolio
                <i className="ri-arrow-right-line ml-2"></i>
              </a>

              <a
                href="#contact"
                className="cursor-pointer rounded-lg border border-white/30 bg-white/10 px-8 py-4 font-semibold whitespace-nowrap text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Contactar Ahora
                <i className="ri-phone-line ml-2"></i>
              </a>

              <a
                href="/freelancers"
                className="transform cursor-pointer rounded-lg bg-linear-to-r from-cyan-600 to-cyan-500 px-8 py-4 font-semibold whitespace-nowrap text-white shadow-lg transition-all hover:scale-105 hover:from-cyan-700 hover:to-cyan-600 hover:shadow-xl"
              >
                Ver Freelancers
                <i className="ri-team-line ml-2"></i>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 border-t border-white/20 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">+{gdnStats.completedProjects}</div>
                <div className="text-sm text-blue-200">Proyectos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">+{gdnStats.satisfiedClients}</div>
                <div className="text-sm text-blue-200">Clientes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">5★</div>
                <div className="text-sm text-blue-200">Calificación</div>
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

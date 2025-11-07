"use client"

export default function WorksHero() {
  const scrollToSearch = () => {
    const element = document.getElementById("works-search")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('/banners/works-banner.avif')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 text-center text-white">
        <h1 className="mb-8 text-5xl leading-tight font-bold md:text-7xl">
          Encuentra Proyectos
          <span className="block text-cyan-400">Que Te Inspiren</span>
        </h1>
        <p className="mx-auto mb-12 max-w-4xl text-xl leading-relaxed md:text-2xl">
          Descubre oportunidades de trabajo que se ajusten a tus habilidades y experiencia. Conecta
          con clientes verificados y crece tu carrera como freelancer
        </p>

        <div className="flex flex-col justify-center gap-6 sm:flex-row">
          <button
            onClick={scrollToSearch}
            className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-12 py-5 text-xl font-bold whitespace-nowrap text-white shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/40"
          >
            <i className="ri-search-line text-2xl transition-transform group-hover:scale-110"></i>
            Explorar Proyectos
          </button>
          <a
            href="/dashboard"
            className="group inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-white bg-white/10 px-12 py-5 text-xl font-bold whitespace-nowrap text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:text-gray-900"
          >
            <i className="ri-dashboard-line text-2xl transition-transform group-hover:scale-110"></i>
            Ver Mi Dashboard
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 transform animate-bounce text-white">
        <button
          onClick={scrollToSearch}
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 border-white transition-all hover:bg-white hover:text-gray-900"
        >
          <i className="ri-arrow-down-line text-2xl"></i>
        </button>
      </div>
    </section>
  )
}

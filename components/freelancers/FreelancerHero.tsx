"use client"

export default function FreelancerHero() {
  const scrollToSearch = () => {
    const element = document.getElementById("freelancer-search")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('/bannerfreelancers.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 text-center text-white">
        <h1 className="mb-8 text-5xl leading-tight font-bold md:text-7xl">
          Marketplace de
          <span className="block text-cyan-400">Freelancers</span>
        </h1>
        <p className="mx-auto mb-12 max-w-4xl text-xl leading-relaxed md:text-2xl">
          Conecta con los mejores freelancers especializados o únete a nuestra red de talento
          verificado
        </p>

        <div className="flex flex-col justify-center gap-6 sm:flex-row">
          <button
            onClick={scrollToSearch}
            className="bg-primary cursor-pointer rounded-full px-12 py-5 text-xl font-bold whitespace-nowrap text-white transition-all hover:scale-105 hover:bg-cyan-700"
          >
            Buscar Freelancers
          </button>
          <a
            href="/auth/register"
            className="cursor-pointer rounded-full border-2 border-white px-12 py-5 text-xl font-bold whitespace-nowrap text-white transition-all hover:scale-105 hover:bg-white hover:text-gray-900"
          >
            Únete Como Freelancer
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

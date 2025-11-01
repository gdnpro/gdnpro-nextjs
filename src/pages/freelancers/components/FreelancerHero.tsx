"use client"

export default function FreelancerHero() {
  const scrollToSearch = () => {
    const element = document.getElementById("freelancer-search")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  const scrollToJoin = () => {
    const element = document.getElementById("join-freelancer")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center text-white">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
          Marketplace de
          <span className="block text-cyan-400">Freelancers</span>
        </h1>
        <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed">
          Conecta con los mejores freelancers especializados o únete a nuestra
          red de talento verificado
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button
            onClick={scrollToSearch}
            className="bg-primary hover:bg-cyan-700 text-white px-12 py-5 rounded-full text-xl font-bold transition-all  hover:scale-105 whitespace-nowrap cursor-pointer"
          >
            Buscar Freelancers
          </button>
          <button
            onClick={scrollToJoin}
            className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-12 py-5 rounded-full text-xl font-bold transition-all  hover:scale-105 whitespace-nowrap cursor-pointer"
          >
            Únete Como Freelancer
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <button
          onClick={scrollToSearch}
          className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center hover:bg-white hover:text-gray-900 transition-all  cursor-pointer"
        >
          <i className="ri-arrow-down-line text-2xl"></i>
        </button>
      </div>
    </section>
  )
}

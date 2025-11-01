import { teamMembers } from "@/services/TeamMembers"

export default function Team() {
  return (
    <section id="team" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Nuestro Equipo
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conoce a los profesionales apasionados que hacen posible cada
            proyecto exitoso
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all  hover:-translate-y-2"
            >
              <div className="relative overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-80 object-cover object-top group-hover:scale-110 transition-transform "
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity "></div>
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all ">
                  <div className="flex justify-center space-x-4">
                    {Object.entries(member.social).map(
                      ([platform, link], idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-primary transition-all  cursor-pointer"
                        >
                          <i className={`ri-${platform}-line text-lg`}></i>
                        </a>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-primary font-semibold mb-3">
                  {member.position}
                </p>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="bg-blue-50 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              ¿Quieres formar parte de nuestro equipo?
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Estamos siempre buscando talento excepcional para unirse a nuestra
              red de freelancers especializados
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => (window.location.href = "/freelancers")}
                className="bg-primary hover:bg-cyan-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all  whitespace-nowrap cursor-pointer"
              >
                Ver Oportunidades
              </button>
              <button
                onClick={() => (window.location.href = "/register")}
                className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all  whitespace-nowrap cursor-pointer"
              >
                Únete Como Freelancer
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

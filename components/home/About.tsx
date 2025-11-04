import { Counter } from "@/components/Counter"
import { gdnStats } from "@/constants/currentData"

export default function About() {
  const stats = [
    { number: gdnStats.completedProjects, label: "Proyectos Completados" },
    { number: gdnStats.satisfiedClients, label: "Clientes Satisfechos" },
    { number: gdnStats.experienceYears, label: "Años de Experiencia" },
    { number: gdnStats.qualifications, label: "Tasa de Satisfacción" },
  ]

  const scrollToContact = () => {
    const element = document.getElementById("contact")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Sobre GDN Pro
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Somos una empresa de consultoría digital especializada en
              transformar ideas en soluciones tecnológicas innovadoras. Con más
              de 2 años de experiencia, hemos ayudado a empresas de todos los
              tamaños a digitalizar sus procesos y alcanzar sus objetivos.
            </p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Nuestro enfoque integral combina desarrollo de software de alta
              calidad, estrategias de marketing digital efectivas y acceso a una
              red de freelancers especializados para cubrir todas tus
              necesidades digitales.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <i className="ri-check-double-line text-primary text-xl mr-4"></i>
                <span className="text-gray-700 text-lg">
                  Soluciones personalizadas para cada cliente
                </span>
              </div>
              <div className="flex items-center">
                <i className="ri-check-double-line text-primary text-xl mr-4"></i>
                <span className="text-gray-700 text-lg">
                  Tecnologías de vanguardia
                </span>
              </div>
              <div className="flex items-center">
                <i className="ri-check-double-line text-primary text-xl mr-4"></i>
                <span className="text-gray-700 text-lg">
                  Soporte continuo y mantenimiento
                </span>
              </div>
              <div className="flex items-center">
                <i className="ri-check-double-line text-primary text-xl mr-4"></i>
                <span className="text-gray-700 text-lg">
                  Red de freelancers especializados
                </span>
              </div>
            </div>

            <button
              onClick={scrollToContact}
              className="bg-primary hover:bg-cyan-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all whitespace-nowrap cursor-pointer"
            >
              Conoce Más Sobre Nosotros
            </button>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1580920461931-fcb03a940df5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470"
              alt="GDN Pro Team"
              className="rounded-2xl shadow-2xl object-cover object-top w-full h-96"
            />
            <div className="absolute -bottom-8 -left-8 bg-white rounded-2xl p-6 shadow-xl">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">2023</div>
                <div className="text-gray-600">Fundada</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                <span>
                  <Counter initial={0} final={stat.number} />
                  {index === 3 ? "%" : ""}
                </span>
              </div>
              <div className="text-gray-600 text-lg">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

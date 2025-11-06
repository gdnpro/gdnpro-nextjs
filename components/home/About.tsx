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
    <section id="about" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">Sobre GDN Pro</h2>
            <p className="mb-8 text-xl leading-relaxed text-gray-600">
              Somos una empresa de consultoría digital especializada en transformar ideas en
              soluciones tecnológicas innovadoras. Con más de 2 años de experiencia, hemos ayudado a
              empresas de todos los tamaños a digitalizar sus procesos y alcanzar sus objetivos.
            </p>
            <p className="mb-8 text-lg leading-relaxed text-gray-600">
              Nuestro enfoque integral combina desarrollo de software de alta calidad, estrategias
              de marketing digital efectivas y acceso a una red de freelancers especializados para
              cubrir todas tus necesidades digitales.
            </p>

            <div className="mb-8 space-y-4">
              <div className="flex items-center">
                <i className="ri-check-double-line text-primary mr-4 text-xl"></i>
                <span className="text-lg text-gray-700">
                  Soluciones personalizadas para cada cliente
                </span>
              </div>
              <div className="flex items-center">
                <i className="ri-check-double-line text-primary mr-4 text-xl"></i>
                <span className="text-lg text-gray-700">Tecnologías de vanguardia</span>
              </div>
              <div className="flex items-center">
                <i className="ri-check-double-line text-primary mr-4 text-xl"></i>
                <span className="text-lg text-gray-700">Soporte continuo y mantenimiento</span>
              </div>
              <div className="flex items-center">
                <i className="ri-check-double-line text-primary mr-4 text-xl"></i>
                <span className="text-lg text-gray-700">Red de freelancers especializados</span>
              </div>
            </div>

            <button
              onClick={scrollToContact}
              className="bg-primary cursor-pointer rounded-full px-8 py-4 text-lg font-semibold whitespace-nowrap text-white transition-all hover:bg-cyan-700"
            >
              Conoce Más Sobre Nosotros
            </button>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1580920461931-fcb03a940df5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470"
              alt="GDN Pro Team"
              className="h-96 w-full rounded-2xl object-cover object-top shadow-2xl"
            />
            <div className="absolute -bottom-8 -left-8 rounded-2xl bg-white p-6 shadow-xl">
              <div className="text-center">
                <div className="text-gray-600">Fundada</div>
                <div className="text-primary mb-2 text-3xl font-bold">2023</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-primary mb-2 text-4xl font-bold md:text-5xl">
                <span>
                  <Counter initial={0} final={stat.number} />
                  {index === 3 ? "%" : ""}
                </span>
              </div>
              <div className="text-lg text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

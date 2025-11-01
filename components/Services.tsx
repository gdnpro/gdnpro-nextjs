import { services } from "@/services/HomeServices"

export default function Services() {
  const scrollToContact = () => {
    const element = document.getElementById("contact")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  const Unirteahora = () => {
    window.location.href = "/freelancers"
  }

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Nuestros Servicios
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ofrecemos soluciones completas para impulsar tu negocio en el mundo
            digital
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <article
              key={index}
              className="bg-white flex rounded-2xl p-8 justify-between flex-col shadow-lg hover:shadow-xl transition-all  hover:-translate-y-2"
            >
              <div>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <i className={`${service.icon} text-primary text-3xl`}></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {service.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center text-sm text-gray-600"
                  >
                    <i className="ri-check-line text-primary mr-2"></i>
                    {feature}
                  </li>
                ))}
              </ul>

              <footer className="border-t pt-6">
                <div className="text-xl font-bold text-primary mb-4">
                  {service.price}
                </div>
                <button
                  onClick={
                    service.title === "Red de Freelancers"
                      ? Unirteahora
                      : scrollToContact
                  }
                  className="w-full bg-primary hover:bg-cyan-700 text-white py-3 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer"
                >
                  {service.title === "Red de Freelancers"
                    ? "Unirte Ahora"
                    : "Solicitar Cotización"}
                </button>
              </footer>
            </article>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              ¿Necesitas una solución personalizada?
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Cada proyecto es único. Conversemos sobre tus necesidades
              específicas y creemos la solución perfecta para ti.
            </p>
            <button
              onClick={scrollToContact}
              className="bg-primary hover:bg-cyan-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all  whitespace-nowrap cursor-pointer"
            >
              Consulta Gratuita
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

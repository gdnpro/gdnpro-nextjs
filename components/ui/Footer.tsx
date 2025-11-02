"use client"

import { useRouter, usePathname } from "next/navigation"

export default function Footer() {
  const router = useRouter()
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()

  const scrollToSection = (sectionId: string) => {
    if (pathname !== "/") {
      // Si NO estás en la home → redirige a home con hash
      router.push(`/#${sectionId}`)
    } else {
      // Si YA estás en la home → hace scroll suave
      const section = document.getElementById(sectionId)
      if (section) {
        section.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Grid principal de 4 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 items-start">
          {/* Logo y descripción */}
          <div className="space-y-4 flex flex-col justify-start">
            <div className="w-fit">
              <img src="/logo.png" alt="GDN PRO" className="h-12 w-auto" />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Transformamos ideas en realidad digital. Expertos en desarrollo
              web, apps móviles y marketing digital.
            </p>

            {/* Redes sociales 
            <div className="flex space-x-4 pt-2">
              <a
                href="#"
                className="w-10 h-10 bg-primary hover:bg-cyan-700 rounded-full flex items-center justify-center transition-all  cursor-pointer"
              >
                <i className="ri-linkedin-line"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-primary hover:bg-cyan-700 rounded-full flex items-center justify-center transition-all  cursor-pointer"
              >
                <i className="ri-twitter-line"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-primary hover:bg-cyan-700 rounded-full flex items-center justify-center transition-all  cursor-pointer"
              >
                <i className="ri-instagram-line"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-primary hover:bg-cyan-700 rounded-full flex items-center justify-center transition-all  cursor-pointer"
              >
                <i className="ri-github-line"></i>
              </a>
            </div>*/}
          </div>

          {/* Servicios */}
          <div>
            <h3 className="text-xl font-bold mb-6">Servicios</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollToSection("services")}
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Desarrollo Web
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("services")}
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Desarrollo Móvil
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("services")}
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Marketing Digital
                </button>
              </li>
              <li>
                <a
                  href="/freelancers"
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Red de Freelancers
                </a>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Consultoría
                </button>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-xl font-bold mb-6">Empresa</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollToSection("about")}
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Sobre Nosotros
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("portfolio")}
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Portafolio
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("team")}
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Nuestro Equipo
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("testimonials")}
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Testimonios
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xl font-bold mb-6">Newsletter</h3>
            <p className="text-gray-300 mb-4">
              Suscríbete para recibir las últimas noticias y ofertas especiales.
            </p>
            <div className="space-y-3">
              <input
                id="email-footer"
                type="email"
                placeholder="Tu email"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-primary text-white focus:outline-none placeholder-gray-400"
              />
              <button className="w-full bg-primary hover:bg-cyan-700 text-white py-3 rounded-xl font-semibold transition-all  whitespace-nowrap cursor-pointer">
                Suscribirse
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 mb-4 md:mb-0">
              © {currentYear} GDN Pro. Todos los derechos reservados.
            </div>
            <div className="flex flex-wrap gap-6">
              <a
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Política de Privacidad
              </a>
              <a
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Términos de Servicio
              </a>
              <a
                href="/data-deletion"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Eliminación de Datos
              </a>
              <button
                onClick={scrollToTop}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center"
              >
                <i className="ri-arrow-up-line mr-1"></i>Volver arriba
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

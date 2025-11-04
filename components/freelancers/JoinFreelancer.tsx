"use client"

import { useState } from "react"

export default function JoinFreelancer() {
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<"freelancer" | "client">(
    "freelancer"
  )
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: "",
    skills: [] as string[],
    hourlyRate: "",
    experienceYears: "",
    companyName: "",
    industry: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [skillInput, setSkillInput] = useState("")

  const categorizedSkills = [
    {
      category: "Lenguajes de Programación",
      skills: [
        "JavaScript",
        "TypeScript",
        "Python",
        "Java",
        "C#",
        "C++",
        "C",
        "Go",
        "PHP",
        "Ruby",
        "Swift",
        "Kotlin",
        "Rust",
        "Dart",
        "Scala",
        "R",
        "Perl",
        "Elixir",
        "Haskell",
        "Lua",
        "Bash",
        "Shell Script",
        "Objective-C",
        "Visual Basic",
        "MATLAB",
        "Julia",
        "COBOL",
        "Fortran",
        "Assembly",
      ],
    },
    {
      category: "Frontend",
      skills: [
        "React",
        "React Native",
        "Next.js",
        "Vue.js",
        "Nuxt.js",
        "Angular",
        "Svelte",
        "SvelteKit",
        "SolidJS",
        "Qwik",
        "Astro",
        "Preact",
        "Alpine.js",
        "jQuery",
        "Tailwind CSS",
        "Bootstrap",
        "Bulma",
        "Foundation",
        "Material UI",
        "Chakra UI",
        "Ant Design",
        "Styled Components",
        "Framer Motion",
      ],
    },
    {
      category: "Backend",
      skills: [
        "Node.js",
        "Express.js",
        "NestJS",
        "Fastify",
        "AdonisJS",
        "Hapi",
        "Django",
        "Flask",
        "FastAPI",
        "Tornado",
        "Laravel",
        "Symfony",
        "CodeIgniter",
        "Spring Boot",
        "Micronaut",
        "Quarkus",
        "ASP.NET Core",
        "Ruby on Rails",
        "Phoenix (Elixir)",
        "Fiber (Go)",
        "Gin (Go)",
        "GraphQL",
        "REST API",
        "tRPC",
        "gRPC",
      ],
    },
    {
      category: "Bases de Datos",
      skills: [
        "MySQL",
        "PostgreSQL",
        "SQLite",
        "MongoDB",
        "MariaDB",
        "Oracle",
        "Microsoft SQL Server",
        "Firebase",
        "Supabase",
        "Redis",
        "Cassandra",
        "CouchDB",
        "DynamoDB",
        "ElasticSearch",
        "PlanetScale",
        "Prisma ORM",
        "TypeORM",
        "Sequelize",
        "Mongoose",
      ],
    },
    {
      category: "DevOps y Cloud",
      skills: [
        "Docker",
        "Kubernetes",
        "AWS",
        "Google Cloud Platform",
        "Microsoft Azure",
        "DigitalOcean",
        "Heroku",
        "Vercel",
        "Netlify",
        "Render",
        "Railway",
        "Cloudflare",
        "Terraform",
        "Ansible",
        "Jenkins",
        "GitHub Actions",
        "GitLab CI",
        "CircleCI",
        "Nginx",
        "Apache",
        "Linux",
        "Bash Scripting",
        "Serverless",
        "CI/CD",
      ],
    },
    {
      category: "Diseño y Multimedia",
      skills: [
        "Figma",
        "Adobe XD",
        "Sketch",
        "Photoshop",
        "Illustrator",
        "Premiere Pro",
        "After Effects",
        "Lightroom",
        "Canva",
        "CorelDRAW",
        "Blender",
        "Cinema 4D",
        "3ds Max",
        "Maya",
        "UI/UX Design",
        "Wireframing",
        "Prototyping",
        "Motion Graphics",
        "Video Editing",
      ],
    },
    {
      category: "Marketing y Negocios",
      skills: [
        "Marketing Digital",
        "SEO",
        "SEM",
        "Google Ads",
        "Facebook Ads",
        "TikTok Ads",
        "LinkedIn Ads",
        "Community Management",
        "Social Media Strategy",
        "Branding",
        "E-commerce",
        "Shopify",
        "WooCommerce",
        "Google Analytics",
        "Data Studio",
        "Email Marketing",
        "Content Marketing",
        "Copywriting",
        "Growth Hacking",
        "CRM (HubSpot, Salesforce)",
      ],
    },
    {
      category: "IA y Ciencia de Datos",
      skills: [
        "Machine Learning",
        "Deep Learning",
        "Artificial Intelligence",
        "Data Science",
        "Data Analysis",
        "TensorFlow",
        "PyTorch",
        "Keras",
        "Scikit-learn",
        "Pandas",
        "NumPy",
        "Matplotlib",
        "Seaborn",
        "Power BI",
        "Tableau",
        "BigQuery",
        "Apache Spark",
        "Hadoop",
        "LangChain",
        "OpenAI API",
        "IA Generativa",
      ],
    },
    {
      category: "Ciberseguridad y Testing",
      skills: [
        "Ciberseguridad",
        "Pentesting",
        "Ethical Hacking",
        "OWASP",
        "Network Security",
        "Firewalls",
        "Testing QA",
        "Unit Testing",
        "Integration Testing",
        "Selenium",
        "Cypress",
        "Playwright",
        "Postman",
        "API Testing",
      ],
    },
    {
      category: "Blockchain y Web3",
      skills: [
        "Blockchain",
        "Ethereum",
        "Solidity",
        "Web3.js",
        "Ethers.js",
        "Smart Contracts",
        "NFT",
        "DeFi",
        "Crypto Trading Bots",
        "Rust (Solana)",
        "Metamask Integration",
        "IPFS",
      ],
    },
    {
      category: "Automatización y Bots",
      skills: [
        "Automatización de Procesos",
        "RPA (UiPath, Automation Anywhere)",
        "Scripting",
        "Zapier",
        "Make (Integromat)",
        "Chatbots",
        "Dialogflow",
        "Botpress",
        "Telebot",
        "Discord.js",
        "Slack Bots",
      ],
    },
    {
      category: "Gestión y Negocios",
      skills: [
        "Gestión de Proyectos",
        "Scrum",
        "Agile",
        "Kanban",
        "Trello",
        "Jira",
        "Notion",
        "Asana",
        "Slack",
        "Microsoft Teams",
        "Comunicación Empresarial",
        "Planificación Estratégica",
      ],
    },
    {
      category: "Otros",
      skills: [
        "IoT (Internet of Things)",
        "Raspberry Pi",
        "Arduino",
        "Automatización Industrial",
        "Educación Online",
        "Traducción",
        "Transcripción",
        "Redacción Técnica",
        "Legal",
        "Contabilidad",
        "Finanzas",
        "Excel Avanzado",
        "Data Entry",
      ],
    },
  ]

  const [openCategory, setOpenCategory] = useState<string | null>(null)

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill],
      })
      setSkillInput("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(
        "https://kdmdhhhppizzlhvauofe.supabase.co/functions/v1/auth-handler",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "register",
            userData: {
              email: formData.email,
              password: formData.password,
              userType,
              fullName: formData.fullName,
              bio: formData.bio,
              skills: formData.skills,
              hourlyRate: formData.hourlyRate
                ? parseFloat(formData.hourlyRate)
                : null,
              experienceYears: formData.experienceYears
                ? parseInt(formData.experienceYears)
                : null,
            },
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar usuario")
      }

      // Redirigir al dashboard correspondiente
      if (userType === "freelancer") {
        window.location.href = "/dashboard/freelancer"
      } else {
        window.location.href = "/dashboard/client"
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="join-freelancer" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Únete a Nuestra Red de Freelancers
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Forma parte de nuestra comunidad de profesionales y accede a
            proyectos de alta calidad con clientes verificados
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="bg-blue-50 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                ¿Por qué unirse a GDN Pro?
              </h3>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4 shrink-0">
                    <i className="ri-money-dollar-circle-line text-primary text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Pagos Garantizados
                    </h4>
                    <p className="text-gray-600">
                      Recibe tus pagos de forma segura y puntual a través de
                      nuestra plataforma.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4 shrink-0">
                    <i className="ri-shield-check-line text-primary text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Clientes Verificados
                    </h4>
                    <p className="text-gray-600">
                      Todos nuestros clientes pasan por un proceso de
                      verificación riguroso.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4 shrink-0">
                    <i className="ri-team-line text-primary text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Soporte 24/7
                    </h4>
                    <p className="text-gray-600">
                      Nuestro equipo te apoya en cada paso del proceso.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4 shrink-0">
                    <i className="ri-rocket-line text-primary text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Proyectos de Calidad
                    </h4>
                    <p className="text-gray-600">
                      Accede a proyectos interesantes y bien remunerados.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 text-white rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4">Comisión Competitiva</h3>
              <div className="text-3xl font-bold text-cyan-400 mb-2">
                Solo 15%
              </div>
              <p className="text-gray-300 mb-4">
                Una de las comisiones más bajas del mercado. Mantén más de tus
                ganancias.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center">
                  <i className="ri-check-line text-green-400 mr-2"></i>
                  Sin costos ocultos
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-green-400 mr-2"></i>
                  Pagos semanales
                </li>
                <li className="flex items-center">
                  <i className="ri-check-line text-green-400 mr-2"></i>
                  Múltiples métodos de pago
                </li>
              </ul>
            </div>
          </div>

          <div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Crear Cuenta
              </h3>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Paso 1: Tipo de usuario */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      ¿Cómo quieres usar GDN Pro?
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <button
                        type="button"
                        onClick={() => setUserType("freelancer")}
                        className={`p-6 border-2 rounded-lg text-left hover:border-primary/5 transition-all cursor-pointer ${
                          userType === "freelancer"
                            ? "border-cyan-700 bg-primary/10"
                            : "border-gray-300"
                        }`}
                      >
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 bg-cyan-700 rounded-full flex items-center justify-center mr-3">
                            <i className="ri-user-line text-cyan-50"></i>
                          </div>
                          <h5 className="font-semibold text-gray-900">
                            Soy Freelancer
                          </h5>
                        </div>
                        <p className="text-sm text-gray-600">
                          Quiero ofrecer mis servicios y encontrar proyectos
                          interesantes
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserType("client")}
                        className={`p-6 border-2 rounded-lg text-left hover:bg-primary/5 transition-all cursor-pointer ${
                          userType === "client"
                            ? "border-cyan-700 bg-primary/10"
                            : "border-gray-300"
                        }`}
                      >
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 bg-cyan-700 rounded-full flex items-center justify-center mr-3">
                            <i className="ri-briefcase-line text-cyan-50"></i>
                          </div>
                          <h5 className="font-semibold text-gray-900">
                            Soy Cliente
                          </h5>
                        </div>
                        <p className="text-sm text-gray-600">
                          Necesito contratar freelancers para mis proyectos
                        </p>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 whitespace-nowrap cursor-pointer"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {/* Paso 2: Información básica */}
              {step === 2 && (
                <form className="space-y-6" onSubmit={handleRegister}>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label
                        htmlFor="fullName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        id="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Contraseña
                      </label>
                      <input
                        type="password"
                        name="password"
                        id="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Confirmar Contraseña
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {userType === "freelancer"
                        ? "Descripción profesional"
                        : "Descripción de tu empresa"}
                    </label>
                    <textarea
                      name="bio"
                      id="bio"
                      rows={3}
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      placeholder={
                        userType === "freelancer"
                          ? "Cuéntanos sobre tu experiencia y especialidades..."
                          : "Cuéntanos sobre tu empresa y qué tipo de proyectos necesitas..."
                      }
                    />
                  </div>

                  {userType === "freelancer" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Habilidades
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {formData.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="ml-2 text-emerald-600 hover:text-emerald-800 cursor-pointer"
                              >
                                <i className="ri-close-line text-xs"></i>
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), addSkill(skillInput))
                            }
                            placeholder="Añadir habilidad"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => addSkill(skillInput)}
                            className="px-4 py-2 bg-primary  text-white rounded-md hover:bg-cyan-700 whitespace-nowrap cursor-pointer"
                          >
                            Añadir
                          </button>
                        </div>
                        <div className="space-y-4">
                          {categorizedSkills.map((group) => (
                            <div
                              key={group.category}
                              className="border border-gray-200 rounded-lg"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenCategory(
                                    openCategory === group.category
                                      ? null
                                      : group.category
                                  )
                                }
                                className="w-full flex justify-between items-center px-4 py-2 text-left font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-t-lg"
                              >
                                {group.category}
                                <i
                                  className={`ri-arrow-${
                                    openCategory === group.category
                                      ? "up"
                                      : "down"
                                  }-s-line text-gray-600`}
                                ></i>
                              </button>

                              {openCategory === group.category && (
                                <div className="p-3 flex flex-wrap gap-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                                  {group.skills.map((skill) => (
                                    <button
                                      key={skill}
                                      type="button"
                                      onClick={() => addSkill(skill)}
                                      className="px-3 py-1 text-xs bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
                                    >
                                      + {skill}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label
                            htmlFor="hourlyRate"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Tarifa por Hora (USD)
                          </label>
                          <input
                            type="number"
                            name="hourlyRate"
                            id="hourlyRate"
                            min="5"
                            max="500"
                            value={formData.hourlyRate}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="experienceYears"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Años de Experiencia
                          </label>
                          <select
                            name="experienceYears"
                            id="experienceYears"
                            value={formData.experienceYears}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm pr-8"
                          >
                            <option value="">Seleccionar</option>
                            <option value="0">Menos de 1 año</option>
                            <option value="1">1-2 años</option>
                            <option value="3">3-5 años</option>
                            <option value="6">6-10 años</option>
                            <option value="11">Más de 10 años</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 whitespace-nowrap cursor-pointer"
                    >
                      Atrás
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creando cuenta...
                        </div>
                      ) : (
                        "Crear Cuenta"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

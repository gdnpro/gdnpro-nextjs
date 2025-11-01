export default function FreelancerStats() {
  const stats = [
    {
      number: "500+",
      label: "Freelancers Verificados",
      icon: "ri-user-star-line",
    },
    {
      number: "1,200+",
      label: "Proyectos Completados",
      icon: "ri-trophy-line",
    },
    {
      number: "98%",
      label: "Satisfacción del Cliente",
      icon: "ri-heart-line",
    },
    {
      number: "24/7",
      label: "Soporte Disponible",
      icon: "ri-customer-service-line",
    },
  ]

  return (
    <section className="py-20 bg-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className={`${stat.icon} text-white text-3xl`}></i>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

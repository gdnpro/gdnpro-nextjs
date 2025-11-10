"use client"

import { testimonials } from "@/services/Tertimonials"
import { useState } from "react"
import { useTranslation } from "react-i18next"

export default function Testimonials() {
  const { t } = useTranslation()
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {t("testimonials.title")}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t("testimonials.subtitle")}
          </p>
        </div>

        <div className="relative">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <div className="flex mb-6">
                  {[...Array(testimonials[activeTestimonial].rating)].map(
                    (_, i) => (
                      <i
                        key={i}
                        className="ri-star-fill text-yellow-400 text-2xl"
                      ></i>
                    )
                  )}
                </div>

                <blockquote className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-8 italic">
                  "{testimonials[activeTestimonial].text}"
                </blockquote>

                <div className="flex items-center mb-4">
                  <img
                    src={testimonials[activeTestimonial].image}
                    alt={testimonials[activeTestimonial].name}
                    className="w-16 h-16 rounded-full object-cover object-top mr-4"
                  />
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {testimonials[activeTestimonial].name}
                    </h4>
                    <p className="text-gray-600">
                      {testimonials[activeTestimonial].position} en{" "}
                      {testimonials[activeTestimonial].company}
                    </p>
                  </div>
                </div>

                <div className="bg-secondary/40 rounded-xl p-4">
                  <p className="text-primary font-semibold">
                    {t("testimonials.project")} {testimonials[activeTestimonial].project}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {testimonials.map((testimonial, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-full border-2 border-transparent text-left p-4 rounded-xl transition-all  cursor-pointer ${
                      activeTestimonial === index
                        ? "bg-primary/20 border-2 border-cyan-300"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover object-top mr-3"
                      />
                      <div>
                        <h5 className="font-semibold text-gray-900">
                          {testimonial.name}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8 space-x-4">
            <button
              onClick={() =>
                setActiveTestimonial(
                  activeTestimonial > 0
                    ? activeTestimonial - 1
                    : testimonials.length - 1
                )
              }
              className="w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-emerald-600 hover:shadow-xl transition-all  cursor-pointer"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
            <button
              onClick={() =>
                setActiveTestimonial(
                  activeTestimonial < testimonials.length - 1
                    ? activeTestimonial + 1
                    : 0
                )
              }
              className="w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-emerald-600 hover:shadow-xl transition-all  cursor-pointer"
            >
              <i className="ri-arrow-right-line text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

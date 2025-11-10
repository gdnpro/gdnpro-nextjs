"use client"

import Hero from "@/components/home/Hero"
import About from "@/components/home/About"
import Services from "@/components/home/Services"
import Portfolio from "@/components/home/Portfolio"
import Team from "@/components/home/Team"
import Testimonials from "@/components/home/Testimonials"
import CTA from "@/components/home/CTA"
import Contact from "@/components/home/Contact"
import { useEffect } from "react"

export default function Home() {
  useEffect(() => {
    document.title = "Inicio | GDN Pro | Tus Proyectos al siguiente nivel"
  }, [])

  return (
    <>
      <Hero />
      <About />
      <Services />
      <Portfolio />
      <Team />
      <Testimonials />
      <CTA />
      <Contact />
    </>
  )
}

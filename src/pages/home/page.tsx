"use client"

import Hero from "./components/Hero"
import About from "./components/About"
import Services from "./components/Services"
import Portfolio from "./components/Portfolio"
import Team from "./components/Team"
import Testimonials from "./components/Testimonials"
import CTA from "./components/CTA"
import Contact from "./components/Contact"
import Layout from "@/components/Layout"
import { useEffect } from "react"

export default function Home() {
  useEffect(() => {
    document.title = "Inicio | GDN Pro"
  }, [])

  return (
    <Layout>
      <Hero />
      <About />
      <Services />
      <Portfolio />
      <Team />
      <Testimonials />
      <CTA />
      <Contact />
    </Layout>
  )
}

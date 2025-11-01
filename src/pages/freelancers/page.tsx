"use client"

import { useEffect, useState } from "react"
import FreelancerHero from "./components/FreelancerHero"
import FreelancerStats from "./components/FreelancerStats"
import FreelancerSearch from "./components/FreelancerSearch"
import FreelancerGrid from "./components/FreelancerGrid"
import JoinFreelancer from "./components/JoinFreelancer"
import Layout from "@/components/Layout"

export default function Freelancers() {
  const [searchFilters, setSearchFilters] = useState({
    search: "",
    category: "",
    location: "",
    experience: "",
    budget: "",
    availability: "",
  })

  useEffect(() => {
    document.title = "Freelancer | GDN Pro"
    window.scrollTo(0, 0)
  }, [])

  const handleFiltersChange = (filters: typeof searchFilters) => {
    setSearchFilters(filters)
  }

  return (
    <Layout>
      <FreelancerHero />
      <FreelancerStats />
      <FreelancerSearch onFiltersChange={handleFiltersChange} />
      <FreelancerGrid searchFilters={searchFilters} />
      <JoinFreelancer />
    </Layout>
  )
}

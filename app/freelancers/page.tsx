"use client"

import { useEffect, useState } from "react"
import FreelancerHero from "@/components/freelancers/FreelancerHero"
import FreelancerStats from "@/components/freelancers/FreelancerStats"
import FreelancerSearch from "@/components/freelancers/FreelancerSearch"
import FreelancerGrid from "@/components/freelancers/FreelancerGrid"
import JoinFreelancer from "@/components/freelancers/JoinFreelancer"
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
    document.title = "Freelancer | GDN Pro | Encuentra al freelancer ideal para tu proyecto"
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

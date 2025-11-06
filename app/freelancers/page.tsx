"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import FreelancerHero from "@/components/freelancers/FreelancerHero"
import FreelancerStats from "@/components/freelancers/FreelancerStats"
import FreelancerSearch from "@/components/freelancers/FreelancerSearch"
import FreelancerGrid from "@/components/freelancers/FreelancerGrid"
import JoinFreelancer from "@/components/freelancers/JoinFreelancer"
import { useAuth } from "@/contexts/AuthContext"

export default function Freelancers() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [searchFilters, setSearchFilters] = useState({
    search: "",
    category: "",
    location: "",
    experience: "",
    budget: "",
    availability: "",
  })

  useEffect(() => {
    document.title = "Freelancers | GDN Pro | Encuentra al freelancer ideal para tu proyecto"
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    // If user is a freelancer, redirect to works page
    if (!loading && profile?.user_type === "freelancer") {
      router.push("/works")
    }
  }, [profile, loading, router])

  const handleFiltersChange = (filters: typeof searchFilters) => {
    setSearchFilters(filters)
  }

  // Don't show freelancer listings if user is a freelancer
  const isFreelancer = profile?.user_type === "freelancer"

  return (
    <>
      <FreelancerHero />
      <FreelancerStats />
      {!isFreelancer && (
        <>
          <FreelancerSearch onFiltersChange={handleFiltersChange} />
          <FreelancerGrid searchFilters={searchFilters} />
        </>
      )}
      <JoinFreelancer />
    </>
  )
}

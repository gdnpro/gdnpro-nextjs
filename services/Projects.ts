type Project = {
  id: number
  titleKey: string
  descriptionKey: string
  category: "web" | "mobile" | "marketing"
  image: string
  technologies: string[]
  link: string
}

export const projects: Project[] = [
  {
    id: 1,
    titleKey: "portfolio.items.gdnStyle.title",
    descriptionKey: "portfolio.items.gdnStyle.description",
    category: "web",
    image: "https://rikirilis.com/images/gdn-style.webp",
    technologies: ["React", "Next.js", "Firebase", "Analytics", "Tawk"],
    link: "https://gdnstyle.com",
  },
  {
    id: 2,
    titleKey: "portfolio.items.fotoEstudio.title",
    descriptionKey: "portfolio.items.fotoEstudio.description",
    category: "web",
    image: "https://capelix.dev/images/page-presentation.webp",
    technologies: ["Astro", "React", "Supabase", "Tailwind CSS"],
    link: "https://fotoestudioelchevere.com",
  },
  {
    id: 3,
    titleKey: "portfolio.items.stopTrivia.title",
    descriptionKey: "portfolio.items.stopTrivia.description",
    category: "mobile",
    image: "https://rikirilis.com/images/stop-trivia.webp",
    technologies: ["React Native", "Firebase", "Expo"],
    link: "https://play.google.com/store/apps/details?id=com.rilisentertainment.stoptriviaonline",
  },
  {
    id: 4,
    titleKey: "portfolio.items.hospitalSystem.title",
    descriptionKey: "portfolio.items.hospitalSystem.description",
    category: "web",
    image: "/portfolios/portafolio 4.jpg",
    technologies: ["Vue.js", "Laravel", "MySQL", "AWS"],
    link: "#",
  },
  {
    id: 5,
    titleKey: "portfolio.items.fintechApp.title",
    descriptionKey: "portfolio.items.fintechApp.description",
    category: "mobile",
    image: "/portfolios/portafolio 5.jpg",
    technologies: ["Flutter", "Django", "PostgreSQL", "Blockchain"],
    link: "#",
  },
  {
    id: 6,
    titleKey: "portfolio.items.growthHacking.title",
    descriptionKey: "portfolio.items.growthHacking.description",
    category: "marketing",
    image: "/portfolios/portafolio 6.jpg",
    technologies: ["Mixpanel", "Mailchimp", "A/B Testing", "CRO"],
    link: "#",
  },
]

"use client"

import { useActionState, useEffect, useState } from "react"
import { categorizedSkills } from "@/constants/currentData"
import Link from "next/link"
import { FormState } from "@/validations/auth"
import { actions } from "@/actions"
import { FormError } from "./FormError"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

const INITIAL_STATE: FormState = {
  success: false,
  message: undefined,
  loading: false,
  error: undefined,
  errorValues: undefined,
  fields: {
    avatar_url: null as File | null,
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    location: "",
    skills: [],
    bio: "",
    user_type: undefined,
    hourly_rate: 0,
    experience_years: 0,
  },
  databaseErrors: null,
  serverErrors: null,
}

export function RegisterForm() {
  const [formState, formAction, pending] = useActionState(
    actions.auth.registerUserAction,
    INITIAL_STATE,
  )

  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<"freelancer" | "client">("freelancer")
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    location: "",
    password: "",
    confirmPassword: "",
    bio: "",
    skills: [] as string[],
    hourly_rate: "",
    experience_years: "",
    company_name: "",
    industry: "",
    avatar_url: null as File | null,
  })
  const [skillInput, setSkillInput] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  const navigate = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    document.title = t("auth.register.documentTitle")
  }, [t])

  useEffect(() => {
    if (formState.success) {
      navigate.push(formState.redirectTo ?? "/auth/login")
    }
  }, [formState.success, navigate])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      window.toast({
        title: t("auth.register.profilePhoto.invalidFile"),
        type: "warning",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })

      return
    }

    if (file.size > 5 * 1024 * 1024) {
      window.toast({
        title: t("auth.register.profilePhoto.maxSize"),
        type: "warning",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })
      return
    }

    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setFormData({
      ...formData,
      avatar_url: null,
    })

    setImagePreview(null)
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

  const handleUserTypeChange = (userType: "freelancer" | "client") => {
    setUserType(userType)
    setStep(2)
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/">
            <img src="/logo.png" alt="GDN PRO" className="mx-auto mb-6 h-12 w-auto" />
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{t("auth.register.title")}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("auth.register.subtitle")}{" "}
            <Link href="/auth/login" className="text-primary font-medium hover:text-cyan-500">
              {t("auth.register.loginLink")}
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          {/* Paso 1: Tipo de usuario */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-medium text-gray-900">
                  {t("auth.register.step1.question")}
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleUserTypeChange("freelancer")}
                    className={`cursor-pointer rounded-lg border-2 p-6 text-left transition-colors hover:border-cyan-500 ${
                      userType === "freelancer" ? "border-cyan-500 bg-cyan-50" : "border-gray-300"
                    }`}
                  >
                    <div className="mb-3 flex items-center">
                      <div className="bg-primary/10 mr-3 flex h-10 w-10 items-center justify-center rounded-full">
                        <i className="ri-user-line text-primary"></i>
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        {t("auth.register.step1.freelancer.title")}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("auth.register.step1.freelancer.description")}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUserTypeChange("client")}
                    className={`cursor-pointer rounded-lg border-2 p-6 text-left transition-colors hover:border-cyan-500 ${
                      userType === "client" ? "border-cyan-500 bg-cyan-50" : "border-gray-300"
                    }`}
                  >
                    <div className="mb-3 flex items-center">
                      <div className="bg-primary/10 mr-3 flex h-10 w-10 items-center justify-center rounded-full">
                        <i className="ri-briefcase-line text-primary"></i>
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        {t("auth.register.step1.client.title")}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("auth.register.step1.client.description")}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Información básica */}
          {step === 2 && (
            <form className="space-y-6" action={formAction}>
              <input type="hidden" name="user_type" value={userType} />
              {formData.skills.map((skill, i) => (
                <input key={i} type="hidden" name="skills" value={skill} />
              ))}

              {/* Foto de Perfil - Solo para Freelancers */}
              {userType === "freelancer" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t("auth.register.profilePhoto.label")}
                  </label>
                  <div className="flex items-center space-x-6">
                    <div className="shrink-0">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-20 w-20 rounded-full border-2 border-gray-300 object-cover object-top"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-200">
                          <i className="ri-user-line text-2xl text-gray-400"></i>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      {!imagePreview ? (
                        <label className="flex cursor-pointer items-center gap-2">
                          <span className="bg-primary cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700">
                            {t("auth.register.profilePhoto.upload")}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            name="avatar_url"
                          />
                        </label>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer">
                            <span className="cursor-pointer rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700">
                              {t("auth.register.profilePhoto.change")}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                              name="avatar_url"
                            />
                          </label>
                          <span
                            onClick={removeImage}
                            className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                          >
                            {t("auth.register.profilePhoto.remove")}
                          </span>
                        </div>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {t("auth.register.profilePhoto.helper")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    {t("auth.register.fields.fullName")}
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="focus:ring-emerald-5 0 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-cyan-500 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    {t("auth.register.fields.email")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {t("auth.register.fields.password")}
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t("auth.register.fields.confirmPassword")}
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  {t("auth.register.fields.location")}
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none sm:text-sm"
                  placeholder={t("auth.register.placeholders.location")}
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  {userType === "freelancer"
                    ? t("auth.register.bio.freelancerLabel")
                    : t("auth.register.bio.clientLabel")}
                </label>
                <textarea
                  name="bio"
                  id="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none sm:text-sm"
                  placeholder={
                    userType === "freelancer"
                      ? t("auth.register.bio.freelancerPlaceholder")
                      : t("auth.register.bio.clientPlaceholder")
                  }
                />
              </div>

              {userType === "freelancer" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t("auth.register.skills.label")}
                    </label>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-primary/10 inline-flex items-center rounded-full px-3 py-1 text-sm text-emerald-800"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="text-primary ml-2 cursor-pointer hover:text-cyan-800"
                          >
                            <i className="ri-close-line text-xs"></i>
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="mb-3 flex gap-2">
                      <label htmlFor="skill-input" className="sr-only">
                        {t("auth.register.skills.addLabel")}
                      </label>
                      <input
                        type="text"
                        id="skill-input"
                        name="skill"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addSkill(skillInput))
                        }
                        placeholder={t("auth.register.skills.inputPlaceholder")}
                        className="focus:ring-emerald-5 0 flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-cyan-500 focus:outline-none sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => addSkill(skillInput)}
                        className="bg-primary rounded-md px-4 py-2 whitespace-nowrap text-white hover:bg-cyan-700"
                      >
                        {t("auth.register.skills.add")}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {categorizedSkills.map((group) => {
                        const categoryKey = `auth.register.skills.categories.${group.categoryKey}`
                        const isOpen = openCategory === group.categoryKey
                        const hasSelectedSkill = formData.skills.some((s) =>
                          group.skills.includes(s),
                        )

                        return (
                          <div
                            key={group.categoryKey}
                            className="rounded-lg border border-gray-200"
                          >
                            <button
                              type="button"
                              onClick={() => setOpenCategory(isOpen ? null : group.categoryKey)}
                              className={`flex w-full items-center justify-between rounded-t-lg px-4 py-2 text-left font-medium ${
                                hasSelectedSkill
                                  ? "bg-cyan-100 text-cyan-800"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                              }`}
                            >
                              {t(categoryKey)}
                              <i
                                className={`ri-arrow-${
                                  isOpen ? "up" : "down"
                                }-s-line text-gray-600`}
                              ></i>
                            </button>

                            {isOpen && (
                              <div className="flex flex-wrap gap-2 rounded-b-lg border-t border-gray-200 bg-gray-50 p-3">
                                {group.skills.map((skill) => (
                                  <button
                                    key={skill}
                                    type="button"
                                    onClick={() => addSkill(skill)}
                                    className="cursor-pointer rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                  >
                                    + {skill}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="hourly_rate"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t("auth.register.fields.hourlyRate")}
                      </label>
                      <input
                        type="number"
                        name="hourly_rate"
                        id="hourly_rate"
                        min="5"
                        max="500"
                        value={formData.hourly_rate}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="experience_years"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t("auth.register.fields.experienceYears")}
                      </label>
                      <select
                        name="experience_years"
                        id="experience_years"
                        value={formData.experience_years}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-8 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none sm:text-sm"
                      >
                        <option value="">{t("auth.register.experienceOptions.default")}</option>
                        <option value="0">
                          {t("auth.register.experienceOptions.lessThanOne")}
                        </option>
                        <option value="1">{t("auth.register.experienceOptions.oneToTwo")}</option>
                        <option value="3">
                          {t("auth.register.experienceOptions.threeToFive")}
                        </option>
                        <option value="6">{t("auth.register.experienceOptions.sixToTen")}</option>
                        <option value="11">
                          {t("auth.register.experienceOptions.moreThanTen")}
                        </option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <FormError error={formState.error ?? null} errorValues={formState.errorValues} />

              <div className="flex justify-between">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setStep(1)}
                  className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("auth.register.buttons.back")}
                </button>

                <button
                  type="submit"
                  disabled={pending}
                  className="bg-primary cursor-pointer rounded-md border border-transparent px-6 py-2 text-sm font-medium whitespace-nowrap text-white shadow-sm hover:bg-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      {t("auth.register.buttons.submitting")}
                    </div>
                  ) : (
                    t("auth.register.buttons.submit")
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { categorizedSkills } from "@/constants/currentData"
import { useAuth } from "@/components/AuthContext"
import Link from "next/link"
import { supabaseBrowser } from "@/utils/supabase/client"

const supabase = supabaseBrowser()

export default function Register() {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<"freelancer" | "client">(
    "freelancer"
  )
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    location: "",
    password: "",
    confirmPassword: "",
    bio: "",
    skills: [] as string[],
    hourlyRate: "",
    experienceYears: "",
    companyName: "",
    industry: "",
    profileImage: null as File | null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const navigate = useRouter()

  const [openCategory, setOpenCategory] = useState<string | null>(null)

  useEffect(() => {
    document.title = "Registro | GDN Pro"
  }, [])

  useEffect(() => {
    if (user) navigate.push("/")
  }, [user])

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        setError("Por favor selecciona un archivo de imagen válido")
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen debe ser menor a 5MB")
        return
      }

      setFormData({
        ...formData,
        profileImage: file,
      })

      // Crear preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError("")
    }
  }

  const removeImage = () => {
    setFormData({
      ...formData,
      profileImage: null,
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

  // Modified registration handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError("")

    try {
      // Validaciones
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Las contraseñas no coinciden")
      }

      if (formData.password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres")
      }

      if (userType === "freelancer") {
        if (!formData.skills || formData.skills.length === 0) {
          throw new Error("Debes seleccionar al menos una habilidad")
        }
        if (!formData.hourlyRate || Number(formData.hourlyRate) <= 0) {
          throw new Error("Debes especificar una tarifa por hora válida")
        }
      }

      console.log("🚀 Starting registration...")

      // 1. Registrar usuario en Supabase Auth SIN CONFIRMACIÓN DE EMAIL
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_type: userType,
          },
          emailRedirectTo: undefined,
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Error al crear usuario")

      try {
        const confirmResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auth-handler`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "confirm_email",
              userId: authData.user.id,
            }),
          }
        )

        if (confirmResponse.ok) {
          window.toast({
            title: "Email confirmado automáticamente",
            type: "success",
            location: "bottom-center",
            dismissible: true,
            icon: true,
          })
        }
      } catch (confirmError) {
        window.toast({
          title: "No se pudo confirmar email automáticamente, pero continuamos",
          type: "warning",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })
      }

      let avatarUrl = null

      // 3. Subir foto de perfil si existe (solo para freelancers)
      if (userType === "freelancer" && formData.profileImage) {
        console.log("📸 Uploading profile photo...")

        try {
          const fileName = `${authData.user.id}-${Date.now()}.${formData.profileImage.name.split(".").pop()}`

          const formDataUpload = new FormData()
          formDataUpload.append("file", formData.profileImage)
          formDataUpload.append("fileName", fileName)
          formDataUpload.append("bucket", "avatars")

          const uploadResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/upload-avatar`,
            {
              method: "POST",
              body: formDataUpload,
            }
          )

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            console.error("❌ Error in upload response:", errorText)
            throw new Error("Error subiendo imagen")
          }

          const uploadResult = await uploadResponse.json()

          if (uploadResult.success && uploadResult.publicUrl) {
            avatarUrl = uploadResult.publicUrl
            console.log("✅ Photo uploaded successfully:", avatarUrl)
          } else {
            console.error("❌ Error in upload result:", uploadResult)
          }
        } catch (uploadError) {
          console.error("❌ Error uploading photo:", uploadError)
          // No fallar el registro por error de foto
        }
      }

      // 4. Crear perfil en la tabla profiles
      const profileData = {
        id: authData.user.id,
        user_id: authData.user.id,
        full_name: formData.fullName,
        email: formData.email,
        location: formData.location,
        user_type: userType,
        role: userType,
        avatar_url: avatarUrl,
        bio: formData.bio,
        ...(userType === "freelancer" && {
          skills: formData.skills,
          hourly_rate: formData.hourlyRate,
          bio: formData.bio || "",
          experience_years: parseInt(formData.experienceYears) || 0,
          availability: "full-time",
        }),
      }

      console.log("💾 Creating profile:", profileData)

      const { error: profileError } = await supabase
        .from("profiles")
        .insert([profileData])

      if (profileError) {
        console.error("❌ Error creating profile:", profileError)
        throw profileError
      }

      window.toast({
        title: "Perfil creado exitosamente",
        type: "success",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (loginError) {
        window.toast({
          title: "Error en login automático",
          type: "error",
          location: "bottom-center",
          dismissible: true,
          icon: true,
        })

        console.error(loginError)
        navigate.push("/auth/login")
        return
      }

      window.toast({
        title: "Login automático exitoso",
        type: "success",
        location: "bottom-center",
        dismissible: true,
        icon: true,
      })

      // 6. Redirigir según el tipo de usuario
      if (userType === "freelancer") {
        console.log("🎯 Redirecting to freelancer dashboard...")
        navigate.push("/dashboard/freelancer")
      } else {
        console.log("🎯 Redirecting to client dashboard...")
        navigate.push("/dashboard/client")
      }
    } catch (error: unknown) {
      console.error("💥 Registration error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setError(errorMessage || "Error al crear la cuenta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/">
            <img
              src="/logo.png"
              alt="GDN PRO"
              className="h-12 w-auto mx-auto mb-6"
            />
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:text-cyan-500"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Paso 1: Tipo de usuario */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  ¿Cómo quieres usar GDN Pro?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setUserType("freelancer")}
                    className={`p-6 border-2 rounded-lg text-left hover:border-cyan-500 transition-colors cursor-pointer ${
                      userType === "freelancer"
                        ? "border-cyan-500 bg-cyan-50"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                        <i className="ri-user-line text-primary"></i>
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        Soy Freelancer
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Quiero ofrecer mis servicios y encontrar proyectos
                      interesantes
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserType("client")}
                    className={`p-6 border-2 rounded-lg text-left hover:border-cyan-500 transition-colors cursor-pointer ${
                      userType === "client"
                        ? "border-cyan-500 bg-cyan-50"
                        : "border-gray-300"
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                        <i className="ri-briefcase-line text-primary"></i>
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        Soy Cliente
                      </h4>
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
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 whitespace-nowrap"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Paso 2: Información básica */}
          {step === 2 && (
            <form className="space-y-6" onSubmit={handleRegister}>
              {/* Foto de Perfil - Solo para Freelancers */}
              {userType === "freelancer" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto de Perfil
                  </label>
                  <div className="flex items-center space-x-6">
                    <div className="shrink-0">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-20 w-20 object-cover object-top rounded-full border-2 border-gray-300"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                          <i className="ri-user-line text-gray-400 text-2xl"></i>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      {!imagePreview ? (
                        <label className="cursor-pointer">
                          <span className="bg-primary hover:bg-cyan-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
                            Subir Foto
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="flex space-x-2">
                          <label className="cursor-pointer">
                            <span className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
                              Cambiar
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={removeImage}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG o GIF. Máximo 5MB.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-5

0 focus:border-cyan-500 sm:text-sm"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Ubicación
                  </label>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    required
                    value={formData.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    placeholder="Ciudad, País"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
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
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-emerald-800"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-primary hover:text-cyan-800 cursor-pointer"
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-5

0 focus:border-cyan-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => addSkill(skillInput)}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-cyan-700 whitespace-nowrap"
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
                            className={`w-full flex justify-between items-center px-4 py-2 text-left font-medium rounded-t-lg ${
                              formData.skills.some((s) =>
                                group.skills.includes(s)
                              )
                                ? "bg-cyan-100 text-cyan-800"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            {group.category}
                            <i
                              className={`ri-arrow-${
                                openCategory === group.category ? "up" : "down"
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm pr-8"
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
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 whitespace-nowrap"
                >
                  Atrás
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
  )
}

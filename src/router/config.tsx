import { lazy } from "react"
import type { RouteObject } from "react-router-dom"
import ProtectedRoute from "@/components/feature/ProtectedRoute"

// Lazy loading de componentes
const HomePage = lazy(() => import("@/pages/home/page"))
const FreelancersPage = lazy(() => import("@/pages/freelancers/page"))
const FreelancerProfilePage = lazy(
  () => import("@/pages/freelancer-profile/page")
)
const LoginPage = lazy(() => import("@/pages/auth/login"))
const RegisterPage = lazy(() => import("@/pages/auth/register"))
const FreelancerDashboard = lazy(() => import("@/pages/dashboard/freelancer"))
const ClientDashboard = lazy(() => import("@/pages/dashboard/client"))
const AdminContacts = lazy(() => import("@/pages/admin/contacts"))
const CheckoutPage = lazy(() => import("@/pages/payment/checkout"))
const PaymentSuccessPage = lazy(() => import("@/pages/payment/success"))
const PaymentCancelPage = lazy(() => import("@/pages/payment/cancel"))
const PrivacyPolicyPage = lazy(() => import("@/pages/legal/privacy-policy"))
const TermsOfServicePage = lazy(() => import("@/pages/legal/terms-of-service"))
const DataDeletionPage = lazy(() => import("@/pages/legal/data-deletion"))
const NotFoundPage = lazy(() => import("@/pages/NotFound"))

const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/freelancers",
    element: <FreelancersPage />,
  },
  {
    path: "/freelancer/:slug",
    element: <FreelancerProfilePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/dashboard/freelancer",
    element: (
      <ProtectedRoute requiredRole="freelancer">
        <FreelancerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/client",
    element: (
      <ProtectedRoute requiredRole="client">
        <ClientDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/contacts",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminContacts />
      </ProtectedRoute>
    ),
  },
  {
    path: "/checkout",
    element: <CheckoutPage />,
  },
  {
    path: "/payment/success",
    element: <PaymentSuccessPage />,
  },
  {
    path: "/payment/cancel",
    element: <PaymentCancelPage />,
  },
  {
    path: "/privacy-policy",
    element: <PrivacyPolicyPage />,
  },
  {
    path: "/terms-of-service",
    element: <TermsOfServicePage />,
  },
  {
    path: "/data-deletion",
    element: <DataDeletionPage />,
  },
  {
    path: "/404",
    element: <NotFoundPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]

export default routes

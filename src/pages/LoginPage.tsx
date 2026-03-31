import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Lock, Mail, AlertCircle } from 'lucide-react'
import KaniniLogo from '../../images/46455373.png'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

const KaniniMark: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className}>
    <div className="inline-flex items-center gap-3">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
        <img
          src={KaniniLogo}
          alt="KANINI mark"
          className="h-10 w-10"
          loading="lazy"
        />
      </span>
      <div>
        <span className="text-2xl font-semibold tracking-[0.55em] text-[#0f172a]">KANINI</span>
      </div>
    </div>
  </div>
)

export const LoginPage: React.FC = () => {
  const { login, isLoading, error, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, navigate, searchParams])

  const onSubmit = async ({ email, password }: LoginFormData) => {
    try {
      await login({ email, password })
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f4f7ff] via-[#eef2ff] to-[#fdfbff]">
      <div className="pointer-events-none absolute -left-32 top-10 h-[360px] w-[360px] rounded-full bg-[#d4e2ff] opacity-60 blur-[140px]" />
      <div className="pointer-events-none absolute right-[-60px] bottom-0 h-[520px] w-[520px] rounded-full bg-[#f8e7ff] opacity-60 blur-[200px]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[520px] rounded-[44px] border border-white/70 bg-white px-6 py-12 shadow-[0_35px_95px_rgba(15,23,42,0.16)] sm:px-14">
          <div className="text-center">
            <div className="mb-6 flex flex-col items-center justify-center space-y-3">
              <KaniniMark />
            </div>
            <h1 className="text-[30px] font-semibold leading-tight text-[#0b1526]">
              Clinical Intelligence Platform
            </h1>
            <p className="mt-2 text-base text-[#6b7280]">Secure access to patient records</p>
          </div>

          {error && (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-left text-sm text-red-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-none" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <form className="mt-10 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-[#0f172a]">
                  Email Address
                </label>
                <div className="relative mt-2">
                  <Mail className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9ca3af]" />
                  <input
                    {...register('email')}
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="your.email@kanini.com"
                    className={`w-full rounded-2xl border ${
                      errors.email ? 'border-red-300' : 'border-[#dfe5f2]'
                    } bg-[#fdfdff] py-4 pl-14 pr-4 text-base text-[#111827] placeholder:text-[#c3cad9] focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#9eb7ff]`}
                  />
                </div>
                {errors.email && (
                  <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email.message}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium text-[#0f172a]">
                  Password
                </label>
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9ca3af]" />
                  <input
                    {...register('password')}
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`w-full rounded-2xl border ${
                      errors.password ? 'border-red-300' : 'border-[#dfe5f2]'
                    } bg-[#fdfdff] py-4 pl-14 pr-4 text-base text-[#111827] placeholder:text-[#c3cad9] focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#9eb7ff]`}
                  />
                </div>
                {errors.password && (
                  <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.password.message}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-3 text-sm text-[#111827]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#cdd6eb] text-[#0ea5e9] focus:ring-[#0ea5e9]"
                  {...register('rememberMe')}
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-[#1d4ed8] hover:text-[#0f3ea7]"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full rounded-full bg-[#0b0b0f] py-3 text-lg font-semibold text-white shadow-[0_18px_30px_rgba(15,15,20,0.35)] transition hover:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting || isLoading ? (
                <span className="flex items-center justify-center gap-2 text-base">
                  <svg
                    className="h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-30"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-80"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'

interface CustomRenderOptions extends RenderOptions {
  route?: string
}

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  )
}

function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  if (options?.route) {
    window.history.pushState({}, 'Test page', options.route)
  }
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }

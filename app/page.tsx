"use client"

import dynamic from 'next/dynamic'

const SplashScreen = dynamic(() => import('./components/splash_screen'), { ssr: false })

export default function Home() {
  return <SplashScreen />
}

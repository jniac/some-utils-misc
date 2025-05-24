'use client'

import { createContext } from 'react'

import { ThreeBaseContext } from 'some-utils-three/experimental/contexts/types'

export const reactThreeContext = createContext<ThreeBaseContext>(null!)

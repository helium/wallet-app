import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from 'react'
import { type SkMatrix, type SkSize } from '@shopify/react-native-skia'
import type { ReactNode, FC } from 'react'
import type { SharedValue } from 'react-native-reanimated'

import type { StickerProps } from './components/Sticker'

export interface Sticker {
  Sticker: FC<StickerProps>
  size: SkSize
  matrix: SharedValue<SkMatrix>
  dragged: SharedValue<boolean>
}

type Stickers = Sticker[]

interface StickerContextInterface {
  stickers: Stickers
  dispatch: (action: StickerAction) => void
}

const StickerContext = createContext<StickerContextInterface | null>(null)

interface StickerAction {
  action: 'add'
  sticker: Sticker
}

const stickerReducer = (stickers: Stickers, action: StickerAction) => {
  return [...stickers, action.sticker]
}

export const useStickerContext = () => {
  const ctx = useContext(StickerContext)
  if (ctx === null) {
    throw new Error('No Sticker context found')
  }
  const { stickers, dispatch } = ctx
  const addSticker = useCallback(
    (sticker: Sticker) => {
      dispatch({ action: 'add', sticker })
    },
    [dispatch],
  )
  return {
    stickers,
    addSticker,
  }
}

interface StickerProviderProps {
  children: ReactNode | ReactNode[]
}

export const StickerProvider = ({ children }: StickerProviderProps) => {
  const [stickers, dispatch] = useReducer(stickerReducer, [])
  return (
    <StickerContext.Provider value={{ stickers, dispatch }}>
      {children}
    </StickerContext.Provider>
  )
}

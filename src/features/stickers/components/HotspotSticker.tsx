/* eslint-disable max-len */
import React from 'react'
import { Group, ImageSVG, Skia } from '@shopify/react-native-skia'
import type { StickerProps } from './Sticker'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const svg = Skia.SVG.MakeFromString(
  `<svg width="213" height="209" viewBox="0 0 213 209" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<g filter="url(#filter0_bi_2_308)">
<path d="M47.4194 69.355C38.5028 84.7587 18.8259 119.246 11.4506 133.964C11.4178 134.118 11.1309 134.971 10.2467 137.147C9.14143 139.866 8.07419 144.866 8.03361 146.6C8.00115 147.987 8.86548 150.404 9.3017 151.44C10.9866 154.677 14.4737 161.383 14.9429 162.311C15.5294 163.471 17.4816 169.013 21.6507 172.324C24.9859 174.973 31.108 176.019 33.7521 176.211L37.1661 176.306L42.2741 176.509L48.5273 176.552L50.4908 175.631L52.1422 172.498L53.0226 171.802L56.656 168.61L57.797 166.808L57.4696 165.854L58.9843 165.974L58.7171 167.231L59.5246 168.539L63.8868 168.33L65.3198 165.63L72.6128 165.414L72.3381 166.706L73.3119 168.063L77.6769 167.842L79.1071 165.155L78.9755 164.824L79.951 163.087L79.3856 162.184L79.2396 161.446C82.1195 160.846 83.1136 162.346 83.6459 162.93C84.0718 163.397 84.5414 164.259 84.7229 164.632L85.351 164.766C86.5059 164.73 89.2365 164.622 90.9196 164.477C93.0235 164.295 94.1736 166.154 94.5717 166.854C94.8902 167.414 96.1386 169.818 96.7229 170.95L97.4426 171.103L97.172 171.989L99.2804 174.872L99.54 174.819C103.3 174.882 113.894 174.577 126.189 172.849C141.558 170.689 149.121 165.856 155.588 159.685C162.054 153.514 170.354 137.805 175.548 126.867C180.743 115.928 196.388 84.8467 200.722 74.5854C205.056 64.3241 201.484 59.5496 200.059 56.8092C198.635 54.0689 194.923 47.2573 190.192 40.5158C185.461 33.7743 173.778 35.4467 167.285 35.6424C160.791 35.838 133.487 37.4844 121.646 38.5498C109.806 39.6152 88.2421 41.9095 73.7608 45.2805C62.1758 47.9773 51.3728 62.4539 47.4194 69.355Z" stroke="url(#paint0_linear_2_308)" stroke-width="15.8"/>
</g>
<rect x="36.4059" width="180.219" height="174.95" transform="rotate(12.0106 36.4059 0)" fill="url(#pattern0_2_308)"/>
<defs>
<filter id="filter0_bi_2_308" x="-13.0671" y="14.224" width="236.966" height="183.44" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feGaussianBlur in="BackgroundImageFix" stdDeviation="6.6"/>
<feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_2_308"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_2_308" result="shape"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="0.55"/>
<feGaussianBlur stdDeviation="0.1375"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.1 0"/>
<feBlend mode="normal" in2="shape" result="effect2_innerShadow_2_308"/>
</filter>
<pattern id="pattern0_2_308" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_2_308" transform="scale(0.000596659 0.000614628)"/>
</pattern>
<linearGradient id="paint0_linear_2_308" x1="164.595" y1="32.1333" x2="88.072" y2="188.027" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.28"/>
<stop offset="1" stop-color="white" stop-opacity="0.13"/>
</linearGradient>
</defs>
</svg>
`,
)!

const size = { width: 213, height: 209 }

const Sticker = ({ matrix }: StickerProps) => {
  return (
    <Group matrix={matrix}>
      <ImageSVG svg={svg} width={size.width} height={size.height} x={0} y={0} />
    </Group>
  )
}

export const HotspotSticker = { Sticker, size }
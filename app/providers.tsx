
'use client'

import { ChakraProvider } from '@chakra-ui/react'

import { blueSkyTheme } from '@/themes/bluesky'
import { hackerTheme } from '@/themes/hacker'
import { nounsDaoTheme } from '@/themes/nounish'
import { forestTheme } from '@/themes/forest'


import { Aioha } from '@aioha/aioha'
import { AiohaProvider } from '@aioha/react-ui'

import { useEffect } from 'react'
import { windows95Theme } from '@/themes/windows95'
import { hiveBRTheme } from '@/themes/hivebr'
import { cannabisTheme } from '@/themes/cannabis'
import { mengaoTheme } from '@/themes/mengao'
import { UserProvider } from '@/contexts/UserContext'

const aioha = new Aioha()

const themeMap = {
  forest: forestTheme,
  bluesky: blueSkyTheme,
  hacker: hackerTheme,
  nounish: nounsDaoTheme,
  windows95: windows95Theme,
  snapie: windows95Theme,
  hivebr: hiveBRTheme,
  cannabis: cannabisTheme,
  mengao: mengaoTheme,
}

type ThemeName = keyof typeof themeMap;

const themeName = (process.env.NEXT_PUBLIC_THEME as ThemeName) || 'hacker';
const selectedTheme = themeMap[themeName];

// Persistent across renders + strict mode remounts
let hasAttachedPlayerListener = false;

// WeakSet survives React re-renders and tracks actual DOM elements
const styledIframes = new WeakSet<HTMLIFrameElement>();

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    aioha.registerKeychain()
    aioha.registerLedger()
    aioha.registerPeakVault()
    aioha.registerHiveAuth({
      name: process.env.NEXT_PUBLIC_COMMUNITY_NAME || 'MyCommunity',
      description: ''
    })
    aioha.loadAuth()
  })

  // Global listener for 3Speak video player orientation
  useEffect(() => {
    // Prevent Strict Mode from double-attaching the listener
    if (hasAttachedPlayerListener) return;
    
    const handleVideoOrientation = (event: MessageEvent) => {
      // Check if message is from 3speak player
      if (event.data?.type !== '3speak-player-ready') return;
      
      // Find all 3speak iframes and match by src
      const iframes = document.querySelectorAll<HTMLIFrameElement>(
        'iframe[src*="play.3speak.tv"]'
      );
      
      iframes.forEach((iframe) => {
        // Skip if already styled (WeakSet check)
        if (styledIframes.has(iframe)) return;
        
        // Check if this iframe's contentWindow matches the event source
        try {
          if (iframe.contentWindow !== event.source) return;
        } catch {
          return;
        }
        
        console.log('📹 3Speak video loaded:', event.data);
        
        const isVertical = event.data.isVertical;
        
        // Apply responsive dimensions
        iframe.style.margin = '0 auto';
        iframe.style.maxWidth = isVertical ? '450px' : '800px';
        iframe.style.height = isVertical ? '800px' : '450px';
        
        iframe.parentElement?.classList.add(
          isVertical ? 'vertical-video' : 'horizontal-video'
        );
        
        // Mark iframe as styled
        styledIframes.add(iframe);
        
        console.log(
          isVertical
            ? '📱 Applied vertical video styling'
            : '🖥️ Applied horizontal video styling'
        );
      });
    };

    window.addEventListener('message', handleVideoOrientation);
    hasAttachedPlayerListener = true;
    
    console.log('🎯 Attached SINGLE 3Speak listener');
  }, []);

  return (
    <ChakraProvider theme={selectedTheme}>
      <AiohaProvider aioha={aioha}>
        <UserProvider>
          {children}
        </UserProvider>
      </AiohaProvider>
    </ChakraProvider>
  )
}

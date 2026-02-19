import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

declare global {
  interface Window {
    VANTA: any;
  }
}

interface VantaOptions {
  color?: number;
  backgroundColor?: number;
  points?: number;
  maxDistance?: number;
  spacing?: number;
  showDots?: boolean;
}

export function useVantaBackground(options: VantaOptions = {}) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  useEffect(() => {
    let effect: any = null;

    const loadVanta = async () => {
      try {
        const VANTA = await import('vanta/dist/vanta.net.min');

        if (vantaRef.current && !effect) {
          effect = VANTA.default({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color: options.color ?? 0x00E5FF,
            backgroundColor: options.backgroundColor ?? 0x0A0E17,
            points: options.points ?? 10,
            maxDistance: options.maxDistance ?? 20,
            spacing: options.spacing ?? 16,
            showDots: options.showDots ?? true,
          });

          // Reduce opacity of the Vanta canvas
          const canvas = vantaRef.current.querySelector('canvas');
          if (canvas) {
            canvas.style.opacity = '0.4';
          }

          setVantaEffect(effect);
        }
      } catch (err) {
        console.warn('Vanta.js failed to initialize:', err);
      }
    };

    loadVanta();

    // Cleanup to prevent WebGL memory leaks
    return () => {
      if (effect) {
        effect.destroy();
      }
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return vantaRef;
}

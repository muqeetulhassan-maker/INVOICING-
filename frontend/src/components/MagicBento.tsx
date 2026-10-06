import React, { useRef, useEffect, useCallback, useState } from 'react';
import { gsap } from 'gsap';
import './MagicBento.css';

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '124, 92, 255';
const MOBILE_BREAKPOINT = 768;

export interface BentoCardItem {
  color?: string;
  title: string;
  description: string;
  label?: string;
  icon?: React.ReactNode;
}

const defaultCardData: BentoCardItem[] = [
  {
    color: '#111114',
    title: 'Analytics',
    description: 'Track user behavior and cashflow telemetry',
    label: 'Insights'
  },
  {
    color: '#111114',
    title: 'Dashboard',
    description: 'Centralized executive data view',
    label: 'Overview'
  },
  {
    color: '#111114',
    title: 'Invoicing',
    description: 'Create & dispatch compliant invoices',
    label: 'Billing'
  },
  {
    color: '#111114',
    title: 'Automation',
    description: 'Streamline inventory & receipt workflows',
    label: 'Efficiency'
  },
  {
    color: '#111114',
    title: 'Security',
    description: 'Enterprise-grade permission isolation',
    label: 'Protection'
  }
];

const createParticleElement = (x: number, y: number, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute;
    width: 3.5px;
    height: 3.5px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.8);
    pointer-events: none;
    z-index: 10;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const updateCardGlowProperties = (
  card: HTMLElement,
  mouseX: number,
  mouseY: number,
  glow: number,
  radius: number
) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

export interface ParticleCardProps {
  children: React.ReactNode;
  className?: string;
  disableAnimations?: boolean;
  style?: React.CSSProperties;
  particleCount?: number;
  glowColor?: string;
  enableTilt?: boolean;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
  enableBorderGlow?: boolean;
  spotlightRadius?: number;
}

export const ParticleCard: React.FC<ParticleCardProps> = ({
  children,
  className = '',
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = false,
  clickEffect = true,
  enableMagnetism = false,
  enableBorderGlow = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLElement[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef<HTMLElement[]>([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;

    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        }
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const clone = particle.cloneNode(true) as HTMLElement;
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 80,
          y: (Math.random() - 0.5) * 80,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });

        gsap.to(clone, {
          opacity: 0.25,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true
        });
      }, index * 100);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;

    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 3,
          rotateY: 3,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 1000
        });
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();

      if (enableBorderGlow) {
        element.style.setProperty('--glow-intensity', '0');
      }

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }

      if (enableMagnetism) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (enableBorderGlow) {
        updateCardGlowProperties(element, e.clientX, e.clientY, 1, spotlightRadius);
      }

      if (enableTilt || enableMagnetism) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        if (enableTilt) {
          const rotateX = ((y - centerY) / centerY) * -5;
          const rotateY = ((x - centerX) / centerX) * 5;

          gsap.to(element, {
            rotateX,
            rotateY,
            duration: 0.1,
            ease: 'power2.out',
            transformPerspective: 1000
          });
        }

        if (enableMagnetism) {
          const magnetX = (x - centerX) * 0.03;
          const magnetY = (y - centerY) * 0.03;

          magnetismAnimationRef.current = gsap.to(element, {
            x: magnetX,
            y: magnetY,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.35) 0%, rgba(${glowColor}, 0.15) 35%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 5;
      `;

      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        {
          scale: 0,
          opacity: 1
        },
        {
          scale: 1,
          opacity: 0,
          duration: 0.75,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      );
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      clearAllParticles();
    };
  }, [
    animateParticles,
    clearAllParticles,
    disableAnimations,
    enableTilt,
    enableMagnetism,
    clickEffect,
    enableBorderGlow,
    spotlightRadius,
    glowColor
  ]);

  const borderGlowClass = enableBorderGlow ? 'magic-bento-card--border-glow' : '';

  return (
    <div
      ref={cardRef}
      className={`magic-bento-card particle-container ${borderGlowClass} ${className}`}
      style={{
        ...style,
        '--glow-color': glowColor
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

export interface MagicBannerProps {
  children: React.ReactNode;
  className?: string;
  enableStars?: boolean;
  enableBorderGlow?: boolean;
  clickEffect?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  glowColor?: string;
  particleCount?: number;
  spotlightRadius?: number;
  disableAnimations?: boolean;
}

/**
 * MagicBanner — Wraps main top page banners in Nova Business OS with Magic Bento interactivity:
 * - Dynamic cursor-following radial border glow
 * - Particle stars floating on hover
 * - Click ripple wave effect
 * - Responsive mobile fallback
 */
export const MagicBanner: React.FC<MagicBannerProps> = ({
  children,
  className = '',
  enableStars = true,
  enableBorderGlow = true,
  clickEffect = true,
  enableTilt = false,
  enableMagnetism = false,
  glowColor = DEFAULT_GLOW_COLOR,
  particleCount = 10,
  spotlightRadius = 380,
  disableAnimations = false
}) => {
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;

  return (
    <ParticleCard
      className={`p-6 sm:p-7 shadow-soft ${className}`}
      disableAnimations={shouldDisableAnimations}
      enableBorderGlow={enableBorderGlow}
      particleCount={enableStars ? particleCount : 0}
      glowColor={glowColor}
      enableTilt={enableTilt}
      enableMagnetism={enableMagnetism}
      clickEffect={clickEffect}
      spotlightRadius={spotlightRadius}
    >
      {children}
    </ParticleCard>
  );
};

export interface MagicBentoProps {
  cards?: BentoCardItem[];
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  glowColor?: string;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
}

export const MagicBento: React.FC<MagicBentoProps> = ({
  cards = defaultCardData,
  textAutoHide = true,
  enableStars = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = false
}) => {
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;

  return (
    <div className="card-grid bento-section grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => {
        const baseClassName = `magic-bento-card ${
          textAutoHide ? 'magic-bento-card--text-autohide' : ''
        } ${enableBorderGlow ? 'magic-bento-card--border-glow' : ''}`;

        return (
          <ParticleCard
            key={index}
            className={baseClassName}
            style={{
              backgroundColor: card.color || 'var(--color-surface, #111114)',
              '--glow-color': glowColor
            } as React.CSSProperties}
            disableAnimations={shouldDisableAnimations}
            particleCount={enableStars ? particleCount : 0}
            glowColor={glowColor}
            enableTilt={enableTilt}
            clickEffect={clickEffect}
            enableMagnetism={enableMagnetism}
            enableBorderGlow={enableBorderGlow}
            spotlightRadius={spotlightRadius}
          >
            {card.label && (
              <div className="magic-bento-card__header mb-2">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
                  {card.label}
                </span>
                {card.icon && <div className="text-accent">{card.icon}</div>}
              </div>
            )}
            <div className="magic-bento-card__content">
              <h3 className="magic-bento-card__title text-ink">{card.title}</h3>
              <p className="magic-bento-card__description text-secondary">{card.description}</p>
            </div>
          </ParticleCard>
        );
      })}
    </div>
  );
};

export default MagicBento;


import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowRight, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '../types';

export const HeroBannerSlider: React.FC = () => {
  const { setSelectedCategory, banners } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeBanners: Banner[] = React.useMemo(() => {
    return (Array.isArray(banners) ? banners : []).filter((b) => b.active);
  }, [banners]);

  // Slides efetivos: banners cadastrados pelo admin ou banner padrão elegante
  const slides = activeBanners.length > 0 ? activeBanners : [
    {
      id: 'default-banner',
      badge: 'NOVA ESTAÇÃO',
      title: 'Nova Coleção\nPrimavera',
      subtitle: 'Peças delicadas para cada momento seu. Tecidos nobres, estampas autorais e caimento feito para valorizar sua feminilidade.',
      ctaText: 'VER COLEÇÃO',
      categoryFilter: 'Todos',
      imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80',
      alignment: 'left' as const,
      active: true
    }
  ];

  const total = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Transição automática a cada 6 segundos caso haja mais de 1 banner
  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [total, nextSlide]);

  // Reset do slide atual caso o número de banners mude
  useEffect(() => {
    if (currentSlide >= total) {
      setCurrentSlide(0);
    }
  }, [total, currentSlide]);

  const current = slides[currentSlide] || slides[0];

  const handleCta = (categoryFilter?: string) => {
    setSelectedCategory(categoryFilter || 'Todos');
    const el = document.getElementById('destaques-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const alignClass = current.alignment === 'center'
    ? 'text-center mx-auto items-center'
    : current.alignment === 'right'
      ? 'text-right ml-auto items-end'
      : 'text-left items-start';

  return (
    <div className="relative overflow-hidden bg-[#F6E5E8] min-h-[380px] sm:min-h-[520px] lg:min-h-[580px] flex items-center w-full max-w-full">
      {/* Background Image com transição suave */}
      <div className="absolute inset-0 z-0">
        <img
          key={current.id || currentSlide}
          src={current.imageUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80'}
          alt={current.title}
          className="w-full h-full object-cover object-right lg:object-center filter brightness-[0.96] transition-opacity duration-700 animate-fade-in"
        />
        {/* Camada em degradê rosa suave que preserva a legibilidade do texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7E7EA] via-[#F7E7EA]/85 to-transparent sm:via-[#F7E7EA]/75 lg:from-[#F7E7EA] lg:via-[#F7E7EA]/70" />
      </div>

      {/* Conteúdo Editorial Dinâmico sincronizado */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full max-w-full py-10 sm:py-16">
        <div className={`max-w-xl min-w-0 flex flex-col ${alignClass}`}>
          {/* Badge / Selo */}
          {current.badge && (
            <div className="inline-flex items-center gap-1.5 text-[#DC7898] text-[11px] sm:text-sm font-semibold tracking-[0.2em] uppercase mb-3 sm:mb-4 animate-fade-in">
              <Heart className="w-3.5 h-3.5 fill-[#DC7898]" />
              <span>{current.badge}</span>
            </div>
          )}

          {/* Título do Banner */}
          <h1 className="font-serif text-2xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#2D2427] leading-[1.15] sm:leading-[1.12] mb-3 sm:mb-4 whitespace-pre-line">
            {current.title}
          </h1>

          {/* Subtítulo */}
          {current.subtitle && (
            <p className="text-stone-600 text-xs sm:text-base font-light leading-relaxed mb-6 sm:mb-8 max-w-md">
              {current.subtitle}
            </p>
          )}

          {/* Botão de Ação (CTA) */}
          <div>
            <button
              onClick={() => handleCta(current.categoryFilter)}
              className="inline-flex items-center gap-2 bg-[#DC7898] hover:bg-[#D36789] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold text-xs sm:text-sm tracking-wider uppercase shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all group"
            >
              <span>{current.ctaText || 'VER COLEÇÃO'}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Controles de Navegação (caso haja múltiplos banners cadastrados) */}
      {total > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-stone-700 shadow-md flex items-center justify-center transition-all hover:scale-105"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-stone-700" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-stone-700 shadow-md flex items-center justify-center transition-all hover:scale-105"
            aria-label="Próximo banner"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-stone-700" />
          </button>

          {/* Indicadores / Bolinhas do carrossel */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full ${
                  currentSlide === idx
                    ? 'w-6 h-2 bg-[#DC7898]'
                    : 'w-2 h-2 bg-rose-200 hover:bg-rose-300'
                }`}
                aria-label={`Ir para banner ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

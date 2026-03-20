import * as React from "react";
import { motion, type PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: number | string;
  name: string;
  avatar: string;
  description: string;
  productName: string;
  rating: number;
}

interface TestimonialCarouselProps
  extends React.HTMLAttributes<HTMLDivElement> {
  testimonials: Testimonial[];
  showArrows?: boolean;
  showDots?: boolean;
}

const TestimonialCarousel = React.forwardRef<
  HTMLDivElement,
  TestimonialCarouselProps
>(
  (
    { className, testimonials, showArrows = true, showDots = true, ...props },
    ref
  ) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [dragOffset, setDragOffset] = React.useState(0);
    const hasMultiple = testimonials.length > 1;

    const CARD_HEIGHT = 248;

    const prevIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
    const nextIndex = (currentIndex + 1) % testimonials.length;
    const previewIndex = dragOffset > 0 ? prevIndex : nextIndex;
    const previewReveal = Math.min(1, Math.abs(dragOffset) / 140);

    const renderCardContent = (testimonial: Testimonial) => (
      <div className="p-5 flex flex-col items-center gap-2.5">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <h3 className="testimonial-name text-lg font-semibold text-gray-800 dark:text-foreground">
          {testimonial.name}
        </h3>
        <p className="testimonial-product">{testimonial.productName}</p>
        <div className="testimonial-stars" aria-label={`${testimonial.rating} out of 5`}>
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={
                index < testimonial.rating
                  ? "testimonial-star is-filled"
                  : "testimonial-star"
              }
            >
              ★
            </span>
          ))}
        </div>
        <p className="testimonial-review">{testimonial.description}</p>
      </div>
    );

    const advance = React.useCallback(
      (direction: 1 | -1) => {
        if (testimonials.length <= 1) {
          return;
        }
        setCurrentIndex((prev) =>
          direction === 1
            ? (prev + 1) % testimonials.length
            : (prev - 1 + testimonials.length) % testimonials.length
        );
        setDragOffset(0);
      },
      [testimonials.length]
    );

    const goNext = React.useCallback(() => advance(1), [advance]);
    const goPrev = React.useCallback(() => advance(-1), [advance]);

    const handleDragEnd = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      if (info.offset.x > 80) {
        goPrev();
        return;
      }
      if (info.offset.x < -80) {
        goNext();
        return;
      }
      setDragOffset(0);
    };

    return (
      <div
        ref={ref}
        className={cn("w-full flex items-center justify-center", className)}
        {...props}
      >
        <div className="relative w-80" style={{ height: `${CARD_HEIGHT}px` }}>
          {hasMultiple ? (
            <motion.div
              className={cn(
                "absolute w-full h-full rounded-2xl",
                "bg-white shadow-xl",
                "dark:bg-card dark:shadow-[2px_2px_4px_rgba(0,0,0,0.4),-1px_-1px_3px_rgba(255,255,255,0.1)]"
              )}
              style={{
                zIndex: 1,
                opacity: 0.28 + previewReveal * 0.48,
                scale: 0.95 + previewReveal * 0.05
              }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              {renderCardContent(testimonials[previewIndex])}
            </motion.div>
          ) : null}
          {testimonials.map((testimonial, index) => {
            const isCurrentCard = index === currentIndex;

            if (!isCurrentCard) return null;

            return (
              <motion.div
                key={testimonial.id}
                className={cn(
                  "absolute w-full h-full rounded-2xl cursor-grab active:cursor-grabbing",
                  "bg-white shadow-xl",
                  "dark:bg-card dark:shadow-[2px_2px_4px_rgba(0,0,0,0.4),-1px_-1px_3px_rgba(255,255,255,0.1)]"
                )}
                style={{ zIndex: 3 }}
                drag={isCurrentCard ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDrag={
                  isCurrentCard
                    ? (_event, info) => setDragOffset(info.offset.x)
                    : undefined
                }
                onDragEnd={isCurrentCard ? handleDragEnd : undefined}
                initial={{
                  scale: 0.98,
                  opacity: 0,
                  y: 8,
                  rotate: 0
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  x: 0,
                  y: 0,
                  rotate: 0
                }}
                transition={{
                  type: "spring",
                  stiffness: 340,
                  damping: 30
                }}
              >
                {showArrows && hasMultiple && isCurrentCard && (
                  <>
                    <button
                      type="button"
                      className="testimonial-arrow testimonial-arrow--left"
                      onClick={goPrev}
                      aria-label="Previous review"
                    >
                      <span aria-hidden="true">←</span>
                    </button>
                    <button
                      type="button"
                      className="testimonial-arrow testimonial-arrow--right"
                      onClick={goNext}
                      aria-label="Next review"
                    >
                      <span aria-hidden="true">→</span>
                    </button>
                  </>
                )}

                {renderCardContent(testimonial)}
              </motion.div>
            );
          })}
          {showDots && hasMultiple && (
            <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
              {testimonials.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentIndex
                      ? "bg-blue-500 dark:bg-primary"
                      : "bg-gray-300 dark:bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);
TestimonialCarousel.displayName = "TestimonialCarousel";

export { TestimonialCarousel, type Testimonial };

'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface StarRatingProps {
  totalStars?: number;
  defaultValue?: number;
  onRate?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function StarRating({
  totalStars = 5,
  defaultValue = 0,
  onRate,
  size = 'md',
  className,
  disabled = false,
}: StarRatingProps) {
  const [rating, setRating] = useState(defaultValue);
  const [hover, setHover] = useState(0);
  const [sparkles, setSparkles] = useState<{ id: string; x: number; y: number }[]>([]);

  const handleRating = (star: number) => {
    if (disabled) return;
    setRating(star);
    onRate?.(star);
    const burst = Array.from({ length: 12 }).map(() => ({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      x: Math.random() * 36 - 18,
      y: Math.random() * -28 - 6
    }));
    setSparkles(burst);
    window.setTimeout(() => setSparkles([]), 550);
  };

  const starSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn(
      "star-rating flex items-center gap-2",
      disabled && "opacity-50",
      className
    )}>
      {Array.from({ length: totalStars }, (_, index) => index + 1).map((star) => (
        <motion.button
          key={star}
          type="button"
          className={cn(
            "star-rating__button relative focus-visible:outline-none",
            disabled && "cursor-not-allowed"
          )}
          onClick={() => handleRating(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
          whileHover={!disabled ? { scale: 1.3, rotate: -10 } : undefined}
          whileTap={!disabled ? { scale: 0.9, rotate: 15 } : undefined}
          disabled={disabled}
        >
          {sparkles.length > 0 && (hover || rating) >= star ? (
            <span className="star-rating__sparkles" aria-hidden="true">
              {sparkles.map((sparkle) => (
                <span
                  key={sparkle.id}
                  className="star-rating__sparkle"
                  style={{
                    "--sparkle-x": `${sparkle.x}px`,
                    "--sparkle-y": `${sparkle.y}px`
                  } as React.CSSProperties}
                />
              ))}
            </span>
          ) : null}
          <motion.div
            className={cn(
              "transition-colors duration-300",
              (hover || rating) >= star
                ? "text-[#ff7a3a]"
                : "text-[#d8c7b6]"
            )}
            initial={{ scale: 1 }}
            animate={{
              scale: (hover || rating) >= star ? 1.2 : 1,
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut"
            }}
          >
            <Star
              className={cn(
                starSizes[size],
                "fill-current stroke-[1.5px]"
              )}
            />
          </motion.div>
        </motion.button>
      ))}
    </div>
  );
}

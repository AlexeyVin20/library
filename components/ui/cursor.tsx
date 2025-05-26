'use client';
import React, { useEffect, useState, useRef } from 'react';
import {
  motion,
  SpringOptions,
  useMotionValue,
  useSpring,
  AnimatePresence,
  Transition,
  Variant,
} from 'framer-motion';
import { cn } from '@/lib/utils';

type CursorProps = {
  children: React.ReactNode;
  className?: string;
  springConfig?: SpringOptions;
  attachToParent?: boolean;
  transition?: Transition;
  variants?: {
    initial: Variant;
    animate: Variant;
    exit: Variant;
  };
  onPositionChange?: (x: number, y: number) => void;
  x?: number;
  y?: number;
};

export function Cursor({
  children,
  className,
  springConfig,
  attachToParent,
  variants,
  transition,
  onPositionChange,
  x,
  y,
}: CursorProps) {
  const cursorX = useMotionValue(
    typeof window !== 'undefined' ? (typeof x === 'number' ? x : window.innerWidth / 2) : 0
  );
  const cursorY = useMotionValue(
    typeof window !== 'undefined' ? (typeof y === 'number' ? y : window.innerHeight / 2) : 0
  );
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!attachToParent);

  useEffect(() => {
    if (typeof x === 'number' && typeof y === 'number') {
      cursorX.set(x);
      cursorY.set(y);
    } else {
      const updatePosition = (e: MouseEvent) => {
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
        onPositionChange?.(e.clientX, e.clientY);
      };
      document.addEventListener('mousemove', updatePosition);
      return () => {
        document.removeEventListener('mousemove', updatePosition);
      };
    }
  }, [cursorX, cursorY, onPositionChange, x, y]);

  const cursorXSpring = useSpring(cursorX, springConfig || { duration: 0 });
  const cursorYSpring = useSpring(cursorY, springConfig || { duration: 0 });

  useEffect(() => {
    const handleVisibilityChange = (visible: boolean) => {
      setIsVisible(visible);
    };

    if (attachToParent && cursorRef.current) {
      const parent = cursorRef.current.parentElement;
      if (parent) {
        parent.addEventListener('mouseenter', () => {
          parent.style.cursor = 'none';
          handleVisibilityChange(true);
        });
        parent.addEventListener('mouseleave', () => {
          parent.style.cursor = 'auto';
          handleVisibilityChange(false);
        });
      }
    }

    return () => {
      if (attachToParent && cursorRef.current) {
        const parent = cursorRef.current.parentElement;
        if (parent) {
          parent.removeEventListener('mouseenter', () => {
            parent.style.cursor = 'none';
            handleVisibilityChange(true);
          });
          parent.removeEventListener('mouseleave', () => {
            parent.style.cursor = 'auto';
            handleVisibilityChange(false);
          });
        }
      }
    };
  }, [attachToParent]);

  return (
    <motion.div
      ref={cursorRef}
      className={cn('pointer-events-none fixed left-0 top-0 z-50', className)}
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial='initial'
            animate='animate'
            exit='exit'
            variants={variants}
            transition={transition}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

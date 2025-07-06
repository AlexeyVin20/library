"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import Image from 'next/image';

// Определяем позиции для появления совы вокруг центральной формы
const peekPositions = [
  { // Слева от формы
    variants: {
      hidden: { opacity: 0, x: -50, rotate: 25 },
      visible: { opacity: 1, x: 0, rotate: 15 },
    },
    style: {
      top: '45%',
      left: 'calc(50% - 320px)', // (ширина формы ~512px / 2) + запас
      width: '130px',
    },
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
  { // Справа от формы
    variants: {
      hidden: { opacity: 0, x: 50, rotate: -25 },
      visible: { opacity: 1, x: 0, rotate: -15 },
    },
    style: {
      top: '40%',
      left: 'calc(50% + 200px)', // (ширина формы ~512px / 2) - запас
      width: '150px',
    },
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
  { // Снизу формы
    variants: {
      hidden: { opacity: 0, y: 50, scale: 0.7 },
      visible: { opacity: 1, y: 0, scale: 1 },
    },
    style: {
      top: 'calc(50% + 250px)', // Позиция под формой
      left: '50%',
      transform: 'translateX(-50%)',
      width: '140px',
    },
    transition: { type: 'spring', stiffness: 120, damping: 20 },
  },
  { // Сверху-справа, как бы "через плечо"
    variants: {
      hidden: { opacity: 0, y: -50, x: 50, rotate: -15 },
      visible: { opacity: 1, y: 0, x: 0, rotate: 5 },
    },
    style: {
      top: 'calc(50% - 280px)', // Над формой, с учетом хедера
      left: 'calc(50% + 150px)',
      width: '110px',
    },
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
];

const PeekingOwl = () => {
  const [currentConfig, setCurrentConfig] = useState<(typeof peekPositions[0]) | null>(null);

  useEffect(() => {
    let timers: NodeJS.Timeout[] = [];

    const scheduleNextAppearance = () => {
      // Сначала прячем сову
      setCurrentConfig(null);

      const randomInterval = Math.random() * 8000 + 6000; // 6-14 секунд

      const appearanceTimeout = setTimeout(() => {
        // Выбираем новую случайную позицию
        const randomIndex = Math.floor(Math.random() * peekPositions.length);
        setCurrentConfig(peekPositions[randomIndex]);

        // Планируем ее исчезновение
        const visibilityDuration = 4000; // видна 4 секунды
        const disappearanceTimeout = setTimeout(() => {
            setCurrentConfig(null);
        }, visibilityDuration);
        timers.push(disappearanceTimeout);

      }, randomInterval);
      timers.push(appearanceTimeout);
    };

    // Запускаем цикл появлений
    const intervalId = setInterval(scheduleNextAppearance, 15000); // Полный цикл каждые 15с

    // Первое появление с задержкой
    const initialTimeout = setTimeout(scheduleNextAppearance, 5000);
    
    return () => {
      clearInterval(intervalId);
      clearTimeout(initialTimeout);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {currentConfig && (
        <motion.div
          className="fixed z-0" // z-0 чтобы быть за формой
          style={currentConfig.style}
          variants={currentConfig.variants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={currentConfig.transition as Transition}
        >
          <motion.div whileHover={{ scale: 1.2, rotate: 0 }}>
            <Image
              src="/images/owl-svgrepo-com.svg"
              alt="Peeking Owl"
              width={150}
              height={150}
              className="drop-shadow-lg"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PeekingOwl; 
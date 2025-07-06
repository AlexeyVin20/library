"use client"

import Image from "next/image"
import { motion, Variants } from "framer-motion"

const AuthHeader = () => {
  const logoVariants: Variants = {
    initial: { rotate: -90, opacity: 0, scale: 0.8 },
    animate: {
      rotate: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    hover: {
      scale: 1.1,
      rotate: [0, -5, 5, -3, 3, 0],
      transition: {
        duration: 0.6,
        ease: "easeInOut",
      },
    },
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 my-8">
      <motion.div
        variants={logoVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        className="cursor-pointer"
      >
        <div className="relative group">
          <motion.div
            className="relative"
            whileHover={{
              scale: 1.15,
              rotate: [0, -5, 5, -3, 3, 0],
              transition: {
                duration: 0.6,
                ease: "easeInOut",
              },
            }}
            animate={{
              y: [0, -4, 0],
              transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            {/* Используем новое изображение логотипа */}
            <Image
              src="/images/Synapse_logo_alpha.png"
              alt="СИНАПС Логотип"
              width={400}
              height={200}
              className="object-contain drop-shadow-xl"
              priority
            />

            {/* Магическое свечение */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-300/40 via-purple-300/40 to-yellow-300/40 rounded-full blur-3xl opacity-60"
              animate={{
                opacity: [0.4, 0.7, 0.4],
                scale: [1, 1.1, 1],
                transition: {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default AuthHeader 
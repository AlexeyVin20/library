"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

const EdgePeekingOwl = () => {
  const [isPeeking, setIsPeeking] = useState(false)
  const [motionProps, setMotionProps] = useState<any>({})

  useEffect(() => {
    const peekInterval = setInterval(() => {
      setIsPeeking(true)

      const positions = [
        {
          style: { top: "auto", bottom: "0px", left: "10%", transform: "translateX(-50%) rotate(15deg)" },
          animation: {
            initial: { y: 150, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            exit: { y: 150, opacity: 0 },
          },
        },
        {
          style: { top: "auto", bottom: "0px", right: "10%", transform: "translateX(50%) scaleX(-1) rotate(-15deg)" },
          animation: {
            initial: { y: 150, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            exit: { y: 150, opacity: 0 },
          },
        },
        {
          style: { top: "20vh", left: "-30px", transform: "translateY(-50%) rotate(90deg)" },
          animation: {
            initial: { x: -150, opacity: 0 },
            animate: { x: 0, opacity: 1 },
            exit: { x: -150, opacity: 0 },
          },
        },
        {
          style: { top: "20vh", right: "-30px", transform: "translateY(-50%) scaleX(-1) rotate(-90deg)" },
          animation: {
            initial: { x: 150, opacity: 0 },
            animate: { x: 0, opacity: 1 },
            exit: { x: 150, opacity: 0 },
          },
        },
      ]

      const randomPosition = positions[Math.floor(Math.random() * positions.length)]
      setMotionProps(randomPosition)

      setTimeout(() => {
        setIsPeeking(false)
      }, 3000) // Сова видна 3 секунды
    }, 9000) // Появляется каждые 9 секунд

    return () => clearInterval(peekInterval)
  }, [])

  if (!motionProps.style) return null

  return (
    <AnimatePresence>
      {isPeeking && (
        <motion.div
          {...motionProps.animation}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          style={{
            position: "fixed",
            ...motionProps.style,
            zIndex: 100, // Above most things
          }}
        >
          <Image src="/images/owl-svgrepo-com.svg" alt="Peeking Owl" width={120} height={120} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default EdgePeekingOwl 
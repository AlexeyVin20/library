"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export const PinContainer = ({
  children,
  title,
  href,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  title?: string;
  href?: string;
  className?: string;
  containerClassName?: string;
}) => {
  const [transform, setTransform] = useState("rotateX(0deg)");
  const router = useRouter();

  const onMouseEnter = () => {
    setTransform("rotateX(40deg) scale(0.98)");
  };
  const onMouseLeave = () => {
    setTransform("rotateX(0deg) scale(1)");
  };

  return (
    <div
      className={cn(
        "relative group/pin z-50 cursor-pointer h-full w-full flex items-center justify-center",
        containerClassName
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => router.push(href || "/")}
    >
      <div
        style={{
          perspective: "1000px",
        }}
        className="flex h-full w-full items-center justify-center"
      >
        <div
          style={{
            transform: transform,
          }}
          className="flex flex-col justify-start items-start rounded-2xl shadow-[0_8px_32px_rgba(34,197,94,0.15)] bg-emerald-500/10 backdrop-blur-md border border-green-500/20 group-hover/pin:border-green-400/40 group-hover/pin:bg-white/15 transition-all duration-700 overflow-hidden h-full w-full max-w-[400px] max-h-[320px] p-4 mx-auto my-auto"
        >
          <div className={cn("relative z-50 h-full w-full", className)}>{children}</div>
        </div>
      </div>
      <PinPerspective title={title} href={href} />
    </div>
  );
};

export const PinPerspective = ({
  title,
  href,
}: {
  title?: string;
  href?: string;
}) => {
  return (
    <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover/pin:opacity-100 z-[60] transition duration-500 max-w-[400px] max-h-[320px] mx-auto my-auto">
      <div className="w-full h-full flex-none inset-0 relative">
        <div className="absolute top-0 inset-x-0 flex justify-center">
          <a
            href={href}
            target={"_blank"}
            onClick={(e) => e.stopPropagation()}
            className="relative flex space-x-2 items-center z-10 rounded-full bg-white/10 backdrop-blur-md py-0.5 px-4 border border-green-500/30 hover:border-green-400/50 transition-all duration-300"
          >
            <span className="relative z-20 text-green-100 text-xs font-bold inline-block py-0.5">
              {title}
            </span>
            <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-green-400/0 via-green-400/90 to-green-400/0 transition-opacity duration-500 group-hover/btn:opacity-40"></span>
          </a>
        </div>

        <div
          style={{
            perspective: "1000px",
            transform: "rotateX(70deg) translateZ(0)",
          }}
          className="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2"
        >
          <>
            <motion.div
              initial={{
                opacity: 0,
                scale: 0,
                x: "-50%",
                y: "-50%",
              }}
              animate={{
                opacity: [0, 1, 0.5, 0],
                scale: 1,
                z: 0,
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                delay: 0,
              }}
              className="absolute left-1/2 top-1/2 h-[11.25rem] w-[11.25rem] rounded-[50%] bg-green-500/[0.08] shadow-[0_8px_32px_rgba(34,197,94,0.2)]"
            ></motion.div>
            <motion.div
              initial={{
                opacity: 0,
                scale: 0,
                x: "-50%",
                y: "-50%",
              }}
              animate={{
                opacity: [0, 1, 0.5, 0],
                scale: 1,
                z: 0,
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                delay: 2,
              }}
              className="absolute left-1/2 top-1/2 h-[11.25rem] w-[11.25rem] rounded-[50%] bg-green-500/[0.08] shadow-[0_8px_32px_rgba(34,197,94,0.2)]"
            ></motion.div>
            <motion.div
              initial={{
                opacity: 0,
                scale: 0,
                x: "-50%",
                y: "-50%",
              }}
              animate={{
                opacity: [0, 1, 0.5, 0],
                scale: 1,
                z: 0,
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                delay: 4,
              }}
              className="absolute left-1/2 top-1/2 h-[11.25rem] w-[11.25rem] rounded-[50%] bg-green-500/[0.08] shadow-[0_8px_32px_rgba(34,197,94,0.2)]"
            ></motion.div>
          </>
        </div>

        <>
          <motion.div className="absolute right-1/2 bottom-1/2 bg-gradient-to-b from-transparent to-green-500 translate-y-[14px] w-px h-20 group-hover/pin:h-40 blur-[2px]" />
          <motion.div className="absolute right-1/2 bottom-1/2 bg-gradient-to-b from-transparent to-green-500 translate-y-[14px] w-px h-20 group-hover/pin:h-40" />
          <motion.div className="absolute right-1/2 translate-x-[1.5px] bottom-1/2 bg-green-600 translate-y-[14px] w-[4px] h-[4px] rounded-full z-40 blur-[3px]" />
          <motion.div className="absolute right-1/2 translate-x-[0.5px] bottom-1/2 bg-green-300 translate-y-[14px] w-[2px] h-[2px] rounded-full z-40" />
        </>
      </div>
    </motion.div>
  );
};

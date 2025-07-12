import * as React from "react";
import { ChevronRight } from "lucide-react";


export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: React.ReactNode;
  subtitle: string;
  details?: React.ReactNode;
  icon: React.ReactNode;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, title, value, subtitle, details, icon, ...props }, ref) => {
    
    const cardRef = React.useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      cardRef.current.style.transition = 'none'; // Disable transition for direct response
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - left - width / 2) / 10; // Increased sensitivity
      const y = (e.clientY - top - height / 2) / 10; // Increased sensitivity
      cardRef.current.style.transform = `perspective(1000px) rotateX(${-y}deg) rotateY(${x}deg) scale3d(1.05, 1.05, 1.05)`;
    };

    const handleMouseLeave = () => {
      if (!cardRef.current) return;
      cardRef.current.style.transition = 'transform 0.4s ease-in-out'; // Enable transition for smooth return
      cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    };
    
    return (
      <div
        ref={ref}
        className={`group h-[300px] w-full [perspective:1000px] ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <div 
          ref={cardRef}
          className="relative h-full rounded-[50px] bg-gradient-to-br from-blue-600/50 to-blue-900/80 shadow-2xl [transform-style:preserve-3d]">
          
          <div className="absolute inset-2 rounded-[55px] border-b border-l border-white/20 bg-gradient-to-b from-white/30 to-white/10 backdrop-blur-sm [transform-style:preserve-3d] [transform:translate3d(0,0,25px)]"></div>
          
          <div className="absolute [transform:translate3d(0,0,26px)] w-full p-7">
            <span className="block text-xl font-black text-white">
              {title}
            </span>
            <div className="mt-5">
                <p className="text-4xl font-bold text-white">{value}</p>
                <p className="text-sm text-white/90 mt-1">{subtitle}</p>
            </div>
          </div>

          <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between [transform-style:preserve-3d] [transform:translate3d(0,0,26px)]">
            <div className="text-base text-white/80">
                {details}
            </div>
            <div className="flex w-2/5 cursor-pointer items-center justify-end transition-all duration-200 ease-in-out group-hover:[transform:translate3d(0,0,10px)]">
              <span className="text-xs font-bold text-white">
                Подробнее
              </span>
              <ChevronRight className="h-4 w-4 stroke-white" strokeWidth={3} />
            </div>
          </div>

          <div className="absolute top-0 right-0 [transform-style:preserve-3d] [transform:translate3d(0,0,26px)]">
            <div
              className="absolute grid aspect-square w-[50px] place-content-center rounded-full bg-blue-400/80 shadow-xl transition-transform duration-300 ease-in-out [transform:translate3d(0,0,100px)] group-hover:[transform:translate3d(0,0,110px)_scale(1.15)]"
              style={{ top: "30px", right: "30px" }}
            >
              {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6 fill-blue-900" })}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export default GlassCard;
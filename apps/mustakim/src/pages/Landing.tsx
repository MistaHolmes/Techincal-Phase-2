import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, easeOut } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth, } from "@clerk/clerk-react";
import TypeWriter from "../components/TypeWriter";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import BackgroundGlow from "@/components/ui/BackgroundGlow";

const LandingPage: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const gridX = useSpring(mouseX, { stiffness: 80, damping: 15, mass: 0.7 });
  const gridY = useSpring(mouseY, { stiffness: 80, damping: 15, mass: 0.7 });

  const [isGridActive, setIsGridActive] = useState(false);
  const { isLoaded } = useAuth();
  const route = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set(((e.clientX - centerX) / centerX) * 30);
      mouseY.set(((e.clientY - centerY) / centerY) * 30);
    };

    if (isGridActive) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isGridActive, mouseX, mouseY]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
       },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.7,
        ease: easeOut,
      },
    },
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground overflow-hidden relative">
      <BackgroundGlow />
      {/* Dynamic Background with Glowing Orbs */}
      <motion.div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-background" />
        <motion.div
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-600/20 rounded-full blur-[120px] mix-blend-screen"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
           className="absolute inset-0 opacity-30"
           style={{
             backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
             backgroundSize: "40px 40px",
             x: isGridActive ? gridX : 0,
             y: isGridActive ? gridY : 0,
           }}
           onAnimationComplete={() => setIsGridActive(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </motion.div>

      {/* Header */}
      <div className="absolute top-7 left-6 flex space-x-3 z-20">
        <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
        <div className="h-3 w-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]"></div>
        <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
      </div>
      <div className="absolute top-4 right-4 z-20 glass rounded-full px-2 py-2">
        <SignedOut>
          <SignInButton>
            <button className="px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded-full hover:bg-primary hover:text-white transition-all duration-300">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>

      {/* Main content */}
      <main className="h-screen flex items-center justify-center px-4 relative z-10">
        {isLoaded && (
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-[90%] sm:max-w-4xl text-center space-y-8 p-10 glass-card rounded-[2.5rem]"
          >
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight flex flex-col items-center justify-center gap-4"
            >
              <span className="text-gradient drop-shadow-2xl">
                <TypeWriter text="DraftDock" className="inline-block" />
              </span>
              <span className="text-foreground/90 text-2xl md:text-4xl font-semibold">
                The modern writing hub
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto px-4 font-light"
            >
              Read and write beautiful blogs. Join a vibrant community and share your story with the world in an engaging, premium format.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-6 justify-center px-4 pt-4"
            >
              <SignedIn>
                <motion.button
                  onClick={() => route("/create-blog")}
                  className="glass-button min-w-[180px] px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Drafting <ArrowRight className="ml-2 h-5 w-5" />
                </motion.button>
                <motion.button 
                  onClick={() => route("/blogs")}
                  className="min-w-[180px] px-8 py-4 bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-white/10 rounded-full transition-all font-semibold text-lg backdrop-blur-md flex items-center justify-center"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Reading <ArrowRight className="ml-2 h-5 w-5" />
                </motion.button>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass-button min-w-[180px] px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center mx-auto sm:mx-0"
                  >
                    Start Drafting <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.button>
                </SignInButton>
                <SignInButton mode="modal">
                  <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.95 }}
                    className="min-w-[180px] px-8 py-4 bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-white/10 rounded-full transition-all font-semibold text-lg backdrop-blur-md flex items-center justify-center mx-auto sm:mx-0"
                  >
                    Start Reading <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.button>
                </SignInButton>
              </SignedOut>
            </motion.div>
          </motion.section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;


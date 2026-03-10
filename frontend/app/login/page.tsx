"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

/* ── Staggered field animation ─────────────────────────────────── */

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.06 * i,
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

const inputClass =
  "w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-2xl px-5 py-3.5 text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-foreground/20 focus:bg-foreground/[0.06] transition-all duration-200 text-sm";

/* ── Sub-components ─────────────────────────────────────────────── */

function Divider() {
  return (
    <div className="flex items-center gap-4 my-1">
      <div className="flex-1 h-px bg-foreground/[0.08]" />
      <span className="text-foreground/25 text-xs font-medium tracking-wide uppercase">
        or
      </span>
      <div className="flex-1 h-px bg-foreground/[0.08]" />
    </div>
  );
}

function GoogleButton() {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.985 }}
      className="w-full bg-foreground/[0.04] border border-foreground/[0.08] py-3.5 rounded-full font-medium text-sm text-foreground hover:bg-foreground/[0.07] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Continue with Google
    </motion.button>
  );
}

function Field({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div custom={index} variants={fieldVariants}>
      {children}
    </motion.div>
  );
}

function SignInForm() {
  return (
    <motion.form
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-5"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        visible: { transition: { staggerChildren: 0.06 } },
        exit: { transition: { staggerChildren: 0.03 } },
      }}
    >
      <Field index={0}>
        <label className="block text-foreground/40 text-xs font-medium mb-2 ml-1">
          Email address
        </label>
        <input
          type="email"
          placeholder="you@company.com"
          className={inputClass}
        />
      </Field>

      <Field index={1}>
        <div className="flex items-center justify-between mb-2 ml-1">
          <label className="text-foreground/40 text-xs font-medium">
            Password
          </label>
          <button
            type="button"
            className="text-foreground/30 text-xs hover:text-foreground/50 transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <input
          type="password"
          placeholder="••••••••"
          className={inputClass}
        />
      </Field>

      <Field index={2}>
        <div className="flex flex-col gap-3 mt-3">
          <motion.button
            type="submit"
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.985 }}
            className="w-full bg-foreground text-background py-3.5 rounded-full font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            Sign in
          </motion.button>

          <Divider />

          <GoogleButton />
        </div>
      </Field>
    </motion.form>
  );
}

function SignUpForm() {
  return (
    <motion.form
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-5"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        visible: { transition: { staggerChildren: 0.06 } },
        exit: { transition: { staggerChildren: 0.03 } },
      }}
    >
      <Field index={0}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-foreground/40 text-xs font-medium mb-2 ml-1">
              First name
            </label>
            <input type="text" placeholder="John" className={inputClass} />
          </div>
          <div>
            <label className="block text-foreground/40 text-xs font-medium mb-2 ml-1">
              Last name
            </label>
            <input type="text" placeholder="Doe" className={inputClass} />
          </div>
        </div>
      </Field>

      <Field index={1}>
        <label className="block text-foreground/40 text-xs font-medium mb-2 ml-1">
          Email address
        </label>
        <input
          type="email"
          placeholder="you@company.com"
          className={inputClass}
        />
      </Field>

      <Field index={2}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-foreground/40 text-xs font-medium mb-2 ml-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-foreground/40 text-xs font-medium mb-2 ml-1">
              Confirm password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
        </div>
      </Field>

      <Field index={3}>
        <div className="flex flex-col gap-3 mt-3">
          <motion.button
            type="submit"
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.985 }}
            className="w-full bg-foreground text-background py-3.5 rounded-full font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            Create account
          </motion.button>

          <Divider />

          <GoogleButton />
        </div>
      </Field>
    </motion.form>
  );
}

/* ── Kinetic Background Components ────────────────────────────── */

function TextRow({
  y,
  direction,
  text,
  speed
}: {
  y: number;
  direction: number;
  text: string;
  speed: number
}) {
  const meshRef = useRef<THREE.Group>(null);
  const { viewport, mouse } = useThree();

  const chars = useMemo(() => text.split(""), [text]);
  const letterSpacing = 0.85;
  const wordSpacing = 5.0;
  const totalWordWidth = (chars.length * letterSpacing) + wordSpacing;

  const wordOffsets = useMemo(() => [-3, -2, -1, 0, 1, 2, 3], []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Movement
    meshRef.current.position.x += direction * speed * delta;

    // Smooth looping
    if (direction > 0 && meshRef.current.position.x > totalWordWidth) {
      meshRef.current.position.x -= totalWordWidth;
    } else if (direction < 0 && meshRef.current.position.x < -totalWordWidth) {
      meshRef.current.position.x += totalWordWidth;
    }

    // Cursor position in world coordinates
    const mouseWorldX = (mouse.x * viewport.width) / 2;
    const mouseWorldY = (mouse.y * viewport.height) / 2;

    // Magnifying glass effect per letter
    meshRef.current.children.forEach((wordGroup) => {
      if (wordGroup instanceof THREE.Group) {
        wordGroup.children.forEach((charMesh) => {
          if (charMesh instanceof THREE.Mesh) {
            const charPos = new THREE.Vector3();
            charMesh.getWorldPosition(charPos);

            const dist = Math.sqrt(
              Math.pow(charPos.x - mouseWorldX, 2) +
              Math.pow(charPos.y - mouseWorldY, 2)
            );

            // True magnifying glass effect: tight radius, high zoom
            const maxDist = 2.2;
            const isInside = dist < maxDist;

            // Zoom scale
            const zoom = isInside ? 1 + (1 - dist / maxDist) * 1.6 : 1;
            const targetScale = new THREE.Vector3(zoom, zoom, 1);
            charMesh.scale.lerp(targetScale, 0.15);

            // Dynamic opacity based on proximity
            if (charMesh.material instanceof THREE.MeshBasicMaterial) {
              const targetOpacity = isInside ? 0.45 : 0.05;
              charMesh.material.opacity = THREE.MathUtils.lerp(
                charMesh.material.opacity,
                targetOpacity,
                0.1
              );
            }
          }
        });
      }
    });
  });

  return (
    <group ref={meshRef} position={[0, y, 0]}>
      {wordOffsets.map((wIdx) => (
        <group key={wIdx} position={[wIdx * totalWordWidth, 0, 0]}>
          {chars.map((char, cIdx) => (
            <Text
              key={cIdx}
              position={[cIdx * letterSpacing - (chars.length * letterSpacing) / 2, 0, 0]}
              fontSize={1.1}
              color="black"
              anchorX="center"
              anchorY="middle"
              // @ts-ignore - transparent/opacity handled by Text
              transparent={true}
              // @ts-ignore
              opacity={0.05}
            >
              {char}
            </Text>
          ))}
        </group>
      ))}
    </group>
  );
}

function KineticBackground() {
  const rows = useMemo(() => {
    const result = [];
    for (let i = -7; i <= 7; i++) {
      result.push({
        y: i * 1.6,
        direction: i % 2 === 0 ? 1 : -1,
        speed: 0.4 + (Math.abs(i) % 3) * 0.2,
      });
    }
    return result;
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }} dpr={[1, 2]}>
        {rows.map((row, idx) => (
          <TextRow
            key={idx}
            y={row.y}
            direction={row.direction}
            text="INVENTRA"
            speed={row.speed}
          />
        ))}
      </Canvas>
    </div>
  );
}

/* ── Floating dots background ─────────────────────────────────── */

function FloatingDots() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-foreground/[0.06]"
          style={{
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────── */

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center">
      <KineticBackground />
      <FloatingDots />

      <div className="w-full max-w-lg mx-auto px-6 relative z-10">
        <div className="w-full">
          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full"
          >
            <motion.div
              layout
              transition={{
                layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
              }}
              className="bg-foreground/[0.03] backdrop-blur-xl border border-foreground/[0.08] rounded-[2rem] p-8 sm:p-10 overflow-hidden"
            >
              {/* Header */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? "signup-header" : "signin-header"}
                  initial={{ opacity: 0, x: isSignUp ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isSignUp ? -20 : 20 }}
                  transition={{
                    duration: 0.25,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="mb-8"
                >
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {isSignUp ? "Create account" : "Welcome back"}
                  </h1>
                  <p className="text-foreground/50 mt-2 text-sm">
                    {isSignUp
                      ? "Start managing your assets intelligently."
                      : "Sign in to continue to Inventra."}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Form — crossfade with staggered fields */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? "signup" : "signin"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                  }}
                >
                  {isSignUp ? <SignUpForm /> : <SignInForm />}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Toggle mode */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-center px-4"
            >
              <p className="text-foreground/40 text-sm">
                {isSignUp
                  ? "Already have an account?"
                  : "Don\u2019t have an account?"}{" "}
                <button
                  onClick={toggleMode}
                  className="text-foreground font-medium hover:text-foreground/80 transition-colors cursor-pointer"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom subtle detail */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-foreground/20 text-xs z-10"
      >
        &copy; {new Date().getFullYear()} Inventra
      </motion.p>
    </div>
  );
}

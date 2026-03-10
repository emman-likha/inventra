"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import dynamic from "next/dynamic";

const Canvas = dynamic(
    () => import("@react-three/fiber").then((mod) => mod.Canvas),
    { ssr: false }
);

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

        meshRef.current.position.x += direction * speed * delta;

        if (direction > 0 && meshRef.current.position.x > totalWordWidth) {
            meshRef.current.position.x -= totalWordWidth;
        } else if (direction < 0 && meshRef.current.position.x < -totalWordWidth) {
            meshRef.current.position.x += totalWordWidth;
        }

        const mouseWorldX = (mouse.x * viewport.width) / 2;
        const mouseWorldY = (mouse.y * viewport.height) / 2;

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

                        const maxDist = 2.2;
                        const isInside = dist < maxDist;

                        const zoom = isInside ? 1 + (1 - dist / maxDist) * 1.6 : 1;
                        const targetScale = new THREE.Vector3(zoom, zoom, 1);
                        charMesh.scale.lerp(targetScale, 0.15);

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
                            // @ts-ignore
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

export function KineticBackground() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
            <Canvas camera={{ position: [0, 0, 10], fov: 50 }} dpr={[1, 2]} style={{ position: "absolute", inset: 0 }}>
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

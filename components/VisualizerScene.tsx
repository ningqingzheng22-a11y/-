import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { audioManager } from '../utils/audioManager';
import { CameraMode } from '../types';

// Shared Noise Generator
const noise3D = createNoise3D();

// Utility to calculate terrain height at a specific coordinate
const getTerrainHeight = (x: number, z: number) => {
  // Base Terrain Noise (Large scale) - Increased height for grander mountains
  let y = noise3D(x * 0.03, z * 0.03, 0) * 14; 
  // Secondary Shape
  y += noise3D(x * 0.1, z * 0.1, 0) * 4;
  // Detail Noise
  y += noise3D(x * 0.3, z * 0.3, 0) * 1;
  return y;
};

interface TerrainLayerProps {
  zOffset: number;
  color: string;
  speedMultiplier: number;
  freqRange: [number, number];
  scrollRef: React.MutableRefObject<number>;
  opacity?: number;
}

const TerrainLayer: React.FC<TerrainLayerProps> = ({ zOffset, color, speedMultiplier, freqRange, scrollRef, opacity = 0.7 }) => {
  const meshRef = useRef<THREE.Points>(null);
  
  // Significantly increased world size for wider movement range
  const width = 280; 
  const depth = 120;
  // Increased density (segments) for finer particles
  const widthSegments = 300; 
  const depthSegments = 100;
  
  const originalPositions = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(width, depth, widthSegments, depthSegments);
    geometry.rotateX(-Math.PI / 2);
    return geometry.attributes.position.clone();
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    
    const data = audioManager.getFrequencyData();
    // Audio Reactivity for this layer
    let intensity = 0;
    if (data.length > 0) {
      const slice = data.slice(freqRange[0], freqRange[1]);
      const sum = slice.reduce((a, b) => a + b, 0);
      intensity = (sum / slice.length) / 255; 
    }

    const positions = meshRef.current.geometry.attributes.position;
    const count = positions.count;
    
    // Get shared scroll position
    const currentScroll = scrollRef.current; 

    for (let i = 0; i < count; i++) {
      const x = originalPositions.getX(i);
      const z = originalPositions.getZ(i);
      
      // Calculate effective Z in noise space
      const noiseZ = z + (currentScroll * speedMultiplier);
      
      // Get Height from shared function
      let y = getTerrainHeight(x, noiseZ);

      // Audio Displacement
      // Map X to frequency bins roughly
      const freqIndex = Math.floor(((x + width / 2) / width) * (freqRange[1] - freqRange[0])) + freqRange[0];
      const audioValue = data[freqIndex] ? data[freqIndex] / 255 : 0;
      
      const audioHeight = audioValue * 12 * intensity; // Taller reaction
      
      // Valley mask to keep center path somewhat navigable, but wider now
      const valleyFactor = Math.abs(x) < 8 ? 0.3 : 1;

      positions.setY(i, (y + audioHeight) * valleyFactor);
    }
    
    positions.needsUpdate = true;
  });

  return (
    <points ref={meshRef} position={[0, -10, zOffset]}>
      <planeGeometry args={[width, depth, widthSegments, depthSegments]} />
      <pointsMaterial 
        size={0.15} // Slightly smaller size for denser packing
        color={color} 
        transparent 
        opacity={opacity} 
        sizeAttenuation 
        blending={THREE.AdditiveBlending} 
      />
    </points>
  );
};

// Intelligent Camera System
const CameraController: React.FC<{ mode: CameraMode, scrollRef: React.MutableRefObject<number> }> = ({ mode, scrollRef }) => {
  const { camera } = useThree();
  
  // State refs for smooth transitions
  const targetLookAt = useRef(new THREE.Vector3(0, 0, -20));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, -20));
  const orbitAngle = useRef(0);
  
  // Audio responsiveness smoothing
  const smoothedBass = useRef(0);
  const smoothedVol = useRef(0);
  const smoothedHigh = useRef(0);

  useFrame(({ clock }, delta) => {
    if (mode === CameraMode.MANUAL) return;

    const { bass, high, vol } = audioManager.getAnalysis();

    // Smooth audio data
    smoothedBass.current += (bass - smoothedBass.current) * 5 * delta;
    smoothedVol.current += (vol - smoothedVol.current) * 3 * delta;
    smoothedHigh.current += (high - smoothedHigh.current) * 3 * delta;

    // --- 1. Update Scroll (Movement along path) ---
    // Speed depends on Bass (Rhythm/BPM proxy)
    const baseSpeed = 6;
    const speedBoost = smoothedBass.current * 20; // Faster max speed
    const currentSpeed = baseSpeed + speedBoost;
    
    scrollRef.current += currentSpeed * delta;

    // --- 2. Cinematic Zoom Director (New) ---
    const time = clock.getElapsedTime();
    // Noise value roughly -1 to 1. Moving slowly (0.08 frequency) to make cuts occasional.
    const directorNoise = noise3D(time * 0.08, 200, 0); 
    
    // Map noise to Zoom Factor: 0 (Close Up) to 1 (Wide)
    // We offset by +0.3 to bias towards Wide shots (we want ~70% wide, ~30% close).
    // Mapping: range [-0.4, 0.4] around the offset noise dictates the transition.
    const rawZoom = directorNoise + 0.3;
    const zoomFactor = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(rawZoom, -0.4, 0.4, 0, 1), 0, 1);
    
    // Interpolate Parameters based on Zoom Factor
    
    // Radius: Close (25-45) vs Wide (90-180)
    // Close radius allows flying THROUGH the particle layers
    const minR = THREE.MathUtils.lerp(25, 90, zoomFactor);
    const maxR = THREE.MathUtils.lerp(45, 180, zoomFactor);
    const targetRadius = minR + (smoothedVol.current * (maxR - minR));

    // Orbit Speed: Slower rotation when close up to prevent dizziness, faster when wide
    const speedFactor = THREE.MathUtils.lerp(0.5, 1.0, zoomFactor);
    const baseRotSpeed = 0.08 * speedFactor;
    const rotSpeedBoost = smoothedHigh.current * 0.2;
    orbitAngle.current += (baseRotSpeed + rotSpeedBoost) * delta;

    // Orbit Center Z: Move center closer to camera when zooming in to see foreground details
    // Wide: -40 (Center of scene), Close: 0 (Near foreground layers)
    const centerZ = THREE.MathUtils.lerp(0, -40, zoomFactor);

    // --- 3. Camera Positioning ---
    
    if (mode === CameraMode.AUTO) {
        // Look At Height: Look slightly up (positive Y offset) when close and low to see mountain heights
        const lookAtYOffset = THREE.MathUtils.lerp(5, 0, zoomFactor);
        targetLookAt.current.set(0, 10 + lookAtYOffset, centerZ);
        
        currentLookAt.current.lerp(targetLookAt.current, 1.0 * delta);
        
        // Calculate Position
        const camX = Math.sin(orbitAngle.current) * targetRadius;
        const camZ = centerZ + Math.cos(orbitAngle.current) * targetRadius;
        
        // Height: Low (12) vs High (45+)
        // Bass bounce intensity scales with height (smaller bounce when close)
        const baseH = THREE.MathUtils.lerp(12, 45, zoomFactor);
        const bounceScale = THREE.MathUtils.lerp(5, 30, zoomFactor);
        
        const hoverHeight = baseH + smoothedBass.current * bounceScale;
        // Add subtle breathing movement
        const camY = hoverHeight + Math.sin(time * 0.2) * (zoomFactor * 5 + 2);

        // Smooth camera movement
        camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.8 * delta);
        camera.lookAt(currentLookAt.current);
    }
  });

  return null;
};

interface SceneProps {
  cameraMode: CameraMode;
  isPlaying: boolean;
}

export const VisualizerScene: React.FC<SceneProps> = ({ cameraMode, isPlaying }) => {
  // Shared scroll reference to sync terrain and camera
  const scrollRef = useRef(0);

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-[#020405] to-[#0a151a]">
      <Canvas dpr={[1, 2]} gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 40, 80]} fov={60} near={0.1} far={500} />
        
        {cameraMode === CameraMode.MANUAL && (
          <OrbitControls 
            enablePan={true} 
            minDistance={10} 
            maxDistance={200} 
            maxPolarAngle={Math.PI / 1.8} 
          />
        )}
        
        <CameraController mode={cameraMode} scrollRef={scrollRef} />

        {/* Atmosphere - Grand scale */}
        <fog attach="fog" args={['#020405', 20, 200]} />
        <ambientLight intensity={0.3} />
        <pointLight position={[30, 50, 30]} intensity={2} color="#4fd1c5" decay={2} />
        <Stars radius={300} depth={100} count={10000} factor={6} saturation={0.8} fade speed={0.5} />
        
        <group>
            {/* 
               Multi-Layer Terrain System - "A Thousand Li"
               Created to simulate depth through parallax and color grading 
            */}
            
            {/* Layer 1: Distant Background - Deep Ink */}
            <TerrainLayer 
                zOffset={-70} 
                color="#081820" 
                speedMultiplier={0.1} 
                freqRange={[0, 5]} 
                scrollRef={scrollRef}
                opacity={0.4}
            />
            
             {/* Layer 2: Mid Background - Dark Teal */}
             <TerrainLayer 
                zOffset={-45} 
                color="#0F2C36" 
                speedMultiplier={0.2} 
                freqRange={[0, 10]} 
                scrollRef={scrollRef}
                opacity={0.5}
            />

            {/* Layer 3: Mid Ground - Typical Green/Blue */}
            <TerrainLayer 
                zOffset={-25} 
                color="#1A535C" 
                speedMultiplier={0.3} 
                freqRange={[5, 15]} 
                scrollRef={scrollRef}
                opacity={0.6}
            />

            {/* Layer 4: Focus Layer - Vibrant Teal */}
            <TerrainLayer 
                zOffset={-10} 
                color="#2C7A7B" 
                speedMultiplier={0.4} 
                freqRange={[10, 30]} 
                scrollRef={scrollRef}
                opacity={0.8}
            />
            
            {/* Layer 5: Foreground - Brighter Cyan */}
            <TerrainLayer 
                zOffset={10} 
                color="#38B2AC" 
                speedMultiplier={0.5} 
                freqRange={[20, 60]} 
                scrollRef={scrollRef}
                opacity={0.7}
            />

            {/* Layer 6: Close Details - Gold/Ochre Highlights */}
            <TerrainLayer 
                zOffset={25} 
                color="#D69E2E" 
                speedMultiplier={0.7} 
                freqRange={[40, 120]} 
                scrollRef={scrollRef}
                opacity={0.9}
            />
            
            {/* Floating Particles */}
            <Sparkles 
                count={1500} 
                scale={[150, 60, 150]} 
                size={6} 
                speed={0.4} 
                opacity={0.6} 
                color="#E0FFFF" 
                position={[0, 10, -10]}
            />
        </group>

      </Canvas>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>
    </div>
  );
};
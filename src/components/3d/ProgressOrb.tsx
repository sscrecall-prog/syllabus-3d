import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ProgressOrbProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressOrb: React.FC<ProgressOrbProps> = ({
  percentage,
  size = 'md',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  const dimensions = {
    sm: { width: 140, height: 140 },
    md: { width: 220, height: 220 },
    lg: { width: 300, height: 300 },
  }[size];

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      setWebGlSupported(false);
      return;
    }

    renderer.setSize(dimensions.width, dimensions.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, dimensions.width / dimensions.height, 0.1, 100);
    camera.position.z = 4.2;

    const group = new THREE.Group();
    scene.add(group);

    // Inner Glowing Core
    const coreGeometry = new THREE.SphereGeometry(1.0, 32, 32);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x5b5fef,
      emissive: 0x2428af,
      specular: 0x818cf8,
      shininess: 90,
      transparent: true,
      opacity: 0.88,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(coreMesh);

    // Outer Wireframe Orbital Cage
    const wireGeometry = new THREE.IcosahedronGeometry(1.35, 2);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
    group.add(wireMesh);

    // Orbiting Particles Ring
    const particleCount = 60;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = (i / particleCount) * Math.PI * 2;
      const radius = 1.6 + Math.sin(i * 3) * 0.15;
      particlePositions[i * 3] = Math.cos(theta) * radius;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      particlePositions[i * 3 + 2] = Math.sin(theta) * radius;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x10b981,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particleSystem);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x5b5fef, 3, 50);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x10b981, 2, 50);
    pointLight2.position.set(-5, -5, -3);
    scene.add(pointLight2);

    let animationFrameId: number;
    let targetRotX = 0;
    let targetRotY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = currentMount.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = x * 0.5;
      targetRotX = y * 0.5;
    };

    currentMount.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      coreMesh.rotation.y += 0.008;
      wireMesh.rotation.x -= 0.004;
      wireMesh.rotation.y -= 0.006;
      particleSystem.rotation.y += 0.005;

      group.rotation.x += (targetRotX - group.rotation.x) * 0.05;
      group.rotation.y += (targetRotY - group.rotation.y) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      currentMount.removeEventListener('mousemove', onMouseMove);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [dimensions]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div
        ref={mountRef}
        style={{ width: dimensions.width, height: dimensions.height }}
        className="cursor-pointer transition-transform duration-300 hover:scale-105"
      />
      {!webGlSupported && (
        <div
          style={{ width: dimensions.width, height: dimensions.height }}
          className="rounded-full bg-gradient-to-tr from-brand-600 via-brand-500 to-emerald-400 shadow-2xl flex items-center justify-center"
        />
      )}
      <div className="absolute flex flex-col items-center pointer-events-none text-center">
        <span className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
          {percentage}%
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-100 opacity-90 drop-shadow">
          Mastered
        </span>
      </div>
    </div>
  );
};

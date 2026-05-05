import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Instances, Instance, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { KnowledgeGraph } from '../ai/gemini';
import { audioEngine } from '../audio/AudioEngine';

interface GalaxyProps {
  graph: KnowledgeGraph;
}

export default function Galaxy({ graph }: GalaxyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Distribute nodes in a 3D sphere layout
  const nodePositions = useMemo(() => {
    const positions = new Map<string, THREE.Vector3>();
    const radius = 10;
    
    // Attempt somewhat deterministic random distribution, or simple spherical distribution
    graph.nodes.forEach((node, i) => {
      const phi = Math.acos(-1 + (2 * i) / graph.nodes.length);
      const theta = Math.sqrt(graph.nodes.length * Math.PI) * phi;
      
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      
      // Jiggle a bit
      positions.set(node.id, new THREE.Vector3(
        x + (Math.random() - 0.5) * 5,
        y + (Math.random() - 0.5) * 5,
        z + (Math.random() - 0.5) * 5
      ));
    });
    return positions;
  }, [graph]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Background Particles */}
      <ParticleSwarm count={graph.visualParams.particleCount || 2000} speed={graph.visualParams.particleSpeed || 1} />

      {/* Edges */}
      {graph.edges.map((edge, i) => {
        const start = nodePositions.get(edge.source);
        const end = nodePositions.get(edge.target);
        if (!start || !end) return null;
        return (
          <Line
            key={`edge-${i}`}
            points={[start, end]}
            color="white"
            opacity={0.15}
            transparent
            lineWidth={1}
          />
        );
      })}

      {/* Nodes */}
      {graph.nodes.map((node) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return null;
        
        const isHovered = hoveredNode === node.id;
        
        return (
          <group key={node.id} position={pos}>
            <mesh 
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredNode(node.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredNode(null);
                document.body.style.cursor = 'auto';
              }}
              onClick={(e) => {
                e.stopPropagation();
                audioEngine.playNodeInteraction();
              }}
            >
              <sphereGeometry args={[node.scale * (isHovered ? 1.2 : 1), 32, 32]} />
              <meshPhysicalMaterial 
                color={node.color} 
                emissive={node.color}
                emissiveIntensity={isHovered ? 2 : 0.8}
                roughness={0.2}
                metalness={0.8}
                clearcoat={1}
              />
            </mesh>

            {/* Labels */}
            {isHovered && (
              <Html center className="pointer-events-none">
                <div className="glass-panel p-4 rounded-xl text-white text-sm w-64 animate-in fade-in zoom-in duration-200">
                  <h3 className="font-bold text-lg mb-1" style={{ color: node.color }}>{node.label}</h3>
                  <p className="opacity-80 text-xs leading-relaxed">{node.summary}</p>
                </div>
              </Html>
            )}
            
            {!isHovered && (
              <Text 
                position={[0, node.scale + 0.5, 0]} 
                fontSize={0.8} 
                color="white" 
                anchorX="center" 
                anchorY="middle"
                opacity={0.6}
              >
                {node.label}
              </Text>
            )}
          </group>
        );
      })}
    </group>
  );
}

// Particle Swarm component
function ParticleSwarm({ count, speed }: { count: number, speed: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
        temp.push({
            pos: new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100),
            t: Math.random() * 100,
            factor: Math.random() * speed + 0.5
        })
    }
    return temp;
  }, [count, speed]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    particles.forEach((particle, i) => {
        let { t, factor, pos } = particle;
        t = particle.t += factor / 200;
        
        const x = pos.x + Math.sin(t) * 2;
        const y = pos.y + Math.cos(t) * 2;
        const z = pos.z + Math.cos(t) * 2;
        
        dummy.position.set(x, y, z);
        const scale = 0.1;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <circleGeometry args={[1, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
    </instancedMesh>
  );
}

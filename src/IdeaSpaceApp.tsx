import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, EffectComposer, Bloom } from '@react-three/drei';
import { Search, Loader2, Volume2, VolumeX, Info } from 'lucide-react';
import { generateKnowledgeGraph, type KnowledgeGraph } from './ai/gemini';
import { audioEngine } from './audio/AudioEngine';
import Galaxy from './canvas/Galaxy';

export default function IdeaSpaceApp() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    return () => {
      audioEngine.stop();
    };
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!topic.trim()) return;
    
    setLoading(true);
    setError("");
    
    try {
      if (!started) {
        await audioEngine.initialize();
        setStarted(true);
        setMuted(false);
      }
      
      const newGraph = await generateKnowledgeGraph(topic);
      setGraph(newGraph);
      
      // Update environment colors
      document.body.style.backgroundColor = newGraph.visualParams.backgroundColor;
      
      if (!muted) {
        audioEngine.applyParams(newGraph.audioParams);
      }
      
    } catch (err) {
      console.error(err);
      setError("Failed to explore this topic. It might be too abstract or the models missed it. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMute = async () => {
    if (!started && muted) {
      await audioEngine.initialize();
      setStarted(true);
      if (graph) audioEngine.applyParams(graph.audioParams);
    } else {
      if (muted) {
        if (graph) audioEngine.applyParams(graph.audioParams);
      } else {
        audioEngine.stop();
      }
    }
    setMuted(!muted);
  };

  return (
    <>
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 w-full h-full bg-black transition-colors duration-1000" style={{ backgroundColor: graph ? graph.visualParams.backgroundColor : '#050505' }}>
        <Canvas camera={{ position: [0, 0, 30], fov: 60 }} gl={{ antialias: false }}>
          <color attach="background" args={[graph?.visualParams.backgroundColor || '#050505']} />
          <ambientLight intensity={0.2} />
          <directionalLight position={[10, 10, 10]} intensity={1} />
          
          <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
          
          {graph && <Galaxy graph={graph} />}
          {!graph && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
          
          <Environment preset="city" />
        </Canvas>
      </div>

      {/* UI Overlay Layer */}
      <div className="ui-overlay p-6 md:p-8">
        
        {/* Header */}
        <header className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-2xl md:text-3xl font-mono font-bold tracking-tighter text-white glow-text flex items-center gap-2">
              ✨ IdeaSpace
            </h1>
            <p className="opacity-60 text-sm mt-1 max-w-sm">
              Enter a concept. Discover a procedural, generative 3D environment mapped with related knowledge and ambient synesthesia.
            </p>
          </div>
          
          <button 
            onClick={toggleMute}
            className="p-3 glass-panel rounded-full hover:bg-white/10 transition flex items-center justify-center text-white"
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </header>

        {/* Center UI - Search Input (when not exploring) */}
        {!graph && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center pointer-events-auto">
            <h2 className="text-4xl text-center font-semibold mb-8 text-white max-w-2xl leading-tight">
              What do you want to explore?
            </h2>
            
            <form onSubmit={handleSearch} className="w-full max-w-xl relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Cognitive Behavioral Therapy, The Renaissance, Black Holes..."
                className="w-full p-6 pr-16 text-lg bg-black/40 border border-white/20 rounded-2xl text-white placeholder-white/30 backdrop-blur-xl focus:border-white/60 focus:outline-none transition shadow-2xl"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!topic.trim()}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white text-black rounded-xl hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
              >
                <Search size={20} />
              </button>
            </form>
            
            <div className="flex gap-3 justify-center mt-6 flex-wrap">
              {['String Theory', 'Dadaism', 'Stoicism', 'CRISPR'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={async () => { 
                    setTopic(suggestion); 
                    setLoading(true);
                    setError("");
                    try {
                      if (!started) {
                        await audioEngine.initialize();
                        setStarted(true);
                        setMuted(false);
                      }
                      const newGraph = await generateKnowledgeGraph(suggestion);
                      setGraph(newGraph);
                      document.body.style.backgroundColor = newGraph.visualParams.backgroundColor;
                      if (!muted) {
                        audioEngine.applyParams(newGraph.audioParams);
                      }
                    } catch (err) {
                      console.error(err);
                      setError("Failed to explore this topic. It might be too abstract or the models missed it. Try again.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-4 py-2 border border-white/10 rounded-full text-xs hover:bg-white/10 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            
            {error && <p className="text-red-400 mt-4 text-sm bg-red-950/50 p-3 rounded-lg border border-red-500/20">{error}</p>}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 size={48} className="animate-spin text-white opacity-80" />
            <p className="mt-6 text-xl tracking-widest uppercase font-mono text-white/80 animate-pulse">
              Synthesizing Universe...
            </p>
          </div>
        )}

        {/* Navigation bottom bar when exploring */}
        {graph && !loading && (
          <div className="mt-auto pointer-events-auto">
            <div className="glass-panel p-6 rounded-2xl max-w-3xl border border-white/10 flex flex-col md:flex-row gap-6 justify-between items-center bg-black/40">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1 font-mono text-white flex items-center gap-2">
                  {graph.topic}
                </h3>
                <p className="opacity-70 text-sm">
                  Generated audio mood: <span className="text-white font-medium">{graph.audioParams.mood}</span>
                </p>
              </div>
              
              <form onSubmit={handleSearch} className="flex relative w-full md:w-96">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Explore something else..."
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/50 text-white placeholder-white/40"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg">
                  <Search size={16} />
                </button>
              </form>
            </div>
          </div>
        )}
        
      </div>
    </>
  );
}

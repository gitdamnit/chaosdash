import React, { useState, useRef, useCallback } from 'react';
import { useApp, Plant } from '@/lib/useAppState';
import { Droplet, Plus, Trash2, Sun, SunMedium, Cloud, Lightbulb, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LIGHT_LEVELS = [
  { id: 'low', label: 'Low light', icon: Cloud, color: 'text-slate-500', bg: 'bg-slate-500/10', desc: 'Shade or far from windows' },
  { id: 'medium', label: 'Indirect', icon: SunMedium, color: 'text-yellow-500', bg: 'bg-yellow-500/10', desc: 'Bright room, no direct sun' },
  { id: 'high', label: 'Bright indirect', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-500/10', desc: 'Near a window' },
  { id: 'direct', label: 'Direct sun', icon: Sun, color: 'text-red-500', bg: 'bg-red-500/10', desc: 'Full sun in window' },
];

function LightMeter({ onResult }: { onResult: (level: string, lux: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [brightness, setBrightness] = useState<number | null>(null);
  const [error, setError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>();

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setStreaming(true);
      measure();
    } catch {
      setError('Camera access denied. Check browser permissions and try again.');
    }
  };

  const measure = () => {
    const loop = () => {
      if (!videoRef.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      canvasRef.current.width = 32;
      canvasRef.current.height = 32;
      ctx.drawImage(videoRef.current, 0, 0, 32, 32);
      const data = ctx.getImageData(0, 0, 32, 32).data;
      let total = 0;
      for (let i = 0; i < data.length; i += 4) {
        total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avg = total / (data.length / 4);
      setBrightness(Math.round(avg));
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
  };

  const stop = () => {
    cancelAnimationFrame(animRef.current!);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setStreaming(false);
  };

  const capture = () => {
    if (brightness === null) return;
    const lux = Math.round((brightness / 255) * 80000);
    const level = brightness < 40 ? 'low' : brightness < 100 ? 'medium' : brightness < 170 ? 'high' : 'direct';
    onResult(level, lux);
    stop();
  };

  const getLevelFromBrightness = (b: number) => b < 40 ? LIGHT_LEVELS[0] : b < 100 ? LIGHT_LEVELS[1] : b < 170 ? LIGHT_LEVELS[2] : LIGHT_LEVELS[3];
  const currentLevel = brightness !== null ? getLevelFromBrightness(brightness) : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Point your camera at the spot where your plant sits. We'll estimate light level from image brightness.</p>
      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}
      {!streaming ? (
        <button onClick={startCamera} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
          <Camera className="w-4 h-4" /> Open Camera
        </button>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-w-sm">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            {currentLevel && (
              <div className={`absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-lg px-3 py-2 ${currentLevel.bg} backdrop-blur-sm`}>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${currentLevel.color}`}>{currentLevel.label}</p>
                  <p className="text-xs text-muted-foreground">Raw brightness: {brightness}/255</p>
                </div>
                <div className="w-16 h-2 bg-black/30 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${((brightness || 0) / 255) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-2">
            <button onClick={capture} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
              Save reading
            </button>
            <button onClick={stop} className="bg-secondary text-muted-foreground px-4 py-2 rounded-lg text-sm">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Plants() {
  const { plants, setPlants } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [newPlant, setNewPlant] = useState({ name: '', interval: 7, notes: '', lightLevel: 'medium' as Plant['lightLevel'] });
  const [lightMeterFor, setLightMeterFor] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlant.name) return;
    setPlants([...plants, { id: Date.now().toString(), name: newPlant.name, lastWatered: null, waterIntervalDays: newPlant.interval, notes: newPlant.notes, lightLevel: newPlant.lightLevel }]);
    setIsAdding(false);
    setNewPlant({ name: '', interval: 7, notes: '', lightLevel: 'medium' });
  };

  const waterPlant = (id: string) => setPlants(plants.map(p => p.id === id ? { ...p, lastWatered: Date.now() } : p));
  const deletePlant = (id: string) => setPlants(plants.filter(p => p.id !== id));

  const setLight = (id: string, level: string) => {
    setPlants(plants.map(p => p.id === id ? { ...p, lightLevel: level as any } : p));
    setLightMeterFor(null);
  };

  const getStatus = (plant: Plant) => {
    if (!plant.lastWatered) return { text: 'Needs water!', color: 'text-destructive bg-destructive/10' };
    const daysSince = Math.floor((Date.now() - plant.lastWatered) / 86400000);
    const daysLeft = plant.waterIntervalDays - daysSince;
    if (daysLeft < 0) return { text: `Overdue by ${Math.abs(daysLeft)}d`, color: 'text-destructive bg-destructive/10' };
    if (daysLeft === 0) return { text: 'Water today', color: 'text-orange-500 bg-orange-500/10' };
    return { text: `In ${daysLeft} days`, color: 'text-green-500 bg-green-500/10' };
  };

  const lightInfo = (level?: string) => LIGHT_LEVELS.find(l => l.id === level) || LIGHT_LEVELS[1];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Plant Tracker</h1>
          <p className="text-muted-foreground">Keep your green friends alive. Use the light meter to find the right spot.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Plant
        </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-card p-6 rounded-xl border border-primary/30 shadow-md">
            <form onSubmit={handleAdd} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1">Plant Name</label>
                <input type="text" value={newPlant.name} onChange={e => setNewPlant({ ...newPlant, name: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Watering every (days)</label>
                  <input type="number" min="1" value={newPlant.interval} onChange={e => setNewPlant({ ...newPlant, interval: parseInt(e.target.value) })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Light level</label>
                  <select value={newPlant.lightLevel} onChange={e => setNewPlant({ ...newPlant, lightLevel: e.target.value as any })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none">
                    {LIGHT_LEVELS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input type="text" value={newPlant.notes} onChange={e => setNewPlant({ ...newPlant, notes: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Indirect sunlight" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm">Save</button>
                <button type="button" onClick={() => setIsAdding(false)} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium text-sm">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plants.map(plant => {
          const status = getStatus(plant);
          const light = lightInfo(plant.lightLevel);
          const LightIcon = light.icon;
          return (
            <div key={plant.id} className="bg-card rounded-xl border border-border overflow-hidden flex flex-col group relative">
              <button onClick={() => deletePlant(plant.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="p-5 flex-1">
                <h3 className="font-bold text-lg mb-1 pr-6">{plant.name}</h3>
                <div className="flex gap-2 flex-wrap mb-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${status.color}`}>{status.text}</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${light.bg} ${light.color}`}>
                    <LightIcon className="w-3 h-3" /> {light.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{plant.notes || 'No notes.'}</p>
                <p className="text-xs text-muted-foreground/60">Waters every {plant.waterIntervalDays} days</p>
              </div>

              <div className="border-t border-border">
                {lightMeterFor === plant.id ? (
                  <div className="p-4">
                    <LightMeter onResult={(level) => setLight(plant.id, level)} />
                    <button onClick={() => setLightMeterFor(null)} className="mt-2 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setLightMeterFor(plant.id)} className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" /> Measure light level
                  </button>
                )}
              </div>

              <button onClick={() => waterPlant(plant.id)} className="w-full py-4 bg-secondary/50 hover:bg-blue-500/10 text-blue-500 hover:text-blue-600 font-medium text-sm border-t border-border flex items-center justify-center gap-2 transition-colors">
                <Droplet className="w-4 h-4" /> Just Watered
              </button>
            </div>
          );
        })}
        {plants.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">No plants yet. Add your first green friend!</div>
        )}
      </div>
    </div>
  );
}

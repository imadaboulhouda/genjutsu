import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Swords, Plus, LogIn, Sparkles, Zap, Users } from 'lucide-react';
import FloatingParticles from './FloatingParticles';

interface HomeScreenProps {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
}

const HomeScreen = ({ onCreateRoom, onJoinRoom }: HomeScreenProps) => {
  const [nickname, setNickname] = useState(() => localStorage.getItem('genjutsu-play-name') || '');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'home' | 'join'>('home');

  const handleCreate = () => {
    if (!nickname.trim()) return;
    localStorage.setItem('genjutsu-play-name', nickname.trim());
    onCreateRoom(nickname.trim());
  };

  const handleJoin = () => {
    if (!nickname.trim() || roomCode.length < 6) return;
    localStorage.setItem('genjutsu-play-name', nickname.trim());
    onJoinRoom(roomCode.trim(), nickname.trim());
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Floating particles */}
      <FloatingParticles />
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-foreground/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-foreground/[0.02] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-foreground/[0.02] rounded-full blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md space-y-10 text-center relative z-10"
      >
        {/* Logo */}
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex items-center justify-center gap-3"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-foreground/20 rounded-2xl blur-xl" />
              <div className="relative bg-card glass-border rounded-2xl p-3 text-primary">
                <Swords className="h-10 w-10" />
              </div>
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-black tracking-tight gradient-text"
          >
            GENJUTSU PLAY
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-sm"
          >
            Play mini games with friends, peer-to-peer
          </motion.p>
        </div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass glass-border rounded-2xl p-6 space-y-5 glow-sm"
        >
          <Input
            placeholder="Enter your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className="h-13 text-center text-lg bg-secondary/60 border-border/50 focus:border-foreground/30 focus:glow-sm transition-all placeholder:text-muted-foreground/60"
          />

          {mode === 'home' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <Button
                onClick={handleCreate}
                disabled={!nickname.trim()}
                className="flex-1 h-14 text-base font-semibold gap-2 glow-sm hover:glow-md transition-shadow"
              >
                <Plus className="h-5 w-5" />
                Create Room
              </Button>
              <Button
                onClick={() => setMode('join')}
                variant="outline"
                disabled={!nickname.trim()}
                className="flex-1 h-14 text-base font-semibold gap-2 border-border/50 hover:bg-accent hover:border-foreground/20 transition-all"
              >
                <LogIn className="h-5 w-5" />
                Join Room
              </Button>
            </motion.div>
          )}

          {mode === 'join' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <Input
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="h-13 text-center text-xl font-mono tracking-[0.3em] bg-secondary/60 border-border/50 focus:border-foreground/30 transition-all placeholder:tracking-normal placeholder:text-base placeholder:font-sans"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setMode('home'); setRoomCode(''); }}
                  className="flex-1 h-12 border-border/50"
                >
                  Back
                </Button>
                <Button
                  onClick={handleJoin}
                  disabled={!roomCode.trim() || roomCode.length < 6}
                  className="flex-1 h-12 font-semibold glow-sm hover:glow-md transition-shadow"
                >
                  Join
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Features row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-6 text-muted-foreground"
        >
          <div className="flex items-center gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>14 Games</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-xs">
            <Zap className="h-3.5 w-3.5" />
            <span>Real-time</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" />
            <span>P2P</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomeScreen;

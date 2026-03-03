import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Copy, LogOut, MessageCircle, X, Loader2, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { ConnectionStatus, GameId, ChatMessage } from '@/types/game';
import ChatPanel from './ChatPanel';
import GameSelector from './GameSelector';
import ErrorBoundary from './ErrorBoundary';
import TicTacToe from './games/TicTacToe';
import RockPaperScissors from './games/RockPaperScissors';
import ConnectFour from './games/ConnectFour';
import ChessGame from './games/ChessGame';
import SnakeGame from './games/SnakeGame';
import PongGame from './games/PongGame';
import WordGuessing from './games/WordGuessing';
import DrawingGuessing from './games/DrawingGuessing';
import TriviaBattle from './games/TriviaBattle';
import MemoryMatch from './games/MemoryMatch';
import CheckersGame from './games/CheckersGame';
import BattleshipGame from './games/BattleshipGame';
import Game2048 from './games/Game2048';
import TypingRace from './games/TypingRace';
import { toast } from 'sonner';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface RoomViewProps {
  status: ConnectionStatus;
  roomCode: string;
  myName: string;
  peerName: string;
  messages: ChatMessage[];
  activeGame: GameId | null;
  gameState: any;
  pendingInvite: GameId | null;
  isInviter: boolean;
  peerTyping: boolean;
  isHost: boolean;
  peerDisconnected: boolean;
  sendChat: (text: string) => void;
  sendGameInvite: (gameId: GameId) => void;
  acceptGameInvite: () => void;
  declineGameInvite: () => void;
  sendGameState: (gameId: GameId, state: any) => void;
  sendTyping: (isTyping: boolean) => void;
  leaveGame: () => void;
  leaveRoom: () => void;
}

const GAME_NAMES: Record<GameId, string> = {
  'tic-tac-toe': 'Tic Tac Toe',
  'rock-paper-scissors': 'Rock Paper Scissors',
  'connect-four': 'Connect Four',
  'chess': 'Chess',
  'snake': 'Snake',
  'pong': 'Pong',
  'word-guessing': 'Word Guessing',
  'drawing-guessing': 'Draw & Guess',
  'trivia-battle': 'Trivia Battle',
  'memory-match': 'Memory Match',
  'checkers': 'Checkers',
  'battleship': 'Battleship',
  '2048-battle': '2048 Battle',
  'typing-race': 'Typing Race',
};

const RoomView = (props: RoomViewProps) => {
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenCountRef = useRef(0);
  const { enabled: soundEnabled, toggle: toggleSound, play } = useSoundEffects();

  const {
    status, roomCode, myName, peerName, messages,
    activeGame, gameState, pendingInvite, isInviter,
    peerTyping, isHost, peerDisconnected,
    sendChat, sendGameInvite, acceptGameInvite,
    declineGameInvite, sendGameState, sendTyping,
    leaveGame, leaveRoom,
  } = props;

  // Track unread messages - only count incoming messages
  useEffect(() => {
    const incomingCount = messages.filter(m => !m.isMe).length;
    if (incomingCount > lastSeenCountRef.current) {
      setUnreadCount(prev => prev + (incomingCount - lastSeenCountRef.current));
      play('message');
    }
    lastSeenCountRef.current = incomingCount;
  }, [messages, play]);

  // Clear unread when chat is visible (desktop sidebar always visible on md+)
  const handleOpenChat = () => {
    setShowChat(true);
    setUnreadCount(0);
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  // Clear unread on desktop where chat sidebar is always visible
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = () => { if (mq.matches) setUnreadCount(0); };
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [messages]);

  // Sound for peer events
  useEffect(() => {
    if (peerDisconnected) play('leave');
  }, [peerDisconnected, play]);

  useEffect(() => {
    if (pendingInvite && !isInviter) play('invite');
  }, [pendingInvite, isInviter, play]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
    play('click');
  };

  const onSendState = useCallback((state: any) => {
    if (activeGame) sendGameState(activeGame, state);
  }, [activeGame, sendGameState]);

  const handleSendChat = useCallback((text: string) => {
    sendChat(text);
    play('click');
  }, [sendChat, play]);

  const handleSelectGame = useCallback((gameId: GameId) => {
    sendGameInvite(gameId);
    play('click');
  }, [sendGameInvite, play]);

  if (status === 'creating' || status === 'joining') {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-foreground/10 rounded-full blur-xl animate-pulse" />
            <Loader2 className="relative h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground">Connecting...</span>
        </motion.div>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'linear-gradient(hsl(0 0% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 50%) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-8 relative z-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold gradient-text">Waiting for a friend...</h2>
            <p className="text-sm text-muted-foreground">Share this code to invite someone</p>
          </div>
          <button
            onClick={copyRoomCode}
            className="group inline-flex items-center gap-3 glass glass-border rounded-2xl px-8 py-5 font-mono text-4xl tracking-[0.2em] hover:glow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {roomCode}
            <Copy className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
          <div className="flex items-center justify-center gap-2 text-muted-foreground/60">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/30" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground/50" />
            </span>
            <span className="text-sm">Listening for connections...</span>
          </div>
          <Button variant="ghost" onClick={leaveRoom} className="text-muted-foreground hover:text-foreground">Cancel</Button>
        </motion.div>
      </div>
    );
  }

  const gameProps = {
    isHost,
    peerState: gameState,
    onSendState,
    onLeaveGame: leaveGame,
    myName,
    peerName,
  };

  const renderGame = () => {
    const GameComponent = {
      'tic-tac-toe': TicTacToe,
      'rock-paper-scissors': RockPaperScissors,
      'connect-four': ConnectFour,
      'chess': ChessGame,
      'snake': SnakeGame,
      'pong': PongGame,
      'word-guessing': WordGuessing,
      'drawing-guessing': DrawingGuessing,
      'trivia-battle': TriviaBattle,
      'memory-match': MemoryMatch,
      'checkers': CheckersGame,
      'battleship': BattleshipGame,
      '2048-battle': Game2048,
      'typing-race': TypingRace,
    }[activeGame!];

    if (!GameComponent) return null;

    return (
      <ErrorBoundary key={activeGame}>
        <GameComponent {...gameProps} />
      </ErrorBoundary>
    );
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border/50 px-4 py-2.5 glass shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={copyRoomCode} className="font-mono text-[11px] bg-secondary/80 glass-border px-2.5 py-1 rounded-lg hover:bg-accent transition-all hover:scale-105 active:scale-95">{roomCode}</button>
          <div className="flex items-center gap-1.5">
            <span className={`relative flex h-2 w-2`}>
              {!peerDisconnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/50" />}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${peerDisconnected ? 'bg-destructive' : 'bg-success'}`} />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground/90">{myName}</span>
          <span className="text-muted-foreground/50 text-xs">vs</span>
          <span className="font-medium text-foreground/90">{peerName || '...'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleSound} title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden relative h-8 w-8" onClick={handleOpenChat}>
            <MessageCircle className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={leaveRoom} className="h-8 w-8 text-muted-foreground hover:text-destructive"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      {/* Peer disconnected banner */}
      <AnimatePresence>
        {peerDisconnected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-destructive/30 bg-destructive/10 overflow-hidden shrink-0"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive"><strong>{peerName}</strong> has left the room. You should leave too.</span>
              </div>
              <Button size="sm" variant="destructive" onClick={leaveRoom}>Leave Room</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingInvite && !isInviter && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-border bg-secondary/50 overflow-hidden shrink-0">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm"><strong>{peerName}</strong> wants to play <strong>{GAME_NAMES[pendingInvite]}</strong></span>
              <div className="flex gap-2">
                <Button size="sm" onClick={acceptGameInvite}>Play</Button>
                <Button size="sm" variant="ghost" onClick={declineGameInvite}>Decline</Button>
              </div>
            </div>
          </motion.div>
        )}
        {pendingInvite && isInviter && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-border bg-secondary/50 overflow-hidden shrink-0">
            <div className="flex items-center justify-center gap-2 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Waiting for {peerName} to accept {GAME_NAMES[pendingInvite]}...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <main className="flex-1 overflow-auto">
          {activeGame ? renderGame() : <GameSelector onSelectGame={handleSelectGame} disabled={!!pendingInvite || peerDisconnected} />}
        </main>
        <aside className="hidden md:flex w-80 border-l border-border flex-col min-h-0">
          <ChatPanel messages={messages} onSendMessage={handleSendChat} peerTyping={peerTyping} onTyping={sendTyping} />
        </aside>
      </div>

      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed inset-0 top-14 z-50 bg-background md:hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-2 shrink-0">
              <span className="font-medium text-sm">Chat</span>
              <Button variant="ghost" size="icon" onClick={handleCloseChat}><X className="h-4 w-4" /></Button>
            </div>
            <ChatPanel messages={messages} onSendMessage={handleSendChat} peerTyping={peerTyping} onTyping={sendTyping} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomView;

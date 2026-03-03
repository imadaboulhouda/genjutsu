import { useState, useCallback, useRef, useEffect } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { ChatMessage, ConnectionStatus, GameId, PeerMessage } from '@/types/game';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function usePeerConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [roomCode, setRoomCode] = useState('');
  const [myName, setMyName] = useState('');
  const [peerName, setPeerName] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [pendingInvite, setPendingInvite] = useState<GameId | null>(null);
  const [isInviter, setIsInviter] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [peerDisconnected, setPeerDisconnected] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const myNameRef = useRef('');

  const send = useCallback((msg: PeerMessage) => {
    if (connRef.current?.open) {
      connRef.current.send(msg);
    }
  }, []);

  const setupConnection = useCallback((conn: DataConnection) => {
    connRef.current = conn;

    conn.on('open', () => {
      setStatus('connected');
      conn.send({ type: 'player-info', name: myNameRef.current } as PeerMessage);
    });

    conn.on('data', (data) => {
      const msg = data as PeerMessage;
      switch (msg.type) {
        case 'chat':
          setMessages(prev => [...prev, { ...msg, isMe: false }]);
          break;
        case 'player-info':
          setPeerName(msg.name);
          break;
        case 'game-invite':
          setPendingInvite(msg.gameId);
          setIsInviter(false);
          break;
        case 'game-accept':
          setActiveGame(msg.gameId);
          setPendingInvite(null);
          setIsInviter(false);
          setGameState(null);
          break;
        case 'game-decline':
          setPendingInvite(null);
          setIsInviter(false);
          break;
        case 'game-state':
          setGameState(msg.state);
          break;
        case 'typing':
          setPeerTyping(msg.isTyping);
          break;
        case 'leave-game':
          setActiveGame(null);
          setGameState(null);
          break;
      }
    });

    conn.on('close', () => {
      setPeerDisconnected(true);
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
    });
  }, []);

  const createRoom = useCallback((name: string) => {
    myNameRef.current = name;
    setMyName(name);
    setIsHost(true);
    const code = generateRoomCode();
    setRoomCode(code);
    setStatus('creating');

    const peer = new Peer(`miniplay-${code}`);
    peerRef.current = peer;

    peer.on('open', () => {
      setStatus('waiting');
    });

    peer.on('connection', (conn) => {
      setupConnection(conn);
    });

    peer.on('error', (err: any) => {
      console.error('Peer error:', err);
      if (err.type === 'unavailable-id') {
        peer.destroy();
        const newCode = generateRoomCode();
        setRoomCode(newCode);
        const newPeer = new Peer(`miniplay-${newCode}`);
        peerRef.current = newPeer;
        newPeer.on('open', () => setStatus('waiting'));
        newPeer.on('connection', (conn) => setupConnection(conn));
      }
    });
  }, [setupConnection]);

  const joinRoom = useCallback((code: string, name: string) => {
    myNameRef.current = name;
    setMyName(name);
    setIsHost(false);
    setRoomCode(code.toUpperCase());
    setStatus('joining');

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', () => {
      const conn = peer.connect(`miniplay-${code.toUpperCase()}`);
      setupConnection(conn);
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setStatus('disconnected');
    });
  }, [setupConnection]);

  const sendChat = useCallback((text: string) => {
    const id = Math.random().toString(36).slice(2);
    const timestamp = Date.now();
    const msg: PeerMessage = { type: 'chat', text, sender: myNameRef.current, timestamp, id };
    send(msg);
    setMessages(prev => [...prev, { id, text, sender: myNameRef.current, timestamp, isMe: true }]);
  }, [send]);

  const sendGameInvite = useCallback((gameId: GameId) => {
    send({ type: 'game-invite', gameId });
    setPendingInvite(gameId);
    setIsInviter(true);
  }, [send]);

  const acceptGameInvite = useCallback(() => {
    if (pendingInvite) {
      send({ type: 'game-accept', gameId: pendingInvite });
      setActiveGame(pendingInvite);
      setPendingInvite(null);
      setGameState(null);
    }
  }, [send, pendingInvite]);

  const declineGameInvite = useCallback(() => {
    send({ type: 'game-decline' });
    setPendingInvite(null);
  }, [send]);

  const sendGameState = useCallback((gameId: GameId, state: any) => {
    send({ type: 'game-state', gameId, state });
  }, [send]);

  const sendTyping = useCallback((isTyping: boolean) => {
    send({ type: 'typing', isTyping });
  }, [send]);

  const leaveGame = useCallback(() => {
    send({ type: 'leave-game' });
    setActiveGame(null);
    setGameState(null);
  }, [send]);

  const leaveRoom = useCallback(() => {
    connRef.current?.close();
    peerRef.current?.destroy();
    peerRef.current = null;
    connRef.current = null;
    setStatus('disconnected');
    setRoomCode('');
    setPeerName('');
    setMessages([]);
    setActiveGame(null);
    setGameState(null);
    setPendingInvite(null);
    setIsHost(false);
  }, []);

  useEffect(() => {
    return () => {
      peerRef.current?.destroy();
    };
  }, []);

  return {
    status, roomCode, myName, peerName, messages,
    activeGame, gameState, pendingInvite, isInviter,
    peerTyping, isHost, peerDisconnected,
    createRoom, joinRoom, sendChat, sendGameInvite,
    acceptGameInvite, declineGameInvite, sendGameState,
    sendTyping, leaveGame, leaveRoom, setActiveGame,
  };
}

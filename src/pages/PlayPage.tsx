import Navbar from '@/components/Navbar';
import HomeScreen from '@/components/play/HomeScreen';
import RoomView from '@/components/play/RoomView';
import { useSupabaseConnection } from '@/hooks/useSupabaseConnection';
import { Helmet } from 'react-helmet-async';

const PlayPage = () => {
    const peer = useSupabaseConnection();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Helmet>
                <title>Play | Genjutsu</title>
                <meta name="description" content="Play mini games with friends in real-time." />
            </Helmet>
            <Navbar />
            <main className="flex-1 flex flex-col">
                {peer.status === 'disconnected' ? (
                    <HomeScreen onCreateRoom={peer.createRoom} onJoinRoom={peer.joinRoom} />
                ) : (
                    <RoomView {...peer} />
                )}
            </main>
        </div>
    );
};

export default PlayPage;

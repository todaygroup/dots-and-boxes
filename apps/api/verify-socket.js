const io = require('socket.io-client');
const fetch = require('node-fetch'); // Assuming v2 or globally available, fallback to built-in if Node 18+

// If node-fetch is not available, we use the global fetch (Node 18+)
const _fetch = global.fetch || require('node-fetch');

async function verify() {
    // 1. Create a session via HTTP
    console.log('Creating session via HTTP...');
    let session;
    try {
        const res = await _fetch('http://localhost:4000/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ width: 3, height: 3 })
        });
        if (!res.ok) throw new Error(res.statusText);
        session = await res.json();
        console.log('Session Created:', session.id);
    } catch (e) {
        console.error('HTTP Create Failed:', e);
        process.exit(1);
    }

    // 2. Connect via WebSocket
    console.log('Connecting via WebSocket...');
    const socket = io('http://localhost:4000');

    socket.on('connect', () => {
        console.log('Connected to WebSocket');

        console.log('Joining session as Player A...');
        socket.emit('join_session', { sessionId: session.id, playerId: 'socket-player-A' });

        setTimeout(() => {
            console.log('Joining session as Player B...');
            socket.emit('join_session', { sessionId: session.id, playerId: 'socket-player-B' });
        }, 500);
    });

    socket.on('session_state', (data) => {
        console.log('Received session_state update. Status:', data.status);
        console.log('Current Player:', data.board.currentPlayer);

        // If we joined successfully and it's our turn (or anyone's), try making a move
        // Ideally we should wait for a specific state, but for verification let's just trigger a move
        // We need to be the current player.
        // Let's force a move as Player 0 (default current) via HTTP to see if we get update
        // Or send via Socket if implemented.

        if (data.status === 'PLAYING' && data.board.currentPlayer === 0 && data.board.edges.length === 0) {
            console.log('Sending make_move via WebSocket...');
            socket.emit('make_move', {
                sessionId: session.id,
                move: { type: 'vertical', row: 0, col: 0, playerIndex: 0 }
            });
        } else if (data.board.edges.length > 0) {
            console.log('Move verified! Edge added:', data.board.edges[0]);
            socket.disconnect();
            console.log('Verification Success');
            process.exit(0);
        }
    });

    socket.on('error', (err) => {
        console.error('WebSocket Error:', err);
        process.exit(1);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected');
    });

    // Timeout
    setTimeout(() => {
        console.error('Timeout waiting for verification');
        process.exit(1);
    }, 5000);
}

verify();

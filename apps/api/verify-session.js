async function verify() {
    try {
        console.log('Creating session...');
        const res = await fetch('http://localhost:4000/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ width: 3, height: 3 })
        });

        if (!res.ok) {
            throw new Error(`Create failed: ${res.status} ${res.statusText}`);
        }

        const session = await res.json();
        console.log('Session Created:', session.id);

        if (!session.id) throw new Error('No session ID');

        // Join Player A
        console.log('Joining Player A...');
        const joinResA = await fetch(`http://localhost:4000/sessions/${session.id}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: 'player-A' })
        });
        if (!joinResA.ok) throw new Error('Join A failed');
        console.log('Player A Joined');

        // Join Player B
        console.log('Joining Player B...');
        const joinResB = await fetch(`http://localhost:4000/sessions/${session.id}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: 'player-B' })
        });
        if (!joinResB.ok) throw new Error('Join B failed');
        console.log('Player B Joined');

        // Make Move
        console.log('Making Move...');
        const moveRes = await fetch(`http://localhost:4000/sessions/${session.id}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'horizontal', row: 0, col: 0, playerIndex: 0 })
        });
        if (!moveRes.ok) throw new Error(`Move failed: ${moveRes.status}`);
        const movedSession = await moveRes.json();
        console.log('Move Successful. Edges:', movedSession.board.edges);

        console.log('Verification Success');
    } catch (e) {
        console.error('Verification Failed:', e);
        process.exit(1);
    }
}
verify();

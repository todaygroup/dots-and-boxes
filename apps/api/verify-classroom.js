const fetch = global.fetch || require('node-fetch');
const io = require('socket.io-client');

const API_URL = 'http://localhost:4000';

async function verify() {
    console.log('--- Verifying Classroom Mode ---');

    // 1. Create Class (Teacher)
    console.log('1. Creating Class...');
    const createRes = await fetch(`${API_URL}/classrooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: 'teacher-123' })
    });
    if (!createRes.ok) throw new Error('Failed to create class');
    const classSession = await createRes.json();
    console.log('Class Code:', classSession.code);

    // 2. Connect Teacher Socket
    const teacherSocket = io(API_URL);
    teacherSocket.emit('join_class', { code: classSession.code, name: 'Teacher', isTeacher: true });

    teacherSocket.on('class_updated', (data) => {
        console.log(`[Teacher] Class Updated: ${data.students.length} students`);
        if (data.students.length === 2 && data.status === 'LOBBY') {
            console.log('3. Two students joined. Starting game...');
            teacherSocket.emit('start_class_game', { code: classSession.code });
        }
    });

    // 3. Join Students
    setTimeout(async () => {
        const s1 = io(API_URL);
        s1.emit('join_class', { code: classSession.code, name: 'Student A' });
        s1.on('joined_class', (data) => console.log('[Student A] Joined Class:', data));
        s1.on('game_started', (data) => {
            console.log('[Student A] Game Started! Opponent:', data.opponent, 'Session:', data.sessionId);
            s1.disconnect();
        });

        const s2 = io(API_URL);
        s2.emit('join_class', { code: classSession.code, name: 'Student B' });
        s2.on('joined_class', (data) => console.log('[Student B] Joined Class:', data));
        s2.on('game_started', (data) => {
            console.log('[Student B] Game Started! Opponent:', data.opponent, 'Session:', data.sessionId);
            s2.disconnect();
            teacherSocket.disconnect();
            console.log('Verification Success');
            process.exit(0);
        });
    }, 1000);

    // Timeout
    setTimeout(() => {
        console.error('Timeout');
        process.exit(1);
    }, 10000);
}

verify();

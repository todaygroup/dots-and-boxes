const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function createSession(width: number, height: number, mode: 'ONLINE' = 'ONLINE') {
    const res = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ width, height }) // mode is not used by backend yet for creation logic diffs, but good to have
    });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
}

// Classroom API
export interface ClassSession {
    code: string;
    teacherId: string;
    students: { id: string, name: string }[];
    status: 'LOBBY' | 'PLAYING' | 'FINISHED';
}

export const createClass = async (teacherId: string): Promise<ClassSession> => {
    const res = await fetch(`${API_URL}/classrooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId }),
    });
    if (!res.ok) throw new Error('Failed to create class');
    return res.json();
};

export const getClass = async (code: string): Promise<ClassSession> => {
    const res = await fetch(`${API_URL}/classrooms/${code}`);
    if (!res.ok) throw new Error('Class not found');
    return res.json();
};

export async function joinSession(sessionId: string, playerId: string) {
    const res = await fetch(`${API_URL}/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to join session');
    }
    return res.json();
}

export async function getSession(sessionId: string) {
    const res = await fetch(`${API_URL}/sessions/${sessionId}`);
    if (!res.ok) throw new Error('Session not found');
    return res.json();
}

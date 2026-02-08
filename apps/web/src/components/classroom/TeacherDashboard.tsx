'use client';

import React, { useState, useEffect } from 'react';
import { createClass, ClassSession } from '../../lib/api';
import { socket } from '../../lib/socket';
import { Users, Play, ArrowLeft } from 'lucide-react';

interface TeacherDashboardProps {
    onBack: () => void;
}

export const TeacherDashboard = ({ onBack }: TeacherDashboardProps) => {
    const [session, setSession] = useState<ClassSession | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Auto-create class on mount
        const initClass = async () => {
            try {
                const newClass = await createClass('teacher-' + Math.random().toString(36).substr(2, 5));
                setSession(newClass);

                socket.connect();
                socket.emit('join_class', { code: newClass.code, name: 'Teacher', isTeacher: true });

                socket.on('class_updated', (updatedSession: ClassSession) => {
                    console.log('Class updated:', updatedSession);
                    setSession(updatedSession);
                });

            } catch (e: any) {
                setError(e.message);
            }
        };

        if (!session) {
            initClass();
        }

        return () => {
            socket.off('class_updated');
            // socket.disconnect(); // Don't disconnect here if we want to keep it alive? 
            // Actually usually we disconnect when leaving the screen.
            socket.disconnect();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleStartGame = () => {
        if (!session) return;
        socket.emit('start_class_game', { code: session.code });
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-red-500 gap-4">
                <p>Error: {error}</p>
                <button onClick={onBack} className="text-blue-500 underline">Back</button>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                Creating Classroom...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <header className="max-w-4xl mx-auto mb-12 flex items-center justify-between">
                <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 transition">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Menu
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
            </header>

            <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Class Code Card */}
                <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center text-center border-t-4 border-blue-500">
                    <h2 className="text-gray-500 font-semibold mb-2 uppercase tracking-wide">Class Code</h2>
                    <div className="text-6xl font-black text-blue-600 tracking-widest mb-4 font-mono select-all">
                        {session.code}
                    </div>
                    <p className="text-gray-400 text-sm">Share this code with your students</p>
                </div>

                {/* Status Card */}
                <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col justify-between border-t-4 border-purple-500">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-gray-700 font-bold text-xl flex items-center">
                                <Users className="w-6 h-6 mr-2 text-purple-500" />
                                Students Joined
                            </h2>
                            <span className="bg-purple-100 text-purple-700 font-bold px-3 py-1 rounded-full">
                                {session.students.length}
                            </span>
                        </div>
                        <div className="h-48 overflow-y-auto pr-2 space-y-2">
                            {session.students.length === 0 ? (
                                <p className="text-gray-400 italic text-center py-8">Waiting for students to join...</p>
                            ) : (
                                session.students.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium text-gray-700">{s.name}</span>
                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleStartGame}
                        disabled={session.students.length < 2}
                        className={`mt-6 w-full py-4 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${session.students.length < 2
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-green-500 text-white hover:bg-green-600 hover:scale-[1.02] shadow-md'
                            }`}
                    >
                        <Play className="w-6 h-6 mr-2" />
                        Start Pair Game
                    </button>
                    {session.students.length < 2 && (
                        <p className="text-xs text-center text-red-400 mt-2">Need at least 2 students to start</p>
                    )}
                </div>
            </main>
        </div>
    );
};


import React, { useState } from 'react';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import { useApp } from '../../hooks/useApp.ts';
import { X, Activity, Scale, FileText, Save, History, TrendingUp } from 'lucide-react';

interface CoachDashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CoachDashboardModal: React.FC<CoachDashboardModalProps> = ({ isOpen, onClose }) => {
    const { profile, deviceMetrics, updateUserProfile, translate } = useApp();
    const [note, setNote] = useState('');
    const [activeTab, setActiveTab] = useState<'stats' | 'notes'>('stats');

    if (!isOpen || !profile) return null;

    const handleSaveNote = () => {
        if (!note.trim()) return;
        const newNote = {
            date: new Date().toISOString(),
            trainerName: 'Head Coach', // In a real app this would be the logged-in coach
            content: note
        };
        updateUserProfile({ coach_notes: [...(profile.coach_notes || []), newNote] });
        setNote('');
    };

    const weightHistory = profile.weight_history?.slice(-5) || [];

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center p-4 animate-fadeIn">
            <Card className="max-w-4xl w-full h-[85vh] flex flex-col relative border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.1)] overflow-hidden">
                {/* Tactical Header */}
                <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-widest flex items-center">
                            <Activity className="w-6 h-6 text-blue-500 mr-3 animate-pulse"/>
                            {translate('coach.dashboard.title')}
                        </h2>
                        <p className="text-blue-400 font-mono text-xs mt-1">ID: {profile.id?.substring(0,8).toUpperCase()} // {translate('coach.dashboard.status')}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
                        <X className="w-8 h-8"/>
                    </button>
                </div>

                <div className="flex gap-4 mb-6">
                    <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 font-bold uppercase tracking-wider rounded-lg transition-colors ${activeTab === 'stats' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                        {translate('coach.dashboard.tab.stats')}
                    </button>
                    <button onClick={() => setActiveTab('notes')} className={`flex-1 py-3 font-bold uppercase tracking-wider rounded-lg transition-colors ${activeTab === 'notes' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                        {translate('coach.dashboard.tab.notes')}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === 'stats' ? (
                        <div className="space-y-6">
                            {/* Live Vitals */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-700">
                                    <p className="text-xs text-gray-500 uppercase font-bold">{translate('coach.dashboard.metric.hr')}</p>
                                    <p className="text-3xl font-mono text-white mt-1">{deviceMetrics.heartRate} <span className="text-sm text-gray-400">BPM</span></p>
                                </div>
                                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-700">
                                    <p className="text-xs text-gray-500 uppercase font-bold">{translate('coach.dashboard.metric.weight')}</p>
                                    <p className="text-3xl font-mono text-white mt-1">{profile.weight} <span className="text-sm text-gray-400">KG</span></p>
                                </div>
                                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-700">
                                    <p className="text-xs text-gray-500 uppercase font-bold">{translate('coach.dashboard.metric.sessions')}</p>
                                    <p className="text-3xl font-mono text-white mt-1">{profile.workout_history?.length || 0}</p>
                                </div>
                                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-700">
                                    <p className="text-xs text-gray-500 uppercase font-bold">{translate('coach.dashboard.metric.goal')}</p>
                                    <p className="text-sm font-bold text-blue-400 mt-2 uppercase">{profile.goal?.join(', ')}</p>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                    <History className="w-5 h-5 mr-2 text-blue-500"/>
                                    {translate('coach.dashboard.recent')}
                                </h3>
                                <div className="space-y-3">
                                    {profile.workout_history?.slice(-3).map((w, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-black/40 rounded-lg border border-gray-700">
                                            <div>
                                                <p className="font-bold text-white">{w.title}</p>
                                                <p className="text-xs text-gray-400">{w.date}</p>
                                            </div>
                                            <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded border border-green-900">{translate('coach.dashboard.completed')}</span>
                                        </div>
                                    ))}
                                    {(!profile.workout_history || profile.workout_history.length === 0) && (
                                        <p className="text-gray-500 text-sm">{translate('coach.dashboard.noActivity')}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 h-full flex flex-col">
                            {/* Notes List */}
                            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                {profile.coach_notes?.map((note, i) => (
                                    <div key={i} className="bg-gray-900/80 p-4 rounded-xl border-l-4 border-blue-500">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold text-white">{note.trainerName}</span>
                                            <span className="text-xs text-gray-400">{new Date(note.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-300 text-sm">{note.content}</p>
                                    </div>
                                ))}
                                {(!profile.coach_notes || profile.coach_notes.length === 0) && (
                                    <div className="text-center py-10 text-gray-500">
                                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-20"/>
                                        <p>{translate('coach.dashboard.noLogs')}</p>
                                    </div>
                                )}
                            </div>

                            {/* Add Note Input */}
                            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                                <h4 className="text-sm font-bold text-white mb-2">{translate('coach.dashboard.addLog')}</h4>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={translate('coach.dashboard.placeholder')}
                                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none mb-3"
                                />
                                <Button onClick={handleSaveNote} disabled={!note.trim()} className="w-full bg-blue-600 hover:bg-blue-700 border-blue-500">
                                    <Save className="w-4 h-4 mr-2"/> {translate('coach.dashboard.save')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default CoachDashboardModal;


import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import { X, Calendar, Clock, Check, ChevronLeft, ChevronRight, Globe, Activity } from 'lucide-react';
import { TrainerProfile } from '../types.ts';
import { useApp } from '../hooks/useApp.ts';
import { CURRENCY_MAP } from '../lib/currency.ts';
import CoachDashboardModal from '../components/trainers/CoachDashboardModal.tsx';
import SecureConnectionModal from '../components/trainers/SecureConnectionModal.tsx';

interface ExpertAdviceScreenProps {
    onClose: () => void;
    trainer: TrainerProfile;
}

const generateMockAvailability = (year: number, month: number): { [day: number]: string[] } => {
    const availability: { [day: number]: string[] } = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < 8; i++) {
        const day = Math.floor(Math.random() * daysInMonth) + 1;
        if (!availability[day]) {
            const allSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
            availability[day] = allSlots.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 2);
        }
    }
    return availability;
};

export const ExpertAdviceScreen: React.FC<ExpertAdviceScreenProps> = ({ onClose, trainer }) => {
    const { translate, profile, showStatus, language, currencyInfo, setCurrency } = useApp();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [monthlyAvailability, setMonthlyAvailability] = useState<{ [day: number]: string[] }>({});
    
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isBooked, setIsBooked] = useState(false);
    const [isCurrencySelectorOpen, setIsCurrencySelectorOpen] = useState(false);
    
    // New States for Features
    const [isCoachDashboardOpen, setIsCoachDashboardOpen] = useState(false);
    const [isSecureConnectOpen, setIsSecureConnectOpen] = useState(false);

    useEffect(() => {
        setMonthlyAvailability(generateMockAvailability(currentDate.getFullYear(), currentDate.getMonth()));
    }, [currentDate]);

    const initiateBooking = () => {
        if(selectedTime && selectedDate) {
            setIsSecureConnectOpen(true);
        }
    }

    const finalizeBooking = async () => {
        setIsSecureConnectOpen(false);
        setIsBooked(true);
        const formattedDate = selectedDate!.toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' });
        const bookingMessage = translate('expert.confirmation.subtitle', { name: trainer.name, date: formattedDate, time: selectedTime! });
        showStatus(bookingMessage);
    }
    
    const formattedDateForConfirmation = selectedDate 
        ? selectedDate.toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' }) 
        : '';
        
    const sessionFee = (trainer.sessionFeeEUR * currencyInfo.rate).toFixed(2);

    if (isBooked) {
        return (
             <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                 <Card className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-500">
                        <Check className="w-10 h-10 text-purple-300"/>
                    </div>
                    <h2 className="text-2xl font-bold text-white">{translate('expert.confirmation.title')}</h2>
                    <p className="text-gray-300 mt-2">{translate('expert.confirmation.subtitle', { name: trainer.name, date: formattedDateForConfirmation, time: selectedTime! })}</p>
                    <p className="text-gray-400 mt-1">{translate('expert.confirmation.info')}</p>
                    <Button onClick={onClose} className="mt-6 w-full">{translate('done')}</Button>
                </Card>
             </div>
        );
    }
    
    // --- Calendar Logic ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(1); 
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
        setSelectedDate(null);
        setSelectedTime(null);
    };

    const handleDateSelect = (day: number) => {
        const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        if (newSelectedDate < today || !monthlyAvailability[day]) return;
        
        setSelectedDate(newSelectedDate);
        setSelectedTime(null);
    };

    const weekdays = [...Array(7).keys()].map(i => {
        const day = new Date(Date.UTC(2024, 0, i)); 
        return day.toLocaleDateString(language, { weekday: 'short', timeZone: 'UTC' }).slice(0, 2);
    });

    return (
        <div className={`fixed inset-0 bg-black z-50 p-4 animate-slideInUp text-white ${isCurrencySelectorOpen ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            <CoachDashboardModal isOpen={isCoachDashboardOpen} onClose={() => setIsCoachDashboardOpen(false)} />
            <SecureConnectionModal 
                isOpen={isSecureConnectOpen} 
                onClose={() => setIsSecureConnectOpen(false)} 
                onConnected={finalizeBooking}
                trainerName={trainer.name}
            />

            {isCurrencySelectorOpen && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
                    <Card className="max-w-sm w-full relative">
                        <button onClick={() => setIsCurrencySelectorOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-1">
                            <X className="w-6 h-6"/>
                        </button>
                        <h2 className="text-xl font-bold text-white mb-4">{translate('sub.selectCurrency')}</h2>
                        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                            {Object.entries(CURRENCY_MAP).map(([code, { symbol }]) => (
                                <button
                                    key={code}
                                    onClick={() => {
                                        setCurrency(code);
                                        setIsCurrencySelectorOpen(false);
                                    }}
                                    className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${currencyInfo.code === code ? 'bg-[#8A2BE2]/40' : 'bg-gray-800 hover:bg-gray-700'}`}
                                >
                                    <span className="font-bold">{code}</span>
                                    <span className="text-gray-400 ml-2">{symbol}</span>
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>
             )}
            <div className="max-w-2xl mx-auto">
                <header className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-white">{translate('expert.title')}</h1>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
                        <X className="w-7 h-7"/>
                    </button>
                </header>

                <Card className="mb-6">
                    <div className="flex flex-col md:flex-row items-center gap-6 relative">
                        <img src={trainer.photoUrl} alt={trainer.name} className="w-32 h-32 rounded-full border-4 border-[#8A2BE2] object-cover" />
                        <div>
                            <h2 className="text-2xl font-semibold text-white">{trainer.name}</h2>
                            <p className="text-purple-400 font-medium">{trainer.titles[0]}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {trainer.languages.slice(0,4).map(lang => (
                                    <span key={lang} className="px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded">{lang}</span>
                                ))}
                            </div>
                        </div>
                        
                        {/* New Feature Button: Coach Dashboard View */}
                        <button 
                            onClick={() => setIsCoachDashboardOpen(true)}
                            className="absolute top-0 right-0 p-2 text-blue-400 hover:text-blue-300 flex flex-col items-center"
                            title="Coach Insight Panel (Demo)"
                        >
                            <Activity className="w-6 h-6" />
                            <span className="text-[10px] font-bold">INSIGHTS</span>
                        </button>
                    </div>
                    <p className="text-gray-300 mt-4">{trainer.bio}</p>
                </Card>

                <Card>
                    <h3 className="text-xl font-bold text-white flex items-center mb-4"><Calendar className="w-5 h-5 mr-2 text-purple-400"/>{translate('expert.selectDate')}</h3>
                    
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700"><ChevronLeft className="w-6 h-6"/></button>
                            <h4 className="font-bold text-lg text-white capitalize">{currentDate.toLocaleString(language, { month: 'long', year: 'numeric' })}</h4>
                            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700"><ChevronRight className="w-6 h-6"/></button>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                            {weekdays.map(day => <div key={day}>{day}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                                const day = dayIndex + 1;
                                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                const isPast = date < today;
                                const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
                                const isAvailable = monthlyAvailability[day] && !isPast;
                                
                                let dayClasses = 'h-10 w-10 flex items-center justify-center rounded-full font-semibold transition-colors duration-200';
                                if (isPast || !monthlyAvailability[day]) {
                                    dayClasses += ' text-gray-600 cursor-not-allowed';
                                } else if (isSelected) {
                                    dayClasses += ' bg-[#8A2BE2] text-white';
                                } else if (isAvailable) {
                                    dayClasses += ' text-white hover:bg-gray-700';
                                }

                                return (
                                    <div key={day} className="relative">
                                        <button onClick={() => handleDateSelect(day)} className={dayClasses} disabled={isPast || !monthlyAvailability[day]}>
                                            {day}
                                        </button>
                                        {isAvailable && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full"></div>}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {selectedDate && (
                        <div className="mt-6 animate-fadeIn">
                            <h3 className="text-xl font-bold text-white flex items-center mb-4"><Clock className="w-5 h-5 mr-2 text-purple-400"/>{translate('expert.selectTime')}</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {monthlyAvailability[selectedDate.getDate()].sort().map(time => (
                                    <button 
                                        key={time} 
                                        onClick={() => setSelectedTime(time)}
                                        className={`p-3 rounded-lg font-bold text-sm transition-all duration-200 active:scale-95 ${selectedTime === time ? 'bg-purple-500 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                </Card>
                
                <div className="sticky bottom-0 mt-6 pb-4 bg-gradient-to-t from-black to-transparent">
                    <Card>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <p className="text-gray-400 text-sm">{translate('expert.sessionFee')}</p>
                                <p className="text-2xl font-bold text-white">{currencyInfo.symbol}{sessionFee}</p>
                                <button onClick={() => setIsCurrencySelectorOpen(true)} className="mt-1 inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
                                    <Globe className="w-3 h-3" />
                                    <span>{currencyInfo.code}</span>
                                </button>
                            </div>
                            <Button onClick={initiateBooking} disabled={!selectedTime} className="w-full sm:w-auto">
                                {selectedTime ? translate('expert.bookForTime', { time: selectedTime }) : translate('expert.selectTimePrompt')}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

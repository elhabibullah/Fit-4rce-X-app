import React, { useState } from 'react';
import { useApp } from '../hooks/useApp.ts';
import Button from '../components/common/Button.tsx';
import Card from '../components/common/Card.tsx';
import { Lock, Mail } from 'lucide-react';

interface SignInScreenProps {
  onBack: () => void;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ onBack }) => {
    const { translate, signIn, language } = useApp();
    const [email, setEmail] = useState('elhabibullah@gmail.com');
    const [password, setPassword] = useState('•••••••••••');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSignIn = () => {
        setIsLoading(true);
        setTimeout(() => {
            signIn({ 
                full_name: 'Abdelwahid', 
                language: language,
                email: email,
            });
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen w-full bg-black flex flex-col items-center p-6 pt-16 pb-32 font-['Poppins']">
            <div className="w-full max-w-sm">
                <Card className="w-full border-purple-500/10 shadow-[0_0_60px_rgba(138,43,226,0.05)] bg-black/40 backdrop-blur-2xl rounded-[3rem] p-10">
                    <div className="text-center mb-12">
                        <h1 className="text-xl font-normal text-white uppercase tracking-[0.25em]">
                            {translate('signIn.title')}
                        </h1>
                        <div className="w-12 h-0.5 bg-purple-500 mx-auto mt-6 opacity-40 rounded-full" />
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }} className="space-y-6">
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-purple-400 transition-colors" />
                            <input
                                type="email"
                                placeholder={translate('signIn.email')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-gray-800/80 rounded-2xl p-5 pl-14 text-white text-sm font-light tracking-wide focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-700"
                            />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-purple-400 transition-colors" />
                            <input
                                type="password"
                                placeholder={translate('signIn.password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-gray-800/80 rounded-2xl p-5 pl-14 text-white text-sm font-light tracking-wide focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-700"
                            />
                        </div>
                        
                        <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-6 text-sm font-bold uppercase tracking-[0.2em] mt-6 shadow-2xl bg-[#8A2BE2] border-purple-400/30 text-white"
                        >
                            {isLoading ? translate('processing') : translate('signIn.submit')}
                        </Button>
                    </form>
                    
                    <div className="text-center mt-12 space-y-8">
                        <button 
                            type="button" 
                            onClick={() => alert(translate('signIn.recoveryAlert'))}
                            className="text-[11px] font-black text-gray-600 hover:text-purple-400 uppercase tracking-widest transition-colors"
                        >
                            {translate('signIn.forgotPassword')}
                        </button>

                        <div className="pt-8 border-t border-gray-800/50">
                            <p className="text-[11px] text-gray-700 uppercase tracking-widest font-bold">
                                {translate('signIn.noAccount')}{' '}
                                <button onClick={onBack} className="text-purple-400 font-black hover:text-purple-300 ml-1 underline decoration-purple-500/30 underline-offset-4">
                                    {translate('signIn.signUp')}
                                </button>
                            </p>
                        </div>
                    </div>
                </Card>
                
                <button onClick={onBack} className="w-full mt-12 text-[10px] font-black text-gray-700 hover:text-white uppercase tracking-[0.4em] transition-all py-6">
                    {translate('signIn.back')}
                </button>
            </div>
        </div>
    );
};

export default SignInScreen;

import React, { useState } from 'react';
import { useApp } from '../hooks/useApp.ts';
import Button from '../components/common/Button.tsx';
import Card from '../components/common/Card.tsx';

interface SignInScreenProps {
  onBack: () => void;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ onBack }) => {
    const { translate, signIn, language } = useApp();
    const [email, setEmail] = useState('elhabibullah@gmail.com');
    const [password, setPassword] = useState('password123');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSignIn = () => {
        setIsLoading(true);
        // Simulate network delay for mock login
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
        <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 animate-fadeIn">
            <Card className="w-full max-w-sm">
                <h1 className="text-2xl font-bold text-white text-center mb-6">{translate('signIn.title')}</h1>
                <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }} className="space-y-4">
                     <input
                        type="email"
                        placeholder={translate('signIn.email')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                        type="password"
                        placeholder={translate('signIn.password')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? translate('processing') : translate('signIn.button')}
                    </Button>
                </form>
                <div className="text-center mt-4">
                    <button 
                        type="button" 
                        onClick={() => alert(translate('signIn.recoveryAlert'))}
                        className="text-sm text-purple-400 hover:text-purple-300"
                    >
                        {translate('signIn.forgotPassword')}
                    </button>
                </div>
            </Card>
            <button onClick={onBack} className="mt-6 text-gray-400 hover:text-white">
                {translate('signIn.back')}
            </button>
        </div>
    );
};

export default SignInScreen;

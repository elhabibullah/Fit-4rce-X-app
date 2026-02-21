import React, { useState } from 'react';
import { CheckCircle, Globe, X, Gift, Crown, User } from 'lucide-react';
import { useApp } from '../hooks/useApp.ts';
import Button from '../components/common/Button.tsx';
import Card from '../components/common/Card.tsx';
import { DURATION_OPTIONS } from '../lib/constants.ts';
import { DurationOption } from '../types.ts';
import { CURRENCY_MAP } from './currency.ts';

interface SubscriptionScreenProps {
  onPaymentSuccess?: () => void;
  isManaging?: boolean;
  onSignInClick?: () => void;
}

const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ onPaymentSuccess, isManaging = false, onSignInClick }) => {
  const { translate, constants, updateUserProfile, currencyInfo, setCurrency, language } = useApp();
  const [selectedPlanId, setSelectedPlanId] = useState<'silver' | 'premium'>('premium');
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(DURATION_OPTIONS[3]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCurrencySelectorOpen, setIsCurrencySelectorOpen] = useState(false);

  // Force prices for SAR to match the user's requirements exactly
  const getDisplayPrice = (planId: string) => {
      if (currencyInfo.code === 'SAR') {
          return planId === 'silver' ? '76.95' : '101.25';
      }
      const plan = constants.SUBSCRIPTION_PLANS.find(p => p.id === planId)!;
      return (plan.monthlyPrice * currencyInfo.rate).toFixed(2);
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateUserProfile({ subscription_status: 'active', plan_id: selectedPlanId });
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (e) {
      setIsProcessing(false);
    }
  };

  const calculateTotalPrice = () => {
      if (currencyInfo.code === 'SAR') {
          if (selectedPlanId === 'premium' && selectedDuration.months === 12) return "1032.75";
          const monthly = parseFloat(getDisplayPrice(selectedPlanId));
          const baseTotal = monthly * selectedDuration.months;
          const discount = baseTotal * (selectedDuration.discount / 100);
          return (baseTotal - discount).toFixed(2);
      }
      const monthly = parseFloat(getDisplayPrice(selectedPlanId));
      const baseTotal = monthly * selectedDuration.months;
      const discount = baseTotal * (selectedDuration.discount / 100);
      return (baseTotal - discount).toFixed(2);
  };

  return (
    <div className="min-h-screen w-full bg-black text-white px-6 pt-16 pb-44 font-['Poppins'] font-light" key={language}>
      {isCurrencySelectorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
            <Card className="max-w-sm w-full relative border-white/5">
                <button onClick={() => setIsCurrencySelectorOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-1">
                    <X className="w-6 h-6"/>
                </button>
                <h2 className="text-xl font-light text-white mb-4 uppercase tracking-widest">{translate('sub.selectCurrency')}</h2>
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    {(Object.entries(CURRENCY_MAP) as [string, any][]).map(([code, { symbol }]) => (
                        <button
                            key={code}
                            onClick={() => {
                                setCurrency(code);
                                setIsCurrencySelectorOpen(false);
                            }}
                            className={`w-full text-left p-4 rounded-xl mb-2 transition-colors ${currencyInfo.code === code ? 'bg-purple-900/20 border border-purple-500/50' : 'bg-gray-900 hover:bg-gray-800'}`}
                        >
                            <span className="font-light text-white">{code}</span>
                            <span className="text-gray-400 ml-2">{symbol}</span>
                        </button>
                    ))}
                </div>
            </Card>
        </div>
      )}
      
      <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-8">
          <div className="text-center w-full">
            <h1 className="text-3xl font-light uppercase tracking-[0.2em] text-white">
              {translate('sub.title')}
            </h1>
            <p className="text-zinc-500 mt-4 uppercase text-[10px] font-light tracking-[0.4em]">{translate('sub.subtitle')}</p>
            
            <div className="flex items-center justify-center gap-4 mt-8">
                <button onClick={() => setIsCurrencySelectorOpen(true)} className="inline-flex items-center gap-2 text-sm text-purple-400 bg-purple-900/10 px-6 py-2.5 rounded-full border border-purple-500/20 shadow-lg transition-all active:scale-95">
                    <Globe className="w-4 h-4" />
                    <span className="uppercase tracking-widest font-light text-[11px] text-white">{currencyInfo.symbol} {currencyInfo.code}</span>
                </button>
                
                {onSignInClick && (
                    <button onClick={onSignInClick} className="inline-flex items-center gap-2 text-[10px] text-zinc-400 uppercase tracking-widest hover:text-white transition-all">
                        <span>{translate('sub.alreadyMember')} <span className="text-white underline decoration-purple-500/50 underline-offset-4">{translate('sub.signIn')}</span></span>
                    </button>
                )}
            </div>
          </div>

          <div className="w-full space-y-6">
            {constants.SUBSCRIPTION_PLANS.map((plan) => (
              <div 
                key={plan.id}
                className={`glow-container w-full transition-all duration-300 ${selectedPlanId === plan.id ? 'active' : 'opacity-100'}`}
              >
                <button 
                  onClick={() => setSelectedPlanId(plan.id)} 
                  className="glow-content p-8 !items-start !justify-start"
                >
                  <h2 className="text-xl font-light uppercase tracking-widest text-white">{translate(`sub.plan.${plan.id === 'silver' ? 'silver' : 'gold'}.name`)}</h2>
                  <p className="text-5xl font-light mt-4 text-white tracking-tighter">{currencyInfo.symbol}{getDisplayPrice(plan.id)}<span className="text-lg font-light text-zinc-500">/{language === 'ar' ? 'شهر' : 'mo'}</span></p>
                  <ul className="mt-8 space-y-4">
                    {(plan.id === 'silver' ? ['sub.feat.aiWorkout', 'sub.feat.3dModels', 'sub.feat.store'] : ['sub.feat.allSilver', 'sub.feat.nutriAI', 'sub.feat.holoCardio', 'sub.feat.defense']).map((fKey, i) => (
                        <li key={i} className="flex items-center text-white text-xs font-light uppercase tracking-widest text-left">
                            <CheckCircle className="w-5 h-5 mr-4 text-purple-400 flex-shrink-0" />
                            {translate(fKey)}
                        </li>
                    ))}
                  </ul>
                  {plan.id === 'premium' && (
                      <div className="mt-8 p-[1px] bg-gradient-to-r from-purple-800 via-white to-purple-800 rounded-2xl w-full shadow-lg">
                          <div className="bg-black/90 rounded-2xl py-4 px-5 flex items-center text-purple-400">
                             <Crown className="w-5 h-5 mr-4" fill="currentColor" />
                             <span className="text-[11px] font-light uppercase tracking-widest leading-tight text-left text-white">{translate('sub.special.trainers')}</span>
                          </div>
                      </div>
                  )}
                </button>
              </div>
            ))}
          </div>
          
          <div className="w-full grid grid-cols-2 gap-4">
              {DURATION_OPTIONS.map((duration) => (
                  <div 
                      key={duration.months}
                      className={`glow-container w-full h-24 transition-all ${selectedDuration.months === duration.months ? 'active' : 'opacity-100'}`}
                  >
                      <button 
                        onClick={() => setSelectedDuration(duration)} 
                        className="glow-content p-5"
                      >
                          <p className="font-light text-xs uppercase tracking-[0.2em] text-white">{duration.months} {duration.months > 1 ? translate('sub.months') : translate('sub.month')}</p>
                          {duration.discount > 0 && <p className="text-[9px] text-purple-400 font-light uppercase mt-2 tracking-widest">{translate('sub.save', { discount: duration.discount })}</p>}
                      </button>
                  </div>
              ))}
          </div>

          <Card className="w-full bg-zinc-950/80 border-zinc-800 p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5">
            <div className="text-center">
                <p className="text-zinc-600 text-[10px] font-light uppercase tracking-[0.4em] mb-4">{translate('sub.totalPrice')}</p>
                <p className="text-6xl font-light text-white tracking-tighter">{currencyInfo.symbol}{calculateTotalPrice()}</p>
                
                {selectedDuration.months >= 6 && (
                    <div className="mt-10 p-5 bg-purple-900/10 border border-purple-500/20 rounded-2xl flex items-center justify-center shadow-inner">
                        <Gift className="w-7 h-7 text-purple-400 mr-5" />
                        <div className="text-left">
                            <p className="text-xs font-light text-white uppercase tracking-[0.2em]">{translate('sub.freeGift')}</p>
                             <p className="text-[10px] text-zinc-500 font-light uppercase tracking-widest">{translate('sub.delivery')}</p>
                        </div>
                    </div>
                )}
            </div>
            
            <Button onClick={handleSubscribe} disabled={isProcessing} className="w-full mt-12 py-7 text-sm font-light uppercase tracking-[0.3em] shadow-[0_15px_40px_rgba(138,43,226,0.3)]">
                {isProcessing ? translate('processing') : translate('sub.subscribeNow')}
            </Button>
            <p className="text-[9px] text-zinc-700 text-center mt-8 font-light uppercase tracking-[0.3em] opacity-40">{translate('sub.securePayments')}</p>
          </Card>
      </div>
    </div>
  );
};

export default SubscriptionScreen;

import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Info, Globe, X, Gift, Truck, Crown } from 'lucide-react';
import { useApp } from '../hooks/useApp.ts';
import Button from '../components/common/Button.tsx';
import Card from '../components/common/Card.tsx';
import { DURATION_OPTIONS } from '../constants.ts';
import { SubscriptionPlan, DurationOption } from '../types.ts';
import { CURRENCY_MAP } from '../lib/currency.ts';

interface SubscriptionScreenProps {
  onPaymentSuccess?: () => void;
  isManaging?: boolean;
  onSignInClick?: () => void;
}

const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ onPaymentSuccess, isManaging = false, onSignInClick }) => {
  const { translate, constants, updateUserProfile, profile, currencyInfo, userLocation, setCurrency, language } = useApp();
  const [selectedPlanId, setSelectedPlanId] = useState<'silver' | 'premium'>(profile?.subscription_status === 'active' ? 'premium' : 'premium');
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(DURATION_OPTIONS[3]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCurrencySelectorOpen, setIsCurrencySelectorOpen] = useState(false);

  const selectedPlan = constants.SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId)!;

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('Simulating payment processing...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateUserProfile({ subscription_status: 'active', plan_id: selectedPlanId });

      if (onPaymentSuccess) {
        onPaymentSuccess();
      } else {
        setError(null);
        setIsProcessing(false);
        alert(translate('sub.updateSuccess'));
      }
    } catch (e: any) {
      console.error("Subscription Error:", e);
      setError(e.message || translate('sub.error'));
      setIsProcessing(false);
    }
  };

  const calculatePrice = () => {
    const basePriceEUR = selectedPlan.monthlyPrice * selectedDuration.months;
    const discountAmountEUR = basePriceEUR * (selectedDuration.discount / 100);
    const finalPriceEUR = basePriceEUR - discountAmountEUR;
    
    const finalPriceConverted = finalPriceEUR * currencyInfo.rate;

    return {
        total: finalPriceConverted.toFixed(2),
        perMonth: (finalPriceConverted / selectedDuration.months).toFixed(2)
    };
  }

  // Key added to force re-render when language changes
  return (
    <div className="min-h-screen w-full bg-black text-white overflow-y-auto pb-20 pt-20 px-4" key={language}>
      {isCurrencySelectorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
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
      
      <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-8">
          {/* Header */}
          <div className="text-center w-full">
            <h1 
              className="text-3xl md:text-4xl font-bold"
               style={{ textShadow: '0 0 10px #8A2BE2' }}
            >
              {isManaging ? translate('profile.subscription.title') : translate('sub.title')}
            </h1>
            <p className="text-gray-400 mt-2">{isManaging ? translate('sub.policy.title') : translate('sub.subtitle')}</p>
            
            <button onClick={() => setIsCurrencySelectorOpen(true)} className="mt-4 inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300">
                <Globe className="w-4 h-4" />
                <span>{translate('sub.changeCurrency')}: {currencyInfo.symbol} {currencyInfo.code}</span>
            </button>
            {userLocation && (
                <div className="mt-1 text-xs text-gray-500">
                    <p>{translate('location.country')}: {userLocation.countryCode}</p>
                </div>
            )}
          </div>

          {!isManaging && onSignInClick && (
            <div className="text-center -mt-4 w-full">
                <p className="text-gray-400">
                    {translate('sub.alreadyMember')}{' '}
                    <button onClick={onSignInClick} className="font-medium text-purple-400 hover:text-purple-300 underline">
                        {translate('sub.signIn')}
                    </button>
                </p>
            </div>
          )}

          {isManaging && (
            <Card className="w-full">
                <h3 className="font-bold flex items-center mb-2"><Info className="w-5 h-5 mr-2 text-purple-400"/>{translate('sub.policy.cardTitle')}</h3>
                <p className="text-sm text-gray-400">
                    {translate('sub.policy.content')}
                </p>
            </Card>
          )}

          {/* Plans Section */}
          <div className="w-full space-y-4">
            {constants.SUBSCRIPTION_PLANS.map((plan) => (
              <div key={plan.id} className="w-full">
                  <button 
                    onClick={() => setSelectedPlanId(plan.id)} 
                    className={`glow-container w-full text-left transition-all duration-300 relative rounded-2xl overflow-hidden block ${selectedPlanId === plan.id ? 'bg-gray-900 ring-2 ring-[#8A2BE2]' : 'opacity-80 hover:opacity-100'}`}
                  >
                    <div className={`glow-content p-6 transition-colors duration-300 ${selectedPlanId === plan.id ? 'bg-[#8A2BE2]/10' : ''}`}>
                      <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                      <p className="text-3xl font-bold mt-2 text-white">{currencyInfo.symbol}{(plan.monthlyPrice * currencyInfo.rate).toFixed(2)}<span className="text-base font-normal text-gray-400">/mo</span></p>
                      <ul className="mt-4 space-y-2">
                        {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center text-gray-300">
                                <CheckCircle className="w-4 h-4 mr-2 text-[#8A2BE2]" />
                                {feature}
                            </li>
                        ))}
                      </ul>
                      
                      {/* SPECIAL GOLD HIGHLIGHT */}
                      {plan.specialHighlight && (
                          <div className="mt-4 p-[1px] gold-glow-container rounded-lg">
                              <div className="bg-[#1a1a1a] rounded-lg pt-3 pb-3 px-3 flex items-center text-[#FFD700] relative overflow-hidden">
                                 <Crown className="w-5 h-5 mr-2 z-10 flex-shrink-0" fill="#FFD700" />
                                 <span className="z-10 text-sm leading-tight font-medium">{plan.specialHighlight}</span>
                                 <Crown className="absolute -right-4 -bottom-6 w-20 h-20 text-[#FFD700]/10 rotate-12" />
                              </div>
                          </div>
                      )}
                    </div>
                  </button>
              </div>
            ))}
          </div>
          
          {/* Durations Section */}
          <div className="w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((duration) => (
                    <div key={duration.months} className="relative group">
                        {duration.gift && (
                            <div className="absolute -top-3 left-0 right-0 flex justify-center z-20">
                                <span className="bg-[#8A2BE2] text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-purple-300 animate-pulse whitespace-nowrap">
                                    {translate('sub.freeGift').split('+')[0] || 'GIFT'}
                                </span>
                            </div>
                        )}
                        <button 
                            onClick={() => setSelectedDuration(duration)} 
                            className={`glow-container w-full block relative rounded-2xl transition-all overflow-hidden ${selectedDuration.months === duration.months ? 'ring-2 ring-[#8A2BE2]' : 'opacity-80 hover:opacity-100'}`}
                        >
                            <div className={`glow-content p-3 text-center transition-colors duration-300 ${selectedDuration.months === duration.months ? 'bg-[#8A2BE2]/20' : 'bg-gray-900'}`}>
                                <p className="font-bold text-white">{duration.months} {duration.months > 1 ? translate('sub.months') : translate('sub.month')}</p>
                                {duration.discount > 0 && <p className="text-xs text-purple-300">{translate('sub.save', { discount: duration.discount })}</p>}
                            </div>
                        </button>
                    </div>
                ))}
            </div>
          </div>

          {/* Total Price Card */}
          <Card className="w-full">
            <div className="text-center">
                <p className="text-gray-400">{translate('sub.totalPrice')}</p>
                <p className="text-3xl font-bold my-2 text-white">{currencyInfo.symbol}{calculatePrice().total}</p>
                <p className="font-bold text-purple-400">{translate('sub.perMonth', { price: calculatePrice().perMonth, symbol: currencyInfo.symbol })}</p>
                
                {selectedDuration.gift && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-purple-900/50 to-black border border-purple-500/50 rounded-lg flex items-center justify-center animate-fadeIn">
                        <Gift className="w-6 h-6 text-[#8A2BE2] mr-3" />
                        <div className="text-left">
                            <p className="text-xs font-bold text-white uppercase tracking-wide">{translate('sub.freeGift')}</p>
                             <p className="text-[10px] text-gray-400 flex items-center"><Truck className="w-3 h-3 mr-1"/> {translate('sub.delivery')}</p>
                        </div>
                    </div>
                )}
            </div>

            {error && <p className="mt-4 text-center text-yellow-500 flex items-center justify-center"><AlertTriangle className="w-4 h-4 mr-2"/>{error}</p>}
            
            <Button onClick={handleSubscribe} disabled={isProcessing} className="w-full mt-6">
                {isProcessing ? translate('processing') : (isManaging ? translate('sub.updatePlan') : translate('sub.subscribeNow'))}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">{translate('sub.securePayments')}</p>
          </Card>
      </div>
    </div>
  );
};

export default SubscriptionScreen;

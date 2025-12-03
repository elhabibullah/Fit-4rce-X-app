
import React, { useState, useMemo } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { ChevronRight, CheckCircle, X, Globe, Search, ShoppingCart, Star, Filter, Heart, Plus, Minus, Trash2 } from 'lucide-react';
import { F4XProduct } from '../../types.ts';
import Button from '../common/Button.tsx';
import Card from '../common/Card.tsx';
import { CURRENCY_MAP } from '../../lib/currency.ts';

const F4X_LOGO_URL = "https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_Nutrition_logo.png";

interface CartItem {
    product: F4XProduct;
    quantity: number;
}

const F4XStore: React.FC = () => {
    const { translate, currencyInfo, setCurrency } = useApp();
    const [selectedProduct, setSelectedProduct] = useState<F4XProduct | null>(null);
    const [isCurrencySelectorOpen, setIsCurrencySelectorOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Products
    const F4X_PRODUCTS: F4XProduct[] = [
        {
            id: 'p1',
            name: translate('store.p1.name'),
            tagline: translate('store.p1.tagline'),
            price: 32.00,
            image_url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_Iso-whey_tiramisu.jpg',
            category: 'protein',
            description: translate('store.p1.desc'),
            benefits: ['High Protein', 'Digestive Enzymes', 'Sugar Free'],
            nutrition_facts: [{ label: 'Protein', value: '26g' }, { label: 'BCAA', value: '6g' }]
        },
        {
            id: 'p2',
            name: translate('store.p2.name'),
            tagline: translate('store.p2.tagline'),
            price: 32.00,
            image_url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_Iso_Mochacchino.jpg',
            category: 'protein',
            description: translate('store.p2.desc'),
            benefits: ['Fast Acting', 'Coffee Infused', 'Low Fat'],
            nutrition_facts: [{ label: 'Protein', value: '26g' }, { label: 'BCAA', value: '6g' }]
        },
        {
            id: 'p3',
            name: translate('store.p3.name'),
            tagline: translate('store.p3.tagline'),
            price: 32.00,
            image_url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_Iso-whey_strawberry.jpg',
            category: 'protein',
            description: translate('store.p3.desc'),
            benefits: ['Natural Flavor', 'Instant Mix', 'Zero Bloating'],
            nutrition_facts: [{ label: 'Protein', value: '26g' }, { label: 'BCAA', value: '6g' }]
        },
        {
            id: 'p4',
            name: translate('store.p4.name'),
            tagline: translate('store.p4.tagline'),
            price: 40.00,
            image_url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_massgainer_vanilla.jpg',
            category: 'recovery',
            description: translate('store.p4.desc'),
            benefits: ['High Calorie', 'Creatine Loaded', 'Complex Carbs'],
            nutrition_facts: [{ label: 'Calories', value: '1250' }, { label: 'Protein', value: '50g' }]
        },
        {
            id: 'p5',
            name: translate('store.p5.name'),
            tagline: translate('store.p5.tagline'),
            price: 34.00,
            image_url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_Feline-women_whey.jpg',
            category: 'protein',
            description: translate('store.p5.desc'),
            benefits: ['Lean Muscle', 'Metabolic Support', 'Great Taste'],
            nutrition_facts: [{ label: 'Protein', value: '24g' }, { label: 'Fat', value: '1g' }]
        },
        {
            id: 'p6',
            name: translate('store.p6.name'),
            tagline: translate('store.p6.tagline'),
            price: 18.00,
            image_url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_Rhino.jpg',
            category: 'energy',
            description: translate('store.p6.desc'),
            benefits: ['Laser Focus', 'Explosive Energy', 'Muscle Pumps'],
            nutrition_facts: [{ label: 'Caffeine', value: '200mg' }, { label: 'Beta-Alanine', value: '3g' }]
        },
        {
            id: 'p7',
            name: translate('store.p7.name'),
            tagline: translate('store.p7.tagline'),
            price: 20.00,
            image_url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_fatburner.jpg',
            category: 'wellness',
            description: translate('store.p7.desc'),
            benefits: ['Thermogenic', 'Appetite Control', 'Energy Boost'],
            nutrition_facts: [{ label: 'L-Carnitine', value: '1g' }, { label: 'Green Tea', value: 'Extract' }]
        }
    ];

    const CATEGORIES = [
        { id: 'all', label: translate('store.cat.all') },
        { id: 'protein', label: translate('store.cat.protein') },
        { id: 'energy', label: translate('store.cat.energy') },
        { id: 'recovery', label: translate('store.cat.recovery') },
        { id: 'wellness', label: translate('store.cat.wellness') }
    ];

    const getDisplayPrice = (basePrice: number) => {
        const rate = currencyInfo.rate || 1;
        const converted = basePrice * rate;
        if (['SAR', 'AED', 'JPY', 'KRW'].includes(currencyInfo.code)) {
             return Math.ceil(converted); 
        }
        return converted.toFixed(2);
    };

    const addToCart = (product: F4XProduct) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1 }];
        });
        setSelectedProduct(null); // Close modal after adding
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const calculateTotal = () => {
        const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        // Base delivery fee 5 EUR -> approx 20 SAR
        const deliveryFee = subtotal > 0 ? 5 : 0; 
        return {
            subtotal: subtotal,
            delivery: deliveryFee,
            total: subtotal + deliveryFee
        };
    };

    const filteredProducts = useMemo(() => {
        return F4X_PRODUCTS.filter(p => {
            const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchQuery, F4X_PRODUCTS]);

    const { subtotal, delivery, total } = calculateTotal();
    const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="bg-[#111] min-h-screen pb-24 font-sans text-gray-100" key={currencyInfo.code}>
            
            {/* Top Bar - Standard Height (h-20) */}
            <div className="sticky top-0 z-30 bg-[#111]/95 backdrop-blur-md border-b border-gray-800 px-4 flex items-center justify-between h-20 relative">
                
                {/* Logo - Large & Overflowing */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-40 h-28 flex items-center pointer-events-none">
                    <img src={F4X_LOGO_URL} alt="F4X" className="h-full w-auto object-contain drop-shadow-xl" />
                </div>
                
                <div className="flex items-center gap-4 ml-auto">
                    <button onClick={() => setIsCurrencySelectorOpen(true)} className="flex items-center gap-2 text-xs font-bold text-[#8A2BE2] bg-transparent hover:bg-white/5 px-2 py-1 rounded transition-colors">
                        <Globe className="w-3 h-3" />
                        <span>{currencyInfo.code}</span>
                    </button>
                    <button onClick={() => setIsCartOpen(true)} className="relative p-1">
                        <ShoppingCart className="w-6 h-6 text-white" />
                        {cartItemCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[#111]">
                                {cartItemCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Currency Selector Modal */}
            {isCurrencySelectorOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
                    <Card className="max-w-sm w-full relative">
                        <button onClick={() => setIsCurrencySelectorOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-1">
                            <X className="w-6 h-6"/>
                        </button>
                        <h2 className="text-xl font-bold text-white mb-4">{translate('sub.selectCurrency')}</h2>
                        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
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

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-[#111] z-[100] flex flex-col animate-slideInUp overflow-hidden">
                    <div className="relative flex-none">
                        <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 text-black hover:text-red-600 z-20 p-2 bg-white/80 rounded-full shadow-lg transition-colors">
                            <X className="w-6 h-6"/>
                        </button>
                        <div className="h-80 w-full bg-white flex items-center justify-center p-8 rounded-b-[2.5rem] shadow-2xl">
                            <img src={selectedProduct.image_url} alt={selectedProduct.name} className="max-h-full max-w-full object-contain filter drop-shadow-xl" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h2 className="text-2xl font-black text-white leading-tight">{selectedProduct.name}</h2>
                                <p className="text-gray-400 text-sm mt-1">{selectedProduct.tagline}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-green-500">{currencyInfo.symbol}{getDisplayPrice(selectedProduct.price)}</span>
                            </div>
                        </div>

                        <div className="flex gap-1 mb-6">
                            {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                            <span className="text-xs text-gray-500 ml-2">(128 Reviews)</span>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                                <h3 className="text-white font-bold mb-2">{translate('nutrition.store.modal.description')}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{selectedProduct.description}</p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold mb-3">{translate('nutrition.store.modal.benefits')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProduct.benefits.map((benefit, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs font-bold rounded-lg border border-gray-700 flex items-center">
                                            <CheckCircle className="w-3 h-3 mr-1.5 text-green-500"/> {benefit}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-white font-bold mb-3">{translate('nutrition.store.modal.nutrition')}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedProduct.nutrition_facts.map((fact, i) => (
                                        <div key={i} className="flex justify-between items-center bg-gray-900 p-3 rounded-lg border border-gray-800">
                                            <span className="text-gray-400 text-xs">{fact.label}</span>
                                            <span className="text-white font-bold text-sm">{fact.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-[#111] border-t border-gray-800">
                        <Button 
                            onClick={() => addToCart(selectedProduct)} 
                            className="w-full bg-[#8A2BE2] hover:bg-purple-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(138,43,226,0.3)] uppercase tracking-wider"
                        >
                            {translate('store.addToCart')} - {currencyInfo.symbol}{getDisplayPrice(selectedProduct.price)}
                        </Button>
                    </div>
                </div>
            )}

            {/* CART MODAL */}
            {isCartOpen && (
                <div className="fixed inset-0 bg-[#111] z-[150] flex flex-col animate-slideInUp">
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#111]">
                        <h2 className="text-xl font-black text-white uppercase tracking-wider">{translate('store.yourCart')} ({cartItemCount})</h2>
                        <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {cart.length > 0 ? (
                            <div className="space-y-4">
                                {cart.map((item) => (
                                    <div key={item.product.id} className="flex gap-4 bg-gray-900 p-3 rounded-xl border border-gray-800">
                                        <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center p-2 shrink-0">
                                            <img src={item.product.image_url} alt={item.product.name} className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-bold text-white text-sm line-clamp-1">{item.product.name}</h3>
                                                <p className="text-green-500 font-bold text-sm mt-1">{currencyInfo.symbol}{getDisplayPrice(item.product.price)}</p>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center bg-gray-800 rounded-lg">
                                                    <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1.5 text-gray-400 hover:text-white"><Minus className="w-4 h-4"/></button>
                                                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1.5 text-gray-400 hover:text-white"><Plus className="w-4 h-4"/></button>
                                                </div>
                                                <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 p-1.5">
                                                    <Trash2 className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                                <p>{translate('store.emptyCart')}</p>
                            </div>
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="p-4 bg-[#111] border-t border-gray-800 space-y-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-400">
                                    <span>{translate('store.subtotal')}</span>
                                    <span>{currencyInfo.symbol}{getDisplayPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>{translate('store.deliveryFee')}</span>
                                    <span>{currencyInfo.symbol}{getDisplayPrice(delivery)}</span>
                                </div>
                                <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-gray-800">
                                    <span>{translate('store.total')}</span>
                                    <span className="text-green-500">{currencyInfo.symbol}{getDisplayPrice(total)}</span>
                                </div>
                            </div>
                            <Button 
                                onClick={() => alert("Redirecting to Payment Gateway...")} 
                                className="w-full bg-[#8A2BE2] hover:bg-purple-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(138,43,226,0.3)] uppercase tracking-wider"
                            >
                                {translate('store.checkout')}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Search Bar - Moved up since title is gone */}
            <div className="px-4 mb-4 mt-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder={translate('searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#8A2BE2]"
                    />
                </div>
            </div>

            {/* Hero Banner */}
            <div className="px-4 mb-6">
                <div className="w-full h-40 rounded-2xl bg-gradient-to-r from-red-900 to-[#111] relative overflow-hidden flex items-center shadow-lg border border-red-900/50">
                    <div className="z-10 p-6">
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{translate('store.banner.new')}</span>
                        <h2 className="text-2xl font-black text-white mt-2 leading-none uppercase italic whitespace-pre-line">{translate('store.banner.title')}</h2>
                        <p className="text-gray-300 text-xs mt-1 mb-3">{translate('store.banner.subtitle')}</p>
                        <button className="text-xs font-bold text-white underline decoration-red-500 underline-offset-4 hover:text-red-400">{translate('store.banner.shop')}</button>
                    </div>
                    <img 
                        src="https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_Rhino.jpg" 
                        className="absolute -right-4 -bottom-4 w-40 h-40 object-contain rotate-12 filter drop-shadow-2xl" 
                        alt="Promo"
                    />
                </div>
            </div>

            {/* Category Tabs */}
            <div className="mb-6 overflow-x-auto no-scrollbar px-4 flex gap-3">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === cat.id ? 'bg-white text-black' : 'bg-gray-900 text-gray-400 border border-gray-800'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="px-4 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white text-lg">{translate('store.featured')}</h3>
                    <Filter className="w-5 h-5 text-gray-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {filteredProducts.map((product) => (
                        <div 
                            key={product.id} 
                            className="bg-gray-900 rounded-2xl p-3 border border-gray-800 relative group"
                            onClick={() => setSelectedProduct(product)}
                        >
                            <div className="absolute top-3 right-3 z-10 p-1.5 bg-black/20 rounded-full backdrop-blur-sm text-gray-400 hover:text-red-500 cursor-pointer">
                                <Heart className="w-4 h-4" />
                            </div>

                            <div className="w-full aspect-square bg-white rounded-xl mb-3 p-4 flex items-center justify-center">
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-contain filter drop-shadow-lg" />
                            </div>
                            
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{product.category}</p>
                                <h4 className="text-sm font-bold text-white leading-tight mb-2 min-h-[2.5em] line-clamp-2">{product.name}</h4>
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-bold text-green-500">{currencyInfo.symbol}{getDisplayPrice(product.price)}</span>
                                    <button className="bg-white text-black p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default F4XStore;

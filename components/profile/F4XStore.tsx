import React, { useState, useMemo } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { ShoppingCart, Plus, Globe, X, ChevronLeft, CreditCard } from 'lucide-react';
import { F4XProduct } from '../../types.ts';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import { CURRENCY_MAP } from '../../screens/currency.ts';

const F4XStore: React.FC = () => {
    const { translate, currencyInfo, setCurrency, showStatus } = useApp();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isCurrencySelectorOpen, setIsCurrencySelectorOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<F4XProduct | null>(null);
    const [cart, setCart] = useState<F4XProduct[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // PRICES ARE ADJUSTED BASED ON 1 EUR = 4.05 SAR RATE TO MATCH EXACT SAR REQUESTS:
    // SAR 130.00 / 4.05 = 32.0987... -> 32.10
    // SAR 162.00 / 4.05 = 40.00
    // SAR 137.98 / 4.05 = 34.0691... -> 34.07
    // SAR 72.98 / 4.05 = 18.0197... -> 18.02
    // SAR 81.00 / 4.05 = 20.00
    const F4X_PRODUCTS: F4XProduct[] = useMemo(() => [
        { id: 'p1', name: translate('product.p1.name'), tagline: 'ISO-WHEY PREMIUM', price: 32.10, image_url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_Iso-whey_tiramisu.jpg', category: 'protein', description: 'Advanced recovery formula with ultra-filtered whey protein isolate. Ideal for rapid post-workout muscle repair.', benefits: ['Ultra-Filtered', 'Rapid Absorption', 'Zero Sugar'], nutrition_facts: [{label: 'Protein', value: '25g'}, {label: 'Carbs', value: '1g'}] },
        { id: 'p2', name: translate('product.p2.name'), tagline: 'MOCHACCHINO ENERGY', price: 32.10, image_url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_Iso_Mochacchino.jpg', category: 'protein', description: 'High-performance protein combined with natural coffee extracts for that extra metabolic kick.', benefits: ['Natural Caffeine', 'Delicious Taste', 'No Clumping'], nutrition_facts: [{label: 'Protein', value: '24g'}, {label: 'Caffeine', value: '80mg'}] },
        { id: 'p3', name: translate('product.p3.name'), tagline: 'NATURAL STRAWBERRY', price: 32.10, image_url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_Iso-whey_strawberry.jpg', category: 'protein', description: 'Pure strawberry essence in every scoop. Refreshing and packed with essential amino acids.', benefits: ['Real Fruit Flavour', 'Low Calorie', 'High BCAA'], nutrition_facts: [{label: 'Protein', value: '26g'}, {label: 'L-Leucine', value: '3g'}] },
        { id: 'p4', name: translate('product.p4.name'), tagline: 'MASS BUILDER', price: 40.00, image_url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_massgainer_vanilla.jpg', category: 'recovery', description: 'Engineered for muscle hypertrophy and caloric density. For those who find it hard to gain size.', benefits: ['Complex Carbs', 'Slow Digesting', 'Massive Gains'], nutrition_facts: [{label: 'Calories', value: '750'}, {label: 'Protein', value: '50g'}] },
        { id: 'p5', name: translate('product.p5.name'), tagline: 'LADIES CHOICE', price: 34.07, image_url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_Feline-women_whey.jpg', category: 'protein', description: 'Optimized for female biology. Includes iron, folic acid, and digestive enzymes for bloating-free nutrition.', benefits: ['Iron Enriched', 'Anti-Bloat', 'Silky Texture'], nutrition_facts: [{label: 'Protein', value: '22g'}, {label: 'Iron', value: '10mg'}] },
        { id: 'p6', name: translate('product.p6.name'), tagline: 'EXPLOSIVE POWER', price: 18.02, image_url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_Rhino.jpg', category: 'energy', description: 'Maximum training intensity agent. Focus, pump, and sustained energy without the crash.', benefits: ['Beta-Alanine', 'Nitric Oxide', 'Focus Matrix'], nutrition_facts: [{label: 'Citrus Aurantium', value: '500mg'}, {label: 'Beta-Alanine', value: '3g'}] },
        { id: 'p7', name: translate('product.p7.name'), tagline: 'THERMOGENIC AGENT', price: 20.00, image_url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_fatburner.jpg', category: 'wellness', description: 'Target lipid oxidation via thermogenesis. Increase your basal metabolic rate safely.', benefits: ['L-Carnitine', 'Green Tea Extract', 'Fast Acting'], nutrition_facts: [{label: 'Capsicum', value: '100mg'}, {label: 'L-Carnitine', value: '1g'}] }
    ], [translate]);

    const CATEGORIES = [
        { id: 'all', label: translate('store.cat.all') },
        { id: 'protein', label: translate('store.cat.protein') },
        { id: 'energy', label: translate('store.cat.energy') },
        { id: 'recovery', label: translate('store.cat.recovery') },
        { id: 'wellness', label: translate('store.cat.wellness') }
    ];

    const filteredProducts = useMemo(() => {
        return F4X_PRODUCTS.filter(p => selectedCategory === 'all' || p.category === selectedCategory);
    }, [selectedCategory, F4X_PRODUCTS]);

    const renderPrice = (price: number) => {
        const rate = currencyInfo.rate || 1;
        const converted = (price * rate).toFixed(2);
        return (
            <div className="flex items-center gap-1 font-bold">
                <span className="text-[#8A2BE2] text-[10px] uppercase font-black">{currencyInfo.symbol}</span>
                <span className="text-white text-sm font-mono">{converted}</span>
            </div>
        );
    };

    const addToCart = (p: F4XProduct, e?: React.MouseEvent) => {
        if(e) e.stopPropagation();
        setCart([...cart, p]);
        showStatus(`${p.name} added to cart!`);
    };

    const handleCheckout = () => {
        showStatus("Redirecting to Secure Checkout...");
    };

    const cartTotal = cart.reduce((sum, p) => sum + p.price, 0);

    return (
        <div className="bg-black min-h-screen pb-32 animate-fadeIn text-white font-['Poppins']">
            {/* Currency Selector Modal */}
            {isCurrencySelectorOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
                    <Card className="max-w-sm w-full relative">
                        <button onClick={() => setIsCurrencySelectorOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-1">
                            <X className="w-6 h-6"/>
                        </button>
                        <h2 className="text-xl font-bold text-white mb-4">{translate('sub.selectCurrency')}</h2>
                        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                            {(Object.entries(CURRENCY_MAP) as [string, any][]).map(([code, { symbol }]) => (
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

            {/* Product Details Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black z-[110] overflow-y-auto animate-slideInUp">
                    <header className="p-6 flex items-center border-b border-gray-900 sticky top-0 bg-black z-20">
                        <button onClick={() => setSelectedProduct(null)} className="p-2 -ml-2 text-gray-400 hover:text-white">
                            <ChevronLeft size={32} />
                        </button>
                        <h2 className="flex-1 text-center font-black uppercase tracking-widest text-xs">DETAILS</h2>
                        <div className="w-8" />
                    </header>
                    <div className="p-6">
                        <div className="aspect-square bg-gray-900 rounded-3xl mb-8 flex items-center justify-center p-8 border border-gray-800 shadow-inner">
                             <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">{selectedProduct.name}</h1>
                        <p className="text-[#8A2BE2] font-bold text-sm mb-6">{selectedProduct.tagline}</p>
                        
                        <div className="space-y-8 mb-32">
                            <section>
                                <h3 className="text-gray-500 font-black uppercase text-[10px] tracking-widest mb-3 border-b border-gray-800 pb-1">Description</h3>
                                <p className="text-gray-300 text-sm leading-relaxed font-normal">{selectedProduct.description}</p>
                            </section>

                            <section>
                                <h3 className="text-gray-500 font-black uppercase text-[10px] tracking-widest mb-3 border-b border-gray-800 pb-1">BENEFITS</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProduct.benefits.map(b => (
                                        <span key={b} className="bg-red-950/30 border border-red-600/30 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{b}</span>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-gray-500 font-black uppercase text-[10px] tracking-widest mb-3 border-b border-gray-800 pb-1">NUTRITION</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedProduct.nutrition_facts.map(f => (
                                        <div key={f.label} className="bg-gray-900 p-3 rounded-xl flex justify-between items-center border border-gray-800">
                                            <span className="text-[10px] text-gray-500 uppercase font-black">{f.label}</span>
                                            <span className="text-sm font-mono text-white">{f.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                    <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-30">
                        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Price</p>
                                {renderPrice(selectedProduct.price)}
                            </div>
                            <Button onClick={() => addToCart(selectedProduct)} className="flex-1 py-4 flex items-center justify-center gap-2">
                                <Plus size={16} /> ADD TO BASKET
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Modal */}
            {isCartOpen && (
                <div className="fixed inset-0 bg-black/95 z-[120] flex flex-col animate-fadeIn">
                    <header className="p-6 border-b border-gray-900 flex justify-between items-center">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">YOUR BASKET</h2>
                        <button onClick={() => setIsCartOpen(false)} className="text-gray-400 p-2"><X size={32}/></button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {cart.length === 0 ? (
                            <p className="text-center text-gray-500 mt-20 uppercase font-black text-xs tracking-[0.3em]">Your basket is empty</p>
                        ) : (
                            cart.map((p, idx) => (
                                <div key={idx} className="flex gap-4 bg-gray-900 p-4 rounded-2xl border border-gray-800">
                                    <img src={p.image_url} className="w-16 h-16 object-contain" alt={p.name} />
                                    <div className="flex-1">
                                        <h4 className="text-[11px] font-black uppercase tracking-widest leading-tight">{p.name}</h4>
                                        <div className="mt-1">{renderPrice(p.price)}</div>
                                    </div>
                                    <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-500"><X size={20}/></button>
                                </div>
                            ))
                        )}
                    </div>
                    {cart.length > 0 && (
                        <div className="p-6 border-t border-gray-900 bg-gray-950">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-500 font-black uppercase tracking-widest text-xs">Total</span>
                                <span className="text-2xl font-mono font-black">{currencyInfo.symbol}{(cartTotal * currencyInfo.rate).toFixed(2)}</span>
                            </div>
                            <Button onClick={handleCheckout} className="w-full py-5 flex items-center justify-center gap-3 shadow-2xl">
                                <CreditCard size={20} /> CHECKOUT
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Store Header */}
            <div className="px-6 flex justify-between items-center h-16 border-b border-gray-900 mb-6 bg-black sticky top-0 z-40 backdrop-blur-md">
                <div className="flex items-center">
                    <span className="font-black text-white uppercase tracking-tighter text-lg">F4X <span className="text-red-600">STORE</span></span>
                </div>
                
                <button onClick={() => setIsCurrencySelectorOpen(true)} className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8A2BE2]/10 border border-[#8A2BE2]/30 transition-all hover:scale-105 active:scale-95">
                    <Globe className="w-4 h-4 text-[#8A2BE2]" />
                    <span className="text-[#8A2BE2] text-[10px] font-black uppercase tracking-widest">{currencyInfo.symbol} {currencyInfo.code}</span>
                </button>

                <button onClick={() => setIsCartOpen(true)} className="flex items-center relative">
                    <ShoppingCart className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
                    {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                            {cart.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Category Navigation */}
            <div className="mb-8 overflow-x-auto no-scrollbar px-6 flex gap-3">
                {CATEGORIES.map(cat => (
                    <button 
                      key={cat.id} 
                      onClick={() => setSelectedCategory(cat.id)} 
                      className={`whitespace-nowrap px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat.id ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-red-950/20 text-red-500 border border-red-900/30 hover:border-red-500/50'}`}
                    >
                      {cat.label}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="px-6 pb-12">
                <div className="grid grid-cols-2 gap-4">
                    {filteredProducts.map((product) => (
                        <div 
                            key={product.id} 
                            onClick={() => setSelectedProduct(product)}
                            className="bg-red-950/20 rounded-3xl p-4 border border-red-600/10 relative group active:scale-95 transition-all shadow-xl overflow-hidden flex flex-col min-h-[220px] cursor-pointer hover:border-red-600/40"
                        >
                            <div className="w-full aspect-square mb-4 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[7px] text-red-400 font-black uppercase tracking-[0.2em] mb-1">{translate(`store.cat.${product.category}`)}</p>
                                <h4 className="text-[9px] font-bold text-white leading-tight mb-3 uppercase tracking-wide">{product.name}</h4>
                            </div>
                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-red-900/10">
                                {renderPrice(product.price)}
                                <button 
                                    onClick={(e) => addToCart(product, e)}
                                    className="p-1.5 bg-red-600 rounded-lg text-white shadow-lg hover:bg-red-500 transition-colors"
                                >
                                    <Plus size={10} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default F4XStore;
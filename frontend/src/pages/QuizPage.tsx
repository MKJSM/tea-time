
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Coffee, Sun, Moon, Wind } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuizPage: React.FC = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const questions = [
    {
      text: "How do you prefer to start your morning?",
      options: [
        { icon: Sparkles, label: "A burst of energy", value: "high-caffeine" },
        { icon: Coffee, label: "A slow, warm hug", value: "earthy" },
        { icon: Wind, label: "Light and airy", value: "floral" },
      ]
    },
    {
      text: "Which flavor palette speaks to your soul?",
      options: [
        { label: "Freshly cut grass & citrus", value: "green" },
        { label: "Dark chocolate & honey", value: "black" },
        { label: "Lilies & spring air", value: "white" },
        { label: "Toasted nuts & cream", value: "oolong" },
      ]
    },
    {
      text: "When do you typically enjoy your tea?",
      options: [
        { icon: Sun, label: "Mid-day break", value: "medium" },
        { icon: Moon, label: "Unwinding before bed", value: "herbal" },
        { label: "Multiple times throughout", value: "any" },
      ]
    }
  ];

  const handleNext = (val: any) => {
    setAnswers({ ...answers, [step]: val });
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setIsCompleted(true);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {!isCompleted ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-xl w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-tea-100 text-center"
          >
            <div className="mb-8">
              <p className="text-tea-600 font-bold uppercase text-xs tracking-widest mb-2">Discovery Quiz • Step {step + 1} of 3</p>
              <h2 className="text-3xl font-serif font-bold text-tea-900 leading-tight">{questions[step].text}</h2>
            </div>

            <div className="space-y-4">
              {questions[step].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleNext(opt.value)}
                  className="w-full p-6 bg-gray-50 hover:bg-tea-50 border border-gray-100 hover:border-tea-300 rounded-3xl transition-all flex items-center justify-center gap-3 group"
                >
                  {opt.icon && <opt.icon className="text-tea-400 group-hover:text-tea-600 transition-colors" />}
                  <span className="font-bold text-gray-700 group-hover:text-tea-900">{opt.label}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-10 flex justify-center gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${step === i ? 'w-8 bg-tea-700' : 'w-2 bg-gray-200'}`} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full bg-tea-900 text-white rounded-[3rem] p-16 shadow-2xl text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none">
               <img src="https://images.unsplash.com/photo-1594631252845-29fc458695d7?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover" />
            </div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <Check className="text-tea-900" size={40} />
              </div>
              <h2 className="text-5xl font-serif font-bold mb-6">Your Profile Found</h2>
              <p className="text-tea-100 text-lg mb-10 leading-relaxed font-light">
                Based on your soul's preferences, you are a <span className="font-bold text-accent-400">Zen Master of Greens</span>. We've curated a special selection of high-altitude Gyokuro and vibrant Matcha for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/shop" className="px-10 py-5 bg-accent-600 text-tea-900 font-bold rounded-2xl hover:bg-accent-700 transition-all shadow-lg">
                  Shop Curated List
                </Link>
                <button 
                  onClick={() => setIsCompleted(false)}
                  className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/30 transition-all"
                >Start Over</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizPage;

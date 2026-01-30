import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useGeoCurrency } from '@/hooks/use-geo-currency';
import { HighTechBackground, HighTechCardWrapper, PulsingDot, LiveBadge } from '@/components/ui/high-tech-background';
import {
  Globe, Sparkles, Wand2, Code2, Palette, Rocket, ArrowRight,
  CheckCircle2, Lock, RefreshCw, Eye, Layers, Smartphone, Monitor,
  Zap, Settings2, Download, ExternalLink, MessageSquare, Image,
  FileCode, Layout, Box, Send, Crown, Star, Building2
} from 'lucide-react';

interface WebBuilderPanelProps {
  selectedDomain: string | null;
}

type BuilderStep = 'describe' | 'generating' | 'preview' | 'editing';

const SITE_TEMPLATES = [
  { id: 'business', name: 'Business', icon: Building2, description: 'Professional corporate site' },
  { id: 'landing', name: 'Landing Page', icon: Rocket, description: 'High-converting single page' },
  { id: 'portfolio', name: 'Portfolio', icon: Palette, description: 'Showcase your work' },
  { id: 'ecommerce', name: 'E-Commerce', icon: Box, description: 'Online store ready' },
  { id: 'blog', name: 'Blog', icon: FileCode, description: 'Content-focused design' },
  { id: 'saas', name: 'SaaS', icon: Code2, description: 'Software product site' },
];

const GENERATION_STEPS = [
  { label: 'Analyzing requirements', duration: 2000 },
  { label: 'Generating structure', duration: 2500 },
  { label: 'Designing components', duration: 3000 },
  { label: 'Optimizing for SEO', duration: 1500 },
  { label: 'Finalizing build', duration: 1000 },
];

export function WebBuilderPanel({ selectedDomain }: WebBuilderPanelProps) {
  const { user } = useAuth();
  const { formatLocalPrice, countryCode } = useGeoCurrency();
  
  const [step, setStep] = useState<BuilderStep>('describe');
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('business');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [generatedSite, setGeneratedSite] = useState<any>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please sign in to use the AI Website Generator');
      return;
    }
    
    if (!isSubscribed) {
      setShowPaywall(true);
      return;
    }
    
    if (!prompt.trim()) {
      toast.error('Please describe the website you want to create');
      return;
    }
    
    setIsGenerating(true);
    setStep('generating');
    setGenerationProgress(0);
    
    // Simulate generation steps
    let totalTime = 0;
    for (let i = 0; i < GENERATION_STEPS.length; i++) {
      const genStep = GENERATION_STEPS[i];
      setGenerationStep(genStep.label);
      
      const progressStart = (i / GENERATION_STEPS.length) * 100;
      const progressEnd = ((i + 1) / GENERATION_STEPS.length) * 100;
      
      // Animate progress
      const steps = 20;
      const stepDuration = genStep.duration / steps;
      for (let j = 0; j < steps; j++) {
        await new Promise(r => setTimeout(r, stepDuration));
        setGenerationProgress(progressStart + ((progressEnd - progressStart) * (j / steps)));
      }
      
      totalTime += genStep.duration;
    }
    
    setGenerationProgress(100);
    
    // Simulate generated site data
    setGeneratedSite({
      title: `${selectedDomain || 'mysite'}.com`,
      template: selectedTemplate,
      pages: ['Home', 'About', 'Services', 'Contact'],
      sections: [
        { name: 'Hero', type: 'hero' },
        { name: 'Features', type: 'features' },
        { name: 'Testimonials', type: 'testimonials' },
        { name: 'CTA', type: 'cta' },
        { name: 'Footer', type: 'footer' },
      ],
      prompt,
    });
    
    setIsGenerating(false);
    setStep('preview');
    toast.success('Website generated successfully!');
  };

  const handleEdit = async () => {
    if (!editPrompt.trim()) {
      toast.error('Please describe the changes you want to make');
      return;
    }
    
    setIsEditing(true);
    
    // Simulate AI editing
    await new Promise(r => setTimeout(r, 3000));
    
    toast.success('Changes applied successfully!');
    setEditPrompt('');
    setIsEditing(false);
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }
    
    setIsProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: 'price_1SvPF2DhwTkpKWXvqgqQcstn',
          mode: 'subscription',
          successUrl: `${window.location.origin}/vi-dashboard?tab=web&success=true`,
          cancelUrl: `${window.location.origin}/vi-dashboard?tab=web&canceled=true`,
          metadata: {
            type: 'web_builder_subscription',
            domain: selectedDomain,
          }
        }
      });
      
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Failed to start checkout');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="relative min-h-[600px]">
      <HighTechBackground variant="default" showParticles showGrid showScanLine />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-6"
      >
        <div className="glass-card rounded-2xl p-6 border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-background to-fuchsia-500/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">AI Website Generator</h2>
                  <LiveBadge label="AI POWERED" color="violet" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Describe your vision → AI builds your website → Edit inline with AI assistance
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro Subscriber
                </Badge>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowPaywall(true)}
                  className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  Unlock Pro
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {step === 'describe' && (
          <motion.div
            key="describe"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 space-y-6"
          >
            {/* Template Selection */}
            <div className="glass-card rounded-2xl p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Layout className="w-4 h-4 text-violet-400" />
                <h3 className="font-bold">Choose a Template</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {SITE_TEMPLATES.map((template) => (
                  <HighTechCardWrapper key={template.id} showGlow={selectedTemplate === template.id}>
                    <button
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`w-full glass-card rounded-xl p-4 text-center transition-all duration-300 ${
                        selectedTemplate === template.id 
                          ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/30' 
                          : 'border-border/50 hover:border-violet-500/30'
                      }`}
                    >
                      <template.icon className={`w-6 h-6 mx-auto mb-2 ${selectedTemplate === template.id ? 'text-violet-400' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-medium">{template.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{template.description}</p>
                    </button>
                  </HighTechCardWrapper>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="glass-card rounded-2xl p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                <h3 className="font-bold">Describe Your Website</h3>
              </div>
              
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: I need a modern plumbing company website with a hero section showing emergency services, a services grid, customer testimonials carousel, and a contact form with booking calendar. Use dark blue and orange colors with professional imagery..."
                className="min-h-[120px] bg-background/50 border-border/50 focus:border-violet-500/50 resize-none"
              />
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  <span>AI will generate a complete, responsive website from your description</span>
                </div>
                
                <Button 
                  onClick={handleGenerate}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white"
                  disabled={!prompt.trim() || isGenerating}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Website
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { icon: Zap, label: 'Instant Generation', desc: 'Full website in under 30 seconds', color: 'text-amber-400' },
                { icon: Smartphone, label: 'Mobile Responsive', desc: 'Looks perfect on all devices', color: 'text-cyan-400' },
                { icon: Palette, label: 'AI Design', desc: 'Professional layouts & colors', color: 'text-violet-400' },
                { icon: Code2, label: 'Clean Code', desc: 'Optimized & production-ready', color: 'text-emerald-400' },
              ].map((feature) => (
                <HighTechCardWrapper key={feature.label}>
                  <div className="glass-card rounded-xl p-4 text-center h-full">
                    <feature.icon className={`w-6 h-6 mx-auto mb-2 ${feature.color}`} />
                    <p className="text-sm font-semibold">{feature.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{feature.desc}</p>
                  </div>
                </HighTechCardWrapper>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 flex flex-col items-center justify-center py-16"
          >
            <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center border border-violet-500/30">
              <motion.div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-6 border border-violet-500/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Wand2 className="w-10 h-10 text-violet-400" />
              </motion.div>
              
              <h3 className="text-xl font-bold mb-2">Building Your Website</h3>
              <p className="text-sm text-muted-foreground mb-6">{generationStep}...</p>
              
              <Progress value={generationProgress} className="h-2 mb-4" />
              <p className="text-sm font-medium">{Math.round(generationProgress)}% Complete</p>
            </div>
          </motion.div>
        )}

        {step === 'preview' && generatedSite && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 space-y-6"
          >
            {/* Preview Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setStep('describe')}>
                  ← Back to Editor
                </Button>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Generated Successfully
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="glass-card rounded-lg p-1 flex items-center gap-1">
                  <Button
                    variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('desktop')}
                    className="h-7 px-2"
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('mobile')}
                    className="h-7 px-2"
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
                
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Publish
                </Button>
              </div>
            </div>

            {/* Preview Frame */}
            <div className="glass-card rounded-2xl p-4 border border-border/50">
              <div className={`mx-auto bg-background rounded-xl border border-border overflow-hidden transition-all duration-300 ${
                viewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'
              }`}>
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-background rounded-md px-3 py-1 text-xs text-muted-foreground text-center">
                      {generatedSite.title}
                    </div>
                  </div>
                </div>
                
                {/* Site Preview Mockup */}
                <div className="min-h-[400px] p-6 space-y-6">
                  {generatedSite.sections.map((section: any, idx: number) => (
                    <motion.div
                      key={section.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`rounded-lg border border-dashed border-violet-500/30 p-4 ${
                        section.type === 'hero' ? 'h-32' : 'h-20'
                      } flex items-center justify-center bg-violet-500/5`}
                    >
                      <span className="text-sm text-violet-400 font-medium">{section.name} Section</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Inline AI Editor */}
            <div className="glass-card rounded-2xl p-6 border border-violet-500/20 bg-gradient-to-r from-violet-500/5 via-background to-fuchsia-500/5">
              <div className="flex items-center gap-2 mb-4">
                <Wand2 className="w-5 h-5 text-violet-400" />
                <h3 className="font-bold">AI Editor</h3>
                <Badge variant="outline" className="text-[10px]">Inline Editing</Badge>
              </div>
              
              <div className="flex gap-3">
                <Input
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Describe changes: 'Make the hero section taller', 'Add a pricing table', 'Change colors to blue'..."
                  className="flex-1 bg-background/50"
                  disabled={isEditing}
                />
                <Button 
                  onClick={handleEdit}
                  disabled={!editPrompt.trim() || isEditing}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                >
                  {isEditing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Apply Changes
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  AI understands natural language
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-cyan-400" />
                  Changes preview instantly
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  Unlimited revisions
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paywall Modal */}
      <AnimatePresence>
        {showPaywall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowPaywall(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-2xl p-8 max-w-lg w-full border border-violet-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/25">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Unlock AI Website Generator</h2>
                <p className="text-muted-foreground">
                  Build unlimited websites and applications with AI assistance
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                {[
                  'Unlimited AI website generation',
                  'All templates included',
                  'Inline AI editing assistant',
                  'Export to any platform',
                  'Mobile-responsive designs',
                  'SEO-optimized code output',
                  'Priority generation queue',
                  '24/7 support',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-violet-400 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="glass-card rounded-xl p-4 mb-6 text-center bg-violet-500/5 border border-violet-500/20">
                <p className="text-sm text-muted-foreground mb-1">Monthly subscription</p>
                <p className="text-4xl font-bold gradient-text">{formatLocalPrice(12500)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {countryCode !== 'US' && 'Billed in USD • '}Cancel anytime
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setShowPaywall(false)}
                >
                  Maybe Later
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                  onClick={handleSubscribe}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

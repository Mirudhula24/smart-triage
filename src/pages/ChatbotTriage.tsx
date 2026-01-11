import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, AlertTriangle, Bot, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isEmergency?: boolean;
}

const EMERGENCY_KEYWORDS = [
  'chest pain', 'can\'t breathe', 'difficulty breathing', 'severe bleeding',
  'unconscious', 'stroke', 'heart attack', 'seizure', 'overdose',
  'suicidal', 'suicide', 'severe pain', 'numbness', 'paralysis'
];

const INITIAL_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content: 'Hello! I\'m your virtual triage assistant. I\'m here to help assess your symptoms and guide you to the appropriate level of care. Please describe what symptoms you\'re experiencing today.',
  timestamp: new Date(),
};

export default function ChatbotTriage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkForEmergency = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return EMERGENCY_KEYWORDS.some(keyword => lowerText.includes(keyword));
  };

  const generateBotResponse = (userMessage: string): string => {
    const isEmergency = checkForEmergency(userMessage);
    
    if (isEmergency) {
      return '🚨 **IMPORTANT**: Based on what you\'ve described, you may need immediate medical attention. Please call 911 or go to your nearest emergency room immediately. If you\'re unsure, err on the side of caution and seek emergency care now.';
    }

    const responses = [
      'Thank you for sharing that. Can you tell me how long you\'ve been experiencing these symptoms?',
      'I understand. On a scale of 1-10, how would you rate your discomfort level?',
      'That\'s helpful information. Have you taken any medications or treatments for this?',
      'Do you have any pre-existing conditions or allergies I should be aware of?',
      'Based on what you\'ve described, I recommend scheduling an appointment with your primary care provider within the next 24-48 hours. In the meantime, rest and stay hydrated.',
    ];

    const messageCount = messages.filter(m => m.role === 'user').length;
    return responses[Math.min(messageCount, responses.length - 1)];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const isEmergency = checkForEmergency(input);
    if (isEmergency) {
      setShowEmergencyBanner(true);
    }

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateBotResponse(userMessage.content),
        timestamp: new Date(),
        isEmergency,
      };
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);

      // Save to database
      if (user) {
        const allMessages = [...messages, userMessage, botResponse].map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
        }));
        
        supabase
          .from('chat_sessions')
          .upsert({
            user_id: user.id,
            messages: allMessages,
            status: 'active',
          })
          .then(({ error }) => {
            if (error) console.error('Error saving chat:', error);
          });
      }
    }, 1000);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground font-display">Symptom Assessment</h1>
          <p className="text-muted-foreground">
            Describe your symptoms to receive guidance on the appropriate level of care.
          </p>
        </div>

        {showEmergencyBanner && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-urgency-high-bg border border-urgency-high/20 p-4 animate-slide-up">
            <AlertTriangle className="h-6 w-6 text-urgency-high animate-pulse-soft" />
            <div>
              <p className="font-semibold text-urgency-high">Emergency Symptoms Detected</p>
              <p className="text-sm text-foreground">
                If you're experiencing a medical emergency, please call 911 immediately.
              </p>
            </div>
          </div>
        )}

        <Card className="flex h-[600px] flex-col overflow-hidden border-border shadow-healthcare">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 animate-slide-up',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot',
                    message.isEmergency && 'border-2 border-urgency-high'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="mt-1 text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="chat-bubble-bot">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-card p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your symptoms..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground text-center">
              ⚕️ This tool provides guidance only and is not a substitute for professional medical advice.
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

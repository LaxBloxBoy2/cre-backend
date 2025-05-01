'use client';

import { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatTabProps {
  dealId: string;
  dealData: any;
}

export default function AIChatTab({ dealId, dealData }: AIChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add initial welcome message
    setMessages([
      {
        role: 'assistant',
        content: `Hello! I'm your CRE analysis assistant. I can help you analyze this deal and answer questions about the ${dealData.project_name} property. What would you like to know?`,
        timestamp: new Date(),
      },
    ]);
  }, [dealData.project_name]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // In a real app, we would call the API
      // For now, we'll use a conditional to either use the API or mock data
      let response;
      
      if (process.env.NODE_ENV === 'production') {
        // Call the real API
        response = await sendChatMessage(dealId, input, {
          deal: dealData,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        });
      } else {
        // Mock response for development
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate a contextual response based on the input
        let responseText = '';
        
        if (input.toLowerCase().includes('cap rate')) {
          responseText = `The cap rate for this property is ${dealData.exit_cap_rate}%. This is calculated by dividing the net operating income (NOI) by the property value. For this property, with an NOI of $${(dealData.square_footage * dealData.projected_rent_per_sf * (1 - dealData.vacancy_rate / 100) - dealData.square_footage * dealData.operating_expenses_per_sf).toLocaleString()} and a total project cost of $${(dealData.acquisition_price + dealData.construction_cost).toLocaleString()}, the cap rate is ${dealData.exit_cap_rate}%.`;
        } else if (input.toLowerCase().includes('irr') || input.toLowerCase().includes('return')) {
          responseText = `Based on our projections, this property has an estimated 5-year IRR of 12.5%. This takes into account the projected cash flows, the exit value based on the exit cap rate of ${dealData.exit_cap_rate}%, and the initial investment.`;
        } else if (input.toLowerCase().includes('risk')) {
          responseText = `The main risks for this ${dealData.property_type} property in ${dealData.location} include:\n\n1. Market risk: The ${dealData.property_type} market in ${dealData.location} could experience increased vacancy rates.\n\n2. Interest rate risk: Rising interest rates could affect refinancing options.\n\n3. Construction risk: The $${dealData.construction_cost.toLocaleString()} construction budget could face overruns or delays.\n\n4. Leasing risk: Achieving the projected rent of $${dealData.projected_rent_per_sf}/SF might be challenging in certain market conditions.`;
        } else {
          responseText = `I understand you're asking about "${input}" for the ${dealData.project_name} property. This ${dealData.property_type} property in ${dealData.location} has an acquisition price of $${dealData.acquisition_price.toLocaleString()}, construction costs of $${dealData.construction_cost.toLocaleString()}, and a total square footage of ${dealData.square_footage.toLocaleString()} SF. The projected rent is $${dealData.projected_rent_per_sf}/SF with a vacancy rate of ${dealData.vacancy_rate}%. Would you like more specific information about this aspect of the deal?`;
        }
        
        response = { response: responseText };
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">AI Chat Assistant</h3>
        
        <div className="border border-gray-200 rounded-lg p-4 h-96 overflow-y-auto mb-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start mb-4 ${
                message.role === 'user' ? 'justify-end' : ''
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">AI</span>
                  </div>
                </div>
              )}
              <div
                className={`mx-3 p-3 rounded-lg shadow-sm ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-700 font-medium text-sm">You</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">AI</span>
                </div>
              </div>
              <div className="ml-3 bg-white p-3 rounded-lg shadow-sm">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce delay-100"></div>
                  <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Ask a question about this deal..."
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-500">
          Try asking: "What is the cap rate?", "Calculate the IRR", or "What are the risks of this investment?"
        </p>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParsedOption, ConversationState } from '@/types';
import { useChat } from '@/hooks/useChat';
import { UILanguage } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import MessageList from './MessageList';
import InputArea from './InputArea';
import WelcomeScreen from '@/components/welcome/WelcomeScreen';

interface WizardStepDef {
  key: 'wizard.origin' | 'wizard.fuel' | 'wizard.type' | 'wizard.budget' | 'wizard.results';
  states: ConversationState[];
}

const wizardStepDefs: WizardStepDef[] = [
  { key: 'wizard.origin', states: ['asking_car_origin', 'asking_residency'] },
  { key: 'wizard.fuel', states: ['asking_fuel_type'] },
  { key: 'wizard.type', states: ['asking_car_type', 'asking_condition'] },
  { key: 'wizard.budget', states: ['asking_budget', 'asking_fcr_famille'] },
  { key: 'wizard.results', states: ['showing_cars'] },
];

function getActiveStepIndex(state: ConversationState | undefined): number {
  if (!state) return -1;
  return wizardStepDefs.findIndex((step) => step.states.includes(state));
}

function isWizardState(state: ConversationState | undefined): boolean {
  if (!state) return false;
  return wizardStepDefs.some((step) => step.states.includes(state));
}

export default function ChatContainer() {
  const { messages, isLoading, error, sendUserMessage, clearConversation, retryMessage } = useChat();
  const { language } = useLanguage();

  const wizardSteps = wizardStepDefs.map((step) => ({
    label: t(step.key, language),
    states: step.states,
  }));

  const handleSuggestionSelect = useCallback(
    (option: ParsedOption) => {
      // Display full text in chat, send number to API
      sendUserMessage(option.text, undefined, option.number.toString());
    },
    [sendUserMessage]
  );

  const handleFAQClick = useCallback(
    (message: string, language?: UILanguage) => {
      sendUserMessage(message, language);
    },
    [sendUserMessage]
  );

  const hasMessages = messages.length > 0;

  // Get current wizard state from the latest assistant message
  const currentState = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].state) {
        return messages[i].state;
      }
    }
    return undefined;
  }, [messages]);

  const activeStepIndex = getActiveStepIndex(currentState);
  const showProgress = isWizardState(currentState);

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-center px-4 py-3 border-b border-[var(--border-medium)] bg-[var(--bg-secondary)] relative">
        {/* Logo/Title - Centered */}
        <span className="text-xl font-bold text-accent">{t('header.title', language)}</span>

        {/* Reset Button - only show when there are messages */}
        {hasMessages && (
          <button
            onClick={clearConversation}
            className="absolute right-4 p-2 rounded-lg text-text-secondary hover:text-accent
                       hover:bg-accent-light transition-colors"
            title={t('header.newConversation', language)}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Progress Breadcrumb */}
      <AnimatePresence>
        {showProgress && (
          <motion.div
            className="flex-shrink-0 px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-center gap-1 text-xs">
              {wizardSteps.map((step, index) => {
                const isActive = index === activeStepIndex;
                const isCompleted = index < activeStepIndex;

                return (
                  <div key={step.label} className="flex items-center gap-1">
                    {index > 0 && (
                      <span className={`mx-1 ${isCompleted || isActive ? 'text-accent' : 'text-text-secondary/30'}`}>
                        &rsaquo;
                      </span>
                    )}
                    <span
                      className={`transition-colors ${
                        isActive
                          ? 'text-accent font-semibold'
                          : isCompleted
                            ? 'text-accent/60'
                            : 'text-text-secondary/40'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Banner */}
      {error && (
        <div className="flex-shrink-0 px-4 py-2 bg-error/10 border-b border-error/20">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Welcome Screen or Messages */}
      {!hasMessages && !isLoading ? (
        <WelcomeScreen onFAQClick={handleFAQClick} />
      ) : (
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onSuggestionSelect={handleSuggestionSelect}
          onRetry={retryMessage}
        />
      )}

      {/* Input Area */}
      <InputArea onSend={sendUserMessage} disabled={isLoading} />
    </div>
  );
}

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import find from 'lodash/find';
import { IconBrain } from '@tabler/icons';
import { findItemInCollection } from 'utils/collections';
import StyledWrapper, { DragbarWrapper } from './StyledWrapper';

const MIN_WIDTH = 250;
const MAX_WIDTH = window.innerWidth * 0.6;
const DEFAULT_WIDTH = 360;

const AiAssistant = () => {
  const isOpen = useSelector((state) => state.app.isAiAssistantOpen);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const tabs = useSelector((state) => state.tabs.tabs);
  const collections = useSelector((state) => state.collections.collections);

  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  // Get active request context
  const activeContext = (() => {
    const focusedTab = find(tabs, (t) => t.uid === activeTabUid);
    if (!focusedTab?.collectionUid || !focusedTab?.itemUid) return null;
    const collection = find(collections, (c) => c.uid === focusedTab.collectionUid);
    if (!collection) return null;
    const item = findItemInCollection(collection, focusedTab.itemUid);
    if (!item?.request) return null;
    return {
      method: item.request.method,
      url: item.request.url,
      status: item.response?.status,
      responseData: item.response?.data
    };
  })();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Vertical resize handle (left edge of panel)
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleResize = useCallback((e) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
    setPanelWidth(clamped);
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => setIsResizing(false), []);

  useEffect(() => {
    if (!isResizing) return;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleResize, handleResizeEnd]);

  // Listen for streaming chunks from main process
  useEffect(() => {
    const { ipcRenderer } = window;
    if (!ipcRenderer) return;

    const removeChunk = ipcRenderer.on('ai-response-chunk', (chunk) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
        }
        return [...prev, { role: 'assistant', content: chunk }];
      });
    });

    const removeEnd = ipcRenderer.on('ai-response-end', () => {
      setIsStreaming(false);
    });

    const removeError = ipcRenderer.on('ai-response-error', (errMsg) => {
      setError(errMsg);
      setIsStreaming(false);
    });

    return () => {
      removeChunk?.();
      removeEnd?.();
      removeError?.();
    };
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setError(null);
    setInput('');
    setIsStreaming(true);

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);

    const context = activeContext
      ? {
          method: activeContext.method,
          url: activeContext.url,
          status: activeContext.status,
          responseData:
            typeof activeContext.responseData === 'string'
              ? activeContext.responseData.slice(0, 3000)
              : JSON.stringify(activeContext.responseData ?? '').slice(0, 3000)
        }
      : null;

    try {
      await window.ipcRenderer.invoke('send-ai-message', {
        messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        context
      });
    } catch (err) {
      setError(err?.message || 'Erreur lors de la communication avec le LLM.');
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, activeContext]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  if (!isOpen) return null;

  const contextLabel = activeContext
    ? `${activeContext.method} ${activeContext.url}`
    : 'Aucune requête active';

  const lastMessageIsStreaming = isStreaming && messages[messages.length - 1]?.role === 'assistant';

  return (
    <div style={{ display: 'flex', height: '100%', flexShrink: 0 }}>
      <DragbarWrapper
        className={isResizing ? 'active' : ''}
        onMouseDown={handleResizeStart}
      >
        <div className="ai-dragbar-handle" />
      </DragbarWrapper>
      <div style={{ width: `${panelWidth}px`, height: '100%', overflow: 'hidden', flexShrink: 0 }}>
        <StyledWrapper>
          <div className="ai-header">
            <div className="ai-header-title">
              <IconBrain size={14} strokeWidth={1.5} />
              Assistant AI
            </div>
            <span className="ai-context-badge" title={contextLabel}>
              {contextLabel}
            </span>
          </div>

          <div className="ai-messages">
            {messages.length === 0 && (
              <div className="ai-empty-state">
                Posez une question sur votre requête API...
              </div>
            )}
            {messages.map((msg, i) => {
              const isLastAndStreaming = lastMessageIsStreaming && i === messages.length - 1;
              return (
                <div
                  key={i}
                  className={`ai-message ${msg.role}${isLastAndStreaming ? ' streaming' : ''}`}
                >
                  <span className="ai-message-role">
                    {msg.role === 'user' ? 'Vous' : 'Assistant AI'}
                  </span>
                  <div className="ai-message-content">{msg.content}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {error && <div className="ai-error">Erreur : {error}</div>}

          <div className="ai-input-area">
            <textarea
              className="ai-input"
              rows={8}
              placeholder="Posez votre question... (Entrée pour envoyer, Maj+Entrée pour un saut de ligne)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
            />
            <button
              className="ai-send-btn"
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
            >
              {isStreaming ? '...' : 'Envoyer'}
            </button>
          </div>
        </StyledWrapper>
      </div>
    </div>
  );
};

export default AiAssistant;

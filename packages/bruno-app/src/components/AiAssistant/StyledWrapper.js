import styled from 'styled-components';

export const DragbarWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  min-width: 10px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  flex-shrink: 0;

  .ai-dragbar-handle {
    height: 100%;
    width: 1px;
    border-left: solid 1px ${(props) => props.theme.requestTabPanel.dragbar.border};
  }

  &:hover .ai-dragbar-handle,
  &.active .ai-dragbar-handle {
    border-left: solid 1px ${(props) => props.theme.requestTabPanel.dragbar.activeBorder};
  }
`;

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${(props) => props.theme.bg};
  border-left: 1px solid ${(props) => props.theme.requestTabPanel.dragbar.border};
  overflow: hidden;

  .ai-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    border-bottom: 1px solid ${(props) => props.theme.sidebar.dragbar};
    font-size: 12px;
    font-weight: 600;
    color: ${(props) => props.theme.text};
    flex-shrink: 0;
  }

  .ai-header-title {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ai-context-badge {
    font-size: 11px;
    font-weight: 400;
    color: ${(props) => props.theme.colors?.text?.muted || props.theme.textFaint};
    background: ${(props) => props.theme.sidebar.bg};
    border: 1px solid ${(props) => props.theme.sidebar.dragbar};
    border-radius: 4px;
    padding: 1px 6px;
    max-width: 400px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ai-messages {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ai-message {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 90%;
  }

  .ai-message.user {
    align-self: flex-end;
    align-items: flex-end;
  }

  .ai-message.assistant {
    align-self: flex-start;
    align-items: flex-start;
  }

  .ai-message-role {
    font-size: 10px;
    font-weight: 600;
    color: ${(props) => props.theme.textFaint};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ai-message-content {
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .ai-message.user .ai-message-content {
    background: ${(props) => props.theme.colors?.bg?.primary || props.theme.button?.secondary?.bg || '#3b82f6'};
    color: ${(props) => props.theme.colors?.text?.primary || '#fff'};
  }

  .ai-message.assistant .ai-message-content {
    background: ${(props) => props.theme.sidebar.bg};
    border: 1px solid ${(props) => props.theme.sidebar.dragbar};
    color: ${(props) => props.theme.text};
  }

  .ai-message.assistant.streaming .ai-message-content::after {
    content: '▌';
    animation: blink 0.7s step-end infinite;
  }

  @keyframes blink {
    50% { opacity: 0; }
  }

  .ai-empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.textFaint};
    font-size: 13px;
    font-style: italic;
  }

  .ai-input-area {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 8px 12px;
    border-top: 2px solid ${(props) => props.theme.requestTabPanel.dragbar.activeBorder};
    flex-shrink: 0;
  }

  .ai-input {
    flex: 1;
    resize: none;
    border: 1px solid ${(props) => props.theme.requestTabPanel.dragbar.border};
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
    line-height: 1.5;
    background: ${(props) => props.theme.sidebar.bg};
    color: ${(props) => props.theme.text};
    outline: none;
    font-family: inherit;
    overflow-y: auto;

    &:focus {
      border-color: ${(props) => props.theme.requestTabPanel.dragbar.activeBorder};
    }

    &::placeholder {
      color: ${(props) => props.theme.textFaint};
    }
  }

  .ai-send-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: ${(props) => props.theme.colors?.bg?.primary || '#3b82f6'};
    color: #fff;
    flex-shrink: 0;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      opacity: 0.9;
    }
  }

  .ai-error {
    color: ${(props) => props.theme.colors?.text?.danger || '#ef4444'};
    font-size: 12px;
    padding: 4px 12px;
    flex-shrink: 0;
  }
`;

export default StyledWrapper;

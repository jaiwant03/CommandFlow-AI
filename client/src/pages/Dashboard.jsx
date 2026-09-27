import React, { useState, useEffect } from 'react';

import {
  fetchAutomations,
  executeCommand,
  parseCommand,
  retryCommand,
  cancelCommand
} from '../services/automationService';
import socketService from '../services/socketService';

import CommandInput from '../components/CommandInput';
import VoiceRecorder from '../components/VoiceRecorder';

import {
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
  Mic,
  Mail,
  Send,
  Sparkles,
  Bot,
  Layers,
  RefreshCw,
  CalendarDays,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  X,
  Workflow,
  MessageCircle
} from 'lucide-react';

import '../styles/dashboard.css';


const Dashboard = ({ currentLanguage = 'auto' }) => {

  const [automations, setAutomations] = useState([]);
  const [commandText, setCommandText] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);

  const [executionStep, setExecutionStep] = useState(0);
  const [aiPreview, setAiPreview] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);

  const [activeAutomationId, setActiveAutomationId] = useState(null);
  const [selectedAutomation, setSelectedAutomation] =
    useState(null);


  /* ==========================================================
     LOAD DATA & REAL-TIME SOCKET SUBSCRIPTION
  ========================================================== */

  const loadData = async () => {
    try {
      const autoRes = await fetchAutomations();
      if (autoRes.success) {
        setAutomations(autoRes.data || []);
      }
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
    }
  };


  useEffect(() => {
    loadData();

    // Subscribe to real-time status updates via Socket.IO
    const unsubscribe = socketService.subscribeStatus((event) => {
      loadData();
      if (event.automationId && (event.automationId === activeAutomationId || isExecuting)) {
        if (event.status === 'PROCESSING' || event.status === 'SENDING') {
          setExecutionStep(6);
        } else if (event.status === 'SUCCESS' || event.status === 'SENT') {
          setExecutionStep(7);
          setIsExecuting(false);
          setExecutionResult({
            type: 'immediate',
            status: 'SUCCESS',
            message: event.message || 'Automation executed successfully!'
          });
        } else if (event.status === 'FAILED') {
          setExecutionStep(7);
          setIsExecuting(false);
          setExecutionResult({
            type: 'immediate',
            status: 'FAILED',
            message: event.error || event.message || 'Automation execution failed.'
          });
        }
      }
    });

    const interval = setInterval(loadData, 4000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [activeAutomationId, isExecuting]);


  const handleRetry = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await retryCommand(id);
      if (res.success) {
        setActiveAutomationId(id);
        socketService.joinAutomation(id);
        setIsExecuting(true);
        setExecutionStep(5);
        await loadData();
      }
    } catch (err) {
      console.error('Retry error:', err);
    }
  };

  const handleCancel = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await cancelCommand(id);
      await loadData();
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };


  /* ==========================================================
     COMMAND EXECUTION
  ========================================================== */

  const handleStartAnalysisAndRun = async (
    textToAnalyze,
    inputType = 'text',
    attachments = []
  ) => {

    if (
      !textToAnalyze ||
      !textToAnalyze.trim()
    ) {
      return;
    }

    setCommandText(textToAnalyze);

    setIsAnalyzing(true);
    setIsExecuting(false);

    setExecutionResult(null);
    setAiPreview(null);

    setExecutionStep(1);

    try {

      await new Promise((resolve) =>
        setTimeout(resolve, 350)
      );

      setExecutionStep(2);

      const parseRes =
        await parseCommand(
          textToAnalyze
        );

      const parsedData =
        parseRes.data || {};

      await new Promise((resolve) =>
        setTimeout(resolve, 350)
      );

      setExecutionStep(3);

      setAiPreview({
        userCommand: textToAnalyze,
        channel: parsedData.channel || 'gmail',
        intent: parsedData.intent || 'send_email',
        recipient: parsedData.recipient,
        recipients: parsedData.recipients || (parsedData.recipient?.email ? [parsedData.recipient.email] : []),
        subject: parsedData.subject || '',
        message: parsedData.message || parsedData.content || '',
        content: parsedData.message || parsedData.content || '',
        schedule: parsedData.schedule
      });

      await new Promise((resolve) =>
        setTimeout(resolve, 350)
      );

      setExecutionStep(4);

      setIsAnalyzing(false);
      setIsExecuting(true);

      const isScheduled =
        parsedData.schedule?.isScheduled;


      if (isScheduled) {

        setExecutionStep(4);

        const execRes = await executeCommand(
          textToAnalyze,
          inputType,
          attachments
        );

        setExecutionResult({

          type: 'scheduled',

          status: 'SCHEDULED',

          channel:
            parsedData.channel,

          recipient:
            parsedData.recipient,

          recipients:
            parsedData.recipients,

          scheduledDate:
            parsedData.schedule?.date,

          scheduledTime:
            parsedData.schedule?.time,

          intent:
            parsedData.intent,

          message:
            'Automation scheduled successfully. Waiting for background execution time.'

        });

      } else {
        setExecutionStep(5);

        const execRes = await executeCommand(
          textToAnalyze,
          inputType,
          attachments
        );

        const autoId = execRes.data?.automationId;
        if (autoId) {
          setActiveAutomationId(autoId);
          socketService.joinAutomation(autoId);
        }

        if (execRes.success && execRes.data?.status === 'SUCCESS') {
          setExecutionStep(7);
          setExecutionResult({
            type: 'immediate',
            status: 'SUCCESS',
            channel: parsedData.channel,
            recipient: parsedData.recipient,
            intent: parsedData.intent,
            content: parsedData.message || parsedData.content,
            subject: parsedData.subject,
            message: `✓ Successfully executed via ${parsedData.channel?.toUpperCase()} engine!`
          });
        } else if (execRes.success && (execRes.data?.status === 'QUEUED' || execRes.data?.status === 'PROCESSING')) {
          // Worker is currently executing in background, Socket.IO will trigger step 6 -> 7
          setExecutionStep(6);
          setExecutionResult({
            type: 'immediate',
            status: 'PROCESSING',
            channel: parsedData.channel,
            recipient: parsedData.recipient,
            intent: parsedData.intent,
            content: parsedData.message || parsedData.content,
            subject: parsedData.subject,
            message: 'Queued in BullMQ worker. Processing and dispatching...'
          });
        } else if (execRes.success && execRes.data?.status !== 'FAILED') {
          setExecutionStep(7);
          setExecutionResult({
            type: 'immediate',
            status: 'SUCCESS',
            channel: parsedData.channel,
            recipient: parsedData.recipient,
            intent: parsedData.intent,
            content: parsedData.message || parsedData.content,
            subject: parsedData.subject,
            message: `Successfully executed via ${parsedData.channel?.toUpperCase()} engine!`
          });
        } else {
          setExecutionStep(7);
          setExecutionResult({
            type: 'immediate',
            status: 'FAILED',
            channel: parsedData.channel,
            recipient: parsedData.recipient,
            intent: parsedData.intent,
            error: execRes.message || execRes.error?.message || execRes.data?.error || 'Automation execution failed',
            message: execRes.message || 'Execution failed.'
          });
        }
      }

      await loadData();

    } catch (err) {

      console.error(
        'Execution error:',
        err
      );

      setExecutionStep(7);

      setExecutionResult({
        type: 'immediate',
        status: 'FAILED',
        error:
          err.response?.data?.message ||
          err.message ||
          'Execution error encountered',
        message:
          'Command execution failed.'
      });

    } finally {

      setIsAnalyzing(false);
      setIsExecuting(false);

    }

  };


  /* ==========================================================
     STATISTICS
  ========================================================== */

  const totalCount =
    automations.length;

  const successCount =
    automations.filter(
      (a) =>
        a.status === 'SUCCESS' ||
        a.status === 'Success'
    ).length;

  const scheduledCount =
    automations.filter(
      (a) =>
        a.status === 'SCHEDULED' ||
        a.status === 'Scheduled'
    ).length;

  const failedCount =
    automations.filter(
      (a) =>
        a.status === 'FAILED' ||
        a.status === 'Failed'
    ).length;


  /* ==========================================================
     HELPERS
  ========================================================== */

  const getChannel = (automation) => {

    const channel =
      automation?.channel ||
      automation?.type ||
      'gmail';

    return channel.toLowerCase();

  };


  const getChannelIcon = (automation) => {

    const channel =
      getChannel(automation);

    if (
      channel.includes('telegram')
    ) {
      return (
        <Send
          size={19}
          strokeWidth={2.2}
        />
      );
    }

    if (
      channel.includes('calendar')
    ) {
      return (
        <CalendarDays
          size={19}
          strokeWidth={2.2}
        />
      );
    }

    if (
      channel.includes('n8n')
    ) {
      return (
        <Workflow
          size={19}
          strokeWidth={2.2}
        />
      );
    }

    if (
      channel.includes('stack')
    ) {
      return (
        <MessageCircle
          size={19}
          strokeWidth={2.2}
        />
      );
    }

    if (
      channel.includes('groq')
    ) {
      return (
        <Bot
          size={19}
          strokeWidth={2.2}
        />
      );
    }

    return (
      <Mail
        size={19}
        strokeWidth={2.2}
      />
    );

  };


  const getChannelName = (automation) => {

    const channel =
      getChannel(automation);

    if (
      channel.includes('telegram')
    ) {
      return 'Telegram';
    }

    if (
      channel.includes('calendar')
    ) {
      return 'Google Calendar';
    }

    if (
      channel.includes('n8n')
    ) {
      return 'n8n';
    }

    if (
      channel.includes('stack')
    ) {
      return 'Stack';
    }

    return 'Gmail';

  };


  const getChannelClass = (automation) => {

    const channel =
      getChannel(automation);

    if (
      channel.includes('telegram')
    ) {
      return 'telegram';
    }

    if (
      channel.includes('calendar')
    ) {
      return 'calendar';
    }

    if (
      channel.includes('n8n')
    ) {
      return 'n8n';
    }

    if (
      channel.includes('stack')
    ) {
      return 'stack';
    }

    return 'gmail';

  };


  const getAutomationTitle = (automation) => {

    if (
      automation?.generatedContent?.subject
    ) {
      return automation.generatedContent.subject;
    }

    if (
      automation?.subject
    ) {
      return automation.subject;
    }

    if (
      automation?.intent
    ) {

      const intent =
        automation.intent
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) =>
            c.toUpperCase()
          );

      return intent;

    }

    return 'Automation executed';

  };


  const getAutomationMeta = (automation) => {

    const channel =
      getChannelName(automation);

    let recipient =
      automation?.recipient?.name ||
      automation?.recipient?.email ||
      automation?.recipient?.telegramId ||
      '';

    if (recipient) {
      return `${channel} • ${recipient}`;
    }

    return channel;

  };


  const getStatusClass = (status) => {

    const normalized =
      String(status || '')
        .toUpperCase();

    if (
      normalized === 'SUCCESS'
    ) {
      return 'success';
    }

    if (
      normalized === 'FAILED'
    ) {
      return 'failed';
    }

    if (
      normalized === 'SCHEDULED'
    ) {
      return 'scheduled';
    }

    return 'running';

  };


  const formatDate = (date) => {

    if (!date) {
      return 'Recently';
    }

    try {

      return new Date(date)
        .toLocaleString(
          'en-IN',
          {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }
        );

    } catch {
      return 'Recently';
    }

  };


  /* ==========================================================
     STAT CARD
  ========================================================== */

  const StatCard = ({
    type,
    title,
    value,
    icon: Icon,
    trend,
    trendType = 'up'
  }) => (

    <div
      className={`cf-stat-card ${type}`}
    >

      <div className="cf-stat-top">

        <div
          className={`cf-stat-icon ${type}`}
        >
          <Icon
            size={20}
            strokeWidth={2.5}
          />
        </div>

        <div className="cf-stat-chart">

          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
          >

            <path
              d={
                type === 'failed'
                  ? 'M2 25 C18 34, 28 33, 42 29 S68 17, 98 34'
                  : type === 'scheduled'
                  ? 'M2 25 L25 25 L45 25 L65 25 L98 25'
                  : type === 'success'
                  ? 'M2 28 C18 17, 29 15, 44 20 S67 29, 79 19 S92 11, 98 6'
                  : 'M2 28 C17 13, 29 10, 43 18 S67 28, 78 16 S91 13, 98 4'
              }
            />

            <path
              className="chart-fill"
              d={
                type === 'failed'
                  ? 'M2 25 C18 34, 28 33, 42 29 S68 17, 98 34 L98 40 L2 40 Z'
                  : type === 'scheduled'
                  ? 'M2 25 L25 25 L45 25 L65 25 L98 25 L98 40 L2 40 Z'
                  : type === 'success'
                  ? 'M2 28 C18 17, 29 15, 44 20 S67 29, 79 19 S92 11, 98 6 L98 40 L2 40 Z'
                  : 'M2 28 C17 13, 29 10, 43 18 S67 28, 78 16 S91 13, 98 4 L98 40 L2 40 Z'
              }
            />

          </svg>

        </div>

      </div>

      <div className="cf-stat-content">

        <span className="cf-stat-title">
          {title}
        </span>

        <span className="cf-stat-value">
          {value}
        </span>

        <span
          className={`cf-stat-trend ${trendType}`}
        >

          {trendType === 'up' && (
            <ArrowUpRight size={12} />
          )}

          {trendType === 'flat' && (
            <ArrowRight size={12} />
          )}

          {trend}

        </span>

      </div>

    </div>

  );


  /* ==========================================================
     RECENT AUTOMATION ROW
  ========================================================== */

  const RecentAutomation = ({
    automation
  }) => {

    const status =
      String(
        automation?.status || ''
      ).toUpperCase();

    const statusClass =
      getStatusClass(status);

    const channelClass =
      getChannelClass(
        automation
      );

    return (

      <div
        className="cf-recent-row"
        onClick={() =>
          setSelectedAutomation(
            automation
          )
        }
      >

        <div className="cf-recent-left">

          <div
            className={`cf-recent-icon ${channelClass}`}
          >
            {getChannelIcon(
              automation
            )}
          </div>

          <div className="cf-recent-info">

            <div className="cf-recent-title">
              {getAutomationTitle(
                automation
              )}
            </div>

            <div className="cf-recent-meta">
              {getAutomationMeta(
                automation
              )}
            </div>

          </div>

        </div>


        <div className="cf-recent-middle">

          <span
            className={`cf-status-pill ${statusClass}`}
          >

            <span className="cf-status-dot" />

            {status || 'RUNNING'}

          </span>

        </div>


        <div className="cf-recent-right" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {status === 'FAILED' && (
            <button
              onClick={(e) => handleRetry(automation.automationId, e)}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', borderRadius: '4px' }}
              title="Retry Command"
            >
              <RefreshCw size={12} style={{ marginRight: '4px' }} />
              Retry
            </button>
          )}

          {status === 'SCHEDULED' && (
            <button
              onClick={(e) => handleCancel(automation.automationId, e)}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', borderRadius: '4px', color: 'var(--danger)' }}
              title="Cancel Scheduled Command"
            >
              <X size={12} style={{ marginRight: '4px' }} />
              Cancel
            </button>
          )}

          <span className="cf-recent-time">
            {formatDate(
              automation?.createdAt ||
              automation?.updatedAt
            )}
          </span>

          <ChevronRight
            size={16}
            className="cf-recent-chevron"
          />
        </div>

      </div>

    );

  };


  /* ==========================================================
     RETURN
  ========================================================== */

  return (

    <div className="cf-dashboard">

      <div className="cf-bg-orb cf-bg-orb-one" />
      <div className="cf-bg-orb cf-bg-orb-two" />

      <div className="cf-dashboard-inner">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="cf-dashboard-header">

          <div>

            <div className="cf-title-row">

              <h1 className="cf-page-title">
                Command Center
              </h1>

              <Sparkles
                size={20}
                className="cf-title-sparkle"
              />

            </div>

            <p className="cf-page-subtitle">
              Natural language to Groq AI to n8n automation pipeline.
            </p>

          </div>


          <button
            className="cf-sync-btn"
            onClick={loadData}
          >

            <RefreshCw size={16} />

            Sync Status

          </button>

        </div>


        {/* ==================================================
            COMMAND CARD
        ================================================== */}

        <section className="cf-command-card">

          <div className="cf-command-card-inner">

            <div className="cf-command-header">

              <div>

                <div className="cf-command-label">

                  <span>⚡</span>

                  NATURAL LANGUAGE COMMAND INPUT

                </div>

                <h2 className="cf-command-title">
                  What would you like to automate?
                </h2>

              </div>


              <button
                className="cf-voice-btn"
                onClick={() =>
                  setShowVoiceModal(true)
                }
              >

                <Mic size={17} />

                Voice Input (
                {currentLanguage === 'auto'
                  ? 'AUTO'
                  : currentLanguage.toUpperCase()}
                )

              </button>

            </div>


            <div className="cf-command-input-wrapper">

              <CommandInput
                value={commandText}
                onChange={setCommandText}
                onExecute={
                  handleStartAnalysisAndRun
                }
                isLoading={
                  isAnalyzing ||
                  isExecuting
                }
              />

            </div>

          </div>

        </section>


        {/* ==================================================
            EXECUTION TRACE
        ================================================== */}

        {(executionStep > 0 ||
          executionResult ||
          aiPreview) && (

          <section className="cf-execution-card">

            <div className="cf-execution-header">

              <div className="cf-execution-title">

                <Sparkles size={17} />

                AI Interpretation & Execution Trace

              </div>

            </div>


            <div className="cf-progress-steps">

              {[
                'Understanding command',
                'Detecting intent',
                'Resolving recipient',
                'Generating content',
                'Sending through n8n',
                'Gmail / Telegram execution',
                'Status Output'
              ].map(
                (stepLabel, index) => {

                  const stepNum =
                    index + 1;

                  const isCurrent =
                    executionStep ===
                      stepNum &&
                    (isAnalyzing ||
                      isExecuting);

                  const isDone =
                    executionStep >
                      stepNum ||
                    (executionStep === 7 &&
                      executionResult);

                  return (

                    <div
                      key={stepNum}
                      className={`
                        cf-progress-pill
                        ${isCurrent ? 'current' : ''}
                        ${isDone ? 'done' : ''}
                      `}
                    >

                      {isCurrent && (
                        <Zap
                          size={12}
                          className="spin"
                        />
                      )}

                      {isDone && (
                        <CheckCircle
                          size={12}
                        />
                      )}

                      {stepNum}. {stepLabel}

                    </div>

                  );

                }
              )}

            </div>


            {aiPreview && (

              <div className="cf-ai-preview">

                <div className="cf-ai-preview-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bot size={17} color="#2563EB" />
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 750, fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    AI Interpretation & Execution Trace
                  </span>
                </div>

                <div className="cf-trace-debug-card" style={{
                  background: '#0B132B',
                  color: '#F8FAFC',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.35rem',
                  marginTop: '1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.925rem',
                  lineHeight: '1.7',
                  letterSpacing: '-0.012em',
                  border: '1px solid #1E293B',
                  boxShadow: '0 8px 24px rgba(11, 19, 43, 0.25)'
                }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em' }}>USER COMMAND:</span>{' '}
                    <span style={{ color: '#F1F5F9', fontWeight: 500 }}>{aiPreview.userCommand || commandText}</span>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em' }}>CHANNEL:</span>{' '}
                    <span style={{ color: '#10B981', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                      {aiPreview.channel?.toUpperCase() || 'GMAIL'}
                    </span>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em' }}>RECIPIENT:</span>{' '}
                    <span style={{ color: '#F1F5F9', fontWeight: 500 }}>
                      {(aiPreview.recipients && aiPreview.recipients.length > 0)
                        ? aiPreview.recipients.join(', ')
                        : (aiPreview.recipient?.email || aiPreview.recipient?.name || aiPreview.recipient?.chatId || 'N/A')}
                    </span>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em' }}>GENERATED SUBJECT:</span>{' '}
                    <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{aiPreview.subject || 'N/A'}</span>
                  </div>

                  <div>
                    <span style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em' }}>GENERATED MESSAGE:</span>
                    <div style={{
                      color: '#F1F5F9',
                      whiteSpace: 'pre-wrap',
                      marginTop: '0.45rem',
                      backgroundColor: '#162038',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #233554',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.925rem',
                      lineHeight: '1.75'
                    }}>
                      {aiPreview.message || aiPreview.content || 'N/A'}
                    </div>
                  </div>
                </div>

              </div>

            )}


            {executionResult && (

              <div
                className={`cf-result-card ${
                  executionResult.status?.toLowerCase()
                }`}
              >

                <div className="cf-result-top">

                  <span
                    className={`cf-result-badge ${
                      executionResult.status?.toLowerCase()
                    }`}
                  >
                    {executionResult.status}
                  </span>

                  <span className="cf-result-channel">

                    Channel:{' '}

                    <strong>
                      {executionResult.channel?.toUpperCase() ||
                        'N/A'}
                    </strong>

                  </span>

                </div>


                <div className="cf-result-message">
                  {executionResult.message}
                </div>


                {executionResult.scheduledDate && (

                  <div className="cf-scheduled-info">

                    <Clock size={14} />

                    Scheduled for:{' '}

                    {executionResult.scheduledDate}{' '}

                    {executionResult.scheduledTime ||
                      ''}

                  </div>

                )}


                {executionResult.error && (

                  <div className="cf-error-info">
                    {executionResult.error}
                  </div>

                )}

              </div>

            )}

          </section>

        )}


        {/* ==================================================
            STATISTICS
        ================================================== */}

        <div className="cf-stats-grid">

          <StatCard
            type="total"
            title="TOTAL AUTOMATIONS"
            value={totalCount}
            icon={Zap}
            trend="100% from yesterday"
          />

          <StatCard
            type="success"
            title="SUCCESSFUL"
            value={successCount}
            icon={CheckCircle}
            trend="100% from yesterday"
          />

          <StatCard
            type="scheduled"
            title="SCHEDULED"
            value={scheduledCount}
            icon={Clock}
            trend="0% from yesterday"
            trendType="flat"
          />

          <StatCard
            type="failed"
            title="FAILED"
            value={failedCount}
            icon={AlertTriangle}
            trend="100% from yesterday"
          />

        </div>


        {/* ==================================================
            BOTTOM
        ================================================== */}

        <div className="cf-bottom-grid">


          {/* =================================================
              RECENT AUTOMATIONS
          ================================================= */}

          <section className="cf-section-card cf-recent-card">

            <div className="cf-section-header">
              <div className="cf-section-title">
                <Zap size={16} />
                <span>Recent Automations</span>
              </div>

              <button
                type="button"
                className="cf-view-all"
                onClick={() => setShowAllRecent((previous) => !previous)}
                aria-expanded={showAllRecent}
              >
                {showAllRecent ? 'Show Less' : 'View All'}
                <ChevronRight
                  size={14}
                  className={showAllRecent ? 'cf-view-arrow rotated' : 'cf-view-arrow'}
                />
              </button>
            </div>

            <div className="cf-recent-list">
              {(showAllRecent ? automations : automations.slice(0, 3)).map((automation) => (
                <RecentAutomation
                  key={automation._id || automation.automationId}
                  automation={automation}
                />
              ))}

              {automations.length === 0 && (
                <div className="cf-empty-state">
                  <Workflow size={30} />
                  <strong>No automations yet</strong>
                  <span>
                    Speak or type a command above to create your first automation.
                  </span>
                </div>
              )}
            </div>
          </section>


          {/* =================================================
              CONNECTED SERVICES
          ================================================= */}

          <section className="cf-section-card">

            <div className="cf-section-header">

              <div className="cf-section-title">

                <Layers size={16} />

                Connected Services

              </div>

              <button className="cf-manage-btn">
                Manage
              </button>

            </div>


            <div className="cf-services-grid">

              <div className="cf-service gmail">
                <img src="/gmail.png" alt="Gmail" className="cf-service-image" />
                <strong>Gmail</strong>
                <span><i></i>Connected</span>
              </div>

              <div className="cf-service telegram">
                <img src="/telegram.png" alt="Telegram" className="cf-service-image" />
                <strong>Telegram</strong>
                <span><i></i>Connected</span>
              </div>

              <div className="cf-service calendar">
                <img src="/googlecalendar.png" alt="Google Calendar" className="cf-service-image" />
                <strong>Google Calendar</strong>
                <span><i></i>Connected</span>
              </div>

              <div className="cf-service n8n">
                <img src="/n8n.png" alt="n8n" className="cf-service-image" />
                <strong>n8n</strong>
                <span><i></i>Connected</span>
              </div>

              <div className="cf-service groq">
                <img src="/groq.png" alt="Groq AI" className="cf-service-image" />
                <strong>Groq AI</strong>
                <span><i></i>Connected</span>
              </div>

              <div className="cf-service stack">
                <img src="/stack.png" alt="Stack" className="cf-service-image" />
                <strong>Stack</strong>
                <span><i></i>Connected</span>
              </div>

            </div>

          </section>

        </div>


      </div>


      {/* ====================================================
          VOICE MODAL
      ==================================================== */}

      {showVoiceModal && (

        <VoiceRecorder
          selectedLanguage={
            currentLanguage
          }

          onTranscriptComplete={(text) =>
            setCommandText(text)
          }

          onClose={() =>
            setShowVoiceModal(false)
          }
        />

      )}


      {/* ====================================================
          EXECUTION DETAILS MODAL
      ==================================================== */}

      {selectedAutomation && (

        <div
          className="cf-modal-overlay"
          onClick={() =>
            setSelectedAutomation(null)
          }
        >

          <div
            className="cf-trace-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="cf-modal-header">

              <div>

                <span className="cf-modal-kicker">
                  EXECUTION TRACE
                </span>

                <h3>
                  {selectedAutomation.automationId}
                </h3>

              </div>


              <button
                className="cf-modal-close"
                onClick={() =>
                  setSelectedAutomation(null)
                }
              >
                <X size={18} />
              </button>

            </div>


            <div className="cf-trace-grid">

              <div>
                <span>Language</span>
                <strong>
                  {selectedAutomation.language?.toUpperCase()}
                </strong>
              </div>

              <div>
                <span>Channel</span>
                <strong>
                  {selectedAutomation.channel?.toUpperCase()}
                </strong>
              </div>

              <div>
                <span>Intent</span>
                <strong>
                  {selectedAutomation.intent}
                </strong>
              </div>

              <div>
                <span>Recipient</span>
                <strong>
                  {selectedAutomation.recipient?.name ||
                    selectedAutomation.recipient?.email ||
                    selectedAutomation.recipient?.telegramId ||
                    'N/A'}
                </strong>
              </div>

            </div>


            <div className="cf-trace-section">

              <h4>
                Original Command Instruction
              </h4>

              <div className="cf-trace-command">

                "{selectedAutomation.originalCommand}"

              </div>

            </div>


            <div className="cf-trace-section">

              <h4>
                Generated Email / Message Content Sent
              </h4>

              <div className="cf-trace-content">

                {selectedAutomation.generatedContent?.subject && (

                  <div className="cf-trace-subject">

                    Subject:{' '}

                    {
                      selectedAutomation
                        .generatedContent
                        .subject
                    }

                  </div>

                )}

                {
                  selectedAutomation
                    .generatedContent
                    ?.body
                }

              </div>

            </div>


            <div className="cf-modal-footer">

              <button
                className="cf-close-trace"
                onClick={() =>
                  setSelectedAutomation(null)
                }
              >
                Close Trace Window
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};


export default Dashboard;
import React, { useState, useEffect } from 'react';

import {
  fetchAutomations,
  executeCommand,
  parseCommand
} from '../services/automationService';

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

  const [selectedAutomation, setSelectedAutomation] =
    useState(null);


  /* ==========================================================
     LOAD DATA
  ========================================================== */

  const loadData = async () => {
    try {

      const autoRes = await fetchAutomations();

      if (autoRes.success) {
        setAutomations(autoRes.data || []);
      }

    } catch (err) {
      console.warn(
        'Dashboard data fetch error:',
        err
      );
    }
  };


  useEffect(() => {

    loadData();

    const interval = setInterval(
      loadData,
      4000
    );

    return () =>
      clearInterval(interval);

  }, []);


  /* ==========================================================
     COMMAND EXECUTION
  ========================================================== */

  const handleStartAnalysisAndRun = async (
    textToAnalyze,
    inputType = 'text'
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

        channel:
          parsedData.channel,

        intent:
          parsedData.intent,

        recipient:
          parsedData.recipient,

        subject:
          parsedData.subject,

        content:
          parsedData.content,

        schedule:
          parsedData.schedule

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

        await executeCommand(
          textToAnalyze,
          inputType
        );

        setExecutionResult({

          type: 'scheduled',

          status: 'SCHEDULED',

          channel:
            parsedData.channel,

          recipient:
            parsedData.recipient,

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

        await new Promise((resolve) =>
          setTimeout(resolve, 400)
        );

        setExecutionStep(6);

        const execRes =
          await executeCommand(
            textToAnalyze,
            inputType
          );

        setExecutionStep(7);


        if (
          execRes.success &&
          execRes.data?.status !== 'FAILED'
        ) {

          setExecutionResult({

            type: 'immediate',

            status: 'SUCCESS',

            channel:
              parsedData.channel,

            recipient:
              parsedData.recipient,

            intent:
              parsedData.intent,

            content:
              parsedData.content,

            subject:
              parsedData.subject,

            message:
              `Successfully generated content & executed via n8n ${parsedData.channel?.toUpperCase()} node!`

          });

        } else {

          setExecutionResult({

            type: 'immediate',

            status: 'FAILED',

            channel:
              parsedData.channel,

            recipient:
              parsedData.recipient,

            intent:
              parsedData.intent,

            error:
              execRes.message ||
              execRes.data?.error ||
              'n8n execution failed',

            message:
              'Execution failed.'

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


        <div className="cf-recent-right">

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

                <div className="cf-ai-preview-title">

                  <Bot size={17} />

                  Command Understood & Content Generated by Groq AI

                </div>


                <div className="cf-preview-grid">

                  <div>
                    <span>Channel</span>
                    <strong>
                      {aiPreview.channel?.toUpperCase() ||
                        'N/A'}
                    </strong>
                  </div>

                  <div>
                    <span>Recipient</span>
                    <strong>
                      {aiPreview.recipient?.name ||
                        aiPreview.recipient?.email ||
                        aiPreview.recipient?.chatId ||
                        'N/A'}
                    </strong>
                  </div>

                  {aiPreview.subject && (
                    <div>
                      <span>Subject</span>
                      <strong>
                        {aiPreview.subject}
                      </strong>
                    </div>
                  )}

                  <div>
                    <span>Intent</span>
                    <strong>
                      {aiPreview.intent ||
                        'N/A'}
                    </strong>
                  </div>

                </div>


                <div className="cf-generated-label">
                  GENERATED MESSAGE / EMAIL CONTENT
                </div>

                <div className="cf-generated-content">
                  {aiPreview.content}
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

          onCommandExecute={
            handleStartAnalysisAndRun
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
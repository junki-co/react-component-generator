import { useState, useEffect } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import { usePersistentState } from './hooks/usePersistentState';
import type { Provider } from './types';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

const isProvider = (v: unknown): v is Provider => v === 'anthropic' || v === 'google';

function parseApiKeys(raw: unknown): Record<Provider, string> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const { anthropic, google } = raw as Record<string, unknown>;
  return {
    anthropic: typeof anthropic === 'string' ? anthropic : '',
    google: typeof google === 'string' ? google : '',
  };
}

function App() {
  const [apiKeys, setApiKeys] = usePersistentState<Record<Provider, string>>(
    'rcg:api-keys',
    { anthropic: '', google: '' },
    parseApiKeys,
  );
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = usePersistentState<Provider>(
    'rcg:provider',
    'google',
    (raw) => (isProvider(raw) ? raw : undefined),
  );
  const apiKey = apiKeys[provider];
  const setApiKey = (value: string) => setApiKeys((prev) => ({ ...prev, [provider]: value }));
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const [now, setNow] = useState(() => new Date());
  const { components, history, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const hasEnvKey = envKeys[provider];

  const handleGenerate = (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    generate(prompt, apiKey || undefined, provider);
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
  };

  const activeProvider = PROVIDER_CONFIG[provider].label;
  const clock = now.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="app">
      <header className="menubar">
        <div className="menubar-title">
          <span className="menubar-logo" aria-hidden="true" />
          <h1>React 컴포넌트 생성기</h1>
        </div>
        <div className="menubar-status" aria-label="현재 작업 상태">
          <span>{activeProvider}</span>
          <span>컴포넌트 {components.length}개</span>
          <time>{clock}</time>
        </div>
      </header>

      <main className="workspace">
        <div className="sidebar">
          <section className="window composer-panel" aria-label="컴포넌트 생성">
            <div className="titlebar">
              <span className="titlebar-text">프롬프트</span>
            </div>
            <PromptInput onGenerate={handleGenerate} isLoading={isLoading} history={history} />
          </section>

          <aside className="window settings-panel" aria-label="실행 설정">
            <div className="titlebar">
              <span className="titlebar-text">실행 설정</span>
            </div>
            <div className="settings-body">
              <fieldset className="provider-select">
                <legend>AI 제공자</legend>
                {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                  <label key={key} className="radio">
                    <input
                      type="radio"
                      name="provider"
                      value={key}
                      checked={provider === key}
                      onChange={() => handleProviderChange(key as Provider)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              <div className="api-key-input">
                <label htmlFor="api-key">API 키</label>
                <div className="api-key-field">
                  <input
                    id="api-key"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      hasEnvKey
                        ? '서버 키 사용 중 (직접 입력으로 덮어쓰기 가능)'
                        : PROVIDER_CONFIG[provider].placeholder
                    }
                  />
                  <button
                    className="btn btn-toggle-key"
                    onClick={() => setShowKey(!showKey)}
                    type="button"
                  >
                    {showKey ? '숨기기' : '보기'}
                  </button>
                </div>
                <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
                  <span className="led" aria-hidden="true" />
                  {hasEnvKey
                    ? '.env 키가 연결되어 있습니다.'
                    : '직접 입력하거나 서버 환경변수를 설정하세요.'}
                </p>
              </div>
            </div>
          </aside>
        </div>

        <section className="results-section" aria-label="생성 결과">
          {error && (
            <div className="window alert-dialog" role="alert">
              <div className="titlebar">
                <span className="titlebar-text">오류</span>
              </div>
              <div className="alert-body">
                <svg className="alert-icon" viewBox="0 0 32 32" aria-hidden="true" shapeRendering="crispEdges">
                  <polygon points="16,2 30,29 2,29" fill="#f0b429" stroke="#000" strokeWidth="2" />
                  <rect x="15" y="11" width="2" height="9" fill="#000" />
                  <rect x="15" y="22" width="2" height="3" fill="#000" />
                </svg>
                <p>{error}</p>
              </div>
            </div>
          )}

          {components.length > 0 && (
            <div className="results-header">
              <h2>생성된 컴포넌트 {components.length}개</h2>
              <button className="btn btn-clear" onClick={clearAll}>
                전체 삭제
              </button>
            </div>
          )}

          {isLoading && (
            <div className="window loading-card" role="status">
              <div className="titlebar">
                <span className="titlebar-text">생성 중</span>
              </div>
              <div className="loading-body">
                <p>컴포넌트를 생성하고 있습니다...</p>
                <div className="progress" aria-hidden="true">
                  <div className="progress-bar" />
                </div>
              </div>
            </div>
          )}

          {components.length === 0 && !isLoading && !error && (
            <div className="window empty-state">
              <div className="titlebar">
                <span className="titlebar-text">이름 없는 폴더</span>
              </div>
              <div className="empty-body">
                <svg className="empty-icon" viewBox="0 0 32 32" aria-hidden="true" shapeRendering="crispEdges">
                  <path d="M5 2h16l6 6v22H5z" fill="#fff" stroke="#000" strokeWidth="2" />
                  <path d="M21 2v6h6" fill="#d6d8da" stroke="#000" strokeWidth="2" />
                  <rect x="9" y="13" width="6" height="2" fill="#000" />
                  <rect x="9" y="18" width="14" height="2" fill="#000" />
                  <rect x="9" y="23" width="10" height="2" fill="#2b3a8c" />
                </svg>
                <div className="empty-copy">
                  <h2>아직 만든 컴포넌트가 없어요</h2>
                  <p>프롬프트 창에 만들고 싶은 UI를 적고 생성 버튼을 누르세요. 결과는 이곳에 창으로 쌓입니다.</p>
                </div>
              </div>
            </div>
          )}

          <div className="results-grid">
            {components.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                onRemove={removeComponent}
                onRegenerate={handleGenerate}
                isLoading={isLoading}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

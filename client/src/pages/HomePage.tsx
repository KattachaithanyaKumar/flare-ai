import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type IconProps = {
  className?: string;
};

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const PlusIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...svgProps} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const ChatIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...svgProps} className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CloseIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...svgProps} className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const MenuIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...svgProps} className={className}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const LogoutIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...svgProps} className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

const PaperclipIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...svgProps} className={className}>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const SendIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...svgProps} className={className}>
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
);

const SparkIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...svgProps} className={className}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </svg>
);

const DocIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...svgProps} className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M8 13h8M8 17h5" />
  </svg>
);

const CodeIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...svgProps} className={className}>
    <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
  </svg>
);

const CalendarIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...svgProps} className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const ArrowUpRightIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...svgProps} className={className}>
    <path d="M7 17 17 7M7 7h10v10" />
  </svg>
);

const recentChats = [
  "Product launch ideas",
  "Summarize meeting notes",
  "Debug a React form",
  "Weekend reading list",
];

const suggestions = [
  {
    title: "Brainstorm ideas",
    description: "Names and angles for a new AI product",
    prompt: "Brainstorm product names for an AI writing assistant.",
    icon: SparkIcon,
  },
  {
    title: "Summarize text",
    description: "Turn long notes into clear key points",
    prompt: "Summarize these notes into five key points:",
    icon: DocIcon,
  },
  {
    title: "Write code",
    description: "Build a React component with me",
    prompt: "Help me build a responsive React card component.",
    icon: CodeIcon,
  },
  {
    title: "Plan my week",
    description: "Prioritize tasks and make a schedule",
    prompt: "Help me plan a productive week around my top priorities.",
    icon: CalendarIcon,
  },
];

const suggestionBorders = [
  "border-b border-black/[0.06] sm:border-r",
  "border-b border-black/[0.06]",
  "border-b border-black/[0.06] sm:border-b-0 sm:border-r",
  "",
];

const HomePage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const replyTimeout = useRef<number | null>(null);

  const name = localStorage.getItem("name")?.trim() || "there";
  const firstName = name.split(" ")[0] || "there";
  const firstUserMessage = messages.find((message) => message.role === "user");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  useEffect(() => {
    return () => {
      if (replyTimeout.current) window.clearTimeout(replyTimeout.current);
    };
  }, []);

  const sendMessage = (value: string) => {
    const text = value.trim();
    if (!text || thinking) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: text },
    ]);
    setDraft("");
    setThinking(true);
    setSidebarOpen(false);

    if (inputRef.current) inputRef.current.style.height = "auto";

    if (replyTimeout.current) window.clearTimeout(replyTimeout.current);

    replyTimeout.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `This is a preview of the chat experience, ${firstName}. Connect the chat endpoint and I'll answer with real responses right here.`,
        },
      ]);
      setThinking(false);
      replyTimeout.current = null;
    }, 900);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(draft);
  };

  const handleDraftChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`;
  };

  const handleNewChat = () => {
    if (replyTimeout.current) {
      window.clearTimeout(replyTimeout.current);
      replyTimeout.current = null;
    }
    setMessages([]);
    setDraft("");
    setThinking(false);
    setSidebarOpen(false);
    inputRef.current?.focus();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-dvh gap-2 overflow-hidden bg-[#e9e8e5] p-2 text-slate-900 sm:gap-3 sm:p-3">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-[#171512]/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-2 left-2 z-40 flex w-72 flex-col overflow-hidden rounded-[26px] border border-white/[0.06] bg-[#171512] text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65)] transition-transform duration-300 ease-out sm:inset-y-3 sm:left-3 lg:static lg:z-auto lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <span className="inline-flex w-full items-center rounded-xl bg-white px-3 py-2">
            <img
              src={logo}
              alt="Flare AI"
              className="h-10 w-full object-contain"
            />
          </span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 lg:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-3 pt-5">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/40 transition hover:bg-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#171512]"
          >
            <PlusIcon />
            New chat
          </button>
        </div>

        <nav
          className="mt-7 flex-1 overflow-y-auto px-3"
          aria-label="Recent chats"
        >
          <p className="px-3 text-[11px] font-semibold text-white/35">Recent</p>
          <ul className="mt-2 space-y-0.5">
            {recentChats.map((chat, index) => {
              const isActive = index === 0;
              return (
                <li
                  key={chat}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                    isActive
                      ? "bg-white/[0.08] font-medium text-white"
                      : "text-white/55"
                  }`}
                >
                  <ChatIcon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-orange-400" : "text-white/30"
                    }`}
                  />
                  <span className="truncate">{chat}</span>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/[0.07] p-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange-400 to-orange-600 text-sm font-bold text-white">
              {firstName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{name}</p>
              <p className="text-[11px] text-white/40">Free plan</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-black/[0.04] bg-[#fcfcfb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <header className="z-10 flex items-center justify-between gap-4 border-b border-black/[0.05] bg-[#fcfcfb]/80 px-4 py-3.5 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="rounded-xl p-2 text-slate-500 transition hover:bg-black/[0.04] hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 lg:hidden"
            >
              <MenuIcon />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-[#171512]">
                {firstUserMessage?.content ?? "New chat"}
              </h1>
              <p className="text-[11px] text-slate-400">Flare AI assistant</p>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#171512] px-3 py-1.5 text-[11px] font-medium text-white/80">
            <SparkIcon className="h-3 w-3 text-orange-400" />
            Flare 1.0
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !thinking ? (
            <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center px-5 py-14 text-center sm:px-6">
              <div className="relative mb-7">
                <div className="absolute inset-0 scale-150 rounded-full bg-orange-400/25 blur-2xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-orange-400 via-orange-500 to-orange-600 text-white shadow-[0_12px_30px_-10px_rgba(249,115,22,0.6)] ring-1 ring-white/20">
                  <SparkIcon className="h-6 w-6" />
                </div>
              </div>

              <h2 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-[#171512] sm:text-[3.25rem]">
                Hello, {firstName}.
              </h2>
              <p className="mt-4 max-w-sm text-pretty text-[15px] leading-relaxed text-slate-500">
                Ask a question, paste some text, or start with one of these.
              </p>

              <div className="mt-10 w-full overflow-hidden rounded-3xl border border-black/[0.06] bg-white text-left shadow-[0_20px_50px_-32px_rgba(0,0,0,0.35)]">
                <div className="grid sm:grid-cols-2">
                  {suggestions.map((suggestion, index) => {
                    const SuggestionIcon = suggestion.icon;

                    return (
                      <button
                        key={suggestion.title}
                        type="button"
                        onClick={() => sendMessage(suggestion.prompt)}
                        className={`group flex items-start gap-3 p-5 text-left transition-colors hover:bg-[#faf7f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 ${suggestionBorders[index]}`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
                          <SuggestionIcon className="h-[18px] w-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-[#171512]">
                            {suggestion.title}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                            {suggestion.description}
                          </span>
                        </span>
                        <ArrowUpRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange-500" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
              <div className="space-y-8">
                {messages.map((message) =>
                  message.role === "user" ? (
                    <div
                      key={message.id}
                      className="flex animate-[message-in_0.25s_ease-out] justify-end"
                    >
                      <div className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#171512] px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div
                      key={message.id}
                      className="flex animate-[message-in_0.25s_ease-out] gap-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange-400 to-orange-600 text-white shadow-sm">
                        <SparkIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="mb-1 text-xs font-semibold text-slate-400">
                          Flare AI
                        </p>
                        <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ),
                )}

                {thinking && (
                  <div className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange-400 to-orange-600 text-white shadow-sm">
                      <SparkIcon className="h-4 w-4" />
                    </span>
                    <div className="flex items-center gap-1.5 pt-2.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-400 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-400" />
                    </div>
                  </div>
                )}

                <div ref={endRef} />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-black/[0.05] bg-[#fcfcfb]/85 px-4 pb-4 pt-3 backdrop-blur-xl sm:px-6">
          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
            <div className="rounded-3xl border border-black/[0.08] bg-white p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_16px_40px_-24px_rgba(0,0,0,0.35)] transition-all duration-200 focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-500/10">
              <div className="flex items-end gap-1.5">
                <button
                  type="button"
                  disabled
                  aria-label="Attach a file"
                  title="Attachments coming soon"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                >
                  <PaperclipIcon className="h-[18px] w-[18px]" />
                </button>

                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={handleDraftChange}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      sendMessage(draft);
                    }
                  }}
                  rows={1}
                  placeholder="Message Flare AI..."
                  aria-label="Message Flare AI"
                  className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                />

                <button
                  type="submit"
                  disabled={!draft.trim() || thinking}
                  aria-label="Send message"
                  className="group/send flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_6px_18px_-6px_rgba(249,115,22,0.7)] transition-all duration-200 hover:bg-orange-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none"
                >
                  <SendIcon className="h-[18px] w-[18px] transition-transform duration-200 group-hover/send:-translate-y-0.5" />
                </button>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-3 px-1">
              <p className="text-[11px] text-slate-400">
                Flare AI can make mistakes. Check important information.
              </p>
              <p className="hidden shrink-0 items-center gap-1.5 text-[11px] text-slate-400 sm:flex">
                <kbd className="rounded-md border border-black/10 bg-white px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-500">
                  Enter
                </kbd>
                to send
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default HomePage;

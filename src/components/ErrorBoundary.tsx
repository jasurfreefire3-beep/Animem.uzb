import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  // @ts-ignore
  props: Readonly<Props>;
  // @ts-ignore
  state: Readonly<State> = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in React Component:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 bg-[#ff006a]/20 border border-[#ff006a]/40 rounded-full flex items-center justify-center mb-4 text-[#ff006a] text-2xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-black mb-2 text-white uppercase tracking-tight">
            Animem.uz
          </h1>
          <p className="text-white/70 text-sm max-w-md mb-6 leading-relaxed">
            Sahifani yuklashda xatolik yuz berdi. Qayta yuklash tugmasini bosing.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#ff006a] hover:bg-[#d40058] text-white font-bold px-6 py-3 rounded-md text-xs uppercase tracking-wider shadow-lg shadow-[#ff006a]/30 cursor-pointer"
          >
            Qayta yuklash
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

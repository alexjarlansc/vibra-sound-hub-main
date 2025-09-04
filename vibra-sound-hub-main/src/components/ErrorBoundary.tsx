import React from 'react';
import { Button } from '@/components/ui/button';

interface State { error: Error | null; info: React.ErrorInfo | null }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State { return { error, info: null }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log básico
    if(import.meta.env.DEV){ console.error('[ErrorBoundary] Capturado', error, info); }
    this.setState({ info });
    // Armazena último erro para debug (/localStorage)
    try { localStorage.setItem('__last_error__', JSON.stringify({ message: error.message, stack: error.stack, componentStack: info.componentStack, ts: Date.now() })); } catch {}
  }

  handleReset = () => { this.setState({ error: null, info: null }); };

  render(){
    if(this.state.error){
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Ocorreu um erro</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">Capturamos uma exceção na interface. Você pode tentar recarregar ou limpar o estado. Copie a mensagem abaixo se precisar reportar.</p>
          </div>
          <pre className="text-left text-xs bg-muted p-4 rounded-md max-w-xl w-full overflow-auto border">
{this.state.error.message}\n\n{this.state.error.stack?.split('\n').slice(0,8).join('\n')}
          </pre>
          <div className="flex gap-3">
            <Button onClick={this.handleReset} variant="secondary">Tentar continuar</Button>
            <Button onClick={()=> window.location.reload()}>Recarregar</Button>
            <Button variant="outline" onClick={()=>{ try { navigator.clipboard.writeText(localStorage.getItem('__last_error__')||''); } catch{} }}>Copiar Log</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

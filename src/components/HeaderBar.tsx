import { LogOut } from "lucide-react";

interface HeaderBarProps {
  userName?: string;
  onLogout?: () => void;
}

const HeaderBar = ({ userName, onLogout }: HeaderBarProps) => (
  <header className="bg-primary px-6 py-4">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-primary-foreground">📦 GoInvoice OCR</h1>
        <p className="text-sm font-medium text-accent">AI-powered freight invoice extraction</p>
      </div>

      {userName && (
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-primary-foreground">{userName}</p>
            <p className="text-xs text-primary-foreground/60">Edits recorded under your name</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  </header>
);

export default HeaderBar;

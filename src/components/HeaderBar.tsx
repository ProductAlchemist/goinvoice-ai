import { LogOut } from "lucide-react";

interface HeaderBarProps {
  userName?: string;
  onLogout?: () => void;
}

const HeaderBar = ({ userName, onLogout }: HeaderBarProps) => (
  <header className="bg-primary px-6 py-3 shadow-sm">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src="https://www.gocomet.com/website/static/images/logo/logo-blue.png"
          alt="GoComet"
          className="h-7 brightness-0 invert"
        />
        <div className="h-5 w-px bg-primary-foreground/20" />
        <span className="text-sm font-medium text-primary-foreground/80">Invoice OCR</span>
      </div>

      {userName && (
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-primary-foreground">{userName}</p>
            <p className="text-xs text-primary-foreground/50">Edits recorded under your name</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
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

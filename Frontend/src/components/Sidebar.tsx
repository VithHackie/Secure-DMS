import { House, Archive, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from '../assets/logo.png';

interface SidebarProps {
  activeTab?: string;
}

const navItems = [
  { label: "Admin Dashboard", key: "dashboard", icon: House },
  { label: "Document Vault", key: "vault", icon: Archive },
  { label: "Audit Logs", key: "audit", icon: FileText },
];

export const Sidebar = ({ activeTab = "dashboard" }: SidebarProps) => {
  const navigate = useNavigate();

  const navigationHandler = (value: string) => {
    if (value == "dashboard") {
      navigate("/");
    } else if (value == "vault") {
      navigate("/vault");
    } else if (value == "audit") {
      navigate("/logs");
    }
  };
  return (
    <aside className="hidden w-65 flex-col border-r border-slate-300 bg-[#e7edf5] lg:flex">
      <div className="px-5 py-4 flex items-center gap-2">
        <img src={logo} alt="LegalIntegrity CMS logo" className="h-9 w-9" />
          <div className="text-[2rem] font-semibold tracking-tight text-slate-800">
            LegalIntegrity CMS
          </div>
      </div>

      <div className="px-4 py-4">
        <div className="mb-3 text-sm font-medium text-slate-500">
          Case Control
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  navigationHandler(item.key);
                }}
                className={[
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-medium transition",
                  isActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-200/80",
                ].join(" ")}
              >
                <span className="flex h-5 w-5 items-center justify-center text-sm">
                  <Icon
                    className={
                      isActive ? "h-5 w-5 text-white" : "h-5 w-5 text-slate-600"
                    }
                  />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-300 bg-[#e7edf5] p-4">
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-200/80"
          >
            <span>⚙</span>
            <span>Settings</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-200/80"
          >
            <span>?</span>
            <span>Support</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

import { useState } from "react";
import { useLocation } from "wouter";

export default function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [usersSubmenuOpen, setUsersSubmenuOpen] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleUsersSubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setUsersSubmenuOpen(!usersSubmenuOpen);
  };

  const navItems = [
    { path: "/", icon: "dashboard", label: "Dashboard" },
    { path: "/families", icon: "people", label: "Families" },
    { 
      path: "/users", 
      icon: "group", 
      label: "Users",
      isExpandable: true,
      subItems: [
        { path: "/users/add", label: "Add New" },
        { path: "/users", label: "View All Users" }
      ]
    },
    { path: "/payments", icon: "payments", label: "Payments" },
    { path: "/reports", icon: "assessment", label: "Reports" },
    { path: "/settings", icon: "settings", label: "Settings" }
  ];

  return (
    <div 
      className={`bg-primary text-white h-full transition-all duration-300 flex-shrink-0 z-10 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center">
            <span className="material-icons mr-2">apartment</span>
            <h1 className="font-bold text-lg">Intizamia Sonwar</h1>
          </div>
        )}
        {collapsed && (
          <span className="material-icons mx-auto">apartment</span>
        )}
        <button onClick={toggleSidebar} className={collapsed ? "mx-auto" : ""}>
          <span className="material-icons">
            {collapsed ? "menu_open" : "menu"}
          </span>
        </button>
      </div>
      
      <div className="mt-6">
        <nav>
          <ul>
            {navItems.map((item) => (
              <li key={item.path} className="mb-1">
                {item.isExpandable ? (
                  <>
                    <div 
                      onClick={toggleUsersSubmenu}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer ${
                        location.startsWith(item.path)
                          ? "bg-primary-dark" 
                          : "hover:bg-primary-dark"
                        } rounded-r-lg`}
                    >
                      <div className="flex items-center">
                        <span className="material-icons mr-3">{item.icon}</span>
                        {!collapsed && <span>{item.label}</span>}
                      </div>
                      {!collapsed && (
                        <span className="material-icons text-sm">
                          {usersSubmenuOpen ? 'expand_less' : 'expand_more'}
                        </span>
                      )}
                    </div>
                    {!collapsed && usersSubmenuOpen && item.subItems && (
                      <ul className="ml-6 mt-1">
                        {item.subItems.map(subItem => (
                          <li key={subItem.path} className="mb-1">
                            <div 
                              onClick={() => window.location.href = subItem.path}
                              className={`flex items-center px-4 py-2 text-sm cursor-pointer ${
                                location === subItem.path 
                                  ? "bg-primary-dark" 
                                  : "hover:bg-primary-dark"
                                } rounded-r-lg`}
                            >
                              <span className="material-icons mr-2 text-sm">subdirectory_arrow_right</span>
                              <span>{subItem.label}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <div
                    onClick={() => window.location.href = item.path}
                    className={`flex items-center px-4 py-3 cursor-pointer ${
                      location === item.path 
                        ? "bg-primary-dark" 
                        : "hover:bg-primary-dark"
                      } rounded-r-lg`}
                  >
                    <span className="material-icons mr-3">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      <div className="absolute bottom-0 w-full p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="material-icons text-sm">person</span>
          </div>
          {!collapsed && (
            <div className="ml-2">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-300">admin@intizamia-sonwar.org</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

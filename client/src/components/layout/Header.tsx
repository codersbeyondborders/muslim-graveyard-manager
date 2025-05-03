import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/families":
        return "Families";
      case "/payments":
        return "Payments";
      case "/reports":
        return "Reports";
      case "/settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search logic
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h2>
        </div>
        <div className="flex items-center">
          <form onSubmit={handleSearch} className="relative mr-4">
            <Input
              type="text"
              placeholder="Search..."
              className="pl-8 pr-4 py-2 rounded-lg border border-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="material-icons absolute left-2 top-2 text-gray-400">search</span>
          </form>
          <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-gray-100">
            <span className="material-icons text-gray-600">notifications</span>
          </Button>
          <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-gray-100">
            <span className="material-icons text-gray-600">help_outline</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

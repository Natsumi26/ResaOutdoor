import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div
        className="nav-item"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <span>🔍 Rechercher un canyon</span>
        {isOpen && (
          <div className="dropdown">
            <label>
              Nombre de personnes :
              <input type="number" min="1" />
            </label>
            <label>
              Date souhaitée :
              <input type="date" />
            </label>
            <button className="lang-switch">Passer en anglais 🇬🇧</button>
          </div>
        )}
      </div>
    </nav>
  );
}

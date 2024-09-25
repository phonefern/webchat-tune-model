// ThemeSwitcher.jsx
import React from 'react';

const ThemeSwitcher = ({ theme, toggleTheme }) => {
    return (
        <div className="theme-switcher" onClick={toggleTheme}>
            {theme === "light" ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
            <img src="../img/world.png" alt="lang" className="world-icon" />
        </div>
    );
};

export default ThemeSwitcher;

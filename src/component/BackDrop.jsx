// Backdrop.jsx
import React from 'react';

const BackDrop = ({ isOpen, toggleDrawer }) => {
    return (
        <div className={`backdrop ${isOpen ? "show" : ""}`} onClick={toggleDrawer}>
            <img src="../img/menu.png" alt="Menu Icon" className="backdrop-menu-icon" />
        </div>
    );
};

export default BackDrop;

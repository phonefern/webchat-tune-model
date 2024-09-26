// Header.jsx
import React, { useState } from 'react';



const Header = ({ toggleDrawer, isOpen, animateHeaderLine, setAnimateHeaderLine,isModelMenuOpen, setSelectedModel , setIsModelMenuOpen }) => {
   


    const handleModelClick = () => {
        setIsModelMenuOpen(!isModelMenuOpen);
    };

    const handleModelSelect = (model) => {
        setSelectedModel(model);
        setAnimateHeaderLine(true);
        setTimeout(() => setAnimateHeaderLine(false), 2000);
        setIsModelMenuOpen(false);
    };

    return (
        <div>
            <div className="menu-icon" onClick={toggleDrawer}>
                <i className="fa-solid fa-bars"></i>
            </div>
            <div className={`header-slide ${isOpen ? "drawer-open" : ""}`}>

                        <div id="topnav-header_gen" className="header_gen">
                            <div className="left-section">
                                <div className="logo_top">

                                    <h1 className="name">AskMedi Ai</h1>

                                    <div className="select-model-icon" onClick={handleModelClick}>
                                        <i className="fa-solid fa-angle-down"></i>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div className={`header-line ${animateHeaderLine ? "animate" : ""}`}></div>

                        {isModelMenuOpen && (
                            <div className="model-selection-menu">
                                <p onClick={() => handleModelSelect("gemini-1.5-flash")}>Gemini 1.5 Flash</p>
                                <p onClick={() => handleModelSelect("packagetestv2-nettsfkvxpqs")}>Package Test v2</p>
                            </div>
                        )}
                    </div>
        </div>
    );
};

export default Header;

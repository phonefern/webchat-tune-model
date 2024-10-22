// Header.jsx
import React, { useState } from 'react';



const Header = ({ toggleDrawer, isOpen, animateHeaderLine, setAnimateHeaderLine, isModelMenuOpen, setSelectedModel, setIsModelMenuOpen, selectedModel }) => {



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

            <div className={`header-slide ${isOpen ? "drawer-open" : ""}`}>
                <div className="menu-icon" onClick={toggleDrawer}>
                    <i className="fa-solid fa-bars"></i>
                </div>

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
                        <p
                            onClick={() => handleModelSelect("gemini-1.5-flash")}
                            className="flex justify-between items-center px-4 py-2 cursor-pointer text-gray-700 hover:bg-gray-100 hover:text-black transition-colors duration-200 border-b border-gray-200"
                        >
                            <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.172 3.607a1 1 0 00.95.69h3.801c.969 0 1.371 1.24.588 1.81l-3.073 2.23a1 1 0 00-.364 1.118l1.172 3.607c.3.921-.755 1.688-1.539 1.118l-3.073-2.23a1 1 0 00-1.175 0l-3.073 2.23c-.784.57-1.838-.197-1.539-1.118l1.172-3.607a1 1 0 00-.364-1.118L2.44 9.034c-.784-.57-.38-1.81.588-1.81h3.801a1 1 0 00.95-.69l1.172-3.607z" />
                                </svg>
                                Gemini 1.5 Flash
                            </span>
                            {selectedModel === "gemini-1.5-flash" && (
                                <i className="fa-regular fa-square-check text-green-500"></i>
                            )}
                        </p>

                        <p onClick={() => handleModelSelect("packagetestv2-nettsfkvxpqs")}
                            className="flex justify-between items-center px-4 py-2 cursor-pointer text-gray-700 hover:bg-gray-100 hover:text-black transition-colors duration-200 border-b border-gray-200">
                            <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 512 512"><path fill="#79808b" d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z" /></svg>
                                Package Test v2
                            </span>
                            {selectedModel === "packagetestv2-nettsfkvxpqs" && (
                                <i className="fa-regular fa-square-check text-green-500"></i>
                            )}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Header;

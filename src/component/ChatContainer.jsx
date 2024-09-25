import React, { useState, useEffect, useRef } from 'react';
import Typewriter from 'typewriter-effect'; // Assuming this is used in your project

const ChatContainer = ({ isOpen, isLoading, showGreeting, messages, handleSendMessage, question, handleInputChange, setQuestion }) => {

    const chatEndRef = useRef(null); // Ref to scroll to the end of the chat

    const promptSuggestions = [
        "อายุ 25-40 ปี  ปวดกล้ามเนื้อ โปรแกรมการรักษา?",
        "อายุ 18-35 ปี อาการน้ำมูกไหล โปรแกรมการรักษา?",
        "อายุ 35-60 ปี อาการปัสสาวะบ่อย โปรแกรมการรักษา?"
    ];

    // Handle prompt click to set the prompt in the input field
    const handlePromptClick = (prompt) => {
        setQuestion(prompt);
    };

    

    // Handle "Enter" key to send message
    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            handleSendMessage(event);
        }
    };

    // Scroll to the bottom of the chat container
    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    

    // Add keydown event listener for the "Enter" key
    useEffect(() => {
        const questionInput = document.getElementById("question");
        if (questionInput) {
            questionInput.addEventListener("keydown", handleKeyDown);
            return () => questionInput.removeEventListener("keydown", handleKeyDown);
        }
    }, [question]);

    // Scroll to the bottom every time a new message is added
    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    
    return (
        <div className={`all-container ${isOpen ? "drawer-open" : ""}`}>
            <div className="chat-container">
                {!messages.length && !isLoading && (
                    <div className={`greeting-message ${showGreeting ? "show" : ""}`}>
                        <p>Hello! How can I help you today?</p>
                        <div className="prompt-column">
                            {promptSuggestions.map((prompt, index) => (
                                <button key={index} className="prompt-button" onClick={() => handlePromptClick(prompt)}>
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="chat-box" id="answer-container">
                    {isLoading ? (
                        <div className="loading-message"></div>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.sender === "user" ? "user-message" : "ai-message"}`}>
                                <div className="message-text">
                                    {msg.sender === "bot" && index === messages.length - 1 ? (
                                        <Typewriter
                                            options={{ delay: 10 }}
                                            onInit={(typewriter) => {
                                                const cleanText = msg.text.replace(/\*/g, "");
                                                typewriter.typeString(cleanText).start();
                                            }}
                                        />
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={chatEndRef} />
                </div>
                {isLoading && (
                    <div className="loading-container" style={{ textAlign: 'center', position: 'absolute' }}>
                        <img src="../img/Dots Loader.gif" alt="Loading..." style={{ width: '100px' }} />
                    </div>
                )}
                <div className="input-container">
                    <input
                        id="question"
                        type="text"
                        value={question}
                        onChange={handleInputChange}
                        placeholder="ถามมาได้เลยจ้า..."
                        onKeyDown={handleKeyDown}
                    />
                    <button onClick={handleSendMessage}>
                        <i className="fa-solid fa-arrow-up"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatContainer;

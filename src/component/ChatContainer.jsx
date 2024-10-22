import React, { useState, useEffect, useRef } from 'react';
import Typewriter from 'typewriter-effect'; // Assuming this is used in your project

const ChatContainer = ({ isOpen, isLoading, showGreeting, messages, handleSendMessage, question, handleInputChange, setQuestion, theme, setImagePreview, setImageFile, isDeleteModalOpen, chatToDelete, setIsDeleteModalOpen, confirmDeleteChat, isBotLoading }) => {



    const chatEndRef = useRef(null);

    const promptSuggestions = [
        "อายุ 25-40 ปี  ปวดกล้ามเนื้อ โปรแกรมการรักษา?",
        "อายุ 18-35 ปี อาการน้ำมูกไหล โปรแกรมการรักษา?",
        "อายุ 35-60 ปี อาการปัสสาวะบ่อย โปรแกรมการรักษา?"
    ];


    const handlePromptClick = (prompt) => {
        setQuestion(prompt);
    };



    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            handleSendMessage(event);
        }
    };


    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };




    useEffect(() => {
        const questionInput = document.getElementById("question");
        if (questionInput) {
            questionInput.addEventListener("keydown", handleKeyDown);
            return () => questionInput.removeEventListener("keydown", handleKeyDown);
        }
    }, [question]);


    useEffect(() => {
        scrollToBottom();
    }, [messages]);




    // Simulate the file input click when the image icon is clicked
    const triggerFileInput = () => {
        document.getElementById('file-input').click();

    };

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
        console.log("Picture selected")
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result); // Set the image preview URL
            };
            reader.readAsDataURL(file); // Convert the file to base64
        }
    };

    return (

        <div>

            <div className="chat-container">
                {!messages.length && !isLoading && (
                    <div className={`greeting-message ${showGreeting ? "show" : ""}`}>
                        <p>Hello! How can I help you today?</p>

                        <div className="prompt-column">
                            {promptSuggestions.map((prompt, index) => (
                                <button
                                    key={index}
                                    className="prompt-button"
                                    onClick={() => handlePromptClick(prompt)}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div
                    className={`chat-box ${!messages.length && !isLoading ? "empty" : "filled"}`}
                    id="answer-container"
                >
                    {isLoading ? (
                        <div className="loading-message"></div>
                    ) : (
                        messages.map((msg, index) => {
                            console.log("Rendering message:", msg);

                          
                            const isUserMessage = msg.sender === "user";
                            const isBotMessageLoading = msg.sender === "bot" && msg.isLoading;

                            return (
                                <div
                                    key={index}
                                    className={`chat-message ${isUserMessage ? "user-message" : isBotMessageLoading ? "ai-message loading" : "ai-message"}`}
                                >
                                    <div className="message-text">
                                        {isBotMessageLoading ? (
                                         
                                            <img
                                                src="../img/Message.gif"
                                                alt="Loading..."
                                                className="loading-gif"
                                                style={{ width: '70px', height: '70px' }}
                                            />
                                        ) : (
                                         
                                            isUserMessage ? (
                                                <span>{msg.text}</span>
                                            ) : (
                                               
                                                msg.text.length < 100 ? (
                                                    <Typewriter
                                                        options={{ delay: 5 }}
                                                        onInit={(typewriter) => {
                                                            typewriter.typeString(msg.text).start();
                                                        }}
                                                    />
                                                ) : (
                                                    
                                                    msg.text.split('\n').map((line, i) => (
                                                        <span key={i}>
                                                            {line}
                                                            <br />
                                                        </span>
                                                    ))
                                                )
                                            )
                                        )}

                                        {msg.image && (
                                            <img src={msg.image} alt="User uploaded" className="uploaded-image" />
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>













                {/* Loading GIF */}
                {isLoading && (
                    <div className="loading-container" style={{ textAlign: 'center', position: 'position: absolute;' }}>
                        <img src="../img/Dots Loader.gif" alt="Loading..." style={{ width: '100px', }} />
                    </div>
                )}

            </div>

            <div className={`bot-container ${theme}`}>
                <div className={`bottom-section ${isOpen ? 'drawer-open' : ''}`}>
                    <div className="input-container">
                        <input
                            type="text"
                            id="question"
                            value={question}
                            onChange={handleInputChange}
                            placeholder="ถามมาได้เลยจ้า..."
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />

                        <i className="fa-solid fa-arrow-up" onClick={handleSendMessage}></i>

                        {/* <i className="fa-solid fa-file-image" onClick={triggerFileInput} ></i> */}
                        <input
                            type="file"
                            id="file-input"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </div>

                    <h4 className="follow_text_gen">
                        Copyright © 2024 โรงพยาบาลกรุงเทพ หาดใหญ่
                    </h4>
                </div>
            </div>

            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <p className="text-lg d mb-4">
                            Are you sure you want to delete the chat ?
                        </p>
                        <div className="flex justify-around mt-6">
                            <button
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                                onClick={() => confirmDeleteChat()}
                            >
                                Yes, Delete
                            </button>
                            <button
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                                onClick={() => setIsDeleteModalOpen(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}






        </div>





    );
};

export default ChatContainer;

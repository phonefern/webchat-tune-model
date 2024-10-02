import React, { useState, useEffect, useRef } from 'react';
import Typewriter from 'typewriter-effect'; // Assuming this is used in your project

const ChatContainer = ({ isOpen, isLoading, showGreeting, messages, handleSendMessage, question, handleInputChange, setQuestion, theme, setImagePreview,setImageFile  }) => {

    const chatEndRef = useRef(null); // Ref to scroll to the end of the chat

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

                <div className="chat-box" id="answer-container">
                    {isLoading ? (
                        <div className="loading-message"></div>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.sender === "user" ? "user-message" : "ai-message"}`}>
                                <div className="message-text">
                                    {msg.sender === "bot" && index === messages.length - 1 ? (
                                        msg.text.length < 300 ? (
                                            <Typewriter
                                                options={{ delay: 10 }}
                                                onInit={(typewriter) => {
                                                    const cleanText = msg.text.replace(/\*/g, "");
                                                    typewriter.typeString(cleanText).start();
                                                }}
                                            />
                                        ) : (
                                            msg.text
                                        )
                                    ) : (
                                        msg.text
                                    )}
                                    {msg.image && (
                                        <img src={msg.image} alt="User uploaded" className="uploaded-image" /> // Display uploaded image
                                    )}
                                </div>
                            </div>
                        ))
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
                        


                        <i className="fa-solid fa-file-image" onClick={triggerFileInput} ></i>


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

        </div>





    );
};

export default ChatContainer;

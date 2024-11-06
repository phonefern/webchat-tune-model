import React, { useState, useEffect, useRef } from 'react';
import Typewriter from 'typewriter-effect'; // Assuming this is used in your project

const ChatContainer = ({ isOpen, isLoading, showGreeting, messages, handleSendMessage, question, handleInputChange, setQuestion, theme, setImagePreview, setImageFile }) => {

    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);


    const openModal = (imageSrc) => {
        setSelectedImage(imageSrc);
        setModalOpen(true);
    };

    const closeModal = () => {
        setSelectedImage(null);
        setModalOpen(false);
    };

    const chatEndRef = useRef(null);

    const promptSuggestions = [
        "อาการอ่อนเพลียเรื้อรัง แพ็คเกจแนะนำระยะยาว?",
        "มีคนในครอบครัว เป็นมะเร็งหลายคน แพ็คเกจแนะนำ?",
        "ผู้สูงอายุอายุ 60 ปีขึ้นไป หกล้มบ่อย แพ็คเกจแนะนำ?"
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

                            const keywordImageMap = {
                                "SRV": "../img/package/p01.png",
                                "แพ็คเกจวัคซีนป้องกันโรคไข้เลือดออก": "../img/package/p02.png",
                                "แพ็คเกจวัคซีนไข้หวัดใหญ่": "../img/package/p03.png",
                                "Mild Hyperbaric Oxygen M HBOT": "../img/package/p04.png",
                                "BDMS BREAST CANCER SCREENING PACKAGE": "../img/package/p05.png",
                                "BALANCE": "../img/package/p06.png",
                                "Multi Vitamin IV Drip Therapy": "../img/package/p07.png",
                                "Pelvic floor Strengthening ": "../img/package/p08.png",
                                "Encode Hereditary Breast and Ovarian Cancer Syndrome": "../img/package/p09.png",
                                "Hereditary Multi Cancer Panel": "../img/package/p10.png",
                                "CIRCLE DNA": "../img/package/p11.png",
                                "Bone Density": "../img/package/p12.png",
                                "Anti Fall": "../img/package/p13.png",
                                "Sleep test": "../img/package/p14.png",
                            };

                            const matchedImages = Object.keys(keywordImageMap).filter((keyword) =>
                                msg.sender === "bot" && msg.text.includes(keyword)
                            ).map(keyword => keywordImageMap[keyword]);



                            return (
                                <div
                                    key={index}
                                    className={`chat-message ${isUserMessage ? "user-message" : isBotMessageLoading ? "ai-message loading" : "ai-message"}`}
                                >
                                    <div className="message-text">
                                        {msg.image && (
                                            <img src={msg.image} alt="User uploaded" className="uploaded-image" />
                                        )}

                                        {matchedImages.map((imageSrc, i) => (
                                            <img key={i} src={imageSrc}
                                                alt={`Related to keyword ${i + 1}`}
                                                className="special-package-image"
                                                style={{ width: '150px', height: '200px', margin: '5px' }}
                                                onClick={(() => openModal(imageSrc))}
                                            />
                                        ))}
                                        {/* <br /> */}

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



                {isModalOpen && (
                    <div className="image-modal-overlay" onClick={closeModal}>
                        <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="close-button" onClick={closeModal}>×</button>
                            <img src={selectedImage} alt="Zoomed" className="zoomed-image" />
                        </div>
                    </div>
                )}


                {/* Loading GIF */}
                {isLoading && (
                    <div className="loading-container" style={{ textAlign: 'center', position: 'position: absolute;' }}>
                        <img src="../img/Dots Loader.gif" alt="Loading..." style={{ width: '100px', }} />
                    </div>
                )}

            </div>

            <div className={`bot-container ${theme}`}>
                <div className={`bottom-section ${isOpen ? 'drawer-open' : ''}`}>
                    <div className="input-container flex flex-col">
                        <div className='flex  gap-3'>
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
            </div>

        </div>





    );
};

export default ChatContainer;

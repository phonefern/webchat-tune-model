import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, getDoc, Timestamp } from "firebase/firestore";
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import Typewriter from "typewriter-effect";
import { auth } from '../firebase'; // Firebase auth


// คอมโพเนนต์หลักของแอปพลิเคชัน
const ChatPage = () => {
    // สร้าง state สำหรับเก็บข้อมูลคำถามจากผู้ใช้
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [showGreeting, setShowGreeting] = useState(true);
    const [isOpen, setIsOpen] = useState(false)
    const [selectedModel, setSelectedModel] = useState("packagetestv2-nettsfkvxpqs");
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const [chatItems, setChatItems] = useState([]);
    const [newChatTitle, setNewChatTitle] = useState('');
    const [activeChatId, setActiveChatId] = useState(null);
    const [theme, setTheme] = useState("light")
    const [animateHeaderLine, setAnimateHeaderLine] = useState(false);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false); // New loading state

    const user = auth.currentUser;


    const deleteSubcollection = async (userId) => {
        const chatsCollection = collection(db, `users/${userId}/chats`);
        const chatsSnapshot = await getDocs(chatsCollection);

        // Loop through each chat document
        for (const chatDoc of chatsSnapshot.docs) {
            // Delete messages subcollection for each chat
            const messagesCollection = collection(chatsCollection, chatDoc.id, 'messages');
            const messagesSnapshot = await getDocs(messagesCollection);

            // Loop through each message document and delete
            for (const messageDoc of messagesSnapshot.docs) {
                await deleteDoc(doc(messagesCollection, messageDoc.id));
            }

            // Now delete the chat document itself
            await deleteDoc(doc(chatsCollection, chatDoc.id));
        }
    };

    // Function to handle logout
    const handleLogout = async () => {
        try {
            const user = auth.currentUser; // Get the currently signed-in user

            if (user && user.isAnonymous) {

                await deleteSubcollection(user.uid);
                const userDocRef = doc(db, `users/${user.uid}`);
                await deleteDoc(userDocRef)
                await user.delete();
            }

            // Sign out the user
            await signOut(auth);
            navigate('/'); // Redirect to login page after sign out
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    // Toggle theme (light/dark)
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };

    // Load theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        // Simulate a loading delay of 4 seconds
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);

        // Cleanup function to clear the timer if the component unmounts
        return () => clearTimeout(timer);
    }, []);


    useEffect(() => {
        const fetchChats = async () => {
            if (!user) return; // Exit if no user is logged in



            try {
                const chatCollection = collection(db, `users/${user.uid}/chats`);
                const chatSnapshot = await getDocs(chatCollection);
                const chatList = chatSnapshot.docs.map(doc => {
                    const chatData = doc.data();
                    return {
                        id: doc.id,
                        ...chatData,
                        isActive: false,
                        date: chatData.date && chatData.date.toDate(),  // Convert Firestore Timestamp to JS Date
                        isRecent: isRecent(chatData.date ? chatData.date.toDate() : new Date()),  // Ensure the date is recent
                    };
                });

                // Sort chatList by date to find the latest chat
                const sortedChatList = chatList.sort((a, b) => b.date - a.date);

                if (sortedChatList.length > 0) {
                    sortedChatList[0].isActive = true; // Mark the latest chat as active
                    setActiveChatId(sortedChatList[0].id); // Track active chat ID
                }

                setChatItems(sortedChatList);
            } catch (error) {
                console.error("Error fetching chats: ", error);
            }
        };

        fetchChats();
    }, [user]);


    // Fetch messages for the active chat
    useEffect(() => {
        if (activeChatId && user) {
            const fetchMessages = async () => {
                try {



                    // Reference the messages collection for the active chat
                    const messagesRef = collection(db, `users/${user.uid}/chats/${activeChatId}/messages`);

                    // Query to order messages by timestamp (ascending)
                    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

                    // Fetch ordered messages
                    const messagesSnapshot = await getDocs(messagesQuery);

                    // Map the snapshot to get the message data
                    const messagesList = messagesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // Update the state with the fetched messages
                    setMessages(messagesList);
                } catch (error) {
                    console.error("Error fetching messages: ", error);
                }
            };

            fetchMessages();
        }
    }, [activeChatId, user]);


    const addNewChat = async () => {
        if (newChatTitle.trim() && user) {
            const currentDate = new Date();
            const newChat = {
                title: newChatTitle,
                date: currentDate,
                isActive: false
            };
            console.log(`Adding chat for user: ${user.uid} at path: users/${user.uid}/chats`);

            try {
                const docRef = await addDoc(collection(db, `users/${user.uid}/chats`), newChat);
                setChatItems([{ id: docRef.id, ...newChat, isRecent: isRecent(currentDate) }, ...chatItems]);
                setNewChatTitle('');
            } catch (error) {
                console.error("Error adding chat: ", error);
            }
        }
    };


    const deleteChat = async (id) => {
        if (user) {
            try {
                // Simulate a 2-second delay using setTimeout
                await new Promise(resolve => setTimeout(resolve, 2000));

                await deleteDoc(doc(db, `users/${user.uid}/chats`, id));
                setChatItems(chatItems.filter(chat => chat.id !== id));
                setActiveChatId(null);
                setMessages([]); // Clear messages while loading
                setIsLoading(true); // Start loading state after the delay
            } catch (error) {
                console.error("Error deleting chat: ", error);
            }
        }
    };



    const handleChatClick = async (id) => {
        if (activeChatId === id && messages.length > 0) {
            return; // Don't fetch again if already active
        }

        setMessages([]); // Clear messages while loading

        setIsLoading(true);  // Start loading state



        setActiveChatId(id);  // Set the new active chat

        // Mark the clicked chat as active and deactivate others
        setChatItems(chatItems.map(chat => ({
            ...chat,
            isActive: chat.id === id
        })));

        setIsOpen(close); // Open the drawer when a chat is clicked

        // Wait for 3 seconds before fetching messages
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {

            const messagesCollection = collection(db, `users/${user.uid}/chats/${id}/messages`);
            const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));  // Sort by timestamp, ascending
            const messagesSnapshot = await getDocs(messagesQuery);
            const messagesList = messagesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setMessages(messagesList); // Update the message state
        } catch (error) {
            console.error("Error fetching messages: ", error);
        } finally {
            setIsLoading(false); // Stop loading after fetching
        }
    };





    // console.log(isOpen);

    // Toggle drawer state
    const toggleDrawer = () => {
        setIsOpen(!isOpen);
    };





    const chatEndRef = useRef(null); // Create a ref for the end of the chat

    // Function to scroll to the bottom of the chat container
    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Use useEffect to scroll to the bottom when messages are updated
    useEffect(() => {
        scrollToBottom();
    }, [messages]); // This will run every time 'messages' changes




    // Handle prompt click to set the prompt in the input field
    const handlePromptClick = (prompt) => {
        setQuestion(prompt);
    };

    const handleModelClick = () => {
        setIsModelMenuOpen(!isModelMenuOpen);
    };

    const handleModelSelect = (model) => {
        setSelectedModel(model);
        setAnimateHeaderLine(true);
        setTimeout(() => setAnimateHeaderLine(false), 2000);
        setIsModelMenuOpen(false);
    };

    // Handle input change
    const handleInputChange = (event) => {
        setQuestion(event.target.value);
    };

    const promptSuggestions = [
        "อายุ 25-40 ปี  ปวดกล้ามเนื้อ โปรแกรมการรักษา?",
        "อายุ 18-35 ปี อาการน้ำมูกไหล โปรแกรมการรักษา?",
        "อายุ 35-60 ปี อาการปัสสาวะบ่อย โปรแกรมการรักษา?"
    ];

    const handleSendMessage = async (e) => {
        e.preventDefault();

        const userMessageText = question.trim();

        // If the user didn't type a message, show an error
        if (!userMessageText) {
            setMessages((prevMessages) => [...prevMessages, { sender: "error", text: "กรุณากรอกคำถาม!" }]);
            return;
        }

        // Check if there's an active chat ID, or if it was deleted
        let currentChatId = activeChatId;

        if (!currentChatId) {
            currentChatId = await createNewChat(); // Create chat and get ID
            setActiveChatId(currentChatId); // Set the newly created chat as active
        }


        const userMessage = { sender: "user", text: userMessageText };
        addMessageToChat(currentChatId, userMessage.text, "user"); // Firestore
        setMessages((prevMessages) => [...prevMessages, userMessage]); // UI
        setQuestion(''); // Clear input field

        try {

            // const response = await fetch("https://geminiapi-flame.vercel.app/api/index", {
            const response = await fetch("http://localhost:3000/ask-ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: userMessageText, model: selectedModel }),
            });

            const result = await response.json();
            console.log(result);
            if (response.ok) {
                const botMessageText = result.answer || "No answer received";
                const botMessage = { sender: "bot", text: botMessageText };


                addMessageToChat(currentChatId, botMessage.text, "bot"); // Firestore
                setMessages((prevMessages) => [...prevMessages, botMessage]); // UI
                console.log("Send Messages Pass");
            } else {
                // Handle errors from the response
                const errorMessage = result.error || "Error occurred";
                const errorMsg = { sender: "error", text: errorMessage };
                setMessages((prevMessages) => [...prevMessages, errorMsg]);
            }
        } catch (error) {
            console.error("Error:", error);
            // Handle network errors
            setMessages((prevMessages) => [...prevMessages, { sender: "error", text: "Cannot connect to server" }]);
        }
    };

    // Function to add messages to Firestore (user or bot)
    const addMessageToChat = async (activeChatId, messageText, sender) => {

        if (!activeChatId || !user) return; // Ensure there's an active chat and user is logged in
        try {
            const messagesCollection = collection(db, `users/${user.uid}/chats/${activeChatId}/messages`);
            const timestamp = new Date()
            const messageData = {
                text: messageText,
                sender,
                timestamp,
                // timeInThai: new Date(timestamp).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
            };

            await addDoc(messagesCollection, messageData); // Save message to Firestore
        } catch (error) {
            console.error("Error adding message to Firestore:", error);
        }
    };


    const createNewChat = async () => {
        const newChatTitle = "Start Chat"; // Default chat title when no chats exist
        if (user) {
            const currentDate = new Date();
            const newChat = {
                title: newChatTitle,
                date: currentDate,
                isActive: true
            };

            try {
                const docRef = await addDoc(collection(db, `users/${user.uid}/chats`), newChat);


                setChatItems((prevChatItems) => {
                    console.log("Updated chat items:", [{ id: docRef.id, ...newChat, isRecent: isRecent(currentDate) }, ...prevChatItems]);
                    return [{ id: docRef.id, ...newChat, isRecent: isRecent(currentDate) }, ...prevChatItems];
                });

                setActiveChatId(docRef.id);
                setIsLoading(false);
                return docRef.id;
            } catch (error) {
                console.error("Error creating new chat:", error);
            }
        }
    };


    // Handle "Enter" key to send message
    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            handleSendMessage(event);
        }
    };

    // Add and remove "keydown" event listener
    useEffect(() => {
        const questionInput = document.getElementById("question");
        if (questionInput) {
            questionInput.addEventListener("keydown", handleKeyDown);
            return () => questionInput.removeEventListener("keydown", handleKeyDown);
        }
    }, [question]);

    return (
        <div>
            <div className={`app-container ${theme}`}>
                <div className="menu-icon" onClick={toggleDrawer}>
                    <i className="fa-solid fa-bars"></i>
                </div>




                <div className={`all-container ${isOpen ? "drawer-open" : ""}`}>
                    <div className={`header-slide ${isOpen ? "drawer-open" : ""}`}>
                        <div className="theme-switcher" onClick={toggleTheme} >
                            {theme === "light" ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
                            <img src="../img/world.png" alt="lang" className="world-icon" />
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
                                <p onClick={() => handleModelSelect("gemini-1.5-flash")}>Gemini 1.5 Flash</p>
                                <p onClick={() => handleModelSelect("packagetestv2-nettsfkvxpqs")}>Package Test v2</p>
                            </div>
                        )}
                    </div>
                    {/* Chat Section */}
                    <div className="chat-container">
                        {/* Greeting Message */}
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
                                    <div
                                        key={index}
                                        className={`chat-message ${msg.sender === "user" ? "user-message" : "ai-message"}`}
                                    >
                                        <div className="message-text">
                                            {msg.sender === "bot" && index === messages.length - 1 ? (
                                                // Apply Typewriter effect to the last message only if text length < 100
                                                msg.text.length < 200 ? (
                                                    <Typewriter
                                                        options={{ delay: 10 }}
                                                        onInit={(typewriter) => {
                                                            const cleanText = msg.text.replace(/\*/g, "");
                                                            typewriter.typeString(cleanText).start();
                                                        }}
                                                    />
                                                ) : (
                                                    // If text length >= 100, render text directly without Typewriter
                                                    msg.text
                                                )
                                            ) : (
                                                // For all older messages, just render the text
                                                msg.text
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

                    {/* Input Field and Send Button */}
                    <div className={`bot-container ${theme} `}>
                        <div className={`bottom-section ${isOpen ? "drawer-open" : ""} `}>
                            <div className="input-container">
                                <input
                                    type="text"
                                    id="question"
                                    value={question}
                                    onChange={handleInputChange}
                                    placeholder="ถามมาได้เลยจ้า..."
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} // Handle Enter key
                                />
                                <button type="button" onClick={handleSendMessage}>
                                    <i className="fa-solid fa-arrow-up"></i>
                                </button>
                            </div>
                            <h4 className="follow_text_gen">
                                Copyright © 2024 โรงพยาบาลกรุงเทพ หาดใหญ่
                            </h4>
                        </div>

                    </div>



                </div>

                {/* Drawer Modal */}
                <div className={`drawer ${isOpen ? 'open' : ''}`}>
                    <div className="drawer-header">
                        <div className="top-drawer">
                            <img
                                src="../img/bhh_logo.png"
                                alt="Bangkok Hospital Logo"
                                className="drawer-logo"
                            />

                        </div>
                        <input
                            type="text"
                            value={newChatTitle}
                            onChange={(e) => setNewChatTitle(e.target.value)}
                            placeholder="Enter new chat title"
                            className="new-chat-input"


                        />
                        <button className="new-chat-btn" onClick={addNewChat}>
                            + New chat
                        </button>
                    </div>

                    {/* Chat History */}
                    <div className="drawer-content">
                        <div className="drawer-setting">
                            <h3>Recent</h3>
                            {chatItems.filter(chat => chat.isRecent).map(chat => (
                                <div
                                    key={chat.id}
                                    className={`chat-item ${chat.isActive ? 'active' : ''}`}
                                    onClick={() => handleChatClick(chat.id)} // Set active on click
                                >
                                    {chat.title}
                                    <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}>🗑️</button>
                                </div>
                            ))}

                            <h3>Yesterday</h3>
                            {chatItems.filter(chat => !chat.isRecent && chat.date > (new Date().getTime() - (1000 * 60 * 60 * 24 * 2))).map(chat => (
                                <div
                                    key={chat.id}
                                    className={`chat-item ${chat.isActive ? 'active' : ''}`}
                                    onClick={() => handleChatClick(chat.id)} // Set active on click
                                >
                                    {chat.title}
                                    <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}>🗑️</button>
                                </div>

                            ))}

                            <h3>7 Days Before</h3>
                            {chatItems.filter(chat =>
                                !chat.isRecent &&
                                chat.date <= (new Date().getTime() - (1000 * 60 * 60 * 24 * 2)) &&
                                chat.date > (new Date().getTime() - (1000 * 60 * 60 * 24 * 7))
                            ).map(chat => (
                                <div
                                    key={chat.id}
                                    className={`chat-item ${chat.isActive ? 'active' : ''}`}
                                    onClick={() => handleChatClick(chat.id)} // Set active on click
                                >
                                    {chat.title}
                                    <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}>🗑️</button>
                                </div>
                            ))}

                            {/* Footer */}
                            <div className="drawer-footer">
                                {/* <div className="footer-item">Help</div> */}
                                {/* <div className="footer-item">Settings</div> */}
                                <div className="footer-item" onClick={handleLogout}>Logout</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            {/* Backdrop for closing the drawer */}
            <div
                className={`backdrop ${isOpen ? "show" : ""}`}
                onClick={toggleDrawer}
            >
                <img
                    src="../img/menu.png"
                    alt="Menu Icon"
                    className="backdrop-menu-icon"
                />

            </div>

        </div>
    );
};

const isRecent = (date) => {
    const now = new Date();
    const chatDate = new Date(date);
    const diffDays = (now - chatDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 1;
};

export default ChatPage;

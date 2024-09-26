// AppContainer.jsx
import React, { useState, useEffect, useRef } from "react";
import Header from '../component/Header';
import ThemeSwitcher from '../component/ThemeSwitcher';
import ChatContainer from '../component/ChatContainer';
import Drawer from '../component/Drawer';
import BackDrop from '../component/BackDrop';
import "../pages/App.css";
import "../component/Chatstyle.css"
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, getDoc, Timestamp } from "firebase/firestore";
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Typewriter from "typewriter-effect";
import { auth } from '../firebase'; // Firebase auth

const AppContainer = () => {


    const [isOpen, setIsOpen] = useState(false);
    const [chatItems, setChatItems] = useState([]);
    const [newChatTitle, setNewChatTitle] = useState('');
    const [selectedModel, setSelectedModel] = useState("packagetestv2-nettsfkvxpqs");
    const [activeChatId, setActiveChatId] = useState(null);
    const [theme, setTheme] = useState("light");
    const [isLoading, setIsLoading] = useState(false);
    const user = auth.currentUser;
    const navigate = useNavigate();
    const [showGreeting, setShowGreeting] = useState(true);
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState("");
    const [animateHeaderLine, setAnimateHeaderLine] = useState(false);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

    // Toggle theme (light/dark)
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };

    const isRecent = (date) => {
        const now = new Date();
        const chatDate = new Date(date);
        const diffDays = (now - chatDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 1;
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
                    const messagesRef = collection(db, `users/${user.uid}/chats/${activeChatId}/messages`);

                    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

                    const messagesSnapshot = await getDocs(messagesQuery);

                    const messagesList = messagesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setMessages(messagesList);
                } catch (error) {
                    console.error("Error fetching messages: ", error);
                }
            };

            fetchMessages();
        }
    }, [activeChatId, user]);

    const deleteChat = async (id) => {
        if (user) {
            try {
                
                // await new Promise((resolve) => setTimeout(resolve, 2000));
                await deleteDoc(doc(db, `users/${user.uid}/chats`, id));
    
                
                setChatItems((prevChatItems) => prevChatItems.filter(chat => chat.id !== id));
    
                if (activeChatId === id) {
                    setActiveChatId(true);
                    setMessages([]); 
                }

                // setActiveChatId(null);
                // setMessages([]); 
    
              
                setIsLoading(false);  
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

    // Handle sending message
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

            const response = await fetch("https://geminiapi-flame.vercel.app/api/index", {
            // const response = await fetch("http://localhost:3000/ask-ai", {
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

    // Handle input change
    const handleInputChange = (event) => {
        setQuestion(event.target.value);
    };

    return (
        <div>
            <div className={`app-container ${theme}`}>
                <div className={`all-container ${isOpen ? "drawer-open" : ""}`}>
                    <Header
                        toggleDrawer={toggleDrawer}
                        isOpen={isOpen}
                        isModelMenuOpen={isModelMenuOpen}
                        animateHeaderLine={animateHeaderLine}
                        setIsModelMenuOpen={setIsModelMenuOpen}
                        setSelectedModel={setSelectedModel}
                        setAnimateHeaderLine={setAnimateHeaderLine}
                    />
                    <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
                    <ChatContainer
                        isOpen={isOpen}
                        messages={messages}
                        handleSendMessage={handleSendMessage}
                        question={question}
                        handleInputChange={handleInputChange}
                        isLoading={isLoading}
                        showGreeting={showGreeting}
                        setQuestion={setQuestion}
                    />
                </div>
                <Drawer
                    isOpen={isOpen}
                    newChatTitle={newChatTitle}
                    setNewChatTitle={setNewChatTitle}
                    chatItems={chatItems}
                    setChatItems={setChatItems}
                    deleteChat={deleteChat}
                    handleChatClick={handleChatClick}

                />
                <BackDrop isOpen={isOpen} toggleDrawer={toggleDrawer} />
            </div>
        </div>
    );
};


export default AppContainer;

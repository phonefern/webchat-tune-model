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
    const [selectedFile, setSelectedFile] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

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
            if (!user) return; 
            try {
                const chatCollection = collection(db, `users/${user.uid}/chats`);
                const chatSnapshot = await getDocs(chatCollection);
                const chatList = chatSnapshot.docs.map(doc => {
                    const chatData = doc.data();
                    return {
                        id: doc.id,
                        ...chatData,
                        isActive: false,
                        date: chatData.date && chatData.date.toDate(),  
                        isRecent: isRecent(chatData.date ? chatData.date.toDate() : new Date()),  
                    };
                });

            
                const sortedChatList = chatList.sort((a, b) => b.date - a.date);

                if (sortedChatList.length > 0) {
                    sortedChatList[0].isActive = true; 
                    setActiveChatId(sortedChatList[0].id); 
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

    const handleChatClick = async (id) => {
        if (activeChatId === id && messages.length > 0) {
            return; 
        }
        setMessages([]); 
        setIsLoading(true); 
        setActiveChatId(id);  

        setChatItems(chatItems.map(chat => ({
            ...chat,
            isActive: chat.id === id
        })));
        setIsOpen(close); 
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
            const messagesCollection = collection(db, `users/${user.uid}/chats/${id}/messages`);
            const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));  
            const messagesSnapshot = await getDocs(messagesQuery);
            const messagesList = messagesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(messagesList); 
        } catch (error) {
            console.error("Error fetching messages: ", error);
        } finally {
            setIsLoading(false); 
        }
    };

    // console.log(isOpen);

    // Toggle drawer state
    const toggleDrawer = () => {
        setIsOpen(!isOpen);
    };

    const createNewChat = async () => {
        const newChatTitle = "Start Chat"; 
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

        if (!activeChatId || !user) return; 
        try {
            const messagesCollection = collection(db, `users/${user.uid}/chats/${activeChatId}/messages`);
            const timestamp = new Date()
            const messageData = {
                text: messageText,
                sender,
                timestamp,
                // timeInThai: new Date(timestamp).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
            };

            await addDoc(messagesCollection, messageData);
        } catch (error) {
            console.error("Error adding message to Firestore:", error);
        }
    };

    
    // const handleSendMessage = async (e) => {
    //     e.preventDefault();

    //     const userMessageText = question.trim();

      
    //     if (!userMessageText && !imageFile) {
    //         setMessages((prevMessages) => [...prevMessages, { sender: "error", text: "กรุณากรอกคำถามหรือเลือกไฟล์ภาพ!" }]);
    //         return;
    //     }

    //     let currentChatId = activeChatId;

    //     if (!currentChatId) {
    //         currentChatId = await createNewChat(); 
    //         setActiveChatId(currentChatId); 
    //     }

     
    //     const userMessage = { sender: "user", text: userMessageText || "Uploaded an image" , image: imagePreview};
    //     addMessageToChat(currentChatId, userMessage.text, "user"); 
    //     setMessages((prevMessages) => [...prevMessages, userMessage]); 
    //     setImagePreview(null);
    //     setQuestion(''); 
    //     setImageFile(null); 

    //     try {
            
    //         const formData = new FormData();
    //         formData.append('question', userMessageText ); 
    //         if (imageFile) {
    //             formData.append('image', imageFile); 
    //         }
    //         formData.append('model', selectedModel);

    //         const response = await fetch("https://geminiapi-flame.vercel.app/api/index", {
    //         const response = await fetch("http://localhost:3000/ask-ai", {
    //             method: "POST",
    //             body: formData, 
    //         });

    //         const result = await response.json();
    //         console.log(result);
    //         if (response.ok) {
    //             const botMessageText = result.answer || "No answer received";
    //             const botMessage = { sender: "bot", text: botMessageText };

    //             addMessageToChat(currentChatId, botMessage.text, "bot"); 
    //             setMessages((prevMessages) => [...prevMessages, botMessage]); 
    //             console.log("Send Messages Pass");
    //         } else {
    //             const errorMessage = result.error || "Error occurred";
    //             const errorMsg = { sender: "error", text: errorMessage };
    //             setMessages((prevMessages) => [...prevMessages, errorMsg]);
    //         }
    //     } catch (error) {
    //         console.error("Error:", error);
    //         setMessages((prevMessages) => [...prevMessages, { sender: "error", text: "Cannot connect to server" }]);
    //     }
    // };
    
    
    const handleSendMessage = async (e) => {
        e.preventDefault();

        const userMessageText = question.trim();

        
        if (!userMessageText) {
            setMessages((prevMessages) => [...prevMessages, { sender: "error", text: "กรุณากรอกคำถาม!" }]);
            return;
        }
        let currentChatId = activeChatId;

        if (!currentChatId) {
            currentChatId = await createNewChat(); 
            setActiveChatId(currentChatId); 
        }


        const userMessage = { sender: "user", text: userMessageText };
        addMessageToChat(currentChatId, userMessage.text, "user"); 
        setMessages((prevMessages) => [...prevMessages, userMessage]); 
        setQuestion(''); 

        try {
            const response = await fetch("https://geminiapi-flame.vercel.app/api/index", {
            // const response = await fetch("http://localhost:3000/ask-ai", {
            // const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyAYinKiYLPNeCT5pqRQkpp5UDP_cO9pmYc', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: userMessageText, model: selectedModel }),
            });

            const result = await response.json();
            console.log(result);
            if (response.ok) {
                const botMessageText = result.answer || "No answer received";
                const botMessage = { sender: "bot", text: botMessageText };

                addMessageToChat(currentChatId, botMessage.text, "bot"); 
                setMessages((prevMessages) => [...prevMessages, botMessage]); 
                console.log("Send Messages Pass");
            } else {
                
                const errorMessage = result.error || "Error occurred";
                const errorMsg = { sender: "error", text: errorMessage };
                setMessages((prevMessages) => [...prevMessages, errorMsg]);
            }
        } catch (error) {
            console.error("Error:", error);
            
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
                        setSelectedFile={setSelectedFile}
                        setImageFile={setImageFile}
                        setImagePreview={setImagePreview}
                    />
                </div>
                <Drawer
                    isOpen={isOpen}
                    toggleDrawer={toggleDrawer}
                    newChatTitle={newChatTitle}
                    setNewChatTitle={setNewChatTitle}
                    chatItems={chatItems}
                    setChatItems={setChatItems}
                    // deleteChat={deleteChat}
                    handleChatClick={handleChatClick}
                    

                />
                <BackDrop isOpen={isOpen} toggleDrawer={toggleDrawer} />
            </div>
        </div>
    );
};


export default AppContainer;
